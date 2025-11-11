-- ============================================================================
-- CONSULTA 6: ANÁLISIS DE CALIDAD DE DATOS
-- Propósito: Detectar problemas de calidad en staging y prices
-- ============================================================================

-- ============================================================================
-- 6.1 STAGING: Detectar valores NULL, duplicados, anomalías
-- ============================================================================

-- A. Análisis de NULLs por columna
SELECT
    'stg_prices_polygon_raw' AS tabla,
    COUNTIF(ticker IS NULL) AS ticker_nulls,
    COUNTIF(date IS NULL) AS date_nulls,
    COUNTIF(open IS NULL) AS open_nulls,
    COUNTIF(high IS NULL) AS high_nulls,
    COUNTIF(low IS NULL) AS low_nulls,
    COUNTIF(close IS NULL) AS close_nulls,
    COUNTIF(volume IS NULL) AS volume_nulls,
    COUNT(*) AS total_rows,
    -- Porcentajes
    ROUND(COUNTIF(ticker IS NULL) * 100.0 / COUNT(*), 2) AS ticker_null_pct,
    ROUND(COUNTIF(close IS NULL) * 100.0 / COUNT(*), 2) AS close_null_pct
FROM
    `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE
    date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);

-- B. Detectar registros duplicados (mismo ticker + date)
SELECT
    date,
    ticker,
    COUNT(*) AS duplicate_count,
    ARRAY_AGG(STRUCT(open, close, volume) LIMIT 5) AS sample_values
FROM
    `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE
    date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY
    date, ticker
HAVING
    COUNT(*) > 1
ORDER BY
    duplicate_count DESC, date DESC
LIMIT 100;

-- C. Detectar anomalías de precios (precios negativos, volumen cero, etc.)
SELECT
    date,
    ticker,
    open,
    high,
    low,
    close,
    volume,
    CASE
        WHEN close < 0 OR open < 0 OR high < 0 OR low < 0 THEN 'PRECIO_NEGATIVO'
        WHEN high < low THEN 'HIGH_MENOR_QUE_LOW'
        WHEN close > high OR close < low THEN 'CLOSE_FUERA_DE_RANGO'
        WHEN open > high OR open < low THEN 'OPEN_FUERA_DE_RANGO'
        WHEN volume = 0 THEN 'VOLUMEN_CERO'
        WHEN volume < 0 THEN 'VOLUMEN_NEGATIVO'
        WHEN close = open AND high = low AND volume = 0 THEN 'FLAT_LINE_SUSPICIOUS'
        ELSE 'OK'
    END AS anomaly_type
FROM
    `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE
    date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    AND (
        close < 0 OR open < 0 OR high < 0 OR low < 0
        OR high < low
        OR close > high OR close < low
        OR open > high OR open < low
        OR volume < 0
        OR (close = open AND high = low AND volume = 0)
    )
ORDER BY
    date DESC, anomaly_type
LIMIT 200;

-- ============================================================================
-- 6.2 PRICES: Análisis similar
-- ============================================================================

-- A. Análisis de NULLs en Prices
SELECT
    'Prices' AS tabla,
    COUNTIF(ticker IS NULL) AS ticker_nulls,
    COUNTIF(date IS NULL) AS date_nulls,
    COUNTIF(close IS NULL) AS close_nulls,
    COUNTIF(volume IS NULL) AS volume_nulls,
    COUNTIF(source IS NULL) AS source_nulls,
    COUNT(*) AS total_rows
FROM
    `sunny-advantage-471523-b3.market_data.Prices`
WHERE
    date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    AND source = 'polygon';

-- B. Verificar unicidad de clave primaria (ticker + date + source)
SELECT
    date,
    ticker,
    source,
    COUNT(*) AS duplicate_count
FROM
    `sunny-advantage-471523-b3.market_data.Prices`
WHERE
    date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    AND source = 'polygon'
GROUP BY
    date, ticker, source
HAVING
    COUNT(*) > 1
ORDER BY
    duplicate_count DESC
LIMIT 100;

-- ============================================================================
-- 6.3 COMPARACIÓN DE VALORES: ¿Los valores coinciden?
-- ============================================================================

-- Comparar precios de cierre entre staging y prices para la misma fecha/ticker
SELECT
    s.date,
    s.ticker,
    s.close AS staging_close,
    p.close AS prices_close,
    ABS(s.close - p.close) AS diff,
    ROUND(ABS(s.close - p.close) * 100.0 / NULLIF(s.close, 0), 2) AS diff_pct
FROM
    `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw` s
INNER JOIN
    `sunny-advantage-471523-b3.market_data.Prices` p
    ON s.ticker = p.ticker AND s.date = p.date
WHERE
    s.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    AND p.source = 'polygon'
    AND ABS(s.close - p.close) > 0.01  -- Diferencia mayor a 1 centavo
ORDER BY
    diff_pct DESC
LIMIT 100;

-- ============================================================================
-- 6.4 ANÁLISIS DE COBERTURA DE TICKERS
-- ============================================================================

-- ¿Qué tickers están en staging pero nunca llegaron a prices?
SELECT
    s.ticker,
    COUNT(DISTINCT s.date) AS dates_in_staging,
    MIN(s.date) AS first_date_staging,
    MAX(s.date) AS last_date_staging,
    COUNT(DISTINCT p.date) AS dates_in_prices
FROM
    `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw` s
LEFT JOIN
    `sunny-advantage-471523-b3.market_data.Prices` p
    ON s.ticker = p.ticker AND s.date = p.date AND p.source = 'polygon'
WHERE
    s.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY
    s.ticker
HAVING
    COUNT(DISTINCT p.date) = 0  -- Nunca llegó a prices
ORDER BY
    dates_in_staging DESC
LIMIT 50;

-- ============================================================================
-- EXPORTAR RESULTADOS
-- ============================================================================
-- Ejecutar cada sección por separado y exportar a CSV:
-- bq query --use_legacy_sql=false --format=csv < 06_analisis_calidad_datos.sql > ../artifacts/data_quality.csv

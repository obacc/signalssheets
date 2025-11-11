-- ============================================================================
-- CONSULTA 3: DIFERENCIAS ENTRE STAGING Y PRICES
-- Propósito: Detectar gaps y discrepancias entre las dos tablas
-- ============================================================================

WITH staging_counts AS (
    SELECT
        date AS fecha,
        COUNT(*) AS staging_row_count,
        COUNT(DISTINCT ticker) AS staging_unique_tickers
    FROM
        `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
    WHERE
        date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY
        fecha
),
prices_counts AS (
    SELECT
        date AS fecha,
        COUNT(*) AS prices_row_count,
        COUNT(DISTINCT ticker) AS prices_unique_tickers
    FROM
        `sunny-advantage-471523-b3.market_data.Prices`
    WHERE
        date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        AND source = 'polygon'  -- Ajustar si el campo source tiene otro valor
    GROUP BY
        fecha
),
date_range AS (
    -- Generar todas las fechas en el rango
    SELECT date AS fecha
    FROM UNNEST(GENERATE_DATE_ARRAY(
        DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY),
        CURRENT_DATE()
    )) AS date
)

SELECT
    dr.fecha,
    COALESCE(sc.staging_row_count, 0) AS staging_rows,
    COALESCE(pc.prices_row_count, 0) AS prices_rows,
    COALESCE(sc.staging_unique_tickers, 0) AS staging_tickers,
    COALESCE(pc.prices_unique_tickers, 0) AS prices_tickers,
    -- Diferencias
    COALESCE(sc.staging_row_count, 0) - COALESCE(pc.prices_row_count, 0) AS row_diff,
    CASE
        WHEN sc.staging_row_count IS NULL THEN 'MISSING_IN_STAGING'
        WHEN pc.prices_row_count IS NULL THEN 'NOT_IN_PRICES'
        WHEN sc.staging_row_count != pc.prices_row_count THEN 'COUNT_MISMATCH'
        ELSE 'OK'
    END AS status,
    -- Porcentaje de transferencia
    CASE
        WHEN sc.staging_row_count > 0 THEN
            ROUND(COALESCE(pc.prices_row_count, 0) * 100.0 / sc.staging_row_count, 2)
        ELSE 0
    END AS transfer_percentage
FROM
    date_range dr
LEFT JOIN staging_counts sc ON dr.fecha = sc.fecha
LEFT JOIN prices_counts pc ON dr.fecha = pc.fecha
ORDER BY
    dr.fecha DESC;

-- ============================================================================
-- ANÁLISIS ADICIONAL: Identificar tickers que están en staging pero no en prices
-- ============================================================================

-- DESCOMENTAR PARA EJECUTAR (requiere más recursos):
-- SELECT
--     s.date,
--     s.ticker,
--     COUNT(*) AS staging_count
-- FROM
--     `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw` s
-- LEFT JOIN
--     `sunny-advantage-471523-b3.market_data.Prices` p
--     ON s.ticker = p.ticker AND s.date = p.date
-- WHERE
--     s.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
--     AND p.ticker IS NULL
-- GROUP BY
--     s.date, s.ticker
-- ORDER BY
--     s.date DESC, staging_count DESC
-- LIMIT 100;

-- ============================================================================
-- EXPORTAR RESULTADOS A CSV
-- ============================================================================
-- bq query --use_legacy_sql=false --format=csv < 03_diff_staging_vs_prices.sql > ../artifacts/diff_staging_vs_prices.csv

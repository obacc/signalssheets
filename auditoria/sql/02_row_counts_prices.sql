-- ============================================================================
-- CONSULTA 2: ROW COUNTS POR FECHA - PRICES TABLE
-- Tabla: market_data.Prices
-- Propósito: Contar registros por fecha para últimos 30 días
-- ============================================================================

-- OPCIÓN A: Si la tabla tiene campo 'date' de tipo DATE
SELECT
    date AS fecha,
    COUNT(*) AS row_count,
    COUNT(DISTINCT ticker) AS unique_tickers,
    COUNT(DISTINCT source) AS unique_sources,
    MIN(timestamp) AS min_timestamp,
    MAX(timestamp) AS max_timestamp,
    -- Calcular tamaño aproximado en MB
    ROUND(SUM(LENGTH(TO_JSON_STRING(t))) / 1024 / 1024, 2) AS approx_size_mb
FROM
    `sunny-advantage-471523-b3.market_data.Prices` AS t
WHERE
    date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY
    fecha
ORDER BY
    fecha DESC;

-- ESTIMACIÓN DE COSTO: Similar a staging, depende de particionamiento

-- ============================================================================
-- EXPORTAR RESULTADOS A CSV
-- ============================================================================
-- bq query --use_legacy_sql=false --format=csv --max_rows=1000 < 02_row_counts_prices.sql > ../artifacts/prices_counts.csv

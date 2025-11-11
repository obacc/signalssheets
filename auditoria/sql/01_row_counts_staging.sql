-- ============================================================================
-- CONSULTA 1: ROW COUNTS POR FECHA - STAGING TABLE
-- Tabla: market_data.stg_prices_polygon_raw
-- Propósito: Contar registros por fecha para últimos 30 días
-- ============================================================================

-- Notas:
-- - Ajusta el nombre del campo de fecha según el schema real
-- - Opciones comunes: date, trade_date, timestamp, dt, etc.
-- - Esta query asume que existe un campo DATE o TIMESTAMP

-- OPCIÓN A: Si la tabla tiene campo 'date' de tipo DATE
SELECT
    date AS fecha,
    COUNT(*) AS row_count,
    COUNT(DISTINCT ticker) AS unique_tickers,
    MIN(timestamp) AS min_timestamp,
    MAX(timestamp) AS max_timestamp,
    -- Calcular tamaño aproximado en MB
    ROUND(SUM(LENGTH(TO_JSON_STRING(t))) / 1024 / 1024, 2) AS approx_size_mb
FROM
    `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw` AS t
WHERE
    date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY
    fecha
ORDER BY
    fecha DESC;

-- ESTIMACIÓN DE COSTO:
-- Depende del tamaño de la tabla. Si la tabla está particionada por 'date',
-- el costo será proporcional a 30 días de datos.
-- Si NO está particionada, hará full table scan.
-- Ejemplo: Si la tabla tiene 1TB y solo necesitas 30 días (10GB),
-- Costo con partición: ~$0.05 (10GB * $5/TB)
-- Costo sin partición: ~$5.00 (1TB * $5/TB)

-- ============================================================================
-- ALTERNATIVAS SEGÚN EL SCHEMA
-- ============================================================================

-- OPCIÓN B: Si la tabla usa un campo TIMESTAMP en lugar de DATE
-- SELECT
--     DATE(timestamp) AS fecha,
--     COUNT(*) AS row_count,
--     COUNT(DISTINCT ticker) AS unique_tickers,
--     MIN(timestamp) AS min_timestamp,
--     MAX(timestamp) AS max_timestamp
-- FROM
--     `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
-- WHERE
--     DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
-- GROUP BY
--     fecha
-- ORDER BY
--     fecha DESC;

-- OPCIÓN C: Si la tabla NO tiene campo de fecha claro, ver todas las columnas
-- SELECT
--     *
-- FROM
--     `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
-- LIMIT 10;

-- ============================================================================
-- EXPORTAR RESULTADOS A CSV
-- ============================================================================
-- Para exportar a CSV desde bq CLI:
-- bq query --use_legacy_sql=false --format=csv --max_rows=1000 < 01_row_counts_staging.sql > ../artifacts/staging_counts.csv

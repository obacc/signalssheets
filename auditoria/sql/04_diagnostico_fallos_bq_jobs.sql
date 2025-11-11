-- ============================================================================
-- CONSULTA 4: DIAGNÓSTICO DE FALLOS - BIGQUERY JOBS
-- Propósito: Detectar jobs fallidos o con errores en los últimos 14 días
-- ============================================================================

-- Esta consulta utiliza INFORMATION_SCHEMA.JOBS_BY_PROJECT para analizar
-- el historial de ejecuciones de BigQuery.

-- IMPORTANTE: Esta consulta puede ser costosa si hay muchos jobs.
-- INFORMATION_SCHEMA escanea metadatos, no datos de usuario.
-- Costo estimado: < $0.01 (los metadatos son gratuitos o muy baratos)

SELECT
    creation_time,
    job_id,
    user_email,
    job_type,
    statement_type,
    state,
    error_result.reason AS error_reason,
    error_result.message AS error_message,
    total_bytes_processed,
    total_slot_ms,
    TIMESTAMP_DIFF(end_time, start_time, SECOND) AS duration_seconds,
    -- Extraer nombre de la rutina si aplica
    REGEXP_EXTRACT(query, r'CALL `[^`]+\.([^`]+)`') AS routine_called,
    -- Primeras 200 caracteres de la query
    SUBSTR(query, 1, 200) AS query_preview
FROM
    `sunny-advantage-471523-b3.region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE
    creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)
    AND (
        -- Jobs fallidos
        state = 'DONE' AND error_result IS NOT NULL
        OR
        -- Jobs de tipo QUERY que llaman al SP de polygon
        (query LIKE '%sp_merge_polygon_prices%' OR query LIKE '%polygon%')
    )
ORDER BY
    creation_time DESC
LIMIT 500;

-- ============================================================================
-- ANÁLISIS ESPECÍFICO: Errores en llamadas al SP sp_merge_polygon_prices
-- ============================================================================

SELECT
    DATE(creation_time) AS fecha_error,
    COUNT(*) AS total_errores,
    error_result.reason AS tipo_error,
    error_result.message AS mensaje_error,
    user_email
FROM
    `sunny-advantage-471523-b3.region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE
    creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)
    AND query LIKE '%sp_merge_polygon_prices%'
    AND error_result IS NOT NULL
GROUP BY
    fecha_error, tipo_error, mensaje_error, user_email
ORDER BY
    fecha_error DESC, total_errores DESC;

-- ============================================================================
-- ANÁLISIS DE PERFORMANCE: Jobs más lentos relacionados con polygon
-- ============================================================================

SELECT
    creation_time,
    job_id,
    TIMESTAMP_DIFF(end_time, start_time, SECOND) AS duration_seconds,
    total_bytes_processed / 1024 / 1024 / 1024 AS gb_processed,
    total_slot_ms / 1000 / 60 AS slot_minutes,
    state,
    SUBSTR(query, 1, 200) AS query_preview
FROM
    `sunny-advantage-471523-b3.region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE
    creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)
    AND (query LIKE '%polygon%' OR query LIKE '%stg_prices_polygon_raw%')
    AND job_type = 'QUERY'
ORDER BY
    duration_seconds DESC
LIMIT 50;

-- ============================================================================
-- EXPORTAR RESULTADOS A CSV
-- ============================================================================
-- bq query --use_legacy_sql=false --format=csv < 04_diagnostico_fallos_bq_jobs.sql > ../artifacts/bq_jobs_errors.csv

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. La región puede variar: region-us, region-eu, region-asia-northeast1, etc.
--    Ajusta según la ubicación de tu dataset.
-- 2. Si recibes error "Not found: Table", prueba con:
--    - `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
--    - `us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
--    - Sin región: INFORMATION_SCHEMA.JOBS_BY_PROJECT

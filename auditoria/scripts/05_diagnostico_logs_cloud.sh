#!/bin/bash
################################################################################
# SCRIPT 5: DIAGNÓSTICO DE LOGS - CLOUD FUNCTIONS Y CLOUD LOGGING
# Proyecto: sunny-advantage-471523-b3
# Propósito: Extraer logs de errores de Cloud Functions, Scheduler y DTS
################################################################################

PROJECT_ID="sunny-advantage-471523-b3"
ARTIFACTS_DIR="../artifacts"
DAYS_BACK=14

echo "═══ DIAGNÓSTICO DE LOGS (ÚLTIMOS ${DAYS_BACK} DÍAS) ═══"

# Calcular timestamp para filtrar (últimos 14 días)
TIMESTAMP_START=$(date -u -d "${DAYS_BACK} days ago" +"%Y-%m-%dT%H:%M:%SZ")

################################################################################
# 1. LOGS DE CLOUD FUNCTIONS (errores)
################################################################################

echo "[1] Extrayendo logs de Cloud Functions (errores)..."

gcloud logging read "
    resource.type=\"cloud_function\"
    AND severity>=\"ERROR\"
    AND timestamp>=\"${TIMESTAMP_START}\"
    AND (
        resource.labels.function_name=~\"polygon.*\"
        OR textPayload=~\"polygon.*\"
        OR jsonPayload.message=~\"polygon.*\"
    )
" \
--project="${PROJECT_ID}" \
--format=json \
--limit=500 \
--order=desc > "${ARTIFACTS_DIR}/logs_cloud_functions_errors.json"

echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/logs_cloud_functions_errors.json"

# Resumen de errores
echo "   Generando resumen..."
jq -r '
    group_by(.resource.labels.function_name) |
    map({
        function: .[0].resource.labels.function_name,
        error_count: length,
        last_error: .[0].timestamp,
        sample_message: .[0].textPayload // .[0].jsonPayload.message // "N/A"
    })
' "${ARTIFACTS_DIR}/logs_cloud_functions_errors.json" > "${ARTIFACTS_DIR}/logs_cloud_functions_summary.json"

################################################################################
# 2. LOGS DE CLOUD SCHEDULER
################################################################################

echo "[2] Extrayendo logs de Cloud Scheduler..."

gcloud logging read "
    resource.type=\"cloud_scheduler_job\"
    AND severity>=\"ERROR\"
    AND timestamp>=\"${TIMESTAMP_START}\"
" \
--project="${PROJECT_ID}" \
--format=json \
--limit=500 \
--order=desc > "${ARTIFACTS_DIR}/logs_cloud_scheduler_errors.json"

echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/logs_cloud_scheduler_errors.json"

################################################################################
# 3. LOGS DE DATA TRANSFER SERVICE (BigQuery)
################################################################################

echo "[3] Extrayendo logs de Data Transfer Service..."

gcloud logging read "
    resource.type=\"bigquery_dts_config\"
    AND (
        severity>=\"ERROR\"
        OR jsonPayload.status=\"FAILED\"
    )
    AND timestamp>=\"${TIMESTAMP_START}\"
" \
--project="${PROJECT_ID}" \
--format=json \
--limit=500 \
--order=desc > "${ARTIFACTS_DIR}/logs_dts_errors.json"

echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/logs_dts_errors.json"

################################################################################
# 4. LOGS GENERALES RELACIONADOS CON POLYGON
################################################################################

echo "[4] Extrayendo logs generales relacionados con 'polygon'..."

gcloud logging read "
    (
        textPayload=~\"(?i)polygon\"
        OR jsonPayload.message=~\"(?i)polygon\"
        OR labels.table_name=~\"(?i)polygon\"
    )
    AND severity>=\"WARNING\"
    AND timestamp>=\"${TIMESTAMP_START}\"
" \
--project="${PROJECT_ID}" \
--format=json \
--limit=1000 \
--order=desc > "${ARTIFACTS_DIR}/logs_polygon_all.json"

echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/logs_polygon_all.json"

################################################################################
# 5. ANÁLISIS DE FRECUENCIA DE ERRORES
################################################################################

echo "[5] Analizando frecuencia de errores..."

# Crear CSV con análisis
echo "date,severity,resource_type,count" > "${ARTIFACTS_DIR}/logs_error_frequency.csv"

for log_file in "${ARTIFACTS_DIR}"/logs_*.json; do
    if [ -f "$log_file" ] && [ -s "$log_file" ]; then
        jq -r '
            group_by(.timestamp[:10], .severity, .resource.type) |
            map({
                date: .[0].timestamp[:10],
                severity: .[0].severity,
                resource_type: .[0].resource.type,
                count: length
            }) |
            .[] |
            [.date, .severity, .resource_type, .count] |
            @csv
        ' "$log_file" >> "${ARTIFACTS_DIR}/logs_error_frequency.csv"
    fi
done

echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/logs_error_frequency.csv"

################################################################################
# 6. TOP ERRORES POR MENSAJE
################################################################################

echo "[6] Extrayendo top errores por mensaje..."

# Combinar todos los logs y agrupar por mensaje de error
cat "${ARTIFACTS_DIR}"/logs_*_errors.json 2>/dev/null | jq -s '
    flatten |
    group_by(.textPayload // .jsonPayload.message // "unknown") |
    map({
        error_message: .[0].textPayload // .[0].jsonPayload.message // "unknown",
        occurrences: length,
        first_seen: (map(.timestamp) | min),
        last_seen: (map(.timestamp) | max),
        affected_resources: (map(.resource.type) | unique)
    }) |
    sort_by(-.occurrences)
' > "${ARTIFACTS_DIR}/logs_top_errors.json" 2>/dev/null || echo "[]" > "${ARTIFACTS_DIR}/logs_top_errors.json"

echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/logs_top_errors.json"

################################################################################
# RESUMEN
################################################################################

echo ""
echo "═══ RESUMEN DE LOGS ═══"

for log_file in "${ARTIFACTS_DIR}"/logs_*.json; do
    if [ -f "$log_file" ]; then
        count=$(jq '. | length' "$log_file" 2>/dev/null || echo "0")
        filename=$(basename "$log_file")
        echo "  - $filename: $count entradas"
    fi
done

echo ""
echo "✓ Diagnóstico de logs completado"
echo "  Revisa los archivos JSON en: ${ARTIFACTS_DIR}/"

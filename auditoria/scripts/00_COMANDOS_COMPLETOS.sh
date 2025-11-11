#!/bin/bash
################################################################################
# AUDITORÍA INTEGRAL - PIPELINE POLYGON → BIGQUERY
# Proyecto: sunny-advantage-471523-b3
#
# INSTRUCCIONES:
# 1. Configurar credenciales: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
# 2. Ejecutar secciones individualmente o todo el script
# 3. Los resultados se guardarán en ../artifacts/
#
# IMPORTANTE: Este script es de SOLO LECTURA (no ejecuta operaciones destructivas)
################################################################################

PROJECT_ID="sunny-advantage-471523-b3"
DATASET="market_data"
BUCKET="gs://ss-bucket-polygon-incremental"
ARTIFACTS_DIR="../artifacts"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AUDITORÍA PIPELINE POLYGON → BIGQUERY                     ║${NC}"
echo -e "${BLUE}║     Proyecto: sunny-advantage-471523-b3                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

################################################################################
# SECCIÓN 1: INVENTARIO DE GOOGLE CLOUD STORAGE (GCS)
################################################################################

section_1_gcs_inventory() {
    echo -e "${GREEN}═══ SECCIÓN 1: INVENTARIO GCS ═══${NC}"

    # 1.1 Listar todas las fechas disponibles en el bucket
    echo -e "${YELLOW}[1.1] Listando fechas en GCS...${NC}"
    gsutil ls "${BUCKET}/polygon/daily/" | \
        grep -oP 'date=\K[0-9]{4}-[0-9]{2}-[0-9]{2}' | \
        sort -r > "${ARTIFACTS_DIR}/gcs_dates_available.txt"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/gcs_dates_available.txt"

    # 1.2 Obtener las últimas 30 fechas con detalles
    echo -e "${YELLOW}[1.2] Obteniendo detalles de últimas 30 fechas...${NC}"
    echo "date,file_count,total_bytes,total_mb" > "${ARTIFACTS_DIR}/gcs_inventory.csv"

    for date in $(head -30 "${ARTIFACTS_DIR}/gcs_dates_available.txt"); do
        echo "   Procesando fecha: $date"
        gsutil du -s "${BUCKET}/polygon/daily/date=${date}/" | \
            awk -v date="$date" '{
                bytes=$1;
                mb=bytes/1048576;
                printf "%s,N/A,%d,%.2f\n", date, bytes, mb
            }' >> "${ARTIFACTS_DIR}/gcs_inventory.csv"
    done

    # Para obtener el conteo de archivos por fecha (más lento pero preciso)
    echo -e "${YELLOW}[1.3] Contando archivos por fecha (esto puede tardar)...${NC}"
    for date in $(head -30 "${ARTIFACTS_DIR}/gcs_dates_available.txt"); do
        count=$(gsutil ls "${BUCKET}/polygon/daily/date=${date}/*.parquet" 2>/dev/null | wc -l)
        echo "   $date: $count archivos"
    done

    # 1.4 Detectar gaps temporales
    echo -e "${YELLOW}[1.4] Detectando gaps temporales...${NC}"
    python3 << 'EOF' > "${ARTIFACTS_DIR}/gcs_date_gaps.txt"
from datetime import datetime, timedelta
with open('../artifacts/gcs_dates_available.txt') as f:
    dates = sorted([datetime.strptime(line.strip(), '%Y-%m-%d') for line in f])
if dates:
    start, end = dates[-1], dates[0]
    expected = {start + timedelta(days=x) for x in range((end - start).days + 1)}
    actual = set(dates)
    gaps = sorted(expected - actual)
    if gaps:
        print("GAPS DETECTADOS:")
        for gap in gaps:
            print(f"  - {gap.strftime('%Y-%m-%d')}")
    else:
        print("No se detectaron gaps entre {} y {}".format(start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')))
EOF
    cat "${ARTIFACTS_DIR}/gcs_date_gaps.txt"

    echo -e "${GREEN}✓ Sección 1 completada${NC}\n"
}

################################################################################
# SECCIÓN 2: INVENTARIO DE BIGQUERY
################################################################################

section_2_bigquery_inventory() {
    echo -e "${GREEN}═══ SECCIÓN 2: INVENTARIO BIGQUERY ═══${NC}"

    # 2.1 Listar todos los datasets
    echo -e "${YELLOW}[2.1] Listando datasets...${NC}"
    bq ls --project_id="${PROJECT_ID}" --format=prettyjson > "${ARTIFACTS_DIR}/bq_datasets.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/bq_datasets.json"

    # 2.2 Información detallada de market_data
    echo -e "${YELLOW}[2.2] Obteniendo tablas en ${DATASET}...${NC}"
    bq ls --project_id="${PROJECT_ID}" --dataset_id="${DATASET}" --format=prettyjson > "${ARTIFACTS_DIR}/bq_tables_market_data.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/bq_tables_market_data.json"

    # 2.3 Schema de stg_prices_polygon_raw
    echo -e "${YELLOW}[2.3] Extrayendo schema de stg_prices_polygon_raw...${NC}"
    bq show --schema --format=prettyjson "${PROJECT_ID}:${DATASET}.stg_prices_polygon_raw" > "${ARTIFACTS_DIR}/schema_staging.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/schema_staging.json"

    # 2.4 Schema de Prices
    echo -e "${YELLOW}[2.4] Extrayendo schema de Prices...${NC}"
    bq show --schema --format=prettyjson "${PROJECT_ID}:${DATASET}.Prices" > "${ARTIFACTS_DIR}/schema_prices.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/schema_prices.json"

    # 2.5 Información completa de tablas (incluyendo particionamiento)
    echo -e "${YELLOW}[2.5] Información completa de stg_prices_polygon_raw...${NC}"
    bq show --format=prettyjson "${PROJECT_ID}:${DATASET}.stg_prices_polygon_raw" > "${ARTIFACTS_DIR}/table_info_staging.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/table_info_staging.json"

    echo -e "${YELLOW}[2.6] Información completa de Prices...${NC}"
    bq show --format=prettyjson "${PROJECT_ID}:${DATASET}.Prices" > "${ARTIFACTS_DIR}/table_info_prices.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/table_info_prices.json"

    echo -e "${GREEN}✓ Sección 2 completada${NC}\n"
}

################################################################################
# SECCIÓN 3: RUTINAS Y STORED PROCEDURES
################################################################################

section_3_routines() {
    echo -e "${GREEN}═══ SECCIÓN 3: RUTINAS Y STORED PROCEDURES ═══${NC}"

    # 3.1 Listar todas las rutinas en market_data
    echo -e "${YELLOW}[3.1] Listando rutinas en ${DATASET}...${NC}"
    bq ls --routines --project_id="${PROJECT_ID}" --dataset_id="${DATASET}" --format=prettyjson > "${ARTIFACTS_DIR}/routines.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/routines.json"

    # 3.2 Obtener definición de sp_merge_polygon_prices
    echo -e "${YELLOW}[3.2] Extrayendo definición de sp_merge_polygon_prices...${NC}"
    bq show --format=prettyjson --routine "${PROJECT_ID}:${DATASET}.sp_merge_polygon_prices" > "${ARTIFACTS_DIR}/sp_merge_polygon_prices_metadata.json"

    # Extraer solo el body SQL
    bq show --format=prettyjson --routine "${PROJECT_ID}:${DATASET}.sp_merge_polygon_prices" | \
        jq -r '.routineReference.routineId + "\n\n" + .definitionBody' > "${ARTIFACTS_DIR}/sp_merge_polygon_prices.sql"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/sp_merge_polygon_prices.sql"

    echo -e "${GREEN}✓ Sección 3 completada${NC}\n"
}

################################################################################
# SECCIÓN 4: SCHEDULED QUERIES (DATA TRANSFER SERVICE)
################################################################################

section_4_scheduled_queries() {
    echo -e "${GREEN}═══ SECCIÓN 4: SCHEDULED QUERIES ═══${NC}"

    # 4.1 Listar todas las configuraciones de transferencia
    echo -e "${YELLOW}[4.1] Listando Scheduled Queries (Data Transfer Configs)...${NC}"
    gcloud data-transfer configs list \
        --project="${PROJECT_ID}" \
        --format=json > "${ARTIFACTS_DIR}/scheduled_queries.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/scheduled_queries.json"

    # 4.2 Obtener historial de ejecuciones recientes (últimos 14 días)
    echo -e "${YELLOW}[4.2] Obteniendo historial de runs (últimos 14 días)...${NC}"

    # Primero obtenemos los config IDs
    config_ids=$(jq -r '.[].name' "${ARTIFACTS_DIR}/scheduled_queries.json" 2>/dev/null)

    if [ -n "$config_ids" ]; then
        echo "[" > "${ARTIFACTS_DIR}/scheduled_queries_runs.json"
        first=true
        for config in $config_ids; do
            echo "   Obteniendo runs para: $config"
            if [ "$first" = false ]; then
                echo "," >> "${ARTIFACTS_DIR}/scheduled_queries_runs.json"
            fi
            gcloud data-transfer runs list \
                --transfer-config="$config" \
                --project="${PROJECT_ID}" \
                --format=json | jq '.' >> "${ARTIFACTS_DIR}/scheduled_queries_runs.json"
            first=false
        done
        echo "]" >> "${ARTIFACTS_DIR}/scheduled_queries_runs.json"
    else
        echo "   ℹ No se encontraron Scheduled Queries"
        echo "[]" > "${ARTIFACTS_DIR}/scheduled_queries_runs.json"
    fi

    echo -e "${GREEN}✓ Sección 4 completada${NC}\n"
}

################################################################################
# SECCIÓN 5: CLOUD SCHEDULER
################################################################################

section_5_cloud_scheduler() {
    echo -e "${GREEN}═══ SECCIÓN 5: CLOUD SCHEDULER ═══${NC}"

    # 5.1 Listar todos los jobs de Cloud Scheduler
    echo -e "${YELLOW}[5.1] Listando Cloud Scheduler jobs...${NC}"
    gcloud scheduler jobs list \
        --project="${PROJECT_ID}" \
        --format=json > "${ARTIFACTS_DIR}/cloud_scheduler_jobs.json" 2>&1

    if [ $? -eq 0 ]; then
        echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/cloud_scheduler_jobs.json"

        # Filtrar solo los relacionados con polygon (case-insensitive)
        jq '[.[] | select(.name | test("polygon"; "i"))]' "${ARTIFACTS_DIR}/cloud_scheduler_jobs.json" > "${ARTIFACTS_DIR}/cloud_scheduler_polygon_jobs.json"
    else
        echo "   ⚠ Cloud Scheduler no disponible o sin permisos"
        echo "[]" > "${ARTIFACTS_DIR}/cloud_scheduler_jobs.json"
    fi

    echo -e "${GREEN}✓ Sección 5 completada${NC}\n"
}

################################################################################
# SECCIÓN 6: CLOUD FUNCTIONS
################################################################################

section_6_cloud_functions() {
    echo -e "${GREEN}═══ SECCIÓN 6: CLOUD FUNCTIONS ═══${NC}"

    # 6.1 Listar Cloud Functions en todas las regiones
    echo -e "${YELLOW}[6.1] Listando Cloud Functions (gen1)...${NC}"
    gcloud functions list \
        --project="${PROJECT_ID}" \
        --format=json > "${ARTIFACTS_DIR}/cloud_functions_gen1.json" 2>&1

    # 6.2 Listar Cloud Functions gen2
    echo -e "${YELLOW}[6.2] Listando Cloud Functions (gen2)...${NC}"
    gcloud functions list \
        --gen2 \
        --project="${PROJECT_ID}" \
        --format=json > "${ARTIFACTS_DIR}/cloud_functions_gen2.json" 2>&1

    # 6.3 Filtrar las relacionadas con polygon
    echo -e "${YELLOW}[6.3] Filtrando funciones relacionadas con polygon...${NC}"

    if [ -f "${ARTIFACTS_DIR}/cloud_functions_gen1.json" ]; then
        jq '[.[] | select(.name | test("polygon"; "i"))]' "${ARTIFACTS_DIR}/cloud_functions_gen1.json" > "${ARTIFACTS_DIR}/cloud_functions_polygon.json" 2>/dev/null || echo "[]" > "${ARTIFACTS_DIR}/cloud_functions_polygon.json"
    fi

    echo -e "${GREEN}✓ Sección 6 completada${NC}\n"
}

################################################################################
# SECCIÓN 7: AUDITORÍA IAM
################################################################################

section_7_iam_audit() {
    echo -e "${GREEN}═══ SECCIÓN 7: AUDITORÍA IAM ═══${NC}"

    # 7.1 Obtener policy del proyecto
    echo -e "${YELLOW}[7.1] Obteniendo IAM policy del proyecto...${NC}"
    gcloud projects get-iam-policy "${PROJECT_ID}" --format=json > "${ARTIFACTS_DIR}/iam_project_policy.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/iam_project_policy.json"

    # 7.2 Obtener policy del dataset market_data
    echo -e "${YELLOW}[7.2] Obteniendo IAM policy de ${DATASET}...${NC}"
    bq show --format=prettyjson "${PROJECT_ID}:${DATASET}" | jq '.access' > "${ARTIFACTS_DIR}/iam_dataset_policy.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/iam_dataset_policy.json"

    # 7.3 Obtener policy del bucket
    echo -e "${YELLOW}[7.3] Obteniendo IAM policy del bucket...${NC}"
    gsutil iam get "${BUCKET}" > "${ARTIFACTS_DIR}/iam_bucket_policy.json"
    echo "   ✓ Guardado en: ${ARTIFACTS_DIR}/iam_bucket_policy.json"

    # 7.4 Buscar service accounts relacionadas con DTS y Cloud Functions
    echo -e "${YELLOW}[7.4] Identificando service accounts relevantes...${NC}"
    echo "Service Accounts encontradas:" > "${ARTIFACTS_DIR}/service_accounts_summary.txt"

    # DTS service account (patrón: service-{project-number}@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com)
    jq -r '.bindings[] | select(.members[] | contains("gcp-sa-bigquerydatatransfer")) | .members[]' "${ARTIFACTS_DIR}/iam_project_policy.json" | sort -u >> "${ARTIFACTS_DIR}/service_accounts_summary.txt"

    # Cloud Functions service accounts
    jq -r '.bindings[] | select(.members[] | contains("cloudfunctions") or contains("appspot")) | .members[]' "${ARTIFACTS_DIR}/iam_project_policy.json" | sort -u >> "${ARTIFACTS_DIR}/service_accounts_summary.txt"

    cat "${ARTIFACTS_DIR}/service_accounts_summary.txt"

    echo -e "${GREEN}✓ Sección 7 completada${NC}\n"
}

################################################################################
# MAIN: Ejecutar todas las secciones
################################################################################

main() {
    echo -e "${BLUE}Iniciando auditoría completa...${NC}\n"

    # Verificar autenticación
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
        echo -e "${RED}ERROR: No hay autenticación activa de gcloud${NC}"
        echo "Por favor ejecuta: gcloud auth login"
        exit 1
    fi

    # Crear directorio de artifacts si no existe
    mkdir -p "${ARTIFACTS_DIR}"

    # Ejecutar secciones
    section_1_gcs_inventory
    section_2_bigquery_inventory
    section_3_routines
    section_4_scheduled_queries
    section_5_cloud_scheduler
    section_6_cloud_functions
    section_7_iam_audit

    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     AUDITORÍA COMPLETADA                                      ║${NC}"
    echo -e "${BLUE}║     Revisa los archivos en: ${ARTIFACTS_DIR}                 ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
}

# Ejecutar main si el script se ejecuta directamente
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    main "$@"
fi

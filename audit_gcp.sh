#!/bin/bash
################################################################################
# AUDITORIA COMPLETA GCP - BigQuery
# Proyecto: sunny-advantage-471523-b3
################################################################################

set -e

CREDENTIALS_FILE="/home/user/signalssheets/credentials/gcp-service-account.json"
PROJECT_ID="sunny-advantage-471523-b3"
OUTPUT_DIR="/home/user/signalssheets/audit_2024"

# Crear directorio de salida
mkdir -p "$OUTPUT_DIR"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AUDITORIA COMPLETA GCP - BigQuery                         ║${NC}"
echo -e "${BLUE}║     Proyecto: sunny-advantage-471523-b3                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

################################################################################
# FUNCION: Generar JWT y obtener Access Token
################################################################################
get_access_token() {
    echo -e "${YELLOW}Generando token de acceso...${NC}"

    # Extraer campos del JSON de credenciales
    CLIENT_EMAIL=$(cat "$CREDENTIALS_FILE" | python3 -c "import sys,json; print(json.load(sys.stdin)['client_email'])")

    # Extraer private key y guardarla
    cat "$CREDENTIALS_FILE" | python3 -c "import sys,json; print(json.load(sys.stdin)['private_key'])" > /tmp/private_key.pem

    # Timestamps
    NOW=$(date +%s)
    EXP=$((NOW + 3600))

    # JWT Header (base64url)
    HEADER='{"alg":"RS256","typ":"JWT"}'
    HEADER_B64=$(echo -n "$HEADER" | openssl base64 -e | tr '+/' '-_' | tr -d '=\n')

    # JWT Payload (base64url)
    PAYLOAD=$(cat <<EOF
{
  "iss": "$CLIENT_EMAIL",
  "sub": "$CLIENT_EMAIL",
  "aud": "https://oauth2.googleapis.com/token",
  "iat": $NOW,
  "exp": $EXP,
  "scope": "https://www.googleapis.com/auth/bigquery https://www.googleapis.com/auth/cloud-platform"
}
EOF
)
    PAYLOAD_B64=$(echo -n "$PAYLOAD" | openssl base64 -e | tr '+/' '-_' | tr -d '=\n')

    # Firmar
    SIGNATURE=$(echo -n "${HEADER_B64}.${PAYLOAD_B64}" | openssl dgst -sha256 -sign /tmp/private_key.pem | openssl base64 -e | tr '+/' '-_' | tr -d '=\n')

    # JWT completo
    JWT="${HEADER_B64}.${PAYLOAD_B64}.${SIGNATURE}"

    # Intercambiar por access token
    TOKEN_RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
        -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
        -d "assertion=$JWT")

    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}Error obteniendo token: $TOKEN_RESPONSE${NC}"
        exit 1
    fi

    echo -e "${GREEN}Token obtenido exitosamente${NC}"
    echo "$ACCESS_TOKEN"
}

################################################################################
# FUNCION: API Request
################################################################################
api_get() {
    local url="$1"
    local output_file="$2"

    curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
         -H "Content-Type: application/json" \
         "$url" > "$output_file"
}

api_post() {
    local url="$1"
    local data="$2"
    local output_file="$3"

    curl -s -X POST \
         -H "Authorization: Bearer $ACCESS_TOKEN" \
         -H "Content-Type: application/json" \
         -d "$data" \
         "$url" > "$output_file"
}

bq_query() {
    local query="$1"
    local output_file="$2"

    local data=$(cat <<EOF
{
    "query": "$query",
    "useLegacySql": false,
    "maxResults": 10000
}
EOF
)

    api_post "https://bigquery.googleapis.com/bigquery/v2/projects/$PROJECT_ID/queries" "$data" "$output_file"
}

################################################################################
# MAIN
################################################################################

# Obtener token
ACCESS_TOKEN=$(get_access_token)
echo ""

# 1. DATASETS
echo -e "${GREEN}[1/10] Obteniendo datasets...${NC}"
api_get "https://bigquery.googleapis.com/bigquery/v2/projects/$PROJECT_ID/datasets" "$OUTPUT_DIR/01_datasets.json"
echo "  Guardado en: $OUTPUT_DIR/01_datasets.json"

# Listar datasets encontrados
DATASETS=$(cat "$OUTPUT_DIR/01_datasets.json" | python3 -c "
import sys,json
data = json.load(sys.stdin)
for ds in data.get('datasets', []):
    print(ds['datasetReference']['datasetId'])
" 2>/dev/null || echo "")

echo "  Datasets encontrados:"
for ds in $DATASETS; do
    echo "    - $ds"
done
echo ""

# 2. TABLAS POR DATASET
echo -e "${GREEN}[2/10] Obteniendo tablas por dataset...${NC}"
for ds in $DATASETS; do
    echo "  Dataset: $ds"
    api_get "https://bigquery.googleapis.com/bigquery/v2/projects/$PROJECT_ID/datasets/$ds/tables" "$OUTPUT_DIR/02_tables_${ds}.json"

    # Info detallada de cada tabla
    TABLES=$(cat "$OUTPUT_DIR/02_tables_${ds}.json" | python3 -c "
import sys,json
data = json.load(sys.stdin)
for t in data.get('tables', []):
    print(t['tableReference']['tableId'])
" 2>/dev/null || echo "")

    for tbl in $TABLES; do
        echo "    - $tbl"
        api_get "https://bigquery.googleapis.com/bigquery/v2/projects/$PROJECT_ID/datasets/$ds/tables/$tbl" "$OUTPUT_DIR/02_table_${ds}_${tbl}.json"
    done
done
echo ""

# 3. RUTINAS (Stored Procedures, Functions)
echo -e "${GREEN}[3/10] Obteniendo rutinas (SPs, funciones)...${NC}"
for ds in $DATASETS; do
    echo "  Dataset: $ds"
    api_get "https://bigquery.googleapis.com/bigquery/v2/projects/$PROJECT_ID/datasets/$ds/routines" "$OUTPUT_DIR/03_routines_${ds}.json"

    # Info detallada de cada rutina
    ROUTINES=$(cat "$OUTPUT_DIR/03_routines_${ds}.json" | python3 -c "
import sys,json
data = json.load(sys.stdin)
for r in data.get('routines', []):
    print(r['routineReference']['routineId'])
" 2>/dev/null || echo "")

    for routine in $ROUTINES; do
        echo "    - $routine"
        api_get "https://bigquery.googleapis.com/bigquery/v2/projects/$PROJECT_ID/datasets/$ds/routines/$routine" "$OUTPUT_DIR/03_routine_${ds}_${routine}.json"
    done
done
echo ""

# 4. SCHEDULED QUERIES (Data Transfer Service)
echo -e "${GREEN}[4/10] Obteniendo Scheduled Queries...${NC}"
api_get "https://bigquerydatatransfer.googleapis.com/v1/projects/$PROJECT_ID/locations/-/transferConfigs" "$OUTPUT_DIR/04_scheduled_queries.json"

# Obtener runs de cada config
CONFIGS=$(cat "$OUTPUT_DIR/04_scheduled_queries.json" | python3 -c "
import sys,json
data = json.load(sys.stdin)
for c in data.get('transferConfigs', []):
    print(c['name'])
" 2>/dev/null || echo "")

for config in $CONFIGS; do
    config_name=$(echo "$config" | sed 's|.*/||')
    echo "  - $config_name"
    api_get "https://bigquerydatatransfer.googleapis.com/v1/${config}/runs?pageSize=20" "$OUTPUT_DIR/04_runs_${config_name}.json"
done
echo ""

# 5. JOBS RECIENTES
echo -e "${GREEN}[5/10] Obteniendo jobs recientes de BigQuery...${NC}"
api_get "https://bigquery.googleapis.com/bigquery/v2/projects/$PROJECT_ID/jobs?maxResults=100&allUsers=true" "$OUTPUT_DIR/05_jobs.json"
JOBS_COUNT=$(cat "$OUTPUT_DIR/05_jobs.json" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('jobs', [])))" 2>/dev/null || echo "0")
echo "  Jobs encontrados: $JOBS_COUNT"
echo ""

# 6. CLOUD FUNCTIONS
echo -e "${GREEN}[6/10] Obteniendo Cloud Functions...${NC}"
api_get "https://cloudfunctions.googleapis.com/v1/projects/$PROJECT_ID/locations/-/functions" "$OUTPUT_DIR/06_cloud_functions.json"

FUNCTIONS=$(cat "$OUTPUT_DIR/06_cloud_functions.json" | python3 -c "
import sys,json
data = json.load(sys.stdin)
for f in data.get('functions', []):
    print(f['name'])
" 2>/dev/null || echo "")

for func in $FUNCTIONS; do
    func_name=$(echo "$func" | sed 's|.*/||')
    echo "  - $func_name"
done
echo ""

# 7. CLOUD SCHEDULER
echo -e "${GREEN}[7/10] Obteniendo Cloud Scheduler jobs...${NC}"
for region in us-central1 us-east1 europe-west1; do
    api_get "https://cloudscheduler.googleapis.com/v1/projects/$PROJECT_ID/locations/$region/jobs" "$OUTPUT_DIR/07_scheduler_${region}.json"
done

# Consolidar scheduler jobs
python3 << 'EOF'
import json, glob
all_jobs = []
for f in glob.glob('/home/user/signalssheets/audit_2024/07_scheduler_*.json'):
    try:
        with open(f) as fp:
            data = json.load(fp)
            all_jobs.extend(data.get('jobs', []))
    except:
        pass
with open('/home/user/signalssheets/audit_2024/07_scheduler_all.json', 'w') as fp:
    json.dump({'jobs': all_jobs}, fp, indent=2)
print(f"  Jobs encontrados: {len(all_jobs)}")
EOF
echo ""

# 8. ESTADISTICAS DE TABLAS
echo -e "${GREEN}[8/10] Obteniendo estadisticas de tablas principales...${NC}"

# Query: Info de stg_prices_polygon_raw
bq_query "SELECT COUNT(*) as total_rows, MIN(date) as min_date, MAX(date) as max_date, COUNT(DISTINCT date) as distinct_dates FROM \\\`$PROJECT_ID.market_data.stg_prices_polygon_raw\\\`" "$OUTPUT_DIR/08_stats_staging.json"
echo "  Stats de stg_prices_polygon_raw guardadas"

# Query: Info de Prices
bq_query "SELECT COUNT(*) as total_rows, MIN(date) as min_date, MAX(date) as max_date, COUNT(DISTINCT date) as distinct_dates FROM \\\`$PROJECT_ID.market_data.Prices\\\`" "$OUTPUT_DIR/08_stats_prices.json"
echo "  Stats de Prices guardadas"

# Query: Particiones
bq_query "SELECT table_name, partition_id, total_rows, total_logical_bytes FROM \\\`$PROJECT_ID.market_data.INFORMATION_SCHEMA.PARTITIONS\\\` WHERE table_name IN ('stg_prices_polygon_raw', 'Prices') ORDER BY table_name, partition_id DESC" "$OUTPUT_DIR/08_partitions.json"
echo "  Info de particiones guardada"
echo ""

# 9. INFORMATION_SCHEMA
echo -e "${GREEN}[9/10] Obteniendo metadata de INFORMATION_SCHEMA...${NC}"

# Tablas
bq_query "SELECT table_catalog, table_schema, table_name, table_type, creation_time, ddl FROM \\\`$PROJECT_ID.market_data.INFORMATION_SCHEMA.TABLES\\\`" "$OUTPUT_DIR/09_info_tables.json"
echo "  INFORMATION_SCHEMA.TABLES guardada"

# Columnas
bq_query "SELECT table_name, column_name, ordinal_position, data_type, is_nullable FROM \\\`$PROJECT_ID.market_data.INFORMATION_SCHEMA.COLUMNS\\\` ORDER BY table_name, ordinal_position" "$OUTPUT_DIR/09_info_columns.json"
echo "  INFORMATION_SCHEMA.COLUMNS guardada"

# Routines
bq_query "SELECT routine_catalog, routine_schema, routine_name, routine_type, routine_definition, created, last_modified FROM \\\`$PROJECT_ID.market_data.INFORMATION_SCHEMA.ROUTINES\\\`" "$OUTPUT_DIR/09_info_routines.json"
echo "  INFORMATION_SCHEMA.ROUTINES guardada"
echo ""

# 10. IAM
echo -e "${GREEN}[10/10] Obteniendo IAM policy...${NC}"
api_post "https://cloudresourcemanager.googleapis.com/v1/projects/$PROJECT_ID:getIamPolicy" "{}" "$OUTPUT_DIR/10_iam_policy.json"
echo "  IAM policy guardada"
echo ""

# Limpiar
rm -f /tmp/private_key.pem

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AUDITORIA COMPLETADA                                      ║${NC}"
echo -e "${BLUE}║     Resultados en: $OUTPUT_DIR                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Listar archivos generados
echo ""
echo "Archivos generados:"
ls -la "$OUTPUT_DIR"/*.json | awk '{print "  " $NF}'

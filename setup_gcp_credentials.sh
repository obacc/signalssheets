#!/bin/bash
###############################################################################
# SETUP GCP CREDENTIALS - SignalsSheets EOD Pipeline Audit
# Este script configura las credenciales de GCP para ejecutar la auditoría
###############################################################################

set -e

echo "🔧 CONFIGURACIÓN DE CREDENCIALES GCP"
echo "====================================="
echo ""

# Verificar si se proporcionó el archivo de credenciales
if [ $# -eq 0 ]; then
    echo "❌ Error: Debes proporcionar la ruta al archivo de credenciales JSON"
    echo ""
    echo "Uso:"
    echo "  $0 /ruta/a/credenciales.json"
    echo ""
    echo "O crea el archivo manualmente:"
    echo "  cat > /tmp/gcp-sa-key.json <<'EOF'"
    echo "  { ... JSON content ... }"
    echo "  EOF"
    echo "  export GOOGLE_APPLICATION_CREDENTIALS='/tmp/gcp-sa-key.json'"
    echo ""
    exit 1
fi

CRED_FILE="$1"

# Verificar que el archivo existe
if [ ! -f "$CRED_FILE" ]; then
    echo "❌ Error: El archivo $CRED_FILE no existe"
    exit 1
fi

# Verificar que es un JSON válido
if ! python3 -c "import json; json.load(open('$CRED_FILE'))" 2>/dev/null; then
    echo "❌ Error: El archivo $CRED_FILE no es un JSON válido"
    exit 1
fi

echo "✅ Archivo de credenciales encontrado: $CRED_FILE"
echo ""

# Exportar variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="$CRED_FILE"

echo "✅ Variable GOOGLE_APPLICATION_CREDENTIALS configurada"
echo ""

# Verificar información del service account
echo "📋 Información del Service Account:"
echo "-----------------------------------"
python3 -c "
import json
with open('$CRED_FILE') as f:
    data = json.load(f)
    print(f\"  Project ID: {data.get('project_id', 'N/A')}\")
    print(f\"  Client Email: {data.get('client_email', 'N/A')}\")
    print(f\"  Type: {data.get('type', 'N/A')}\")
"
echo ""

# Verificar que las bibliotecas de Python están instaladas
echo "🔍 Verificando bibliotecas de Python..."
if ! python3 -c "from google.cloud import bigquery, storage; print('OK')" 2>/dev/null; then
    echo "⚠️  Las bibliotecas de Google Cloud no están instaladas"
    echo "   Instalando..."
    pip3 install --quiet google-cloud-bigquery google-cloud-storage google-cloud-logging pytz
    echo "✅ Bibliotecas instaladas"
else
    echo "✅ Bibliotecas de Google Cloud OK"
fi
echo ""

# Probar conexión a BigQuery
echo "🔍 Probando conexión a BigQuery..."
if python3 -c "
import os
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '$CRED_FILE'
from google.cloud import bigquery
client = bigquery.Client(project='sunny-advantage-471523-b3')
list(client.list_datasets(max_results=1))
print('OK')
" 2>/dev/null | grep -q "OK"; then
    echo "✅ Conexión a BigQuery exitosa"
else
    echo "❌ Error: No se pudo conectar a BigQuery"
    echo "   Verifica que el service account tiene permisos de BigQuery"
    exit 1
fi
echo ""

# Probar conexión a GCS
echo "🔍 Probando conexión a Google Cloud Storage..."
if python3 -c "
import os
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '$CRED_FILE'
from google.cloud import storage
client = storage.Client(project='sunny-advantage-471523-b3')
list(client.list_buckets(max_results=1))
print('OK')
" 2>/dev/null | grep -q "OK"; then
    echo "✅ Conexión a GCS exitosa"
else
    echo "⚠️  Advertencia: No se pudo conectar a GCS"
    echo "   Verifica que el service account tiene permisos de Storage"
fi
echo ""

echo "======================================"
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "======================================"
echo ""
echo "Para ejecutar la auditoría:"
echo "  export GOOGLE_APPLICATION_CREDENTIALS='$CRED_FILE'"
echo "  python3 audit_eod_pipeline.py"
echo ""
echo "O en una sola línea:"
echo "  GOOGLE_APPLICATION_CREDENTIALS='$CRED_FILE' python3 audit_eod_pipeline.py"
echo ""

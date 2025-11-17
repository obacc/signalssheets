#!/bin/bash
###############################################################################
# SCRIPT MAESTRO - AUDITORÍA EOD PIPELINE
# Ejecuta toda la auditoría y genera el reporte final
###############################################################################

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║       AUDITORÍA COMPLETA - PIPELINE EOD SIGNALSSHEETS                  ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que existe GOOGLE_APPLICATION_CREDENTIALS
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo -e "${RED}❌ Error: Variable GOOGLE_APPLICATION_CREDENTIALS no configurada${NC}"
    echo ""
    echo "Opciones:"
    echo ""
    echo "1. Configurar manualmente:"
    echo "   export GOOGLE_APPLICATION_CREDENTIALS=\"/ruta/a/credenciales.json\""
    echo "   $0"
    echo ""
    echo "2. Usar el script helper:"
    echo "   ./setup_gcp_credentials.sh /ruta/a/credenciales.json"
    echo "   $0"
    echo ""
    echo "3. Ejecutar inline:"
    echo "   GOOGLE_APPLICATION_CREDENTIALS=\"/ruta/a/creds.json\" $0"
    echo ""
    exit 1
fi

# Verificar que el archivo existe
if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo -e "${RED}❌ Error: Archivo de credenciales no encontrado:${NC}"
    echo "   $GOOGLE_APPLICATION_CREDENTIALS"
    exit 1
fi

echo -e "${GREEN}✅ Credenciales encontradas:${NC} $GOOGLE_APPLICATION_CREDENTIALS"
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: python3 no está instalado${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Verificando dependencias de Python...${NC}"

# Verificar bibliotecas
if ! python3 -c "from google.cloud import bigquery, storage; import pytz" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Instalando dependencias necesarias...${NC}"
    pip3 install --quiet google-cloud-bigquery google-cloud-storage google-cloud-logging pytz
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✅ Dependencias OK${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                     FASE 1-4: AUDITORÍA DE DATOS                       ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Ejecutar auditoría
echo -e "${BLUE}🚀 Ejecutando auditoría completa...${NC}"
echo ""

if python3 audit_eod_pipeline.py; then
    echo ""
    echo -e "${GREEN}✅ Auditoría completada exitosamente${NC}"
else
    echo ""
    echo -e "${RED}❌ Error en la auditoría${NC}"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                   GENERANDO REPORTE MARKDOWN                           ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Generar reporte
if python3 generate_eod_report.py; then
    echo ""
    echo -e "${GREEN}✅ Reporte generado exitosamente${NC}"
else
    echo ""
    echo -e "${RED}❌ Error al generar reporte${NC}"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                      AUDITORÍA COMPLETADA                              ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}📊 ARCHIVOS GENERADOS:${NC}"
echo ""
echo "  1. eod_pipeline_audit_results.json   - Datos raw en JSON"
echo "  2. DATA_PIPELINE_AUDIT_REPORT.md     - Reporte completo con recomendaciones"
echo ""

echo -e "${BLUE}📖 Para ver el reporte:${NC}"
echo ""
echo "  cat DATA_PIPELINE_AUDIT_REPORT.md"
echo ""
echo "  # O en tu editor favorito:"
echo "  code DATA_PIPELINE_AUDIT_REPORT.md"
echo "  vi DATA_PIPELINE_AUDIT_REPORT.md"
echo ""

echo -e "${YELLOW}⚠️  NOTA IMPORTANTE:${NC}"
echo ""
echo "  Para completar el análisis del Worker, necesitamos:"
echo "  - Código del Worker 'free-api'"
echo "  - Configuración wrangler.toml del worker"
echo "  - Logs del worker (wrangler tail --name free-api)"
echo ""

echo -e "${GREEN}✅ SIGUIENTE PASO:${NC}"
echo ""
echo "  Lee el reporte y valida las recomendaciones:"
echo "  cat DATA_PIPELINE_AUDIT_REPORT.md"
echo ""

# Mostrar preview del reporte
echo "═══════════════════════════════════════════════════════════════════════"
echo "PREVIEW DEL REPORTE (primeras 50 líneas):"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
head -50 DATA_PIPELINE_AUDIT_REPORT.md
echo ""
echo "... (continúa en DATA_PIPELINE_AUDIT_REPORT.md)"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"

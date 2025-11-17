# 🔍 AUDITORÍA EOD PIPELINE - INSTRUCCIONES

## 📋 RESUMEN

Este toolkit te permite auditar el pipeline completo de datos EOD (End of Day) de SignalsSheets para determinar el horario óptimo del CRON trigger del Worker de Cloudflare.

**Objetivo:** Mapear el flujo completo desde la descarga de datos de Polygon hasta el refresh del Worker, identificando los tiempos exactos de cada etapa.

---

## 🚀 INICIO RÁPIDO

### Prerequisitos

✅ Python 3.7+ instalado
✅ Acceso al proyecto GCP `sunny-advantage-471523-b3`
✅ Service Account con permisos de BigQuery y Storage

### Paso 1: Configurar Credenciales de GCP

Tienes dos opciones:

#### Opción A: Usando el script helper

```bash
# Crea el archivo de credenciales
cat > /tmp/gcp-sa-key.json <<'EOF'
{
  "type": "service_account",
  "project_id": "sunny-advantage-471523-b3",
  "private_key_id": "TU_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com",
  "client_id": "TU_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
}
EOF

# Ejecuta el setup
./setup_gcp_credentials.sh /tmp/gcp-sa-key.json
```

#### Opción B: Manual

```bash
# Exportar directamente la variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/tu/credenciales.json"

# Instalar dependencias
pip3 install google-cloud-bigquery google-cloud-storage google-cloud-logging pytz
```

### Paso 2: Ejecutar la Auditoría

```bash
# Ejecutar el script de auditoría
python3 audit_eod_pipeline.py
```

**Salida esperada:**
- Archivo JSON: `eod_pipeline_audit_results.json` con todos los datos recolectados
- Output en consola con información detallada de cada fase

### Paso 3: Generar el Reporte

```bash
# Genera el reporte Markdown
python3 generate_eod_report.py

# Ver el reporte
cat DATA_PIPELINE_AUDIT_REPORT.md
```

---

## 📊 ¿QUÉ HACE LA AUDITORÍA?

### FASE 1: BigQuery - Tiempos de Actualización

Analiza:
- ✅ Última actualización de `market_data.prices`
- ✅ Última actualización de `analytics.v_api_free_signals`
- ✅ Distribución horaria de updates (últimos 7 días)
- ✅ Identifica patrones de actualización

**Queries ejecutadas:**
```sql
-- 1. Análisis de tabla prices
SELECT MAX(date), MAX(updated_at), COUNT(*), COUNT(DISTINCT ticker)
FROM `market_data.prices`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS)

-- 2. Análisis de vista de señales
SELECT MAX(signal_date), COUNT(*), COUNT(DISTINCT ticker)
FROM `analytics.v_api_free_signals`

-- 3. Distribución horaria
SELECT EXTRACT(HOUR FROM updated_at), COUNT(*), MIN(updated_at), MAX(updated_at)
FROM `market_data.prices`
WHERE DATE(updated_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS)
GROUP BY EXTRACT(HOUR FROM updated_at)
```

### FASE 2: GCS - Archivos Recientes

Analiza:
- ✅ Últimos archivos cargados en `gs://ss-bucket-polygon-incremental/polygon/daily/`
- ✅ Fechas disponibles
- ✅ Tamaño de archivos
- ✅ Timestamps de actualización

### FASE 3: Scheduled Queries (Manual)

Documenta cómo listar scheduled queries:
```bash
bq ls --transfer_config --project_id=sunny-advantage-471523-b3
```

### FASE 4: Gap Analysis

Calcula:
- ✅ Diferencia temporal entre `prices` y `v_api_free_signals`
- ✅ Identifica si hay desfase entre datos y señales

---

## 📝 ESTRUCTURA DE ARCHIVOS

```
signalssheets/
├── EOD_AUDIT_README.md                 ← Este archivo
├── audit_eod_pipeline.py               ← Script principal de auditoría
├── generate_eod_report.py              ← Generador de reporte Markdown
├── setup_gcp_credentials.sh            ← Helper para configurar credenciales
├── eod_pipeline_audit_results.json     ← Resultados (generado)
└── DATA_PIPELINE_AUDIT_REPORT.md       ← Reporte final (generado)
```

---

## 🎯 INFORMACIÓN DEL CLOUDFLARE WORKER

Para completar la auditoría, necesitamos información sobre el Worker `free-api`:

### ¿Qué necesitamos?

1. **Código del Worker**
   - Archivo principal (index.ts, worker.ts, etc.)
   - Configuración wrangler.toml del worker
   - Código que hace fetch a `analytics.v_api_free_signals`

2. **Configuración actual del CRON**
   - ¿Cuál es el schedule actual? (cada 10 min según contexto)
   - ¿Qué TTL tiene el cache KV?

3. **Ubicación del Repositorio**
   - ¿Está en un repo separado?
   - ¿Cómo se despliega actualmente?

### Compartir esta información

Puedes:
- Proporcionar acceso al repositorio del worker
- Copiar y pegar el código relevante
- Ejecutar `wrangler tail --name free-api` para ver logs

---

## 🔧 TROUBLESHOOTING

### Error: "Failed to retrieve metadata"

**Problema:** No hay credenciales configuradas

**Solución:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/credenciales.json"
python3 audit_eod_pipeline.py
```

### Error: "Permission denied"

**Problema:** El service account no tiene permisos suficientes

**Permisos necesarios:**
- `roles/bigquery.dataViewer` - Para leer tablas
- `roles/bigquery.jobUser` - Para ejecutar queries
- `roles/storage.objectViewer` - Para leer GCS

**Solución:**
```bash
# Verificar permisos
gcloud projects get-iam-policy sunny-advantage-471523-b3 \
  --flatten="bindings[].members" \
  --filter="bindings.members:claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com"
```

### Error: "Table not found"

**Problema:** Nombre de tabla incorrecto o dataset no existe

**Solución:**
```bash
# Listar datasets
bq ls sunny-advantage-471523-b3

# Listar tablas en market_data
bq ls sunny-advantage-471523-b3:market_data

# Listar tablas en analytics
bq ls sunny-advantage-471523-b3:analytics
```

### No se encontraron archivos en GCS

**Problema:** Bucket vacío o prefijo incorrecto

**Solución:**
```bash
# Listar buckets
gsutil ls -p sunny-advantage-471523-b3

# Listar contenido del bucket
gsutil ls gs://ss-bucket-polygon-incremental/

# Ver estructura
gsutil ls gs://ss-bucket-polygon-incremental/polygon/
```

---

## 📖 EJEMPLO DE OUTPUT

### Console Output (audit_eod_pipeline.py)

```
================================================================================
🚀 AUDITORÍA COMPLETA - PIPELINE EOD SIGNALSSHEETS
================================================================================
📅 Fecha de ejecución: 2025-11-17 08:00:00 UTC
🔧 Proyecto: sunny-advantage-471523-b3
================================================================================

================================================================================
🔍 FASE 1: BIGQUERY - ANÁLISIS DE TIEMPOS DE ACTUALIZACIÓN
================================================================================

📊 1.1 - Analizando tabla market_data.prices...
  ✅ Última fecha de precios: 2025-11-16
  ✅ Última actualización: 2025-11-17 07:30:00 UTC | 2025-11-17 01:30:00 CT
  📈 Registros (últimos 7 días): 125,432
  🎯 Tickers únicos: 5,231

🎯 1.2 - Analizando vista analytics.v_api_free_signals...
  ✅ Última fecha de señales: 2025-11-16
  📊 Total de señales: 234
  🎯 Tickers únicos: 234

...
```

### Reporte Final (DATA_PIPELINE_AUDIT_REPORT.md)

```markdown
# REPORTE DE AUDITORÍA - PIPELINE EOD SIGNALSSHEETS

**Proyecto:** `sunny-advantage-471523-b3`
**Fecha de Auditoría:** 2025-11-17T08:00:00Z
**Auditor:** Claude Code

---

## 1. EXECUTIVE SUMMARY

### Estado Actual del Pipeline

- **Última fecha de precios:** 2025-11-16
- **Última actualización de prices:** 2025-11-17 07:30:00 UTC | 01:30:00 CT
- **Registros (últimos 7 días):** 125,432
- **Última fecha de señales:** 2025-11-16
- **Total de señales:** 234
- **Gap entre prices y signals:** 0 días
  - ✅ Señales y precios están sincronizados

...

## 6. RECOMENDACIÓN FINAL

### Nuevo CRON Schedule Recomendado:

```toml
[triggers]
crons = ["0 9 * * 1-5"]  # 09:00 UTC = 03:00 CT (lunes a viernes)
```

**Justificación:**
- Prices se actualizan alrededor de las 07:00 UTC
- Damos 2 horas de margen para que el procesamiento de señales complete
- Worker ejecutará a las 09:00 UTC (03:00 CT)

...
```

---

## 💡 PRÓXIMOS PASOS

Una vez completada la auditoría:

1. ✅ **Revisar el reporte** - `DATA_PIPELINE_AUDIT_REPORT.md`
2. ✅ **Validar los horarios** - Confirmar con logs reales
3. ✅ **Actualizar Worker** - Modificar wrangler.toml con nuevo cron
4. ✅ **Actualizar TTL** - Cambiar cache TTL a 24 horas
5. ✅ **Desplegar** - `wrangler deploy --name free-api`
6. ✅ **Monitorear** - Verificar logs post-deployment

---

## 🆘 ¿NECESITAS AYUDA?

### Para ejecutar la auditoría:

```bash
# 1. Configura credenciales
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/credenciales.json"

# 2. Ejecuta auditoría
python3 audit_eod_pipeline.py

# 3. Genera reporte
python3 generate_eod_report.py

# 4. Lee el reporte
cat DATA_PIPELINE_AUDIT_REPORT.md
```

### ¿Falta información del Worker?

Comparte:
- Código del worker (índex.ts o similar)
- Configuración wrangler.toml
- Output de `wrangler tail --name free-api`

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [Auditoría Polygon Pipeline](auditoria/AUDITORIA_POLYGON.md) - Pipeline de carga GCS → BigQuery
- [Scripts de auditoría existentes](auditoria/scripts/) - Comandos GCS/BQ/IAM
- [Queries SQL](auditoria/sql/) - Análisis de datos

---

**Creado por:** Claude Code
**Versión:** 1.0
**Última actualización:** 2025-11-17

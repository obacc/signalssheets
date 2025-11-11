# 🔍 AUDITORÍA PIPELINE POLYGON → BIGQUERY

Toolkit completo para auditar el pipeline de carga de datos Polygon desde GCS hasta BigQuery.

## 📦 Contenido

```
auditoria/
├── README.md                     ← Instrucciones (este archivo)
├── AUDITORIA_POLYGON.md          ← Informe completo con análisis y recomendaciones
├── scripts/
│   ├── 00_COMANDOS_COMPLETOS.sh  ← Script maestro (GCS, BQ, IAM, Cloud Functions)
│   ├── 05_diagnostico_logs_cloud.sh ← Extracción de logs de errores
│   └── 07_analisis_gcs_vs_bq.py  ← Comparación Python (GCS vs Staging vs Prices)
├── sql/
│   ├── 01_row_counts_staging.sql
│   ├── 02_row_counts_prices.sql
│   ├── 03_diff_staging_vs_prices.sql
│   ├── 04_diagnostico_fallos_bq_jobs.sql
│   └── 06_analisis_calidad_datos.sql
└── artifacts/                    ← Resultados (CSV/JSON) - se generan al ejecutar
```

---

## ⚡ INICIO RÁPIDO

### 1. Configurar Credenciales

Guarda el JSON de service account en un archivo seguro:

```bash
# Crear archivo de credenciales
cat > /tmp/gcp-sa-key.json <<'EOF'
{
  "type": "service_account",
  "project_id": "sunny-advantage-471523-b3",
  "private_key_id": "45e8e24c...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com",
  ...
}
EOF

# Exportar variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="/tmp/gcp-sa-key.json"

# Autenticar gcloud
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
gcloud config set project sunny-advantage-471523-b3
```

### 2. Instalar Dependencias

```bash
# Python 3.7+ requerido
pip3 install google-cloud-storage google-cloud-bigquery

# Verificar instalación de herramientas GCP
gcloud --version
bq --version
gsutil --version
```

### 3. Ejecutar Auditoría Completa

```bash
cd auditoria/scripts

# Opción 1: Script bash completo (GCS, BQ, IAM)
./00_COMANDOS_COMPLETOS.sh

# Opción 2: Solo logs de errores
./05_diagnostico_logs_cloud.sh

# Opción 3: Análisis Python (comparación detallada)
python3 07_analisis_gcs_vs_bq.py
```

### 4. Consultas SQL Individuales

```bash
cd auditoria

# Row counts en staging (últimos 30 días)
bq query --use_legacy_sql=false --format=csv < sql/01_row_counts_staging.sql > artifacts/staging_counts.csv

# Row counts en Prices
bq query --use_legacy_sql=false --format=csv < sql/02_row_counts_prices.sql > artifacts/prices_counts.csv

# Diferencias staging vs prices
bq query --use_legacy_sql=false --format=csv < sql/03_diff_staging_vs_prices.sql > artifacts/diff.csv

# Diagnóstico de fallos (BigQuery jobs)
bq query --use_legacy_sql=false --format=csv < sql/04_diagnostico_fallos_bq_jobs.sql > artifacts/bq_errors.csv

# Análisis de calidad (duplicados, NULLs, anomalías)
bq query --use_legacy_sql=false --format=csv < sql/06_analisis_calidad_datos.sql > artifacts/quality.csv
```

---

## 📊 RESULTADOS ESPERADOS

Después de ejecutar los scripts, encontrarás en `artifacts/`:

### Archivos Generados por Scripts Bash

| Archivo | Descripción |
|---------|-------------|
| `gcs_dates_available.txt` | Lista de todas las fechas en GCS |
| `gcs_inventory.csv` | Detalles por fecha (archivos, bytes, MB) |
| `gcs_date_gaps.txt` | Gaps temporales detectados |
| `bq_datasets.json` | Todos los datasets del proyecto |
| `bq_tables_market_data.json` | Tablas en market_data |
| `schema_staging.json` | Schema de stg_prices_polygon_raw |
| `schema_prices.json` | Schema de Prices |
| `table_info_staging.json` | Info completa de staging (particiones, etc) |
| `table_info_prices.json` | Info completa de Prices |
| `routines.json` | Lista de rutinas en market_data |
| `sp_merge_polygon_prices.sql` | Código del Stored Procedure |
| `scheduled_queries.json` | Configuraciones de Scheduled Queries |
| `scheduled_queries_runs.json` | Historial de ejecuciones |
| `cloud_scheduler_jobs.json` | Jobs de Cloud Scheduler |
| `cloud_functions_*.json` | Funciones en GCP |
| `iam_*.json` | Políticas IAM (proyecto, dataset, bucket) |
| `service_accounts_summary.txt` | SAs relevantes identificadas |

### Archivos de Logs

| Archivo | Descripción |
|---------|-------------|
| `logs_cloud_functions_errors.json` | Errores de Cloud Functions |
| `logs_cloud_scheduler_errors.json` | Errores de Cloud Scheduler |
| `logs_dts_errors.json` | Errores de Data Transfer Service |
| `logs_polygon_all.json` | Todos los logs con keyword "polygon" |
| `logs_top_errors.json` | Top errores agrupados por mensaje |
| `logs_error_frequency.csv` | Frecuencia de errores por día |

### Archivos de Análisis Python

| Archivo | Descripción |
|---------|-------------|
| `diff_gcs_staging_prices.csv` | Comparación fecha por fecha |
| `comparison_summary.json` | Resumen ejecutivo con gaps |

### Archivos de Consultas SQL

| Archivo | Descripción |
|---------|-------------|
| `staging_counts.csv` | Row counts por fecha en staging |
| `prices_counts.csv` | Row counts por fecha en Prices |
| `diff_staging_vs_prices.csv` | Diferencias y status por fecha |
| `bq_jobs_errors.csv` | Jobs fallidos (últimos 14 días) |
| `data_quality.csv` | Duplicados, NULLs, anomalías |

---

## 🎯 CASOS DE USO

### Caso 1: "¿Por qué no hay datos de ayer en Prices?"

```bash
# 1. Verificar si está en GCS
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/ | grep $(date -d "yesterday" +%Y-%m-%d)

# 2. Verificar si llegó a staging
bq query --use_legacy_sql=false "
SELECT date, COUNT(*) as rows
FROM \`sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw\`
WHERE date = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
GROUP BY date
"

# 3. Ejecutar análisis completo
python3 scripts/07_analisis_gcs_vs_bq.py
```

### Caso 2: "¿Hay errores recientes en el pipeline?"

```bash
# 1. Ver errores de BigQuery jobs
bq query --use_legacy_sql=false < sql/04_diagnostico_fallos_bq_jobs.sql

# 2. Ver logs de Cloud (últimos 14 días)
./scripts/05_diagnostico_logs_cloud.sh

# 3. Revisar top errores
cat artifacts/logs_top_errors.json | jq '.[] | select(.occurrences > 5)'
```

### Caso 3: "¿El SP está duplicando datos?"

```bash
# Ejecutar análisis de calidad
bq query --use_legacy_sql=false < sql/06_analisis_calidad_datos.sql

# Ver resultados de duplicados
grep "duplicate_count" artifacts/data_quality.csv
```

### Caso 4: "¿Qué permisos tiene la service account?"

```bash
# Ejecutar auditoría IAM
cd scripts
./00_COMANDOS_COMPLETOS.sh  # Solo ejecuta sección 7

# Ver resumen
cat ../artifacts/service_accounts_summary.txt

# Ver policy completa del proyecto
cat ../artifacts/iam_project_policy.json | jq '.bindings[] | select(.members[] | contains("bigquerydatatransfer"))'
```

---

## 🔧 TROUBLESHOOTING

### Error: "Permission denied"

```bash
# Verificar autenticación
gcloud auth list

# Verificar permisos de la SA
gcloud projects get-iam-policy sunny-advantage-471523-b3 \
  --flatten="bindings[].members" \
  --filter="bindings.members:claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com"
```

**Permisos mínimos necesarios:**
- `roles/bigquery.dataViewer` (para leer tablas)
- `roles/bigquery.jobUser` (para ejecutar queries)
- `roles/storage.objectViewer` (para leer GCS)
- `roles/logging.viewer` (para leer logs)

### Error: "Table not found"

```bash
# Listar tablas existentes
bq ls sunny-advantage-471523-b3:market_data

# Verificar nombre exacto (case-sensitive)
bq show sunny-advantage-471523-b3:market_data.stg_prices_polygon_raw
```

### Error: "Not found: Dataset sunny-advantage-471523-b3:region-us"

En `sql/04_diagnostico_fallos_bq_jobs.sql`, ajustar la región:

```sql
-- Probar con:
FROM `sunny-advantage-471523-b3.region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
-- O sin región:
FROM `sunny-advantage-471523-b3`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
```

### Script Python falla con ImportError

```bash
# Instalar librerías
pip3 install --upgrade google-cloud-storage google-cloud-bigquery

# Verificar instalación
python3 -c "from google.cloud import bigquery, storage; print('OK')"
```

---

## 💰 ESTIMACIÓN DE COSTOS

Todos los scripts son de **SOLO LECTURA** y tienen costos mínimos:

| Operación | Costo Estimado |
|-----------|----------------|
| Listar GCS (`gsutil ls`) | $0 (operaciones gratis) |
| Leer metadatos BQ (`bq show`) | $0 (metadatos gratis) |
| Queries SQL auditoría | ~$0.05 (10 GB escaneados) |
| Leer Cloud Logging | $0 (dentro de límites gratuitos) |
| **TOTAL estimado** | **< $0.10** |

**Nota:** Si las tablas NO están particionadas, las queries SQL pueden escanear toda la tabla (mayor costo). Las consultas incluyen filtros de fecha para minimizar esto.

---

## 🔒 SEGURIDAD

### ⚠️ NO COMMITEAR CREDENCIALES

```bash
# Asegurar que .gitignore incluye:
echo "*.json" >> .gitignore
echo "artifacts/" >> .gitignore
echo "/tmp/*" >> .gitignore
```

### ✅ Buenas Prácticas

1. **Usar Service Account con permisos mínimos** (no Owner/Editor)
2. **Rotar credenciales regularmente** (cada 90 días)
3. **No compartir `private_key`** en Slack/email
4. **Ejecutar desde entorno seguro** (VM con IAM, no laptop personal)
5. **Borrar `artifacts/` después de analizar** (pueden contener datos sensibles)

---

## 📚 DOCUMENTACIÓN COMPLETA

Lee el informe completo: **[AUDITORIA_POLYGON.md](AUDITORIA_POLYGON.md)**

Incluye:
- Análisis detallado de arquitectura
- Recomendaciones de configuración
- Templates de Stored Procedures idempotentes
- Runbook operativo (troubleshooting, rollback)
- Checklist de implementación To-Be
- Decisión justificada: Scheduled Query vs Dataform vs Composer

---

## 🆘 SOPORTE

**Preguntas frecuentes:**
1. "¿Cómo ejecuto solo una sección del script bash?"
   - Edita `00_COMANDOS_COMPLETOS.sh` y comenta las funciones que no necesitas

2. "¿Puedo ejecutar esto en producción?"
   - Sí, todos los scripts son read-only y seguros

3. "¿Qué hago con los resultados?"
   - Analiza los CSV/JSON para identificar gaps y errores
   - Lee el informe completo para recomendaciones
   - Implementa las correcciones sugeridas

**Autor:** Claude Code
**Última actualización:** 2025-11-11
**Versión:** 1.0

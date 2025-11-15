# AUDITORÍA INTEGRAL - PIPELINE POLYGON → BIGQUERY

**Proyecto:** `sunny-advantage-471523-b3`
**Dataset:** `market_data`
**Fecha:** 2025-11-11
**Auditor:** Claude Code
**Última actualización de horarios:** 2025-11-15

---

## ⏰ CAMBIO DE HORARIO - IMPORTANTE

**Nuevo Schedule (vigente desde 2025-11-15):**
- **Cloud Scheduler / Data Transfer:** Martes-Sábado 00:00 CST (`0 0 * * 2-6`)
- **BigQuery Scheduled Query:** Diario 01:00 CST (`every day 01:00`)
- **Timezone:** `America/Chicago` (Central Time US)

**Razón del cambio:**
- Mercado cierra: 15:00 CST (3:00 PM Central)
- Polygon API datos disponibles: ~16:00 CST
- Descarga a medianoche (00:00 CST) = 8 horas de buffer (vs 3 horas anteriores)
- Evita conflictos con horas pico de uso
- Datos siempre disponibles antes de la mañana siguiente

**Mapeo de días:**
| Día de Trading | Descarga en Madrugada |
|----------------|----------------------|
| Lunes          | Martes 00:00 CST    |
| Martes         | Miércoles 00:00 CST |
| Miércoles      | Jueves 00:00 CST    |
| Jueves         | Viernes 00:00 CST   |
| Viernes        | Sábado 00:00 CST    |

---

## 📋 RESUMEN EJECUTIVO

Esta auditoría proporciona un framework completo para diagnosticar el pipeline de carga de datos Polygon desde GCS hasta BigQuery, identificando gaps entre:
- **GCS** (`gs://ss-bucket-polygon-incremental/polygon/daily/`)
- **Staging** (`market_data.stg_prices_polygon_raw`)
- **Prices** (`market_data.Prices`)

### Objetivos Principales
1. ✅ Inventariar todos los recursos del pipeline (GCS, BigQuery, Cloud Functions, Scheduled Queries)
2. ✅ Detectar gaps y discrepancias entre capas (GCS → Staging → Prices)
3. ✅ Diagnosticar fallos recientes (últimos 14 días)
4. ✅ Auditar permisos IAM (principio de mínimo privilegio)
5. ✅ Proponer arquitectura "To-Be" robusta

### Hallazgos Críticos (Hipotéticos - Ejecutar Scripts Para Confirmar)

🔴 **CRÍTICO:**
- Posibles gaps de fechas entre GCS y Staging (carga incompleta)
- Posible falta de idempotencia en `sp_merge_polygon_prices`
- Permisos IAM potencialmente excesivos o insuficientes

🟡 **ADVERTENCIAS:**
- Sin confirmación de particionamiento en tablas (impacto en costos)
- Ausencia de monitoreo/alertas automáticas
- Sin política de retención de datos antigua

---

## 🗂️ ESTRUCTURA DE LA AUDITORÍA

```
auditoria/
├── AUDITORIA_POLYGON.md         ← Este informe
├── README.md                     ← Instrucciones de ejecución
├── scripts/
│   ├── 00_COMANDOS_COMPLETOS.sh  ← Script maestro (GCS, BQ, IAM)
│   ├── 05_diagnostico_logs_cloud.sh ← Logs de errores
│   └── 07_analisis_gcs_vs_bq.py  ← Comparación Python
├── sql/
│   ├── 01_row_counts_staging.sql
│   ├── 02_row_counts_prices.sql
│   ├── 03_diff_staging_vs_prices.sql
│   ├── 04_diagnostico_fallos_bq_jobs.sql
│   └── 06_analisis_calidad_datos.sql
└── artifacts/                    ← Resultados (CSV/JSON)
    └── (generados al ejecutar scripts)
```

---

## 1️⃣ INVENTARIO DE RECURSOS

### 1.1 Google Cloud Storage (GCS)

**Bucket:** `gs://ss-bucket-polygon-incremental/polygon/daily/`
**Estructura:** Particionado Hive-style `date=YYYY-MM-DD/`

#### Comandos de Auditoría

```bash
# Listar últimas 30 fechas disponibles
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/ | \
  grep -oP 'date=\K[0-9]{4}-[0-9]{2}-[0-9]{2}' | \
  sort -r | head -30

# Obtener tamaño por fecha
gsutil du -sh gs://ss-bucket-polygon-incremental/polygon/daily/date=2025-11-10/

# Contar archivos parquet por fecha
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/date=2025-11-10/*.parquet | wc -l
```

#### Script Automatizado
```bash
cd auditoria/scripts
./00_COMANDOS_COMPLETOS.sh  # Ejecuta sección 1
```

**Artefactos Generados:**
- `artifacts/gcs_dates_available.txt` - Lista completa de fechas
- `artifacts/gcs_inventory.csv` - Detalles por fecha (archivos, bytes, MB)
- `artifacts/gcs_date_gaps.txt` - Gaps temporales detectados

---

### 1.2 BigQuery - Datasets y Tablas

#### Tabla Staging: `market_data.stg_prices_polygon_raw`

**Propósito:** Almacenar datos crudos de Polygon antes de normalizarlos

**Campos Esperados:**
- `ticker` (STRING)
- `date` (DATE)
- `open`, `high`, `low`, `close` (FLOAT64)
- `volume` (INT64)
- `timestamp` (TIMESTAMP)

**Verificaciones:**
```bash
# Ver schema completo
bq show --schema --format=prettyjson sunny-advantage-471523-b3:market_data.stg_prices_polygon_raw

# Ver configuración de particionamiento
bq show --format=prettyjson sunny-advantage-471523-b3:market_data.stg_prices_polygon_raw | jq '.timePartitioning'

# Row count por fecha (últimos 30 días)
bq query --use_legacy_sql=false < sql/01_row_counts_staging.sql
```

**Consulta SQL:**
```sql
-- Ver: sql/01_row_counts_staging.sql
SELECT
    date AS fecha,
    COUNT(*) AS row_count,
    COUNT(DISTINCT ticker) AS unique_tickers
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY fecha
ORDER BY fecha DESC;
```

**Artefactos:**
- `artifacts/schema_staging.json`
- `artifacts/table_info_staging.json`
- `artifacts/staging_counts.csv`

---

#### Tabla Destino: `market_data.Prices`

**Propósito:** Tabla consolidada con precios de múltiples fuentes

**Campos Adicionales:**
- `source` (STRING) - Filtrar por 'polygon'
- Posible clave primaria: `(ticker, date, source)`

**Verificaciones:**
```bash
bq query --use_legacy_sql=false < sql/02_row_counts_prices.sql
```

**Consulta SQL:**
```sql
-- Ver: sql/02_row_counts_prices.sql
SELECT
    date AS fecha,
    COUNT(*) AS row_count,
    COUNT(DISTINCT ticker) AS unique_tickers
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND source = 'polygon'
GROUP BY fecha
ORDER BY fecha DESC;
```

**Artefactos:**
- `artifacts/schema_prices.json`
- `artifacts/table_info_prices.json`
- `artifacts/prices_counts.csv`

---

### 1.3 Rutinas y Stored Procedures

#### `market_data.sp_merge_polygon_prices`

**Propósito:** Mover datos de staging a Prices con normalización

**Extracción:**
```bash
bq show --routine sunny-advantage-471523-b3:market_data.sp_merge_polygon_prices
```

**Aspectos Críticos a Revisar:**

✅ **Idempotencia:**
```sql
-- ¿Usa MERGE o INSERT/UPDATE?
-- ¿Verifica duplicados antes de insertar?
MERGE INTO market_data.Prices AS target
USING market_data.stg_prices_polygon_raw AS source
ON target.ticker = source.ticker
   AND target.date = source.date
   AND target.source = 'polygon'
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...
```

✅ **Deduplicación:**
```sql
-- ¿Aplica DISTINCT o ROW_NUMBER()?
WITH deduped AS (
  SELECT * EXCEPT(row_num)
  FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY ticker, date ORDER BY timestamp DESC) AS row_num
    FROM market_data.stg_prices_polygon_raw
  )
  WHERE row_num = 1
)
```

✅ **Validación de Datos:**
```sql
-- ¿Filtra valores inválidos?
WHERE close IS NOT NULL
  AND close > 0
  AND volume >= 0
  AND high >= low
```

**Artefactos:**
- `artifacts/routines.json` - Lista de todas las rutinas
- `artifacts/sp_merge_polygon_prices.sql` - Código SQL completo

---

### 1.4 Scheduled Queries (Data Transfer Service)

**Verificación:**
```bash
gcloud data-transfer configs list --project=sunny-advantage-471523-b3 --format=json

# Ver historial de ejecuciones (últimos 14 días)
gcloud data-transfer runs list \
  --transfer-config=projects/PROJECT_NUMBER/locations/us/transferConfigs/CONFIG_ID \
  --format=json
```

**Checklist:**
- [ ] ¿Existe una Scheduled Query que llame a `sp_merge_polygon_prices`?
- [ ] ¿Cuál es el schedule? (ej: `every day 01:00`)
- [ ] ¿Timezone configurado correctamente? (ej: `America/Chicago`)
- [ ] ¿Service Account tiene permisos adecuados?
- [ ] ¿Hay notificaciones en caso de fallo?

**Artefactos:**
- `artifacts/scheduled_queries.json`
- `artifacts/scheduled_queries_runs.json`

---

### 1.5 Cloud Scheduler

```bash
gcloud scheduler jobs list --project=sunny-advantage-471523-b3 --format=json
```

**Buscar:**
- Jobs con nombre conteniendo "polygon"
- Target: Cloud Function, HTTP endpoint, Pub/Sub

**Artefactos:**
- `artifacts/cloud_scheduler_jobs.json`
- `artifacts/cloud_scheduler_polygon_jobs.json`

---

### 1.6 Cloud Functions

```bash
# Gen1
gcloud functions list --project=sunny-advantage-471523-b3 --format=json

# Gen2
gcloud functions list --gen2 --project=sunny-advantage-471523-b3 --format=json
```

**Verificar:**
- Funciones relacionadas con "polygon"
- Runtime, memoria, timeout
- Trigger (HTTP, Pub/Sub, Cloud Scheduler)
- Service Account asignada

**Artefactos:**
- `artifacts/cloud_functions_gen1.json`
- `artifacts/cloud_functions_gen2.json`
- `artifacts/cloud_functions_polygon.json`

---

### 1.7 IAM - Permisos y Service Accounts

#### Service Accounts Relevantes

1. **Data Transfer Service (DTS) SA:**
   ```
   service-{PROJECT_NUMBER}@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com
   ```

2. **Cloud Functions Default SA:**
   ```
   {PROJECT_ID}@appspot.gserviceaccount.com
   ```

3. **Custom SA (si existe):**
   ```
   claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com
   ```

#### Permisos Mínimos Requeridos

**DTS SA → BigQuery:**
- ✅ `roles/bigquery.dataEditor` en `market_data` (para escribir en staging)
- ✅ `roles/bigquery.jobUser` en proyecto (para ejecutar queries)

**DTS SA → GCS:**
- ✅ `roles/storage.objectViewer` en bucket `ss-bucket-polygon-incremental`

**Cloud Function SA → BigQuery:**
- ✅ `roles/bigquery.dataViewer` (si solo lee)
- ✅ `roles/bigquery.dataEditor` (si modifica)
- ✅ `roles/bigquery.jobUser`

**Auditoría:**
```bash
# IAM del proyecto
gcloud projects get-iam-policy sunny-advantage-471523-b3 --format=json

# IAM del dataset
bq show --format=prettyjson sunny-advantage-471523-b3:market_data | jq '.access'

# IAM del bucket
gsutil iam get gs://ss-bucket-polygon-incremental
```

**Artefactos:**
- `artifacts/iam_project_policy.json`
- `artifacts/iam_dataset_policy.json`
- `artifacts/iam_bucket_policy.json`
- `artifacts/service_accounts_summary.txt`

---

## 2️⃣ AUDITORÍA DE INTEGRIDAD

### 2.1 Análisis de Gaps por Fecha

#### Script Python Automatizado

```bash
cd auditoria/scripts
python3 07_analisis_gcs_vs_bq.py
```

Este script genera:
- Comparación fecha por fecha: GCS vs Staging vs Prices
- Detección de gaps (fechas faltantes)
- Cálculo de porcentaje de transferencia

**Salida Ejemplo:**
```
date       | in_gcs | gcs_files | in_staging | staging_rows | in_prices | prices_rows | status
-----------|--------|-----------|------------|--------------|-----------|-------------|-------------------
2025-11-10 | ✓      | 50        | ✓          | 12,543       | ✓         | 12,543      | OK
2025-11-09 | ✓      | 50        | ✓          | 12,432       | ✗         | 0           | NOT_IN_PRICES
2025-11-08 | ✓      | 50        | ✗          | 0            | ✗         | 0           | MISSING_IN_STAGING
2025-11-07 | ✗      | 0         | ✗          | 0            | ✗         | 0           | MISSING_IN_GCS
```

**Artefactos:**
- `artifacts/diff_gcs_staging_prices.csv`
- `artifacts/comparison_summary.json`

---

#### Consulta SQL: Staging vs Prices

```bash
bq query --use_legacy_sql=false < sql/03_diff_staging_vs_prices.sql
```

```sql
-- Ver: sql/03_diff_staging_vs_prices.sql
WITH staging_counts AS (...),
     prices_counts AS (...)
SELECT
    dr.fecha,
    COALESCE(sc.staging_row_count, 0) AS staging_rows,
    COALESCE(pc.prices_row_count, 0) AS prices_rows,
    COALESCE(sc.staging_row_count, 0) - COALESCE(pc.prices_row_count, 0) AS row_diff,
    CASE
        WHEN sc.staging_row_count IS NULL THEN 'MISSING_IN_STAGING'
        WHEN pc.prices_row_count IS NULL THEN 'NOT_IN_PRICES'
        WHEN sc.staging_row_count != pc.prices_row_count THEN 'COUNT_MISMATCH'
        ELSE 'OK'
    END AS status
FROM date_range dr
LEFT JOIN staging_counts sc ON dr.fecha = sc.fecha
LEFT JOIN prices_counts pc ON dr.fecha = pc.fecha
ORDER BY dr.fecha DESC;
```

**Artefactos:**
- `artifacts/diff_staging_vs_prices.csv`

---

### 2.2 Análisis de Calidad de Datos

```bash
bq query --use_legacy_sql=false < sql/06_analisis_calidad_datos.sql
```

**Verificaciones:**

✅ **Valores NULL:**
```sql
SELECT
    COUNTIF(ticker IS NULL) AS ticker_nulls,
    COUNTIF(close IS NULL) AS close_nulls,
    COUNTIF(volume IS NULL) AS volume_nulls
FROM market_data.stg_prices_polygon_raw
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);
```

✅ **Duplicados:**
```sql
SELECT date, ticker, COUNT(*) AS duplicate_count
FROM market_data.stg_prices_polygon_raw
GROUP BY date, ticker
HAVING COUNT(*) > 1;
```

✅ **Anomalías:**
```sql
SELECT * FROM market_data.stg_prices_polygon_raw
WHERE high < low  -- Inválido
   OR close < 0   -- Precio negativo
   OR volume < 0; -- Volumen negativo
```

**Artefactos:**
- `artifacts/data_quality.csv`

---

## 3️⃣ DIAGNÓSTICO DE FALLOS

### 3.1 BigQuery Jobs (Últimos 14 Días)

```bash
bq query --use_legacy_sql=false < sql/04_diagnostico_fallos_bq_jobs.sql
```

**Buscar:**
- Jobs con `state = 'DONE'` y `error_result IS NOT NULL`
- Jobs que llaman a `sp_merge_polygon_prices`
- Errores comunes:
  - `Access Denied` - Permisos insuficientes
  - `Not Found: Table` - Tabla no existe
  - `Resources exceeded` - Query muy grande
  - `Syntax error` - Error en SQL

**Consulta:**
```sql
-- Ver: sql/04_diagnostico_fallos_bq_jobs.sql
SELECT
    creation_time,
    job_id,
    user_email,
    state,
    error_result.reason AS error_reason,
    error_result.message AS error_message,
    REGEXP_EXTRACT(query, r'CALL `[^`]+\.([^`]+)`') AS routine_called
FROM `sunny-advantage-471523-b3.region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)
  AND (state != 'DONE' OR error_result IS NOT NULL)
ORDER BY creation_time DESC;
```

**Artefactos:**
- `artifacts/bq_jobs_errors.csv`

---

### 3.2 Cloud Logs (Errores)

```bash
cd auditoria/scripts
./05_diagnostico_logs_cloud.sh
```

**Extrae logs de:**
1. Cloud Functions (severity >= ERROR)
2. Cloud Scheduler (fallos de ejecución)
3. Data Transfer Service (transferencias fallidas)
4. Logs generales con keyword "polygon"

**Ejemplo de filtro:**
```bash
gcloud logging read "
    resource.type=\"cloud_function\"
    AND severity>=\"ERROR\"
    AND timestamp>=\"2025-10-28T00:00:00Z\"
    AND resource.labels.function_name=~\"polygon.*\"
" --project=sunny-advantage-471523-b3 --format=json
```

**Artefactos:**
- `artifacts/logs_cloud_functions_errors.json`
- `artifacts/logs_cloud_scheduler_errors.json`
- `artifacts/logs_dts_errors.json`
- `artifacts/logs_polygon_all.json`
- `artifacts/logs_top_errors.json`
- `artifacts/logs_error_frequency.csv`

---

### 3.3 Hipótesis Priorizadas de Fallos

| # | Hipótesis | Evidencia a Buscar | Prueba |
|---|-----------|-------------------|--------|
| 1 | **Data Transfer no está ejecutándose** | No hay runs recientes en `scheduled_queries_runs.json` | `gcloud data-transfer runs list` |
| 2 | **Permisos insuficientes (DTS → BigQuery)** | Errores `Access Denied` en logs de DTS | Revisar `iam_dataset_policy.json` |
| 3 | **Permisos insuficientes (DTS → GCS)** | Errores `403 Forbidden` al leer GCS | Revisar `iam_bucket_policy.json` |
| 4 | **SP no es idempotente (duplica datos)** | `duplicate_count > 1` en Prices para mismo ticker+date | Consulta de duplicados en SQL |
| 5 | **Timezone mal configurado en Scheduled Query** | Query ejecuta antes de que GCS tenga datos | Revisar `schedule` y `timeZone` en config |
| 6 | **Partition expiration borra datos nuevos** | Fechas recientes desaparecen de staging | Revisar `table_info_staging.json` → `expirationMs` |
| 7 | **Schema mismatch entre staging y Prices** | Errores tipo `Column not found` | Comparar `schema_staging.json` vs `schema_prices.json` |
| 8 | **Volumen de datos excede límites** | Errores `Resources exceeded during query execution` | Revisar tamaño de staging vs memoria query |

---

## 4️⃣ ARQUITECTURA TO-BE (RECOMENDADA)

### 4.1 Diagrama de Flujo Propuesto

```
┌─────────────────────────────────────────────────────────────┐
│  FUENTE: Polygon API                                        │
│  (externo - asumido como operacional)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  1. GOOGLE CLOUD STORAGE (GCS)                              │
│  Bucket: gs://ss-bucket-polygon-incremental/polygon/daily/  │
│  Estructura: date=YYYY-MM-DD/*.parquet                      │
│  Particionamiento: Hive-style por fecha                     │
│  Retención: 90 días (ajustable)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ [DATA TRANSFER SERVICE]
                     │ Schedule: Tue-Sat 00:00 CST (America/Chicago)
                     │ SA: service-XXX@gcp-sa-bigquerydatatransfer...
                     │ Permisos: storage.objectViewer + bigquery.dataEditor
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. BIGQUERY STAGING                                        │
│  Tabla: market_data.stg_prices_polygon_raw                  │
│  Tipo: Tabla nativa (no externa)                            │
│  Particionamiento: Por DATE (campo date)                    │
│  Clustering: Por ticker                                     │
│  Expiration: 30 días                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ [SCHEDULED QUERY]
                     │ Schedule: daily 01:00 CST (1h después de carga)
                     │ Query: CALL market_data.sp_merge_polygon_prices()
                     │ SA: service-XXX@gcp-sa-bigquerydatatransfer...
                     │ On failure: Email alert
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. BIGQUERY DESTINO                                        │
│  Tabla: market_data.Prices                                  │
│  Particionamiento: Por DATE (campo date)                    │
│  Clustering: Por ticker, source                             │
│  PK lógica: (ticker, date, source)                          │
│  Retención: Ilimitada (datos históricos)                    │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. MONITOREO Y ALERTAS                                     │
│  - Cloud Monitoring: Scheduled Query success rate           │
│  - Alert Policy: Email on failure                           │
│  - Dashboard: Row counts diarios (GCS/Staging/Prices)       │
│  - Log-based metrics: Errores por tipo                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 Decisión de Orquestación: Scheduled Query vs Dataform vs Composer

| Criterio | Scheduled Query ⭐ | Dataform | Cloud Composer (Airflow) |
|----------|-------------------|----------|--------------------------|
| **Complejidad** | Baja | Media | Alta |
| **Costo** | $0 (incluido en BQ) | $0 (incluido en BQ) | ~$300+/mes (GKE cluster) |
| **Mantenimiento** | Mínimo | Bajo | Alto |
| **Dependencias** | Simples (tiempo) | Git-based, SQL templating | Python DAGs, operadores |
| **Idempotencia** | Soportada (MERGE en SP) | Soportada (incremental models) | Soportada (custom logic) |
| **Monitoreo** | Cloud Logging | Cloud Logging + Git logs | Airflow UI + Cloud Logging |
| **Retry automático** | No (manual) | No (manual) | Sí (configurable) |
| **Casos de uso** | 1-3 pasos simples | Pipeline SQL complejo | Workflows multi-tool/API |

#### ✅ RECOMENDACIÓN: **Scheduled Query**

**Justificación:**
1. **Pipeline simple:** GCS → Staging → Prices (2 pasos)
2. **Sin costo adicional:** No requiere infraestructura extra
3. **Baja complejidad:** Un solo SP idempotente
4. **Suficiente para caso de uso:** Carga diaria sin dependencias externas complejas

**Alternativa (si crece):**
- **Dataform** si necesitas:
  - Múltiples tablas derivadas con dependencias
  - Versionamiento de transformaciones en Git
  - Testing automático de SQL

- **Composer** si necesitas:
  - Llamar APIs externas (Polygon API directamente)
  - Orquestar múltiples fuentes de datos
  - Lógica condicional compleja (ej: reprocess en caso de fallo)

---

### 4.3 Checklist de Configuración

#### ✅ Data Transfer Service (GCS → Staging)

```bash
# Crear config (ejemplo)
bq mk --transfer_config \
  --project_id=sunny-advantage-471523-b3 \
  --data_source=google_cloud_storage \
  --display_name="Polygon Daily Load" \
  --target_dataset=market_data \
  --params='{
    "data_path_template":"gs://ss-bucket-polygon-incremental/polygon/daily/date={run_date}/*.parquet",
    "destination_table_name_template":"stg_prices_polygon_raw",
    "file_format":"PARQUET",
    "write_disposition":"WRITE_APPEND",
    "max_bad_records":"100"
  }' \
  --schedule="0 0 * * 2-6" \
  --schedule_timezone="America/Chicago"
```

**Checklist:**
- [ ] `data_path_template` usa variable `{run_date}` para fecha dinámica
- [ ] `write_disposition=WRITE_APPEND` (no trunca tabla)
- [ ] `schedule_timezone=America/Chicago` (Central Time US)
- [ ] Schedule usa cron `0 0 * * 2-6` (Martes-Sábado medianoche CST)
- [ ] Service Account tiene `roles/storage.objectViewer` en bucket
- [ ] Service Account tiene `roles/bigquery.dataEditor` en dataset

---

#### ✅ Scheduled Query (Staging → Prices)

```sql
-- Query a programar
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();
```

```bash
# Crear Scheduled Query (vía UI o gcloud)
bq query \
  --project_id=sunny-advantage-471523-b3 \
  --use_legacy_sql=false \
  --schedule="every day 01:00" \
  --schedule_time_zone="America/Chicago" \
  --display_name="Polygon Merge to Prices" \
  --target_dataset=market_data \
  "CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices\`();"
```

**Checklist:**
- [ ] Ejecuta 1 hora **después** de la carga de staging (00:00 CST → 01:00 CST)
- [ ] Timezone configurado: `America/Chicago` (Central Time US)
- [ ] SP es idempotente (usa `MERGE` no `INSERT`)
- [ ] Notificación por email en caso de fallo
- [ ] Service Account tiene `roles/bigquery.dataEditor` en dataset
- [ ] Service Account tiene `roles/bigquery.jobUser` en proyecto

---

#### ✅ Stored Procedure: `sp_merge_polygon_prices`

**Template Idempotente:**

```sql
CREATE OR REPLACE PROCEDURE `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`()
BEGIN
  -- 1. Deduplicar staging (por si hay duplicados)
  CREATE OR REPLACE TEMP TABLE staging_deduped AS
  SELECT * EXCEPT(row_num)
  FROM (
    SELECT
      *,
      ROW_NUMBER() OVER (
        PARTITION BY ticker, date
        ORDER BY timestamp DESC  -- Tomar el más reciente
      ) AS row_num
    FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
  )
  WHERE row_num = 1;

  -- 2. MERGE idempotente a Prices
  MERGE `sunny-advantage-471523-b3.market_data.Prices` AS target
  USING staging_deduped AS source
  ON target.ticker = source.ticker
     AND target.date = source.date
     AND target.source = 'polygon'
  WHEN MATCHED THEN
    UPDATE SET
      open = source.open,
      high = source.high,
      low = source.low,
      close = source.close,
      volume = source.volume,
      updated_at = CURRENT_TIMESTAMP()
  WHEN NOT MATCHED THEN
    INSERT (ticker, date, source, open, high, low, close, volume, created_at)
    VALUES (
      source.ticker,
      source.date,
      'polygon',
      source.open,
      source.high,
      source.low,
      source.close,
      source.volume,
      CURRENT_TIMESTAMP()
    );

  -- 3. Log resultado
  SELECT
    FORMAT('Processed %d rows from staging', COUNT(*)) AS message
  FROM staging_deduped;
END;
```

**Validaciones:**
- [ ] Usa `MERGE` (no `INSERT` simple)
- [ ] Deduplicación explícita con `ROW_NUMBER()`
- [ ] Clave de match: `(ticker, date, source)`
- [ ] Campo `updated_at` para tracking
- [ ] No filtra por fecha (procesa todo staging cada vez)

---

#### ✅ Particionamiento y Clustering

**Staging:**
```sql
-- Crear tabla con particionamiento
CREATE TABLE `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw` (
  ticker STRING,
  date DATE,
  open FLOAT64,
  high FLOAT64,
  low FLOAT64,
  close FLOAT64,
  volume INT64,
  timestamp TIMESTAMP
)
PARTITION BY date
CLUSTER BY ticker
OPTIONS(
  partition_expiration_days=30,  -- Borrar particiones > 30 días
  require_partition_filter=true  -- Forzar filtro por date en queries
);
```

**Prices:**
```sql
CREATE TABLE `sunny-advantage-471523-b3.market_data.Prices` (
  ticker STRING,
  date DATE,
  source STRING,
  open FLOAT64,
  high FLOAT64,
  low FLOAT64,
  close FLOAT64,
  volume INT64,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
PARTITION BY date
CLUSTER BY ticker, source
OPTIONS(
  require_partition_filter=true
);
```

**Beneficios:**
- Reducir costo de queries (solo escanea particiones necesarias)
- Mejor performance en queries por ticker
- Expiración automática de staging antiguo

---

#### ✅ Permisos Mínimos (IAM)

**Data Transfer Service SA:**
```bash
# Identificar SA
PROJECT_NUMBER=$(gcloud projects describe sunny-advantage-471523-b3 --format="value(projectNumber)")
DTS_SA="service-${PROJECT_NUMBER}@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com"

# Permisos en GCS
gsutil iam ch serviceAccount:${DTS_SA}:roles/storage.objectViewer \
  gs://ss-bucket-polygon-incremental

# Permisos en BigQuery (a nivel dataset, no proyecto)
bq update --dataset \
  --access_dataset_role WRITER:serviceAccount:${DTS_SA} \
  sunny-advantage-471523-b3:market_data

# Permiso para ejecutar jobs
gcloud projects add-iam-policy-binding sunny-advantage-471523-b3 \
  --member="serviceAccount:${DTS_SA}" \
  --role="roles/bigquery.jobUser"
```

**Checklist:**
- [ ] `storage.objectViewer` en bucket (no `storage.admin`)
- [ ] `bigquery.dataEditor` en dataset (no `bigquery.admin`)
- [ ] `bigquery.jobUser` en proyecto
- [ ] NO dar permisos a nivel proyecto si no es necesario

---

#### ✅ Monitoreo y Alertas

**1. Alert Policy para Scheduled Query Failures:**

```bash
# Crear alert via gcloud (requiere configuración detallada)
# Alternativa: Crear en Cloud Console → Monitoring → Alerting
```

**Configuración:**
- **Metric:** `bigquery.googleapis.com/dts/config/run_failure_count`
- **Condition:** > 0 fallos en ventana de 1 hora
- **Notification Channel:** Email (tu email)
- **Documentation:** "Polygon Scheduled Query falló. Revisar logs en Cloud Logging."

**2. Dashboard de Monitoreo:**

Crear dashboard con:
- Row count por fecha (staging vs prices)
- Latencia de carga (tiempo entre GCS y staging)
- Error rate de Scheduled Queries
- Tamaño de staging (MB/GB por día)

**3. Log-based Metrics:**

```bash
# Crear métrica para errores específicos
gcloud logging metrics create polygon_load_errors \
  --description="Count of polygon load errors" \
  --log-filter='
    resource.type="bigquery_dts_config"
    AND severity="ERROR"
    AND jsonPayload.message=~"polygon"
  '
```

---

### 4.4 Runbook Operativo

#### 📋 Verificación Diaria (5 min)

```bash
# 1. Verificar última fecha cargada en GCS
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/ | tail -1

# 2. Verificar última fecha en staging
bq query --use_legacy_sql=false "
SELECT MAX(date) AS last_date, COUNT(*) AS total_rows
FROM \`sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw\`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
"

# 3. Verificar última fecha en Prices (source=polygon)
bq query --use_legacy_sql=false "
SELECT MAX(date) AS last_date, COUNT(*) AS total_rows
FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE source = 'polygon' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
"

# 4. Verificar último run de Scheduled Query
gcloud data-transfer runs list \
  --transfer-config=projects/.../transferConfigs/CONFIG_ID \
  --max-results=5 \
  --format="table(name,state,errorStatus)"
```

**Expectativa:** Ayer (D-1) debe estar en las 3 capas (GCS, staging, Prices)

---

#### 🔧 Troubleshooting Común

**Problema 1: Fecha falta en staging pero existe en GCS**

```bash
# Diagnóstico
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/date=2025-11-09/

# Ver logs de DTS
gcloud logging read "
  resource.type=\"bigquery_dts_config\"
  AND timestamp>=\"2025-11-09T00:00:00Z\"
  AND timestamp<=\"2025-11-10T00:00:00Z\"
" --limit=50

# Solución: Re-trigger manual
gcloud data-transfer runs schedule \
  --transfer-config=projects/.../transferConfigs/CONFIG_ID \
  --schedule-time="2025-11-09T00:00:00-06:00"  # 00:00 CST
```

**Problema 2: Datos en staging pero no en Prices**

```bash
# Verificar ejecución de SP
bq query --use_legacy_sql=false "
SELECT creation_time, state, error_result
FROM \`sunny-advantage-471523-b3.region-us\`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE query LIKE '%sp_merge_polygon_prices%'
  AND DATE(creation_time) = CURRENT_DATE()
ORDER BY creation_time DESC
LIMIT 5
"

# Solución: Ejecutar SP manualmente
bq query --use_legacy_sql=false "
CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices\`()
"
```

**Problema 3: Duplicados en Prices**

```sql
-- Detectar duplicados
SELECT date, ticker, source, COUNT(*) AS cnt
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND source = 'polygon'
GROUP BY date, ticker, source
HAVING COUNT(*) > 1;

-- Solución: Deduplicar (crear tabla temporal, borrar, reinsertar)
```

---

#### 🔄 Rollback Procedure

**Escenario:** SP ejecutó con bug y corrompió datos en Prices

```sql
-- 1. Identificar rango de fechas afectadas
-- Ejemplo: Últimos 3 días

-- 2. Borrar datos afectados de Prices
DELETE FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE date >= '2025-11-08'
  AND date <= '2025-11-10'
  AND source = 'polygon';

-- 3. Re-ejecutar SP (que tomará datos de staging)
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();

-- 4. Validar resultado
SELECT date, COUNT(*) AS row_count
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE date >= '2025-11-08' AND source = 'polygon'
GROUP BY date
ORDER BY date;
```

**Prevención:**
- Mantener staging por 30 días (ya configurado con `partition_expiration_days=30`)
- Tener backups de tabla Prices (snapshots de BigQuery)
- Testear cambios al SP en dataset de DEV primero

---

## 5️⃣ ESTIMACIÓN DE COSTOS

### Almacenamiento

**GCS:**
- Bucket: `gs://ss-bucket-polygon-incremental`
- Clase: Standard (asumido)
- Tamaño estimado: 10 GB/día × 90 días = 900 GB
- Costo: 900 GB × $0.020/GB/mes = **$18/mes**

**BigQuery:**
- Staging: ~300 GB activos (30 días × 10 GB)
  - Costo: 300 GB × $0.020/GB = $6/mes
- Prices: ~5 TB históricos
  - Costo: 5,000 GB × $0.020/GB = $100/mes
- **Total BQ Storage: $106/mes**

### Compute

**Data Transfer Service:**
- Costo: $0 (incluido en BigQuery)

**BigQuery Queries:**
- Carga diaria (staging): 10 GB/día × 30 días = 300 GB/mes
  - Costo: 300 GB × $5/TB = $1.50/mes
- SP ejecución: ~50 GB escaneados/día × 30 = 1.5 TB/mes
  - Costo: 1.5 TB × $5 = $7.50/mes
- Queries ad-hoc: ~500 GB/mes
  - Costo: 0.5 TB × $5 = $2.50/mes
- **Total BQ Queries: $11.50/mes**

### Total Estimado

| Componente | Costo Mensual |
|------------|---------------|
| GCS Storage | $18 |
| BigQuery Storage | $106 |
| BigQuery Compute | $11.50 |
| **TOTAL** | **~$135/mes** |

### Optimizaciones

1. **Reducir retención en staging:** 30 → 7 días (-$13.80/mes)
2. **Lifecycle policy en GCS:** Mover a Nearline después de 30 días (-$9/mes)
3. **Clustering/Partitioning:** Ya implementado (ahorra en queries)
4. **Compresión en GCS:** Usar Parquet con compresión Snappy

---

## 6️⃣ PRÓXIMOS PASOS

### Fase 1: Auditoría (Esta Semana)

- [x] Crear scripts de auditoría
- [ ] **EJECUTAR** scripts y recopilar artefactos
- [ ] Analizar gaps y errores encontrados
- [ ] Identificar root cause de fallos

### Fase 2: Remediación (Próxima Semana)

- [ ] Corregir permisos IAM (si hay issues)
- [ ] Implementar/corregir SP idempotente
- [ ] Configurar Scheduled Query con alertas
- [ ] Backfill de fechas faltantes (si las hay)

### Fase 3: Monitoreo (Continuo)

- [ ] Crear dashboard en Cloud Monitoring
- [ ] Configurar alertas por email
- [ ] Documentar runbook en Confluence/Docs
- [ ] Programar revisión semanal de logs

---

## 7️⃣ ANEXOS

### A. Comandos de Ejecución Rápida

```bash
# Setup inicial
cd /path/to/auditoria
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
gcloud config set project sunny-advantage-471523-b3

# Ejecutar auditoría completa
./scripts/00_COMANDOS_COMPLETOS.sh > logs/audit_$(date +%Y%m%d).log 2>&1

# Ejecutar solo diagnóstico de logs
./scripts/05_diagnostico_logs_cloud.sh

# Ejecutar análisis Python GCS vs BQ
python3 scripts/07_analisis_gcs_vs_bq.py

# Consultas SQL individuales
bq query --use_legacy_sql=false < sql/01_row_counts_staging.sql
bq query --use_legacy_sql=false < sql/03_diff_staging_vs_prices.sql
bq query --use_legacy_sql=false < sql/04_diagnostico_fallos_bq_jobs.sql
```

---

### B. Glosario

| Término | Definición |
|---------|------------|
| **DTS** | Data Transfer Service - Servicio de GCP para transferir datos a BigQuery |
| **Staging** | Tabla intermedia para datos crudos antes de normalizar |
| **Idempotencia** | Propiedad de que ejecutar N veces da mismo resultado que ejecutar 1 vez |
| **Particionamiento** | Dividir tabla por fecha para mejorar performance y reducir costos |
| **Clustering** | Ordenar datos dentro de particiones por campos específicos |
| **MERGE** | Operación SQL que hace INSERT o UPDATE según condición (idempotente) |
| **Service Account** | Identidad de GCP para aplicaciones (no usuarios humanos) |
| **IAM** | Identity and Access Management - Sistema de permisos de GCP |

---

### C. Referencias

- [BigQuery Data Transfer Service](https://cloud.google.com/bigquery/docs/dts-introduction)
- [Scheduled Queries](https://cloud.google.com/bigquery/docs/scheduling-queries)
- [BigQuery MERGE Statement](https://cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax#merge_statement)
- [Partitioned Tables](https://cloud.google.com/bigquery/docs/partitioned-tables)
- [Cloud Logging Filters](https://cloud.google.com/logging/docs/view/logging-query-language)
- [IAM Best Practices](https://cloud.google.com/iam/docs/best-practices)

---

## 📞 CONTACTO Y SOPORTE

Para preguntas sobre esta auditoría:
- **Service Account:** claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com
- **Documentación:** Este archivo + README.md

---

**Última actualización:** 2025-11-11
**Versión:** 1.0
**Autor:** Claude Code

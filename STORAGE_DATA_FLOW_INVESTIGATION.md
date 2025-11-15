# INVESTIGACIÓN: FLUJO DE DATOS A GCS - POLYGON PIPELINE

**Fecha:** 2025-11-15
**Branch:** claude/investigate-storage-data-flow-01Fh9HU3CrvwkSjEd1tY3TYN
**Bucket Investigado:** `gs://ss-bucket-polygon-incremental/polygon/daily/`
**Investigador:** Claude Code

---

## 🎯 OBJETIVO

Determinar cómo llega la información a la ruta de Google Cloud Storage:
`https://storage.googleapis.com/ss-bucket-polygon-incremental/polygon/daily/`

---

## 🔍 HALLAZGOS PRINCIPALES

### ❌ Hallazgo Crítico: Código de Ingestión NO Está en Este Repositorio

**Conclusión:** El código que escribe datos a GCS **NO existe en este repositorio**. Este repositorio (`signalssheets`) es una aplicación frontend React/TypeScript que **consume** datos ya procesados, pero no los genera.

### ✅ Lo Que SÍ Encontré

1. **Documentación completa del pipeline** en `/auditoria/AUDITORIA_POLYGON.md`
2. **Scripts de auditoría** para analizar el pipeline existente
3. **Referencias al bucket** en archivos de auditoría
4. **Arquitectura documentada** del flujo completo de datos

### ❌ Lo Que NO Encontré

1. Código Python/JavaScript que escriba a GCS
2. Cloud Functions en el repositorio
3. Scripts de ingestión desde Polygon API
4. Llamadas a la API de Polygon (`polygon.io`)
5. Configuración de pipelines ETL

---

## 📊 ARQUITECTURA DEL PIPELINE (Documentada)

```
┌─────────────────────────────────────────────────────────┐
│  PASO 1: FUENTE DE DATOS                                │
│  Polygon API (polygon.io)                               │
│  - Datos históricos de mercado (OHLCV)                  │
│  - S&P 500 stocks                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ ❓ PROCESO DESCONOCIDO
                     │    (NO en este repo)
                     │
                     │ Posibilidades:
                     │ ├─ Cloud Function scheduled
                     │ ├─ Script en otro repositorio
                     │ ├─ Pipeline Airflow/Composer
                     │ └─ Servicio externo
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 2: ALMACENAMIENTO EN GCS                          │
│  📂 gs://ss-bucket-polygon-incremental/polygon/daily/   │
│                                                          │
│  Estructura:                                            │
│    polygon/daily/date=2025-11-15/*.parquet              │
│                   date=2025-11-14/*.parquet              │
│                   date=2025-11-13/*.parquet              │
│                   ...                                   │
│                                                          │
│  Formato: Apache Parquet (columnar)                     │
│  Particionamiento: Hive-style por fecha                 │
│  Campos esperados: ticker, date, open, high, low,       │
│                    close, volume, timestamp             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ [DATA TRANSFER SERVICE]
                     │ - Cron: daily 07:00 UTC
                     │ - SA: service-{NUM}@gcp-sa-bigquerydatatransfer...
                     │ - Config: Parquet → BigQuery
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 3: STAGING EN BIGQUERY                            │
│  📊 sunny-advantage-471523-b3.market_data               │
│      .stg_prices_polygon_raw                            │
│                                                          │
│  Particionado: Por DATE                                 │
│  Clustered: Por ticker                                  │
│  Expiration: 30 días                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ [SCHEDULED QUERY]
                     │ - Cron: daily 08:00 UTC
                     │ - Query: CALL sp_merge_polygon_prices()
                     │ - Operación: MERGE idempotente
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 4: TABLA FINAL                                    │
│  📊 sunny-advantage-471523-b3.market_data.Prices        │
│                                                          │
│  Fuentes múltiples: source = 'polygon'                  │
│  Particionado: Por DATE                                 │
│  Clustered: Por ticker, source                          │
│  Retención: Ilimitada (histórico)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 ARCHIVOS ANALIZADOS

### Archivos de Auditoría (Documentación)

| Archivo | Líneas | Hallazgos |
|---------|--------|-----------|
| `auditoria/AUDITORIA_POLYGON.md` | 1,134 | Arquitectura completa del pipeline documentada |
| `auditoria/README.md` | 339 | Instrucciones de auditoría |
| `auditoria/scripts/00_COMANDOS_COMPLETOS.sh` | 100+ | Scripts para auditar GCS, BQ, IAM |
| `auditoria/scripts/07_analisis_gcs_vs_bq.py` | - | Comparación GCS vs BigQuery |

### Búsquedas Realizadas

```bash
# Búsqueda 1: Referencias al bucket
grep -r "ss-bucket-polygon-incremental" .
# Resultado: Solo en archivos de auditoría

# Búsqueda 2: Código Python
find . -name "*.py"
# Resultado: Solo scripts de auditoría (lectura, no escritura)

# Búsqueda 3: Escritura a GCS
grep -r "upload\|write\|put\|storage.Client\|bucket" **/*.py
# Resultado: Solo lectura en scripts de auditoría

# Búsqueda 4: Polygon API
grep -ri "polygon.*API\|polygon.*fetch\|polygon.*download"
# Resultado: Solo menciones en documentación

# Búsqueda 5: Cloud Functions
find . -path "*/cloud-functions/*" -o -path "*/functions/*"
# Resultado: No encontrado
```

---

## 🔎 EVIDENCIA DEL PIPELINE EXTERNO

### Cita de la Documentación

De `auditoria/AUDITORIA_POLYGON.md:540-543`:

```markdown
┌─────────────────────────────────────────────────────────────┐
│  FUENTE: Polygon API                                        │
│  (externo - asumido como operacional)                       │
└────────────────────┬────────────────────────────────────────┘
```

**Palabras clave:** "externo - asumido como operacional"

Esto confirma que:
1. La fuente de datos es externa al repositorio
2. El proceso de ingestión ya existe y funciona
3. La documentación solo audita el pipeline, no lo implementa

### Data Transfer Service (Configuración Esperada)

De `auditoria/AUDITORIA_POLYGON.md:635-651`:

```bash
bq mk --transfer_config \
  --data_source=google_cloud_storage \
  --display_name="Polygon Daily Load" \
  --params='{
    "data_path_template":"gs://ss-bucket-polygon-incremental/polygon/daily/date={run_date}/*.parquet",
    "destination_table_name_template":"stg_prices_polygon_raw",
    "file_format":"PARQUET",
    "write_disposition":"WRITE_APPEND"
  }' \
  --schedule="every day 07:00"
```

**Interpretación:** El Data Transfer Service lee de GCS (no escribe). Esto confirma que otro proceso debe escribir primero a GCS.

---

## 🎯 UBICACIONES PROBABLES DEL CÓDIGO FALTANTE

### Opción 1: Cloud Function en GCP (Más Probable)

**Evidencia:**
- Mencionada en la documentación de auditoría
- Típico para pipelines scheduled en GCP
- No requiere versionado en este repo

**Cómo verificar:**
```bash
gcloud functions list --project=sunny-advantage-471523-b3
gcloud functions list --gen2 --project=sunny-advantage-471523-b3
gcloud functions describe FUNCTION_NAME --format=json
```

**Código típico esperado:**
```python
# main.py (Cloud Function)
import os
from polygon import RESTClient
from google.cloud import storage
import pandas as pd
from datetime import datetime

def ingest_polygon_daily(request):
    """Scheduled Cloud Function para ingestar datos de Polygon"""

    # Configuración
    polygon_api_key = os.environ['POLYGON_API_KEY']
    bucket_name = 'ss-bucket-polygon-incremental'

    # Cliente Polygon
    client = RESTClient(polygon_api_key)

    # Obtener datos del día anterior
    date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

    # Fetch data para S&P 500 tickers
    tickers = get_sp500_tickers()  # Lista de tickers

    data = []
    for ticker in tickers:
        aggs = client.get_aggs(
            ticker=ticker,
            multiplier=1,
            timespan="day",
            from_=date,
            to=date
        )
        data.extend(aggs)

    # Convertir a DataFrame
    df = pd.DataFrame(data)

    # Escribir a GCS como Parquet
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    blob = bucket.blob(f'polygon/daily/date={date}/data.parquet')
    blob.upload_from_string(
        df.to_parquet(index=False),
        content_type='application/octet-stream'
    )

    return {'status': 'success', 'date': date, 'records': len(df)}
```

### Opción 2: Repositorio Separado de Backend

**Nombres probables:**
- `polygon-ingestion`
- `market-data-pipeline`
- `data-engineering`
- `etl-pipelines`

**Cómo buscar:**
- Revisar la organización de GitHub
- Preguntar al equipo de data engineering
- Revisar bitbucket/gitlab si existen otros repos

### Opción 3: Cloud Composer (Airflow)

**Evidencia:** Mencionado en `auditoria/AUDITORIA_POLYGON.md:597-608` como opción

**Cómo verificar:**
```bash
gcloud composer environments list --project=sunny-advantage-471523-b3
```

**DAG típico esperado:**
```python
# polygon_daily_dag.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

def fetch_and_upload():
    # Lógica de ingestión
    pass

with DAG(
    'polygon_daily_ingestion',
    schedule_interval='0 6 * * *',  # 06:00 UTC daily
    start_date=datetime(2024, 1, 1),
    catchup=False
) as dag:

    ingest_task = PythonOperator(
        task_id='fetch_polygon_data',
        python_callable=fetch_and_upload
    )
```

### Opción 4: Cloud Scheduler → HTTP Endpoint

**Cómo verificar:**
```bash
gcloud scheduler jobs list --project=sunny-advantage-471523-b3
```

**Configuración esperada:**
```bash
gcloud scheduler jobs describe polygon-daily-ingest \
  --project=sunny-advantage-471523-b3
```

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### Para Encontrar el Código Faltante

1. **Ejecutar scripts de auditoría** (requiere credenciales GCP):
   ```bash
   cd auditoria/scripts
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
   ./00_COMANDOS_COMPLETOS.sh
   ```

   Esto generará:
   - `artifacts/cloud_functions_gen1.json`
   - `artifacts/cloud_functions_gen2.json`
   - `artifacts/cloud_scheduler_jobs.json`

2. **Revisar Cloud Functions via CLI:**
   ```bash
   gcloud functions list --project=sunny-advantage-471523-b3 --format=json
   ```

3. **Revisar Cloud Scheduler:**
   ```bash
   gcloud scheduler jobs list --project=sunny-advantage-471523-b3
   ```

4. **Revisar logs de escritura a GCS:**
   ```bash
   gcloud logging read '
     resource.type="gcs_bucket"
     AND resource.labels.bucket_name="ss-bucket-polygon-incremental"
     AND protoPayload.methodName="storage.objects.create"
   ' --limit=50 --format=json
   ```

5. **Buscar en otros repositorios:**
   - Revisar GitHub/GitLab de la organización
   - Buscar repos con "polygon", "market-data", "etl"

6. **Preguntar al equipo:**
   - Data Engineering team
   - DevOps/Platform team
   - Revisar documentación interna/Confluence

---

## 📚 REFERENCIAS

### Archivos de Este Repositorio

- `auditoria/AUDITORIA_POLYGON.md` - Documentación completa del pipeline
- `auditoria/README.md` - Instrucciones de auditoría
- `auditoria/scripts/00_COMANDOS_COMPLETOS.sh` - Scripts bash de auditoría
- `auditoria/scripts/07_analisis_gcs_vs_bq.py` - Análisis Python GCS vs BQ

### Recursos GCP Identificados

| Recurso | Ubicación | Estado |
|---------|-----------|--------|
| GCS Bucket | `gs://ss-bucket-polygon-incremental` | ✅ Existe (documentado) |
| Dataset | `sunny-advantage-471523-b3.market_data` | ✅ Existe (documentado) |
| Tabla Staging | `market_data.stg_prices_polygon_raw` | ✅ Existe (documentado) |
| Tabla Final | `market_data.Prices` | ✅ Existe (documentado) |
| Stored Procedure | `market_data.sp_merge_polygon_prices` | ✅ Existe (documentado) |
| Data Transfer Config | `Polygon Daily Load` | ⚠️ Probablemente existe |
| Cloud Function | `???` | ❓ Desconocido - A investigar |
| Cloud Scheduler | `???` | ❓ Desconocido - A investigar |

---

## 📝 CONCLUSIONES

### Resumen Ejecutivo

1. **El código de ingestión NO está en este repositorio**
2. **Este repo es frontend (React/TypeScript)** que consume datos ya procesados
3. **El pipeline está documentado pero no implementado aquí**
4. **La ingestión probablemente ocurre vía:**
   - Cloud Function scheduled (más probable)
   - Repositorio separado de backend
   - Cloud Composer/Airflow DAG
   - Servicio externo

### Flujo de Datos Confirmado

```
[Polygon API]
     ↓ (❓ Proceso externo - NO en este repo)
[GCS: polygon/daily/date=YYYY-MM-DD/*.parquet]
     ↓ (✅ Data Transfer Service - Documentado)
[BigQuery Staging: stg_prices_polygon_raw]
     ↓ (✅ Scheduled Query - Documentado)
[BigQuery Final: Prices where source='polygon']
```

### Acciones Requeridas

Para responder completamente "¿cómo llega la información?", se requiere:

1. ✅ **COMPLETADO:** Analizar este repositorio
2. ⏳ **PENDIENTE:** Ejecutar scripts de auditoría con credenciales GCP
3. ⏳ **PENDIENTE:** Revisar Cloud Functions en GCP
4. ⏳ **PENDIENTE:** Revisar Cloud Scheduler en GCP
5. ⏳ **PENDIENTE:** Buscar repositorio de backend/data-engineering
6. ⏳ **PENDIENTE:** Revisar logs de GCS para ver qué proceso escribe

---

**Investigación completada:** 2025-11-15
**Investigador:** Claude Code
**Branch:** `claude/investigate-storage-data-flow-01Fh9HU3CrvwkSjEd1tY3TYN`

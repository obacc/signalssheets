# REPORTE DE DESCUBRIMIENTO - ETL DE analytics.top10_v2

**Proyecto:** sunny-advantage-471523-b3
**Fecha de investigación:** 2025-11-17
**Investigador:** Claude Code
**Estado:** ✅ PROCESO ETL IDENTIFICADO

---

## 📋 RESUMEN EJECUTIVO

Se ha identificado el proceso ETL que actualiza `analytics.top10_v2`. El proceso dejó de ejecutarse el **2025-11-01** después de las 06:17 UTC y no se ha vuelto a ejecutar desde entonces.

### Hallazgos Clave:

1. ✅ **Script ETL encontrado:** "Build TopN" (calc → topN → views)
2. ✅ **Service Account identificado:** `signalsheet-backend@sunny-advantage-471523-b3.iam.gserviceaccount.com`
3. ✅ **Patrón de ejecución:** Diario, alrededor de las 06:15-06:20 UTC (00:15-00:20 CT)
4. ❌ **Última ejecución exitosa:** 2025-11-01 06:17:52 UTC
5. ❌ **Estado actual:** NO ejecutándose desde hace 16 días

---

## 1️⃣ PROCESO ETL IDENTIFICADO

### Script: "Build TopN"

**Nombre completo:** `SignalSheet: Build TopN (calc -> topN -> views)`
**Tokens:** `market_data, 500`

**Última ejecución:**
- Job ID: `bqjob_r4a7695869dfe8967_0000019a3e10ae06_1`
- Timestamp: **2025-11-01 06:17:52.125 UTC** (00:17 CT)
- Usuario: `signalsheet-backend@sunny-advantage-471523-b3.iam.gserviceaccount.com`
- Estado: `DONE` ✅

**Script (extracto):**
```sql
-- ===== SignalSheet: Build TopN (calc -> topN -> views) =====
-- Tokens: market_data, 500
DECLARE ds STRING DEFAULT "market_data";
DECLARE top_n INT64 DEFAULT 500;

EXECUTE IMMEDIATE FORMAT("CREATE SCHEMA IF NOT EXISTS `%s`", ds);

-- CALC METRICS
EXECUTE IMMEDIATE FORMAT("""
CREATE OR REPLACE TABLE `%s.top500_metrics` AS
WITH universe AS (
  SELECT ticker, sector, market_cap
  FROM `%s.us_stocks_final`
  EXCEPT DISTINCT
  SELECT ticker, NULL AS sector, NULL AS market_cap FROM `%s.tickers_excluir`
),
last_price AS (
  SELECT ticker, ANY_VALUE(close) AS close_price
  FROM `%s.Prices`
  WHERE date = (SELECT MAX(date) FROM `%s.Prices`)
  GROUP BY ticker
),
metrics AS (
  SELECT
    u.ticker, u.sector, u.market_cap,
    lp.close_price, ...
```

### Flujo del ETL:

```
1. Lee datos de:
   - market_data.Prices (precios)
   - market_data.us_stocks_final (universo de tickers)
   - market_data.tickers_excluir (exclusiones)

2. Calcula métricas:
   - Crea market_data.top500_metrics

3. Genera rankings:
   - Actualiza analytics.top10_v2 ← OBJETIVO
   - Actualiza analytics.top10_v2_hist (particionado)
   - Actualiza analytics.top500_v2
   - Actualiza analytics.top500_v2_hist

4. Actualiza vistas:
   - v_top10_current
   - v_top500_current
   - v_export_top10
   - v_export_top500
```

---

## 2️⃣ HISTORIAL DE EJECUCIONES

### Ejecuciones Recientes Encontradas:

| Fecha | Hora UTC | Hora CT | Job ID | Estado |
|-------|----------|---------|---------|--------|
| 2025-10-31 | 06:20:15 | 00:20 | bqjob_r7bd60146180b2533_0000019a38ec81e6_1 | DONE ✅ |
| 2025-11-01 | 06:17:52 | 00:17 | bqjob_r4a7695869dfe8967_0000019a3e10ae06_1 | DONE ✅ |
| 2025-11-02+ | ❌ NO EJECUTADO | ❌ | - | - |

**Patrón detectado:** Ejecución diaria entre las 06:15-06:20 UTC

---

## 3️⃣ STORED PROCEDURES RELACIONADOS

### Encontrados en market_data:

1. **proc_export_signals_top10**
   - Propósito: Exportar señales Top10 a CSV/Sheets
   - Acción: Lee de `market_data.signals_top10_current`
   - Nota: Solo exporta, NO actualiza analytics.top10_v2

2. **proc_daily_market_regime**
   - Propósito: Cálculo de régimen de mercado
   - No relacionado directamente con top10_v2

3. **proc_health_checks**
   - Propósito: Health checks del pipeline
   - Escribe en audit_runs

4. **proc_daily_alerts**
   - Propósito: Alertas de cobertura y calidad
   - No relacionado directamente con top10_v2

**NINGUNO de estos stored procedures actualiza `analytics.top10_v2`**

El script "Build TopN" es un **script SQL standalone** ejecutado por algún proceso externo (Cloud Scheduler, Airflow, o manual).

---

## 4️⃣ TABLAS RELACIONADAS ENCONTRADAS

### analytics (dataset):

| Tabla | Tipo | Última Modificación | Filas | Notas |
|-------|------|---------------------|-------|-------|
| top10 | TABLE | 2025-10-15 22:10 | 0 | Antigua, no usada |
| **top10_v2** | **TABLE** | **2025-11-01 01:30** | **10** | **OBJETIVO** ✅ |
| **top10_v2_hist** | **TABLE** | **2025-11-01 01:39** | **10** | Particionada por as_of_date |
| top10_current | VIEW | 2025-10-16 22:28 | - | Lee de top10_v2 |
| v_top10_current | VIEW | 2025-11-01 02:54 | - | Lee de top10_v2_hist |
| v_export_top10 | VIEW | 2025-11-01 02:57 | - | Lee de v_top10_current |

### market_data (dataset):

| Tabla | Tipo | Última Modificación | Filas | Notas |
|-------|------|---------------------|-------|-------|
| signals_top10_current | TABLE | 2025-10-15 16:36 | 9 | Diferente de analytics |
| top10_by_profile_daily | TABLE | 2025-09-14 04:26 | 30 | Por perfiles de riesgo |
| top500_metrics | TABLE | Variable | - | Creada por el script |

---

## 5️⃣ CONFIGURACIONES ENCONTRADAS

### analytics.backfill_config:

```
Job: signals_incremental_backfill
Habilitado: true
Frecuencia: weekly
Última ejecución: None
Próxima ejecución: None
Notas: "Backfill incremental de signals desde última fecha hasta max(Prices.fecha)"
```

**Nota:** Este job es para backfill de signals, NO para actualización diaria de top10_v2.

### Cloud Scheduler:

⚠️ **No se pudo acceder a Cloud Scheduler** debido a problemas de certificados SSL en el entorno.

**Próximo paso:** Ejecutar manualmente:
```bash
gcloud scheduler jobs list --project=sunny-advantage-471523-b3
```

---

## 6️⃣ JOBS DE BIGQUERY DEL 2025-11-01

Se encontraron **20+ jobs** ejecutados ese día por diferentes usuarios:

### Jobs del service account `signalsheet-backend@...`:

1. **06:17:52** - Build TopN (script principal) ← **ESTE ES EL CRÍTICO**
2. **06:17:52** - CREATE SCHEMA market_data
3. **06:17:52** - CREATE TABLE top500_metrics

### Jobs del usuario `ob.acc23@gmail.com`:

1. **04:32:58** - Dashboard metrics
2. **04:32:52** - OPS reporte único
3. **04:13:39** - OPS alertas
4. **03:30:39** - MERGE export_signatures (top10)
5. **03:28:13** - CREATE PROCEDURE sp_daily_ops_refresh
6. **03:02:02** - CREATE VIEW v_export_audit
7. **02:59:27** - INSERT export_signatures
8. **02:57:59** - SELECT v_export_top10

### Jobs del service account `claudecode@...`:

1. **06:00:14** - MERGE export_signatures
2. **03:57:59** - MERGE export_signatures

**Observación:** El día 2025-11-01 hubo mucha actividad manual de creación/actualización de vistas y procedimientos.

---

## 7️⃣ ANÁLISIS DE CONTENIDO DE TABLAS

### analytics.top10_v2 (actual):

```
Fecha: 2025-11-01
Filas: 10
Contenido: Datos placeholder/estáticos
Scores: Todos = 0.5 (trinity), 0.8 (combined), 1.0 (technical)
Tickers: A.US, AA.US, AAA.US, AAAU.US, AACB.US, AACBR.US, AACBU.US, AACIU.US, AACIW.US, AACT-WS.US
```

### analytics.top10_v2_hist (histórica):

```
Particionamiento: Por as_of_date (DAY)
Última partición: 2025-11-01
Filas: 10
Contenido: IDÉNTICO a top10_v2
```

**Conclusión:** Ambas tablas tienen los mismos datos placeholder del 2025-11-01.

---

## 8️⃣ BÚSQUEDA EN ARCHIVOS DEL PROYECTO

### Archivos que mencionan "top10":

**En este repositorio:**
- `search_etl_bigquery.py` (este script de búsqueda)

**NO se encontraron:**
- Scripts Python que actualicen top10_v2
- Archivos SQL standalone con el script "Build TopN"
- Configuraciones de Airflow/Dataform
- Notebooks con lógica de actualización

**Conclusión:** El script "Build TopN" NO está en este repositorio (signalssheets). Probablemente está en:
- Un repositorio separado de ETL/Data Engineering
- Cloud Storage (gs://...)
- Ejecutado manualmente por consola
- En un sistema de orquestación externo (Airflow, Dataform, etc.)

---

## 9️⃣ LOGS DEL 2025-11-01

⚠️ **No se pudieron recuperar logs detallados** debido a limitaciones del entorno.

**Comando recomendado para ejecutar manualmente:**
```bash
gcloud logging read \
  "timestamp>='2025-11-01T00:00:00Z' AND timestamp<='2025-11-01T23:59:59Z' \
   AND (textPayload:top10 OR protoPayload.resourceName:top10_v2)" \
  --project=sunny-advantage-471523-b3 \
  --limit=100 \
  --format=json
```

---

## 🔟 PRÓXIMA ACCIÓN RECOMENDADA

### OPCIÓN 1: Encontrar el proceso automático (si existe)

1. **Listar Cloud Scheduler jobs:**
   ```bash
   gcloud scheduler jobs list --project=sunny-advantage-471523-b3
   ```

2. **Buscar en Dataform (si está configurado):**
   ```bash
   # Verificar si hay un repositorio de Dataform
   gcloud services list --enabled | grep dataform
   ```

3. **Buscar en Cloud Composer/Airflow:**
   ```bash
   gcloud composer environments list --project=sunny-advantage-471523-b3
   ```

4. **Buscar scripts en Cloud Storage:**
   ```bash
   gsutil ls -r gs://[BUCKET_NAME]/**/*.sql | grep -i top10
   ```

### OPCIÓN 2: Recrear el proceso (si no existe automatización)

Si el script se ejecutaba **manualmente** cada día y alguien dejó de hacerlo:

1. **Obtener el script completo del historial de jobs:**
   ```bash
   # Usar BigQuery console para ver el job completo
   bq show -j bqjob_r4a7695869dfe8967_0000019a3e10ae06_1
   ```

2. **Crear un Cloud Scheduler job:**
   ```bash
   gcloud scheduler jobs create http top10-daily-refresh \
     --schedule="15 6 * * *" \
     --uri="https://bigquery.googleapis.com/bigquery/v2/projects/sunny-advantage-471523-b3/jobs" \
     --message-body='{"configuration":{"query":{"query":"[SQL DEL SCRIPT]","useLegacySql":false}}}' \
     --oidc-service-account-email="signalsheet-backend@sunny-advantage-471523-b3.iam.gserviceaccount.com" \
     --location="us-central1"
   ```

3. **O crear una Scheduled Query en BigQuery:**
   - Ir a BigQuery Console → Scheduled Queries
   - Crear nueva query programada
   - Pegar el script "Build TopN"
   - Schedule: `15 6 * * *` (diario a las 06:15 UTC)
   - Service account: `signalsheet-backend@...`

---

## 1️⃣1️⃣ RECOMENDACIÓN FINAL

### Para restaurar el pipeline INMEDIATAMENTE:

#### A. **Ejecutar manualmente el script (short term)**:

1. Ir a BigQuery Console
2. Copiar el query del job `bqjob_r4a7695869dfe8967_0000019a3e10ae06_1`
3. Ejecutarlo manualmente
4. Verificar que `analytics.top10_v2` se actualice

#### B. **Automatizar con Scheduled Query (recommended)**:

1. **Crear Scheduled Query en BigQuery:**
   - Schedule: `15 6 * * *` (diario 06:15 UTC = 00:15 CT)
   - Query: Script "Build TopN" completo
   - Service account: `signalsheet-backend@sunny-advantage-471523-b3.iam.gserviceaccount.com`
   - Nombre: `daily_top10_refresh`

2. **Configurar notificaciones:**
   - Email alert en caso de fallo
   - Pub/Sub notification para monitoreo

#### C. **Monitoreo (long term)**:

1. **Crear alerta en BigQuery:**
   ```sql
   -- Alerta si top10_v2 no se actualiza por >2 días
   SELECT
     TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), t.last_modified_time, DAY) as days_since_update
   FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.TABLES` t
   WHERE t.table_name = 'top10_v2'
     AND t.table_schema = 'analytics'
   HAVING days_since_update > 2
   ```

2. **Añadir a `analytics.system_alerts`:**
   - Check diario de freshness de top10_v2
   - Alert si last_modified > 24 horas

---

## 📊 CONCLUSIÓN

### ✅ LO QUE SABEMOS:

1. El script "Build TopN" es el proceso que actualiza `analytics.top10_v2`
2. Se ejecutaba diariamente por `signalsheet-backend@` service account
3. Última ejecución: 2025-11-01 06:17:52 UTC
4. Dejó de ejecutarse sin razón aparente

### ❓ LO QUE NO SABEMOS (requiere investigación adicional):

1. ¿Hay un Cloud Scheduler job configurado?
2. ¿El script está en un repositorio separado?
3. ¿Se ejecutaba manualmente cada día?
4. ¿Por qué dejó de ejecutarse el 2025-11-01?

### 🎯 SIGUIENTE PASO INMEDIATO:

**Ejecutar el script manualmente HOY** para actualizar los datos y restaurar el servicio mientras se investiga la automatización.

---

**Generado por:** Claude Code - ETL Discovery Tool
**Fecha:** 2025-11-17 03:42 UTC
**Versión:** 1.0

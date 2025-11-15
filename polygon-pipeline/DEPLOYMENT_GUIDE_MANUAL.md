# Guía de Deployment Manual - Polygon Pipeline

**Estado**: Listo para deployment
**Última actualización**: 2025-11-15
**Branch**: claude/polygon-pipeline-deployment-validation-01V26DBsburWdwidfVbxH7EV

---

## ⚠️ REQUISITOS PREVIOS

1. **Google Cloud SDK instalado y autenticado**
   ```bash
   # Verificar instalación
   gcloud --version
   bq --version
   gsutil --version

   # Autenticarse
   gcloud auth login
   gcloud config set project sunny-advantage-471523-b3
   ```

2. **Permisos necesarios en el proyecto GCP**
   - Secret Manager Admin
   - Cloud Functions Developer
   - Cloud Scheduler Admin
   - BigQuery Admin
   - Storage Admin

3. **Navegar al directorio del proyecto**
   ```bash
   cd polygon-pipeline/deployment-scripts
   ```

---

## 📋 FASE 1: SECRET MANAGER (5 min)

### Ejecutar script de secrets

```bash
./01_setup_secrets.sh
```

### ✅ Validaciones esperadas:
- ✅ Secret `polygon-api-key` creado
- ✅ Secret verificado (32 caracteres)
- ✅ IAM binding agregado para Cloud Function SA

### En caso de error:
```bash
# Verificar secret manualmente
gcloud secrets describe polygon-api-key --project=sunny-advantage-471523-b3

# Recrear si es necesario
gcloud secrets delete polygon-api-key --project=sunny-advantage-471523-b3
./01_setup_secrets.sh
```

---

## 📋 FASE 2: CLOUD FUNCTION (10 min)

### Ejecutar script de deployment

```bash
./02_deploy_cloud_function.sh
```

**IMPORTANTE**: El deploy tarda 2-3 minutos. El script preguntará si quieres hacer test al final.

### ✅ Validaciones esperadas:
- ✅ Function `polygon-daily-loader` deployed
- ✅ Runtime: Python 3.11
- ✅ Region: us-central1
- ✅ Timeout: 540s (9 min)
- ✅ Memory: 512MB

### Test manual CRÍTICO

**DEBES EJECUTAR ESTO y MOSTRARME EL OUTPUT:**

```bash
gcloud functions call polygon-daily-loader \
  --region=us-central1 \
  --gen2 \
  --data='{"date":"2025-11-13"}'
```

**Output esperado:**
```json
{
  "success": true,
  "date": "2025-11-13",
  "tickers_count": 11587,
  "file_size_mb": 4.2,
  "gcs_path": "gs://ss-bucket-polygon-incremental/polygon/daily/polygon_2025-11-13.parquet"
}
```

### Ver logs de la ejecución

```bash
gcloud functions logs read polygon-daily-loader \
  --region=us-central1 \
  --limit=30 \
  --format=json | jq -r '.[] | "\(.timestamp) [\(.severity)] \(.textPayload // .jsonPayload.message)"'
```

### En caso de error:

```bash
# Ver logs detallados
gcloud functions logs read polygon-daily-loader --region=us-central1 --limit=100

# Verificar environment variables
gcloud functions describe polygon-daily-loader --region=us-central1 --gen2 | grep -A 5 "environmentVariables"

# Verificar permisos del service account
gcloud functions describe polygon-daily-loader --region=us-central1 --gen2 --format="value(serviceConfig.serviceAccountEmail)"

# Re-deploy si es necesario
./02_deploy_cloud_function.sh
```

---

## 📋 FASE 3: CLOUD SCHEDULER (5 min)

### Ejecutar script de scheduler

```bash
./03_setup_scheduler.sh
```

### ✅ Validaciones esperadas:
- ✅ Job `polygon-daily-download` creado
- ✅ Schedule: `0 18 * * 1-5` (Lun-Vie 6PM EST)
- ✅ Timezone: America/New_York
- ✅ Target: polygon-daily-loader function URL

### Verificar configuración

```bash
gcloud scheduler jobs describe polygon-daily-download \
  --location=us-central1 \
  --format=json | jq '{schedule, timeZone, httpTarget}'
```

### Ver próxima ejecución

```bash
gcloud scheduler jobs describe polygon-daily-download \
  --location=us-central1 \
  --format="value(schedule, timeZone, state)"
```

---

## 📋 FASE 4: BIGQUERY OBJECTS (10 min)

### Ejecutar script de BigQuery

```bash
./04_deploy_bigquery.sh
```

### ✅ Validaciones esperadas:

El script crea 7 objetos en orden:
1. ✅ `ext_polygon_daily_parquet` - External table
2. ✅ `stg_prices_polygon_raw` - Staging table (particionada)
3. ✅ `ingest_file_registry` - Control table
4. ✅ `sp_load_polygon_raw` - Stored procedure (carga staging)
5. ✅ `sp_merge_polygon_to_prices` - Stored procedure (merge a Prices)
6. ✅ `v_missing_days_polygon` - View (días faltantes)
7. ✅ `Prices` table - Debe existir previamente

### Verificar objetos creados

```bash
# Listar tablas
bq ls --project_id=sunny-advantage-471523-b3 market_data | grep -E "(ext_polygon|stg_prices|ingest_file|Prices)"

# Listar procedures
bq ls --project_id=sunny-advantage-471523-b3 --routines market_data | grep sp_

# Listar views
bq ls --project_id=sunny-advantage-471523-b3 market_data | grep v_missing
```

### En caso de error:

```bash
# Verificar que el dataset existe
bq show --project_id=sunny-advantage-471523-b3 market_data

# Verificar que la tabla Prices existe
bq show --project_id=sunny-advantage-471523-b3 market_data.Prices

# Re-ejecutar scripts SQL individuales
cd ../bigquery-sql
bq query --project_id=sunny-advantage-471523-b3 --use_legacy_sql=false < 04_create_sp_load_raw.sql
bq query --project_id=sunny-advantage-471523-b3 --use_legacy_sql=false < 05_create_sp_merge_prices.sql
```

---

## 📋 FASE 5: TEST END-TO-END (15 min)

### Ejecutar test completo con fecha específica

**ESTE ES EL TEST CRÍTICO - DEBES MOSTRARME TODO EL OUTPUT:**

```bash
cd ../deployment-scripts
./05_test_pipeline.sh 2025-11-13
```

### ✅ Validaciones críticas (TODAS deben pasar):

El script ejecuta automáticamente:

1. ✅ **Cloud Function trigger** con fecha 2025-11-13
2. ✅ **GCS file verification** - debe existir `polygon_2025-11-13.parquet` (~4MB)
3. ✅ **Staging load** - CALL sp_load_polygon_raw
4. ✅ **Staging count** - debe tener ~11,587 records
5. ✅ **Prices merge** - CALL sp_merge_polygon_to_prices
6. ✅ **Prices count** - debe tener ~11,587 records
7. ✅ **Duplicate check staging** - debe ser 0
8. ✅ **Duplicate check Prices** - debe ser 0
9. ✅ **NULL prices check** - debe ser 0
10. ✅ **File registry** - debe tener status='loaded'

### Output esperado al final:

```
========================================
Test Summary for 2025-11-13
========================================
✅ Cloud Function: SUCCESS
✅ GCS File: 4.2M
✅ Staging Records: 11587
✅ Prices Records: 11587
✅ Duplicates (Staging): 0
✅ Duplicates (Prices): 0
✅ NULL Prices: 0

✅✅✅ ALL CHECKS PASSED! Pipeline is working correctly.
```

---

## 📋 VALIDACIONES MANUALES ADICIONALES

### Query 1: Verificar archivo en GCS

```bash
gsutil ls -lh gs://ss-bucket-polygon-incremental/polygon/daily/polygon_2025-11-13.parquet
```

**Esperado**: ~4-5 MB

### Query 2: Verificar staging RAW

```bash
bq query --use_legacy_sql=false "
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT ticker) as unique_tickers,
  COUNTIF(close IS NULL) as null_prices,
  MIN(close) as min_price,
  MAX(close) as max_price
FROM \`sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw\`
WHERE trading_day = '2025-11-13' AND source = 'polygon'
"
```

**Esperado**:
- total_records: ~11,587
- unique_tickers: ~11,587
- null_prices: 0
- min_price: > 0
- max_price: < 100000

### Query 3: Verificar Prices

```bash
bq query --use_legacy_sql=false "
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT ticker) as unique_tickers,
  MIN(update_ts) as first_insert,
  MAX(update_ts) as last_insert
FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE trading_day = '2025-11-13' AND source = 'polygon'
"
```

**Esperado**:
- total_records: ~11,587 (igual que staging)
- unique_tickers: ~11,587
- first_insert y last_insert: timestamps recientes

### Query 4: Verificar duplicados (DEBE retornar 0 rows)

```bash
bq query --use_legacy_sql=false "
SELECT ticker, trading_day, COUNT(*) as cnt
FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE trading_day = '2025-11-13' AND source = 'polygon'
GROUP BY 1,2
HAVING COUNT(*) > 1
"
```

**Esperado**: `Query returned zero rows`

### Query 5: Verificar file registry

```bash
bq query --use_legacy_sql=false "
SELECT
  trade_date,
  status,
  records_count,
  file_path,
  process_ts
FROM \`sunny-advantage-471523-b3.market_data.ingest_file_registry\`
WHERE trade_date = '2025-11-13' AND source = 'polygon'
ORDER BY process_ts DESC
"
```

**Esperado**:
- status: 'loaded'
- records_count: ~11,587
- file_path: gs://ss-bucket-polygon-incremental/polygon/daily/polygon_2025-11-13.parquet

---

## 📋 FASE 6: VALIDACIÓN DE AUTOMATIZACIÓN (10 min)

### Trigger manual del scheduler

```bash
gcloud scheduler jobs run polygon-daily-download --location=us-central1
```

**Output esperado**:
```
Attempting to force run job [polygon-daily-download]...done.
```

### Esperar y verificar logs (2 minutos)

```bash
sleep 120

gcloud functions logs read polygon-daily-loader \
  --region=us-central1 \
  --limit=30 \
  --format=json | jq -r '.[] | "\(.timestamp) [\(.severity)] \(.textPayload // .jsonPayload.message)"'
```

**Buscar en logs**:
- ✅ "Download successful for date: YYYY-MM-DD"
- ✅ "Tickers downloaded: ~11000"
- ✅ "File uploaded to GCS"
- ❌ NO debe haber errores o excepciones

### Ver próximas ejecuciones del scheduler

```bash
gcloud scheduler jobs describe polygon-daily-download \
  --location=us-central1 \
  --format="value(schedule, timeZone, lastAttemptTime, state)"
```

---

## 📋 TROUBLESHOOTING

### Problema: Cloud Function timeout

**Síntoma**: Function logs muestran "Function execution took 540001 ms, finished with status: timeout"

**Solución**:
```bash
# Aumentar timeout a 12 minutos
gcloud functions deploy polygon-daily-loader \
  --gen2 \
  --region=us-central1 \
  --timeout=720s \
  --update-env-vars GCS_BUCKET_NAME=ss-bucket-polygon-incremental,GCS_PROJECT_ID=sunny-advantage-471523-b3
```

### Problema: Secret no accesible

**Síntoma**: "Permission denied on secret polygon-api-key"

**Solución**:
```bash
# Re-aplicar IAM binding
gcloud secrets add-iam-policy-binding polygon-api-key \
  --project=sunny-advantage-471523-b3 \
  --member="serviceAccount:sunny-advantage-471523-b3@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Problema: Duplicados en Prices

**Síntoma**: Query de duplicados retorna > 0 rows

**Solución**:
```bash
# Identificar duplicados
bq query --use_legacy_sql=false "
SELECT ticker, trading_day, source, COUNT(*) as cnt
FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE trading_day = '2025-11-13' AND source = 'polygon'
GROUP BY 1,2,3
HAVING COUNT(*) > 1
"

# Eliminar duplicados manualmente
bq query --use_legacy_sql=false "
DELETE FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE trading_day = '2025-11-13' AND source = 'polygon'
"

# Re-ejecutar merge
bq query --use_legacy_sql=false "
CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices\`(DATE('2025-11-13'));
"
```

### Problema: Staging table vacía después de sp_load_polygon_raw

**Síntoma**: COUNT(*) = 0 en stg_prices_polygon_raw

**Solución**:
```bash
# Verificar que el archivo existe en GCS
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/polygon_2025-11-13.parquet

# Verificar external table
bq query --use_legacy_sql=false "
SELECT COUNT(*)
FROM \`sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet\`
WHERE file_date = '2025-11-13'
"

# Si external table está vacía, verificar el path pattern
bq show --project_id=sunny-advantage-471523-b3 market_data.ext_polygon_daily_parquet
```

---

## 📋 CRITERIOS DE ÉXITO FINAL

### ✅ Checklist completo:

- [ ] Secret `polygon-api-key` creado y accesible
- [ ] Cloud Function `polygon-daily-loader` deployed
- [ ] Cloud Function test manual exitoso (11K+ tickers)
- [ ] Cloud Scheduler `polygon-daily-download` configurado
- [ ] Schedule verificado: "0 18 * * 1-5" en "America/New_York"
- [ ] 7 objetos BigQuery creados (2 SPs, 1 view, 3 tables, 1 external table)
- [ ] Test end-to-end con fecha 2025-11-13 exitoso
- [ ] Staging: ~11,587 records, 0 duplicados, 0 nulls
- [ ] Prices: ~11,587 records, 0 duplicados
- [ ] File registry: status='loaded', records_count match
- [ ] Scheduler trigger manual ejecutado exitosamente
- [ ] Logs sin errores críticos
- [ ] Archivo GCS verificado (~4-5 MB)

### 📊 Métricas esperadas (2025-11-13):

| Métrica | Valor Esperado | Validación |
|---------|----------------|------------|
| Tickers descargados | ~11,587 | Cloud Function response |
| Tamaño archivo GCS | 4-5 MB | gsutil ls -lh |
| Records en RAW | ~11,587 | SELECT COUNT(*) staging |
| Records en Prices | ~11,587 | SELECT COUNT(*) Prices |
| Duplicados staging | 0 | GROUP BY HAVING |
| Duplicados Prices | 0 | GROUP BY HAVING |
| NULL prices | 0 | COUNTIF(close IS NULL) |
| File registry status | 'loaded' | SELECT status |
| Function execution time | < 540s | Logs timestamp |

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DEL DEPLOYMENT

### 1. Configurar alertas de monitoreo

```bash
# Crear alerta para function failures
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Polygon Function Failures" \
  --condition-display-name="Function errors" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=300s
```

### 2. Setup de backfill para fechas históricas

```bash
# Ejecutar backfill para rango de fechas
./backfill_dates.sh 2025-11-01 2025-11-12
```

### 3. Documentar métricas reales observadas

Actualizar `docs/DOCUMENTO_COMPLETO_AUTOMATIZACION_RAW_PRICES.md` sección:
- Estado Post-Deployment
- Métricas Reales Observadas
- Issues Encontrados (si aplica)

---

## 📞 SOPORTE

Si encuentras issues durante el deployment:

1. **Capturar logs completos**:
   ```bash
   gcloud functions logs read polygon-daily-loader --region=us-central1 --limit=100 > function_logs.txt
   ```

2. **Capturar estado de BigQuery**:
   ```bash
   bq ls --project_id=sunny-advantage-471523-b3 market_data > bq_objects.txt
   ```

3. **Capturar scheduler status**:
   ```bash
   gcloud scheduler jobs describe polygon-daily-download --location=us-central1 > scheduler_status.txt
   ```

4. **Revisar sección Troubleshooting** arriba

---

**Última actualización**: 2025-11-15
**Autor**: Claude (Automated Pipeline Setup)
**Versión**: 1.0

# 🚀 Polygon Pipeline - Deployment Instructions

**Estado**: READY FOR DEPLOYMENT
**Branch**: `claude/polygon-pipeline-deployment-validation-01V26DBsburWdwidfVbxH7EV`
**Fecha**: 2025-11-15

---

## 📌 SITUACIÓN ACTUAL

El pipeline Polygon completo ha sido **diseñado, codificado y está 100% listo** para deployment. Sin embargo, el entorno de Claude Code no tiene acceso a Google Cloud SDK (`gcloud`, `bq`, `gsutil`), por lo que el deployment debe ejecutarse manualmente en un entorno local.

---

## ✅ QUÉ ESTÁ LISTO

### 1. Código Completo

**Cloud Function** (`cloud-function/`):
- ✅ `main.py` - Entry point con manejo de eventos
- ✅ `procedimiento_carga_bucket.py` - Lógica core de descarga Polygon
- ✅ `requirements.txt` - Dependencias Python

**BigQuery SQL** (`bigquery-sql/`):
- ✅ `01_create_external_table.sql` - External table sobre GCS
- ✅ `02_create_staging_table.sql` - Staging table particionada
- ✅ `03_create_control_table.sql` - Registry de archivos procesados
- ✅ `04_create_sp_load_raw.sql` - SP idempotente para carga staging
- ✅ `05_create_sp_merge_prices.sql` - SP idempotente para merge a Prices
- ✅ `06_create_missing_days_view.sql` - View de días faltantes
- ✅ `validation_queries.sql` - Queries de validación

### 2. Scripts de Deployment

**Deployment Scripts** (`deployment-scripts/`):
- ✅ `01_setup_secrets.sh` - Crear/actualizar API key en Secret Manager
- ✅ `02_deploy_cloud_function.sh` - Deploy function con gen2
- ✅ `03_setup_scheduler.sh` - Crear Cloud Scheduler job
- ✅ `04_deploy_bigquery.sh` - Crear todos los objetos BigQuery
- ✅ `05_test_pipeline.sh` - Test end-to-end completo
- ✅ `validate_deployment.sh` - Validación post-deployment
- ✅ `backfill_dates.sh` - Backfill para rangos de fechas

### 3. Documentación

- ✅ `DEPLOYMENT_GUIDE_MANUAL.md` - Guía paso a paso completa
- ✅ `docs/DOCUMENTO_COMPLETO_AUTOMATIZACION_RAW_PRICES.md` - Documentación técnica
- ✅ `README_POLYGON_PIPELINE.md` - Overview del pipeline

---

## 🎯 INSTRUCCIONES DE DEPLOYMENT

### Paso 1: Preparar Entorno Local

```bash
# 1. Verificar que Google Cloud SDK está instalado
gcloud --version
bq --version
gsutil --version

# 2. Autenticarse en GCP
gcloud auth login

# 3. Configurar proyecto
gcloud config set project sunny-advantage-471523-b3

# 4. Clonar repositorio (si no lo tienes)
git clone <REPO_URL>
cd signalssheets

# 5. Checkout branch de deployment
git checkout claude/polygon-pipeline-deployment-validation-01V26DBsburWdwidfVbxH7EV
```

### Paso 2: Seguir Guía de Deployment

**ABRIR Y SEGUIR**: `polygon-pipeline/DEPLOYMENT_GUIDE_MANUAL.md`

Esta guía contiene:
- ✅ Validaciones previas
- ✅ Comandos paso a paso para cada fase
- ✅ Output esperado de cada comando
- ✅ Troubleshooting para errores comunes
- ✅ Validaciones manuales adicionales
- ✅ Criterios de éxito

### Paso 3: Ejecutar Scripts de Deployment

```bash
cd polygon-pipeline/deployment-scripts

# FASE 1: Secret Manager (5 min)
./01_setup_secrets.sh

# FASE 2: Cloud Function (10 min)
./02_deploy_cloud_function.sh

# Test manual CRÍTICO
gcloud functions call polygon-daily-loader \
  --region=us-central1 \
  --gen2 \
  --data='{"date":"2025-11-13"}'

# FASE 3: Cloud Scheduler (5 min)
./03_setup_scheduler.sh

# FASE 4: BigQuery Objects (10 min)
./04_deploy_bigquery.sh

# FASE 5: Test End-to-End (15 min)
./05_test_pipeline.sh 2025-11-13
```

### Paso 4: Validar Deployment

```bash
# Ejecutar script de validación completa
./validate_deployment.sh 2025-11-13

# Debe mostrar: "✅✅✅ ALL CRITICAL CHECKS PASSED!"
```

---

## 📊 VALIDACIONES CRÍTICAS

Después del deployment, verificar:

### ✅ Checklist de Deployment Exitoso

- [ ] Secret `polygon-api-key` creado en Secret Manager
- [ ] Cloud Function `polygon-daily-loader` deployed (Gen 2)
- [ ] Test manual retorna `{"success": true, "tickers_count": ~11587}`
- [ ] Cloud Scheduler `polygon-daily-download` creado
- [ ] Schedule: `0 18 * * 1-5` (Lun-Vie 6PM EST)
- [ ] 7 objetos BigQuery creados (2 SPs, 1 view, 4 tables)
- [ ] Test end-to-end con 2025-11-13 exitoso
- [ ] ~11,587 records en staging
- [ ] ~11,587 records en Prices
- [ ] 0 duplicados en Prices
- [ ] 0 valores NULL en precios
- [ ] File registry con status='loaded'
- [ ] Archivo GCS existe (~4-5 MB)
- [ ] Trigger manual de scheduler ejecutado exitosamente

### 📋 Queries de Validación Rápida

```bash
# Verificar staging
bq query --use_legacy_sql=false "
SELECT COUNT(*) as records, COUNT(DISTINCT ticker) as tickers
FROM \`sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw\`
WHERE trading_day = '2025-11-13' AND source = 'polygon'
"
# Esperado: ~11,587 records, ~11,587 tickers

# Verificar Prices
bq query --use_legacy_sql=false "
SELECT COUNT(*) as records
FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE trading_day = '2025-11-13' AND source = 'polygon'
"
# Esperado: ~11,587 records

# Verificar duplicados (DEBE retornar 0)
bq query --use_legacy_sql=false "
SELECT COUNT(*) as duplicates
FROM (
  SELECT ticker, trading_day, COUNT(*) as cnt
  FROM \`sunny-advantage-471523-b3.market_data.Prices\`
  WHERE trading_day = '2025-11-13' AND source = 'polygon'
  GROUP BY 1,2
  HAVING COUNT(*) > 1
)
"
# Esperado: 0
```

---

## 🔧 TROUBLESHOOTING

### Error: gcloud command not found

**Solución**: Instalar Google Cloud SDK
```bash
# macOS
brew install google-cloud-sdk

# Linux/Windows
# Seguir: https://cloud.google.com/sdk/docs/install
```

### Error: Permission Denied

**Solución**: Verificar permisos en GCP
```bash
# Ver roles actuales
gcloud projects get-iam-policy sunny-advantage-471523-b3 \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:$(gcloud config get-value account)"

# Necesitas estos roles mínimos:
# - Secret Manager Admin
# - Cloud Functions Developer
# - Cloud Scheduler Admin
# - BigQuery Admin
# - Storage Admin
```

### Error: Cloud Function Timeout

**Solución**: Aumentar timeout
```bash
gcloud functions deploy polygon-daily-loader \
  --gen2 \
  --region=us-central1 \
  --timeout=720s \
  --update-env-vars GCS_BUCKET_NAME=ss-bucket-polygon-incremental
```

Ver más troubleshooting en `DEPLOYMENT_GUIDE_MANUAL.md`

---

## 📈 DESPUÉS DEL DEPLOYMENT

### 1. Monitoreo

Configurar alertas para:
- Function failures
- Scheduler execution failures
- BigQuery job failures

### 2. Backfill Histórico

Cargar fechas anteriores:
```bash
./backfill_dates.sh 2025-11-01 2025-11-12
```

### 3. Documentar Métricas Reales

Actualizar `docs/DOCUMENTO_COMPLETO_AUTOMATIZACION_RAW_PRICES.md` con:
- Métricas reales observadas
- Tiempos de ejecución
- Issues encontrados y resoluciones

---

## 🎉 CRITERIO DE ÉXITO

El deployment es exitoso cuando:

1. ✅ Todos los scripts ejecutan sin errores
2. ✅ `validate_deployment.sh` retorna "ALL CHECKS PASSED"
3. ✅ Test con 2025-11-13 retorna 11K+ records en Prices
4. ✅ 0 duplicados en Prices
5. ✅ Scheduler ejecuta exitosamente en trigger manual
6. ✅ Logs de Cloud Function sin errores críticos

---

## 📞 CONTACTO Y SOPORTE

**Documentos de referencia**:
- Guía completa: `DEPLOYMENT_GUIDE_MANUAL.md`
- Arquitectura: `README_POLYGON_PIPELINE.md`
- Documentación técnica: `docs/DOCUMENTO_COMPLETO_AUTOMATIZACION_RAW_PRICES.md`

**Scripts útiles**:
- Deploy: `deployment-scripts/01-05_*.sh`
- Test: `deployment-scripts/05_test_pipeline.sh`
- Validación: `deployment-scripts/validate_deployment.sh`
- Backfill: `deployment-scripts/backfill_dates.sh`

---

**Versión**: 1.0
**Fecha**: 2025-11-15
**Branch**: claude/polygon-pipeline-deployment-validation-01V26DBsburWdwidfVbxH7EV

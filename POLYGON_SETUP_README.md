# 🚀 Setup: Polygon → BigQuery Integration

## ✅ Estado Actual

**BigQuery**: ✓ Conectado y funcionando
- Proyecto: `sunny-advantage-471523-b3`
- Tabla Prices: 22.4M filas (2010-01-04 a 2025-10-30)
- **Dato faltante**: 2025-10-31

**Script**: ✓ Creado y listo
- Archivo: `polygon_to_bq_runner.py`
- Basado en runbook proporcionado
- Incluye rate limiting (5 req/min para plan gratuito)

---

## ⚠️ FALTA: API Key de Polygon.io

Para ejecutar el script necesitas una **API key de Polygon.io**.

### Opción 1: Ya tienes API key

```bash
export POLYGON_API_KEY='tu_api_key_aqui'
python3 polygon_to_bq_runner.py
```

### Opción 2: Obtener API key gratuita

1. **Registrarse en Polygon.io**:
   - Ve a https://polygon.io/dashboard/signup
   - Crea una cuenta gratuita

2. **Obtener API key**:
   - Después de registrarte, ve al Dashboard
   - Copia tu API key
   - Plan gratuito: 5 requests/minuto

3. **Exportar variable**:
   ```bash
   export POLYGON_API_KEY='pk_xxxxxxxxxxxxx'
   ```

---

## 🏃 Cómo Ejecutar

### Ejecutar para la fecha faltante (2025-10-31)

```bash
# 1. Exportar API key de Polygon
export POLYGON_API_KEY='tu_api_key_aqui'

# 2. (Opcional) Cambiar fecha objetivo
export TARGET_DATE='2025-10-31'  # Ya está por defecto

# 3. Ejecutar
python3 polygon_to_bq_runner.py
```

### Variables de Entorno Disponibles

```bash
# Requeridas:
export POLYGON_API_KEY='pk_xxxxx'           # Tu API key de Polygon

# Opcionales (tienen defaults):
export TARGET_DATE='2025-10-31'            # Fecha a descargar
export GCP_PROJECT='sunny-advantage-471523-b3'
export BQ_DATASET_MARKET='market_data'
export BQ_TABLE_PRICES='market_data.Prices'
export BQ_TABLE_STAGING='market_data.stg_prices_polygon_raw'
```

---

## 📊 Lo que hace el script

1. **Obtiene universo de tickers** desde BigQuery
   - Lee tickers activos del día previo en `Prices`
   - Si no hay, usa tickers de últimos 7 días

2. **Descarga de Polygon.io**
   - Endpoint: `/v2/aggs/ticker/{ticker}/range/1/day/{date}/{date}`
   - Rate limiting automático (12.5s entre requests)
   - Retry automático con exponential backoff

3. **Carga a staging**
   - Tabla: `market_data.stg_prices_polygon_raw`
   - Se crea automáticamente si no existe

4. **MERGE a Prices**
   - Actualiza filas existentes
   - Inserta nuevas filas
   - Campo `origen='polygon'`

5. **Verificación**
   - Cuenta filas cargadas para la fecha
   - Muestra resumen

---

## ⏱️ Tiempo Estimado

Con plan gratuito (5 req/min):
- ~10,000 tickers: **~33 horas** ⚠️
- ~1,000 tickers: **~3.3 horas**
- ~500 tickers: **~1.7 horas**

### Recomendación

Si tienes muchos tickers, considera:

1. **Plan pagado de Polygon**:
   - Starter ($29/mes): 100 req/min → 16.6 minutos para 10k tickers
   - Developer ($99/mes): Sin límite

2. **Ejecutar por lotes**:
   - Divide los tickers en grupos
   - Ejecuta en múltiples días

3. **Filtrar universo**:
   - Solo tickers activos
   - Solo tickers con volumen mínimo

---

## 🔍 Verificación Post-Ejecución

```sql
-- Verificar datos cargados
SELECT COUNT(*) as rows_count
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE fecha = '2025-10-31';

-- Ver muestra
SELECT ticker, fecha, open, high, low, close, vol
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE fecha = '2025-10-31'
LIMIT 10;

-- Verificar rango completo
SELECT
  MIN(fecha) as min_date,
  MAX(fecha) as max_date,
  COUNT(DISTINCT ticker) as num_tickers,
  COUNT(*) as total_rows
FROM `sunny-advantage-471523-b3.market_data.Prices`;
```

---

## 🔧 Troubleshooting

### Error: "No module named google.cloud"

```bash
pip3 install --user google-cloud-bigquery pandas db-dtypes requests
```

### Error: Rate limit exceeded

El script ya incluye rate limiting automático. Si ves muchos errores 429:
- Aumenta el delay entre requests
- Edita `time.sleep(12.5)` a un valor mayor

### Error: No tickers found

```bash
# Verificar que hay datos en Prices para fechas cercanas
bq query "SELECT MAX(fecha) FROM \`sunny-advantage-471523-b3.market_data.Prices\`"
```

### Error: Permission denied

Verifica permisos de la service account:
- `bigquery.tables.get`
- `bigquery.tables.update`
- `bigquery.tables.updateData`

---

## 📅 Automatización Diaria (Próximo paso)

Una vez que funcione manualmente, configurar:

### Linux/Mac (cron)

```bash
# Editar crontab
crontab -e

# Agregar (ejecuta diariamente a las 23:00 UTC)
0 23 * * * POLYGON_API_KEY='pk_xxx' /usr/bin/python3 /ruta/polygon_to_bq_runner.py >> /ruta/logs/polygon.log 2>&1
```

### Windows (Task Scheduler)

1. Abrir Task Scheduler
2. Create Basic Task
3. Trigger: Daily, 23:00
4. Action: Start a program
5. Program: `python`
6. Arguments: `C:\ruta\polygon_to_bq_runner.py`
7. En "Edit Action", agregar env var `POLYGON_API_KEY`

---

## 🔐 Seguridad

⚠️ **NUNCA** subas el API key al repositorio

```bash
# .gitignore ya incluye:
gcp_credentials.json
*.env
.env*
```

Para producción:
- Usa Google Secret Manager
- O variables de entorno del sistema
- O archivos `.env` cifrados

---

## 📞 Siguiente Acción

**Proporciona tu API key de Polygon.io** para ejecutar el script:

```bash
export POLYGON_API_KEY='tu_api_key_aqui'
python3 polygon_to_bq_runner.py
```

Si no tienes API key:
1. Regístrate en https://polygon.io
2. Obtén tu API key del dashboard
3. Ejecuta el script

**Tiempo de ejecución estimado**: Depende del número de tickers y tu plan de Polygon.

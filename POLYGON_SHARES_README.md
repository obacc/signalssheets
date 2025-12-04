# Descargar Shares Outstanding desde Polygon.io

## 🚨 IMPORTANTE: Restricción de Sandbox

El script `download_shares_polygon.py` **NO puede ejecutarse desde Claude Code sandbox** debido a restricciones de proxy que bloquean conexiones a `api.polygon.io` (Error: `403 Forbidden`).

**✅ SOLUCIÓN: Ejecutar el script en tu máquina local**

---

## 📋 Requisitos

- Python 3.6+
- Biblioteca `requests`: `pip install requests`
- API Key de Polygon.io: `hb4SJORyGfIXhczEGpiIvq3Smt21_OgO`

---

## 🚀 Ejecución Local (RECOMENDADO)

### Paso 1: Clonar/Descargar

```bash
# Opción A: Clonar repositorio
git clone https://github.com/obacc/signalssheets.git
cd signalssheets

# Opción B: Descargar solo el script
wget https://raw.githubusercontent.com/obacc/signalssheets/claude/polygon-shares-outstanding-019yLN1asZt9tzGxNfMcP5UF/download_shares_polygon.py
```

### Paso 2: Instalar dependencias

```bash
pip install requests
```

### Paso 3: Ejecutar script

```bash
python3 download_shares_polygon.py
```

**Tiempo estimado:** 2-3 minutos (50 tickers con rate limiting)

### Paso 4: Verificar archivos generados

```bash
ls -lh shares_outstanding_polygon_*.csv
ls -lh shares_insert_*.sql
ls -lh shares_errors_*.csv  # Si hay errores
```

---

## 📊 Archivos Generados

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `shares_outstanding_polygon_YYYYMMDD_HHMMSS.csv` | CSV con shares outstanding | **Cargar a BigQuery** |
| `shares_insert_YYYYMMDD_HHMMSS.sql` | SQL INSERT directo | Alternativa SQL |
| `shares_errors_YYYYMMDD_HHMMSS.csv` | Errores (si aplica) | Debugging |
| `shares_outstanding_polygon_SAMPLE.csv` | **Muestra de formato** | Referencia |

---

## 📤 Cargar Datos a BigQuery

### Opción 1: CSV Upload (RECOMENDADO)

1. **Ir a BigQuery Console**
   - Dataset: `sunny-advantage-471523-b3.IS_Fundamentales`
   - Tabla: `shares_outstanding_manual`

2. **Cargar CSV**
   - Click "+" → "Upload"
   - Select file: `shares_outstanding_polygon_YYYYMMDD_HHMMSS.csv`
   - Format: CSV
   - Schema: **Auto-detect**
   - Write preference: **Append to table**

3. **Ejecutar**

### Opción 2: SQL INSERT Directo

```bash
# Copiar contenido de shares_insert_*.sql
# Ejecutar en BigQuery Console
```

### Opción 3: bq CLI

```bash
bq load \
  --source_format=CSV \
  --skip_leading_rows=1 \
  sunny-advantage-471523-b3:IS_Fundamentales.shares_outstanding_manual \
  shares_outstanding_polygon_YYYYMMDD_HHMMSS.csv \
  ticker:STRING,shares_outstanding:INTEGER,shares_source:STRING,polygon_response_date:DATE,last_updated:TIMESTAMP,notes:STRING
```

---

## ✅ Validar Carga

```sql
-- Total registros por fuente
SELECT
  shares_source,
  COUNT(*) as count,
  MIN(polygon_response_date) as first_date,
  MAX(polygon_response_date) as last_date
FROM `sunny-advantage-471523-b3.IS_Fundamentales.shares_outstanding_manual`
GROUP BY shares_source
ORDER BY count DESC;

-- Verificar tickers específicos
SELECT
  ticker,
  shares_outstanding,
  shares_source,
  polygon_response_date
FROM `sunny-advantage-471523-b3.IS_Fundamentales.shares_outstanding_manual`
WHERE ticker IN ('GOOGL', 'TSLA', 'NVDA', 'BRK.B')
ORDER BY ticker;

-- Top 10 shares outstanding
SELECT
  ticker,
  shares_outstanding,
  shares_source
FROM `sunny-advantage-471523-b3.IS_Fundamentales.shares_outstanding_manual`
ORDER BY shares_outstanding DESC
LIMIT 10;
```

---

## 🎯 Tickers Objetivo (50)

```python
['GOOGL', 'GOOG', 'BRK.B', 'TSLA', 'TSM', 'V', 'WMT', 'JPM', 'MA', 'LLY',
 'UNH', 'XOM', 'JNJ', 'NVDA', 'PG', 'HD', 'CVX', 'ABBV', 'MRK', 'COST',
 'BAC', 'KO', 'PEP', 'AVGO', 'TMO', 'MCD', 'CSCO', 'ABT', 'ACN', 'DHR',
 'TXN', 'NKE', 'VZ', 'ADBE', 'WFC', 'CRM', 'NEE', 'LIN', 'PM', 'UPS',
 'RTX', 'HON', 'QCOM', 'MS', 'AMGN', 'LOW', 'UNP', 'BA', 'IBM', 'SPGI']
```

---

## 📝 Schema de Tabla

```sql
CREATE TABLE `sunny-advantage-471523-b3.IS_Fundamentales.shares_outstanding_manual` (
  ticker STRING NOT NULL,
  shares_outstanding INT64 NOT NULL,
  shares_source STRING,  -- 'weighted' o 'share_class'
  polygon_response_date DATE,
  last_updated TIMESTAMP,
  notes STRING
);
```

---

## 🔧 Configuración del Script

### API Key

Cambiar en `download_shares_polygon.py` línea 10:

```python
API_KEY = "TU_API_KEY_AQUI"
```

### Rate Limiting

- **Límite:** 5 llamadas por minuto (plan free)
- **Delay:** 12 segundos cada 5 tickers
- **Total:** ~2-3 minutos para 50 tickers

### Reintentos

- **429 Rate Limit:** Pausa 60s y reintenta
- **Otros errores:** Registra en `shares_errors_*.csv`

---

## 📊 Output Esperado

```
================================================================================
DESCARGA SHARES OUTSTANDING - POLYGON.IO
================================================================================
Tickers a procesar: 50
Fecha: 2025-12-04 14:41:46

[1/50] Procesando GOOGL... ✅ 12,198,500,000 (weighted)
[2/50] Procesando GOOG... ✅ 12,198,500,000 (weighted)
[3/50] Procesando BRK.B... ✅ 2,100,000,000 (share_class)
[4/50] Procesando TSLA... ✅ 3,178,919,364 (weighted)
[5/50] Procesando TSM... ✅ 25,894,855,095 (weighted)

... pausa 12s (rate limiting)

[6/50] Procesando V... ✅ 1,950,000,000 (weighted)
...

================================================================================
RESUMEN
================================================================================
Total procesados:  50
Exitosos:          48 (96.0%)
Fallidos:          2 (4.0%)

Archivos generados:
  - shares_outstanding_polygon_20251204_144146.csv (para BigQuery)
  - shares_insert_20251204_144146.sql (SQL directo)
  - shares_errors_20251204_144146.csv (errores)
================================================================================
```

---

## 🐛 Troubleshooting

### Error: `No module named 'requests'`

```bash
pip install requests
```

### Error: `403 Forbidden` / `Proxy Error`

- ✅ **Ejecutar en máquina local** (NO en sandbox)
- Verificar firewall/proxy corporativo
- Probar con otra red (WiFi, 4G)

### Error: `429 Too Many Requests`

- El script incluye manejo automático
- Espera 60s y reintenta
- Si persiste: aumentar delay en línea 92

### Error: `No shares fields in response`

- Algunos tickers pueden no tener datos
- Revisar `shares_errors_*.csv`
- Buscar manualmente en Polygon.io web

---

## 📚 Documentación Polygon.io

- **Endpoint:** `GET /v3/reference/tickers/{ticker}`
- **Docs:** https://polygon.io/docs/stocks/get_v3_reference_tickers__ticker
- **Campos:**
  - `weighted_shares_outstanding` (preferido)
  - `share_class_shares_outstanding` (fallback)

---

## 🔗 Enlaces Útiles

- **Repositorio:** https://github.com/obacc/signalssheets
- **Branch:** `claude/polygon-shares-outstanding-019yLN1asZt9tzGxNfMcP5UF`
- **BigQuery Console:** https://console.cloud.google.com/bigquery?project=sunny-advantage-471523-b3
- **Polygon.io Dashboard:** https://polygon.io/dashboard

---

## 📧 Soporte

Si encuentras problemas:

1. Verificar `shares_errors_*.csv`
2. Revisar logs del script
3. Probar con 1-2 tickers primero (modificar línea 14)
4. Verificar API key en Polygon.io dashboard

---

## ✅ Checklist de Ejecución

- [ ] Script descargado/clonado
- [ ] Dependencias instaladas (`pip install requests`)
- [ ] API key configurada (opcional, ya está en el script)
- [ ] Script ejecutado localmente (`python3 download_shares_polygon.py`)
- [ ] Archivos CSV/SQL generados
- [ ] CSV cargado a BigQuery
- [ ] Validación ejecutada (queries arriba)
- [ ] Tickers verificados en tabla `shares_outstanding_manual`

---

**🎉 ¡Listo! Los shares outstanding estarán disponibles en BigQuery para análisis.**

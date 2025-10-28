# BigQuery Integration for Claude Code

Esta documentación describe cómo Claude Code está conectado a BigQuery y cómo usar las utilidades disponibles.

## Estado de la Conexión

✅ **Claude Code está conectado exitosamente a BigQuery**

- **Project ID**: `sunny-advantage-471523-b3`
- **Service Account**: `claudecode-939@sunny-advantage-471523-b3.iam.gserviceaccount.com`
- **Credenciales**: `.config/gcp/credentials.json` (seguras, en .gitignore)
- **Librería instalada**: `google-cloud-bigquery` v3.38.0

## Datasets Disponibles

### 1. `analytics` (58 tablas)
Contiene configuraciones, señales consolidadas, y métricas de Trinity:
- `trinity_scores_v2` - Scores Trinity por ticker (1,780 registros)
- `trinity_components_v2` - Componentes del score Trinity
- `signals_combined_v2` - Señales combinadas (16,173 registros)
- `sector_map_v6r2` - Mapeo de sectores (8,113 registros)

### 2. `market_data` (89 tablas) - **PRINCIPAL**
Datos de mercado, precios, y señales en tiempo real:
- `Prices` - Precios históricos (22.3M registros, 1.8GB)
- `us_stocks_history` - Histórico de acciones US (27.1M registros, 2.3GB)
- `signals_eod_current_filtered` - Señales filtradas actuales (4,034 registros)
- `market_regime_current` - Régimen de mercado actual
- `liquidity_daily` - Datos de liquidez diaria (35,756 registros)
- `top10_by_profile_daily` - Top 10 por perfil de inversión
- `top500` - Top 500 señales (500 registros)

### 3. `sec_fundamentals` (22 tablas)
Datos fundamentales de SEC:
- `numbers` - Datos numéricos de reportes SEC (38.9M registros, 4.5GB)
- `submissions` - Submissions de SEC (153,495 registros)
- `tags` - Tags de taxonomía XBRL (1.8M registros)
- `ref_cik_ticker` - Mapeo CIK a ticker (46,512 registros)

### 4. `cloudflare_logs` (1 tabla)
Logs de Cloudflare

### 5. `staging_market_data` (3 tablas)
Datos staging para ingestión

## Scripts Disponibles

### 1. `bigquery_utils.py` - Utilidad Principal
Módulo de Python con funciones helper para BigQuery.

**Uso básico:**
```python
from bigquery_utils import BigQueryClient

# Inicializar cliente
bq = BigQueryClient()

# Ejecutar una consulta SQL
results = bq.query("SELECT * FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered` LIMIT 10")

# Ver información de una tabla
info = bq.get_table_info('market_data', 'Prices')
print(f"Tabla tiene {info['num_rows']:,} filas")

# Preview de datos
preview = bq.preview_table('market_data', 'market_regime_current', limit=5)
```

**Funciones de conveniencia:**
```python
from bigquery_utils import (
    BigQueryClient,
    get_latest_signals,
    get_trinity_scores,
    get_market_regime,
    get_top_signals,
    search_ticker
)

bq = BigQueryClient()

# Obtener últimas señales
signals = get_latest_signals(bq, limit=100)

# Obtener scores Trinity
scores = get_trinity_scores(bq)
ticker_score = get_trinity_scores(bq, ticker='AAPL.US')

# Obtener régimen de mercado actual
regime = get_market_regime(bq)
print(f"Régimen actual: {regime['regime']}")

# Obtener top 10 por perfil
top_balanced = get_top_signals(bq, profile='balanceado')
top_aggressive = get_top_signals(bq, profile='agresivo')

# Buscar datos de un ticker
aapl_data = search_ticker(bq, 'AAPL.US')
```

### 2. `test_bigquery_connection.py` - Test de Conexión
Script para verificar la conexión y listar todos los datasets/tablas.

**Ejecutar:**
```bash
python3 test_bigquery_connection.py
```

### 3. `check_schemas.py` - Verificar Schemas
Script para inspeccionar schemas de tablas específicas.

**Ejecutar:**
```bash
python3 check_schemas.py
```

## Ejemplos de Consultas SQL

### Obtener señales de compra recientes
```python
bq = BigQueryClient()

sql = """
SELECT ticker, fecha, signal, strength, close_price
FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered`
WHERE signal = 'BUY'
  AND strength > 0.7
ORDER BY strength DESC
LIMIT 20
"""

buy_signals = bq.query(sql)
```

### Analizar precios históricos
```python
sql = """
SELECT
    ticker,
    fecha,
    close,
    vol as volume,
    (close - LAG(close) OVER (PARTITION BY ticker ORDER BY fecha)) / LAG(close) OVER (PARTITION BY ticker ORDER BY fecha) * 100 as daily_return
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE ticker = 'AAPL.US'
  AND fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
ORDER BY fecha DESC
"""

price_analysis = bq.query(sql)
```

### Obtener top Trinity scores con sector
```python
sql = """
SELECT
    t.ticker,
    t.trinity_score,
    t.growth_score,
    t.value_score,
    s.sector
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_v2` t
LEFT JOIN `sunny-advantage-471523-b3.analytics.sector_map_v6r2` s
  ON t.ticker = s.ticker
ORDER BY t.trinity_score DESC
LIMIT 50
"""

top_trinity = bq.query(sql)
```

## Estructura de Datos Principal

### Tabla: `signals_eod_current_filtered`
Señales de trading filtradas por liquidez:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `ticker` | STRING | Símbolo del ticker |
| `fecha` | DATE | Fecha de la señal |
| `signal` | STRING | Tipo de señal (BUY, SELL, NONE) |
| `strength` | FLOAT | Fuerza de la señal (0-1) |
| `close_price` | FLOAT | Precio de cierre |
| `sma_20` | FLOAT | Media móvil simple 20 días |
| `sma_50` | FLOAT | Media móvil simple 50 días |
| `rsi_14` | FLOAT | RSI de 14 días |
| `addv20` | FLOAT | Volumen diario promedio 20 días |
| `addv60` | FLOAT | Volumen diario promedio 60 días |
| `pass_liquidity` | BOOLEAN | Pasa filtros de liquidez |
| `computed_at` | TIMESTAMP | Timestamp de cálculo |

### Tabla: `trinity_scores_v2`
Scores del método Trinity:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `run_date` | DATE | Fecha de cálculo |
| `ticker` | STRING | Símbolo del ticker |
| `growth_score` | FLOAT | Score de crecimiento (O'Neill) |
| `value_score` | FLOAT | Score de valor (Graham) |
| `trinity_score` | FLOAT | Score combinado Trinity |

### Tabla: `market_regime_current`
Régimen de mercado actual:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `as_of_date` | DATE | Fecha del régimen |
| `regime` | STRING | Régimen (BULL, BEAR, NEUTRAL) |
| `vix_close` | FLOAT | VIX de cierre |
| `hy_oas` | FLOAT | High Yield OAS |
| `spx_above_200d` | FLOAT | % SPX sobre MA 200d |
| `breadth_200d` | FLOAT | Amplitud de mercado |

## Casos de Uso para Claude Code

### 1. Desarrollo de Features
```python
# Integrar señales de BigQuery en el frontend
from bigquery_utils import BigQueryClient, get_latest_signals

bq = BigQueryClient()
signals = get_latest_signals(bq, limit=500)

# Transformar para el frontend
frontend_signals = [{
    'ticker': s['ticker'],
    'date': str(s['fecha']),
    'signal': s['signal'],
    'strength': s['strength'],
    'price': s['close_price']
} for s in signals]
```

### 2. Auditoría de Datos
```python
# Verificar integridad de datos
sql = """
SELECT
    COUNT(*) as total_signals,
    COUNT(DISTINCT ticker) as unique_tickers,
    MAX(fecha) as last_update,
    AVG(strength) as avg_strength
FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered`
"""

audit = bq.query(sql)[0]
print(f"Auditoría: {audit}")
```

### 3. Mantenimiento
```python
# Monitorear freshness de datos
sql = """
SELECT
    'signals' as table_name,
    MAX(fecha) as last_date,
    DATE_DIFF(CURRENT_DATE(), MAX(fecha), DAY) as days_old
FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered`
"""

freshness = bq.query(sql)[0]
if freshness['days_old'] > 1:
    print(f"⚠️  Datos desactualizados: {freshness['days_old']} días")
```

### 4. Testing
```python
# Validar que datos cumplan reglas de negocio
sql = """
SELECT *
FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered`
WHERE strength < 0 OR strength > 1  -- Strength debe estar entre 0 y 1
   OR signal NOT IN ('BUY', 'SELL', 'NONE')  -- Signal debe ser válido
"""

invalid_data = bq.query(sql)
assert len(invalid_data) == 0, f"Encontrados {len(invalid_data)} registros inválidos"
```

## Seguridad

- ✅ Credenciales almacenadas en `.config/gcp/credentials.json`
- ✅ Archivo agregado a `.gitignore` para no subir a git
- ✅ Service account con permisos de solo lectura (recomendado)
- ✅ Conexión encriptada TLS/SSL por defecto

## Límites y Costos

- **BigQuery Queries**: Primeros 1TB/mes gratis, luego $6.25/TB
- **Storage**: Primeros 10GB gratis, luego $0.02/GB/mes
- **Streaming inserts**: $0.01 por 200MB

**Recomendaciones:**
- Usar `LIMIT` en queries de exploración
- Usar `execute_dry_run()` para estimar costos antes de queries grandes
- Aprovechar las vistas (`v_*`) que ya están optimizadas

## Soporte

Para problemas con la conexión a BigQuery:

1. Verificar credenciales: `ls -la .config/gcp/credentials.json`
2. Probar conexión: `python3 test_bigquery_connection.py`
3. Ver schemas: `python3 check_schemas.py`
4. Consultar logs de error en el output del script

---

**Última actualización**: 2025-10-28
**Estado**: ✅ Operacional

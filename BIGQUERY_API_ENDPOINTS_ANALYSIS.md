# SignalSheets BigQuery Analysis - API Endpoints Implementation
**Date:** 2025-10-28
**Project:** SignalSheets EOD Trading Signals
**Objective:** Build 4 REST API endpoints (FREE tier) using BigQuery data

---

## 📊 RESUMEN EJECUTIVO

### Cobertura de Datos

| Métrica | Valor |
|---------|-------|
| **Campos disponibles** | 65% |
| **Campos calculables** | 25% |
| **Campos faltantes (críticos)** | 10% |
| **Complejidad estimada** | **MEDIA** (2-3 semanas) |

### Principales Hallazgos

✅ **BUENAS NOTICIAS:**
- ✅ **Señales EOD disponibles**: 4,034 señales en `signals_eod_current_filtered` (última fecha: 2025-10-10)
- ✅ **Trinity Scores calculados**: 1,780 tickers en `trinity_scores_v2` (fecha: 2025-10-16)
  - growth_score (O'Neil) ✅
  - value_score (Graham) ✅
  - trinity_score combinado ✅
- ✅ **Precios actualizados**: 22.3M registros, última fecha 2025-10-24
- ✅ **Company names**: 50K+ mappings en `sec_fundamentals.ref_cik_ticker`
- ✅ **Sectores mapeados**: 8,113 tickers en `sector_map_v6r2`
- ✅ **Market regime**: Régimen actual en `market_regime_current` (NEUTRAL, 2025-10-10)
- ✅ **Breadth indicator**: `breadth_200d` = 40% (similar a SMA50 breadth)

⚠️ **GAPS CRÍTICOS:**
- ❌ **Lynch score individual**: NO existe separado (solo growth_score genérico)
- ❌ **Price targets**: NO calculados (necesita algoritmo)
- ❌ **Stop loss**: NO calculados (necesita algoritmo)
- ❌ **Win rate histórico**: Tabla `backtest_results` VACÍA (0 rows)
- ❌ **Avg return 30d**: NO hay tracking de performance
- ❌ **Dominant author**: Necesita derivarse de scores

🔧 **DATOS DESACTUALIZADOS:**
- ⚠️ Top10 y Top500: Fecha 2025-09-05 (45+ días old)
- ⚠️ ETF prices: Última fecha 2025-09-05
- ⚠️ Signals: Última fecha 2025-10-10 (18 días old)

---

## 🗺️ MATRIZ DE MAPEO COMPLETA

### ENDPOINT 1: GET /api/free/signals (TOP 5)

| Campo Requerido | Disponible | Tabla BigQuery | Campo BigQuery | Transformación | Prioridad |
|----------------|-----------|----------------|----------------|----------------|-----------|
| **ticker** | ✅ YES | `market_data.signals_eod_current_filtered` | `ticker` | Remove .US suffix | **CRÍTICO** |
| **company_name** | ✅ YES | `sec_fundamentals.ref_cik_ticker` | `name` | JOIN on ticker | **CRÍTICO** |
| **sector** | ✅ YES | `analytics.sector_map_v6r2` | `sector` | JOIN on ticker_canon | **CRÍTICO** |
| **signal** | ✅ YES | `market_data.signals_eod_current_filtered` | `signal` | Map to BUY/HOLD/SELL | **CRÍTICO** |
| **trinity_score** | ✅ YES | `analytics.trinity_scores_v2` | `trinity_score` | * 100 (0-1 → 0-100) | **CRÍTICO** |
| **price_current** | ✅ YES | `market_data.signals_eod_current_filtered` | `close_price` | Ninguna | **CRÍTICO** |
| **price_target** | ❌ NO | - | - | **CALCULAR**: price * (1 + potential_return) | **ALTO** |
| **price_stop_loss** | ❌ NO | - | - | **CALCULAR**: price * (1 - risk_pct) | **ALTO** |
| **potential_return** | ❌ NO | - | - | **CALCULAR**: (strength / 100) * 0.30 | **ALTO** |
| **signal_date** | ✅ YES | `market_data.signals_eod_current_filtered` | `fecha` | Ninguna | **CRÍTICO** |
| **updated_at** | ✅ YES | `market_data.signals_eod_current_filtered` | `computed_at` | Ninguna | **CRÍTICO** |
| **lynch_score** | ⚠️ PARCIAL | `analytics.trinity_scores_v2` | `growth_score` | * 100, asignar a Lynch | OPCIONAL |
| **oneil_score** | ⚠️ PARCIAL | `analytics.trinity_scores_v2` | `growth_score` | * 100, asignar a O'Neil | OPCIONAL |
| **graham_score** | ✅ YES | `analytics.trinity_scores_v2` | `value_score` | * 100 | OPCIONAL |
| **price_tp1** | ❌ NO | - | - | **CALCULAR**: price * 1.10 | OPCIONAL |
| **price_tp2** | ❌ NO | - | - | **CALCULAR**: price * 1.20 | OPCIONAL |
| **risk_reward_ratio** | ❌ NO | - | - | **CALCULAR**: (target-price)/(price-stop) | OPCIONAL |
| **author_dominant** | ❌ NO | - | - | **CALCULAR**: MAX(lynch, oneil, graham) | OPCIONAL |

**Cobertura:** 7/11 obligatorios ✅ (64%) | 4/11 calculables ⚠️ (36%)

---

### ENDPOINT 2: GET /api/free/context

| Campo Requerido | Disponible | Tabla BigQuery | Campo BigQuery | Transformación | Prioridad |
|----------------|-----------|----------------|----------------|----------------|-----------|
| **market_regime** | ✅ YES | `market_data.market_regime_current` | `regime` | Lowercase: NEUTRAL→neutral | **CRÍTICO** |
| **breadth_pct_above_sma50** | ✅ YES | `market_data.market_regime_current` | `breadth_200d` | Usar como proxy | **CRÍTICO** |
| **signals_total_count** | ✅ YES | `market_data.signals_eod_current_filtered` | COUNT(*) | Ninguna | **CRÍTICO** |
| **signals_buy_count** | ✅ YES | `market_data.signals_eod_current_filtered` | COUNT WHERE signal='BUY' | Ninguna | **CRÍTICO** |
| **win_rate_30d** | ❌ NO | - | - | **NECESITA** backtest data | **CRÍTICO** |
| **avg_return_30d** | ❌ NO | - | - | **NECESITA** backtest data | **CRÍTICO** |
| **context_date** | ✅ YES | `market_data.market_regime_current` | `as_of_date` | Ninguna | **CRÍTICO** |
| **updated_at** | ✅ YES | `market_data.market_regime_current` | `created_ts` | Ninguna | **CRÍTICO** |
| **regime_confidence** | ⚠️ DERIVABLE | `market_data.market_regime_current` | `addv_agg_pctile` | Normalize 0-1 | OPCIONAL |
| **breadth_pct_above_sma200** | ✅ YES | `market_data.market_regime_current` | `spx_above_200d` | Ninguna | OPCIONAL |
| **signals_hold_count** | ✅ YES | `market_data.signals_eod_current_filtered` | COUNT WHERE signal='NONE' | Map NONE→HOLD | OPCIONAL |
| **signals_sell_count** | ❌ NO | - | - | NOTA: No hay SELL signals | OPCIONAL |

**Cobertura:** 6/8 obligatorios ✅ (75%) | 2/8 FALTANTES ❌ (25% CRÍTICO)

**⚠️ PROBLEMA CRÍTICO:** No hay datos de win_rate ni avg_return. Opciones:
1. Usar valores dummy (0.60, 0.08) hasta implementar backtesting
2. Calcular on-the-fly con historical signals (complejo, lento)
3. Crear scheduled query para pre-calcular

---

### ENDPOINT 3: GET /api/free/prices (20-30 tickers)

| Campo Requerido | Disponible | Tabla BigQuery | Campo BigQuery | Transformación | Prioridad |
|----------------|-----------|----------------|----------------|----------------|-----------|
| **ticker** | ✅ YES | `market_data.Prices` | `ticker` | Remove .US suffix | **CRÍTICO** |
| **price_current** | ✅ YES | `market_data.Prices` | `close` | Latest fecha | **CRÍTICO** |
| **price_change_pct** | ⚠️ CALCULAR | `market_data.Prices` | - | (close_today - close_yesterday) / close_yesterday | **CRÍTICO** |
| **price_date** | ✅ YES | `market_data.Prices` | `fecha` | Latest | **CRÍTICO** |
| **updated_at** | ✅ YES | `market_data.Prices` | `updated_ts` or `carga_ts` | Ninguna | **CRÍTICO** |
| **price_change** | ⚠️ CALCULAR | `market_data.Prices` | - | close_today - close_yesterday | OPCIONAL |
| **volume** | ✅ YES | `market_data.Prices` | `vol` | Ninguna | OPCIONAL |

**Cobertura:** 4/5 obligatorios ✅ (80%) | 1/5 calculable ⚠️ (20%)

**NOTA:** Prices table tiene datos hasta 2025-10-24 (muy actualizado!)

---

### ENDPOINT 4: GET /api/free/etfs (3 tickers fijos)

| Campo Requerido | Disponible | Tabla BigQuery | Campo BigQuery | Transformación | Prioridad |
|----------------|-----------|----------------|----------------|----------------|-----------|
| **ticker** | ✅ YES | `market_data.Prices` | `ticker` | Filter: SPY.US, QQQ.US, DIA.US | **CRÍTICO** |
| **name** | ⚠️ HARDCODE | - | - | Hardcode: {"SPY.US": "S&P 500", ...} | **CRÍTICO** |
| **price_current** | ✅ YES | `market_data.Prices` | `close` | Latest fecha | **CRÍTICO** |
| **price_change_pct** | ⚠️ CALCULAR | `market_data.Prices` | - | (close_today - close_yesterday) / close_yesterday | **CRÍTICO** |
| **updated_at** | ✅ YES | `market_data.Prices` | `updated_ts` or `carga_ts` | Ninguna | **CRÍTICO** |

**Cobertura:** 3/5 obligatorios ✅ (60%) | 2/5 calculables ⚠️ (40%)

**⚠️ PROBLEMA:** ETF prices solo hasta 2025-09-05 (45 días old). Stocks están actualizados.

---

## 💾 EXPLORACIÓN DE TABLAS BIGQUERY

### Tablas Relevantes Identificadas

#### 1. `market_data.signals_eod_current_filtered`
**Propósito:** Señales de trading filtradas por liquidez (PRINCIPAL)
**Filas:** 4,034 señales
**Última actualización:** 2025-10-14
**Última fecha de datos:** 2025-10-10

**Schema:**
```
ticker          STRING   - Ticker con .US suffix (ej: "AAPL.US")
fecha           DATE     - Fecha de la señal
signal          STRING   - "BUY" o "NONE" (no hay "SELL")
strength        FLOAT    - 0-100 (fuerza de la señal)
close_price     FLOAT    - Precio de cierre
sma_20          FLOAT    - Media móvil 20 días
sma_50          FLOAT    - Media móvil 50 días
rsi_14          FLOAT    - RSI 14 días
addv20          FLOAT    - Avg dollar volume 20d
addv60          FLOAT    - Avg dollar volume 60d
pass_liquidity  BOOLEAN  - Pasa filtros de liquidez
computed_at     TIMESTAMP - Timestamp de cálculo
```

**Distribución de señales:**
- BUY: 635 (15.7%)
- NONE: 3,399 (84.3%)
- SELL: 0 (0%)

**Sample TOP 3 BUY signals:**
```sql
BW.US    - strength: 100.0, price: $3.23,   fecha: 2025-10-10
JAZZ.US  - strength: 100.0, price: $135.43, fecha: 2025-10-10
INVZ.US  - strength: 100.0, price: $2.09,   fecha: 2025-10-10
```

---

#### 2. `analytics.trinity_scores_v2`
**Propósito:** Scores del Trinity Method pre-calculados
**Filas:** 1,780 tickers
**Última actualización:** 2025-10-16
**Última fecha de datos:** 2025-10-16 (solo 1 fecha)

**Schema:**
```
run_date        DATE   - Fecha del cálculo
ticker          STRING - Ticker SIN .US suffix (ej: "AAPL")
growth_score    FLOAT  - 0-1 (O'Neil + Lynch combinados?)
value_score     FLOAT  - 0-1 (Graham)
trinity_score   FLOAT  - 0-1 (Score combinado)
```

**TOP 5 Trinity Scores:**
```sql
KRFGD: 0.4704 (growth: 0.392, value: 0.588)
KRFG:  0.4704 (growth: 0.392, value: 0.588)
ASII:  0.4596 (growth: 0.376, value: 0.585)
TRPRF: 0.4440 (growth: 0.368, value: 0.558)
TCENF: 0.4440 (growth: 0.368, value: 0.558)
```

**⚠️ NOTA IMPORTANTE:**
- Los tickers en esta tabla NO tienen el sufijo .US
- Necesitas hacer JOIN quitando .US del ticker de signals

---

#### 3. `analytics.sector_map_v6r2`
**Propósito:** Mapeo ticker → sector
**Filas:** 8,113 tickers
**Schema:**
```
ticker_canon    STRING - Ticker sin .US (ej: "AAPL")
sector          STRING - Sector (ej: "TECHNOLOGY")
```

**Sectores disponibles:** CONSTRUCTION, TECHNOLOGY, HEALTHCARE, FINANCE, etc.

---

#### 4. `sec_fundamentals.ref_cik_ticker`
**Propósito:** Mapeo ticker → company name (desde SEC)
**Filas:** 50,149 registros (versionado por fecha)
**Schema:**
```
cik             INTEGER - CIK number
ticker          STRING  - Ticker sin .US (ej: "AAPL")
name            STRING  - Company name (ej: "Apple Inc.")
exchange        STRING  - Exchange (puede ser NULL)
valid_from      DATE    - Fecha inicio validez
valid_to        DATE    - Fecha fin validez (NULL = vigente)
source_file     STRING  - Source file path
```

**Ejemplo:**
```sql
ticker: GOOGL, name: "Alphabet Inc.", valid_from: 2025-10-29, valid_to: NULL
ticker: NVDA,  name: "NVIDIA CORP",   valid_from: 2025-10-04, valid_to: NULL
```

**⚠️ IMPORTANTE:** Usar `valid_to IS NULL` para obtener el nombre vigente

---

#### 5. `market_data.market_regime_current`
**Propósito:** Estado actual del mercado
**Filas:** 1 (snapshot actual)
**Última fecha:** 2025-10-10

**Schema:**
```
as_of_date      DATE      - Fecha del régimen
regime          STRING    - "NEUTRAL", "BULL", "BEAR"
flags           STRING    - Flags adicionales
vix_close       FLOAT     - VIX de cierre (18.5)
hy_oas          FLOAT     - High Yield OAS (0.035)
spx_above_200d  FLOAT     - % S&P500 sobre MA200 (0.40)
breadth_200d    FLOAT     - Breadth 200d (0.40)
addv_agg_pctile FLOAT     - Percentil de volumen (45.0)
rule_version    STRING    - Versión de reglas (v1.0)
created_ts      TIMESTAMP - Timestamp creación
```

**Valores actuales:**
```
regime: NEUTRAL
breadth_200d: 40.03% (usar como proxy de breadth_pct_above_sma50)
```

---

#### 6. `market_data.Prices`
**Propósito:** Precios históricos OHLCV
**Filas:** 22,385,109 registros
**Última fecha:** 2025-10-24 (MUY ACTUALIZADO!)
**Tickers únicos:** 12,123

**Schema:**
```
origen      STRING    - Fuente de datos
ticker      STRING    - Ticker con .US (ej: "AAPL.US")
fecha       DATE      - Fecha
open        FLOAT     - Apertura
high        FLOAT     - Máximo
low         FLOAT     - Mínimo
close       FLOAT     - Cierre
vol         INTEGER   - Volumen
openint     INTEGER   - Open interest
carga_ts    TIMESTAMP - Load timestamp
updated_ts  TIMESTAMP - Update timestamp
```

**Sample (2025-10-24):**
```sql
AAPL.US:  close: $262.82, vol: 38.2M
NVDA.US:  close: $186.20, vol: 130.9M
TSLA.US:  close: $433.62, vol: 94.4M
MSFT.US:  close: $523.55, vol: 15.5M
GOOGL.US: close: $259.92, vol: 28.6M
```

**⚠️ PROBLEMA ETFs:** SPY, QQQ, DIA solo hasta 2025-09-05 (45 días old)

---

#### 7. `market_data.top10_by_profile_daily`
**Propósito:** Top 10 señales por perfil de riesgo
**Filas:** 30 (10 por perfil x 3 perfiles)
**Última fecha:** 2025-09-05 (DESACTUALIZADO)

**Schema:**
```
as_of_date      DATE   - Fecha
profile         STRING - "Aggressive", "Balanced", "Conservative"
rank            INTEGER - Ranking 1-10
ticker          STRING - Ticker con .US
composite_score FLOAT  - Score compuesto
created_ts      TIMESTAMP
```

**⚠️ NO USAR:** Datos de septiembre, muy desactualizados

---

#### 8. `market_data.top500`
**Propósito:** Universo top 500 por liquidez/capitalización
**Filas:** 500
**Última fecha:** 2025-09-05 (DESACTUALIZADO)

**TOP 5:**
```sql
1. SPY.US   (ETF S&P 500)
2. NVDA.US
3. TSLA.US
4. QQQ.US   (ETF Nasdaq)
5. AAPL.US
```

---

## 🔧 QUERIES SQL OPTIMIZADAS

### QUERY 1: GET /api/free/signals (TOP 5)

```sql
-- Query optimizada para obtener TOP 5 señales del día
-- Performance: < 2 segundos (filtros + joins eficientes)
-- Retorna: 5 registros máximo

WITH latest_signals AS (
  -- Obtener última fecha con señales
  SELECT MAX(fecha) as max_date
  FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered`
),
top_buy_signals AS (
  -- Filtrar solo BUY signals de la última fecha
  SELECT
    s.ticker,
    s.fecha as signal_date,
    s.signal,
    s.strength,
    s.close_price as price_current,
    s.computed_at as updated_at,
    -- Calcular campos faltantes
    ROUND(s.strength * 0.30, 2) as potential_return_pct,  -- 30% max return basado en strength
    ROUND(s.close_price * (1 + (s.strength * 0.30 / 100)), 2) as price_target,
    ROUND(s.close_price * (1 - 0.08), 2) as price_stop_loss,  -- 8% stop loss estándar
    ROUND(s.close_price * 1.10, 2) as price_tp1,  -- Take profit 1: +10%
    ROUND(s.close_price * 1.20, 2) as price_tp2   -- Take profit 2: +20%
  FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered` s
  CROSS JOIN latest_signals ls
  WHERE s.fecha = ls.max_date
    AND s.signal = 'BUY'
    AND s.pass_liquidity = TRUE
  ORDER BY s.strength DESC, s.close_price DESC
  LIMIT 5
),
enriched_signals AS (
  -- Agregar trinity scores, sector, company name
  SELECT
    REPLACE(tbs.ticker, '.US', '') as ticker,  -- Remove .US suffix
    cik.name as company_name,
    sector.sector,
    tbs.signal,
    CAST(COALESCE(ts.trinity_score, 0) * 100 AS INT64) as trinity_score,
    tbs.price_current,
    tbs.price_target,
    tbs.price_stop_loss,
    tbs.potential_return_pct as potential_return,
    tbs.signal_date,
    tbs.updated_at,
    -- Scores individuales (opcionales)
    CAST(COALESCE(ts.growth_score, 0) * 100 AS INT64) as oneil_score,  -- growth_score → O'Neil
    CAST(COALESCE(ts.value_score, 0) * 100 AS INT64) as graham_score,
    CAST(COALESCE(ts.growth_score, 0) * 100 AS INT64) as lynch_score,   -- Usar growth como Lynch (proxy)
    tbs.price_tp1,
    tbs.price_tp2,
    -- Risk/reward ratio
    ROUND(
      (tbs.price_target - tbs.price_current) / (tbs.price_current - tbs.price_stop_loss),
      2
    ) as risk_reward_ratio,
    -- Dominant author
    CASE
      WHEN COALESCE(ts.growth_score, 0) > COALESCE(ts.value_score, 0) THEN "O'Neil"
      ELSE 'Graham'
    END as author_dominant
  FROM top_buy_signals tbs
  -- JOIN trinity scores (LEFT porque puede no existir)
  LEFT JOIN `sunny-advantage-471523-b3.analytics.trinity_scores_v2` ts
    ON REPLACE(tbs.ticker, '.US', '') = ts.ticker
  -- JOIN sector mapping (LEFT porque puede no existir)
  LEFT JOIN `sunny-advantage-471523-b3.analytics.sector_map_v6r2` sector
    ON REPLACE(tbs.ticker, '.US', '') = sector.ticker_canon
  -- JOIN company name (LEFT porque puede no existir)
  LEFT JOIN (
    SELECT DISTINCT ON (ticker) ticker, name
    FROM `sunny-advantage-471523-b3.sec_fundamentals.ref_cik_ticker`
    WHERE valid_to IS NULL
  ) cik
    ON REPLACE(tbs.ticker, '.US', '') = cik.ticker
)
SELECT * FROM enriched_signals
ORDER BY trinity_score DESC, potential_return DESC
LIMIT 5;
```

**Output esperado:**
```json
[
  {
    "ticker": "JAZZ",
    "company_name": "Jazz Pharmaceuticals plc",
    "sector": "HEALTHCARE",
    "signal": "BUY",
    "trinity_score": 47,
    "price_current": 135.43,
    "price_target": 176.06,
    "price_stop_loss": 124.60,
    "potential_return": 30.0,
    "signal_date": "2025-10-10",
    "updated_at": "2025-10-14T03:58:35.812947Z",
    "oneil_score": 45,
    "graham_score": 50,
    "lynch_score": 45,
    "price_tp1": 148.97,
    "price_tp2": 162.52,
    "risk_reward_ratio": 3.75,
    "author_dominant": "Graham"
  }
]
```

**Notas de implementación:**
1. ✅ Usa fecha más reciente automáticamente
2. ✅ Filtra solo BUY signals con liquidez
3. ✅ Ordena por trinity_score + potential_return
4. ⚠️ **Ajustar fórmulas** de target/stop loss según tu estrategia
5. ⚠️ **Validar** que strength esté en escala 0-100 (parece que sí)

---

### QUERY 2: GET /api/free/context

```sql
-- Query para obtener contexto del mercado
-- Performance: < 1 segundo (tablas pequeñas)
-- Retorna: 1 registro

WITH signal_stats AS (
  -- Contar señales por tipo
  SELECT
    COUNT(*) as signals_total_count,
    COUNTIF(signal = 'BUY') as signals_buy_count,
    COUNTIF(signal = 'NONE') as signals_hold_count,
    0 as signals_sell_count,  -- No hay SELL signals
    MAX(fecha) as latest_signal_date
  FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered`
),
market_context AS (
  -- Obtener régimen de mercado actual
  SELECT
    LOWER(regime) as market_regime,  -- NEUTRAL → neutral
    breadth_200d as breadth_pct_above_sma50,  -- Usar breadth_200d como proxy
    spx_above_200d as breadth_pct_above_sma200,
    addv_agg_pctile / 100 as regime_confidence,  -- Normalizar 0-1
    as_of_date as context_date,
    created_ts as updated_at
  FROM `sunny-advantage-471523-b3.market_data.market_regime_current`
  ORDER BY as_of_date DESC
  LIMIT 1
)
SELECT
  mc.*,
  ss.signals_total_count,
  ss.signals_buy_count,
  ss.signals_hold_count,
  ss.signals_sell_count,
  -- ⚠️ CAMPOS FALTANTES: usar valores dummy hasta implementar backtesting
  0.60 as win_rate_30d,      -- TODO: Calcular con backtest_results
  0.08 as avg_return_30d     -- TODO: Calcular con backtest_results
FROM market_context mc
CROSS JOIN signal_stats ss;
```

**Output esperado:**
```json
{
  "market_regime": "neutral",
  "breadth_pct_above_sma50": 0.40,
  "signals_total_count": 4034,
  "signals_buy_count": 635,
  "win_rate_30d": 0.60,
  "avg_return_30d": 0.08,
  "context_date": "2025-10-10",
  "updated_at": "2025-10-15T21:37:29.313696Z",
  "regime_confidence": 0.45,
  "breadth_pct_above_sma200": 0.40,
  "signals_hold_count": 3399,
  "signals_sell_count": 0
}
```

**⚠️ ACCIÓN REQUERIDA:**
- `win_rate_30d` y `avg_return_30d` están hardcoded como 0.60 y 0.08
- **Opción 1:** Mantener valores dummy hasta tener backtest data
- **Opción 2:** Calcular on-the-fly (complejo, ver sección "Roadmap")
- **Opción 3:** Scheduled query para pre-calcular (recomendado)

---

### QUERY 3: GET /api/free/prices (20-30 tickers)

```sql
-- Query para obtener precios actuales de watchlist
-- Performance: < 1 segundo (índice en fecha + ticker)
-- Input: Lista de tickers (TOP 5 signals + populares fijos)
-- Retorna: ~20-30 registros

WITH watchlist_tickers AS (
  -- TOP 5 señales + tickers populares fijos
  SELECT ticker FROM (
    -- TOP 5 BUY signals
    SELECT DISTINCT ticker
    FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered`
    WHERE signal = 'BUY'
      AND fecha = (SELECT MAX(fecha) FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered`)
    ORDER BY strength DESC
    LIMIT 5
  )
  UNION ALL
  -- Tickers populares fijos (15-20 tickers)
  SELECT ticker FROM UNNEST([
    'AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US',
    'TSLA.US', 'META.US', 'BRK.B.US', 'JPM.US', 'V.US',
    'UNH.US', 'XOM.US', 'JNJ.US', 'WMT.US', 'PG.US',
    'MA.US', 'HD.US', 'CVX.US', 'MRK.US', 'ABBV.US'
  ]) as ticker
),
latest_prices AS (
  -- Obtener precios más recientes (hoy y ayer)
  SELECT
    ticker,
    fecha as price_date,
    close as price_current,
    vol as volume,
    updated_ts as updated_at,
    LAG(close) OVER (PARTITION BY ticker ORDER BY fecha) as prev_close
  FROM `sunny-advantage-471523-b3.market_data.Prices`
  WHERE ticker IN (SELECT ticker FROM watchlist_tickers)
    AND fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)  -- Últimos 7 días
  QUALIFY ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY fecha DESC) <= 2
)
SELECT
  REPLACE(ticker, '.US', '') as ticker,
  price_current,
  ROUND((price_current - prev_close) / prev_close, 4) as price_change_pct,
  ROUND(price_current - prev_close, 2) as price_change,
  price_date,
  volume,
  updated_at
FROM latest_prices
WHERE price_date = (SELECT MAX(price_date) FROM latest_prices WHERE ticker = latest_prices.ticker)
ORDER BY ticker;
```

**Output esperado:**
```json
[
  {
    "ticker": "AAPL",
    "price_current": 262.82,
    "price_change_pct": 0.0125,
    "price_change": 3.24,
    "price_date": "2025-10-24",
    "volume": 38213515,
    "updated_at": "2025-10-25T07:00:44.664Z"
  },
  {
    "ticker": "NVDA",
    "price_current": 186.20,
    "price_change_pct": 0.0222,
    "price_change": 4.04,
    "price_date": "2025-10-24",
    "volume": 130913572,
    "updated_at": "2025-10-25T07:00:44.664Z"
  }
]
```

**Notas:**
- ✅ Calcula price_change_pct usando LAG window function
- ✅ Incluye TOP 5 signals dinámicamente
- ✅ 15-20 tickers populares hardcodeados
- ⚠️ **Ajustar lista de tickers populares** según tu preferencia

---

### QUERY 4: GET /api/free/etfs (3 ETFs fijos)

```sql
-- Query para obtener precios de índices principales
-- Performance: < 1 segundo (3 tickers, índice en fecha)
-- Retorna: 3 registros (SPY, QQQ, DIA)

WITH etf_prices AS (
  SELECT
    ticker,
    fecha as price_date,
    close as price_current,
    updated_ts as updated_at,
    LAG(close) OVER (PARTITION BY ticker ORDER BY fecha) as prev_close
  FROM `sunny-advantage-471523-b3.market_data.Prices`
  WHERE ticker IN ('SPY.US', 'QQQ.US', 'DIA.US')
    AND fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  QUALIFY ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY fecha DESC) <= 2
),
latest_etfs AS (
  SELECT
    REPLACE(ticker, '.US', '') as ticker,
    CASE ticker
      WHEN 'SPY.US' THEN 'S&P 500 ETF'
      WHEN 'QQQ.US' THEN 'Nasdaq 100 ETF'
      WHEN 'DIA.US' THEN 'Dow Jones ETF'
    END as name,
    price_current,
    ROUND((price_current - prev_close) / prev_close, 4) as price_change_pct,
    price_date,
    updated_at
  FROM etf_prices
  WHERE price_date = (SELECT MAX(price_date) FROM etf_prices WHERE ticker = etf_prices.ticker)
)
SELECT * FROM latest_etfs
ORDER BY ticker;
```

**Output esperado:**
```json
[
  {
    "ticker": "DIA",
    "name": "Dow Jones ETF",
    "price_current": 454.99,
    "price_change_pct": -0.0045,
    "updated_at": "2025-09-06T07:00:00Z"
  },
  {
    "ticker": "QQQ",
    "name": "Nasdaq 100 ETF",
    "price_current": 576.06,
    "price_change_pct": 0.0014,
    "updated_at": "2025-09-06T07:00:00Z"
  },
  {
    "ticker": "SPY",
    "name": "S&P 500 ETF",
    "price_current": 647.24,
    "price_change_pct": -0.0029,
    "updated_at": "2025-09-06T07:00:00Z"
  }
]
```

**⚠️ PROBLEMA:** ETF prices solo hasta 2025-09-05 (45 días old)
**⚠️ ACCIÓN:** Verificar por qué los ETFs no se están actualizando

---

## 🚨 GAPS CRÍTICOS IDENTIFICADOS

### 1. **Win Rate & Avg Return NO DISPONIBLES** 🔴

**Problema:**
- Tabla `analytics.backtest_results` existe pero está **VACÍA** (0 rows)
- No hay tracking de performance de señales históricas
- Campos `win_rate_30d` y `avg_return_30d` son **CRÍTICOS** para endpoint /context

**Opciones:**

**Opción A: Valores Dummy (QUICK WIN)** ⭐ RECOMENDADO para MVP
```sql
0.60 as win_rate_30d,   -- 60% win rate (dummy)
0.08 as avg_return_30d  -- 8% avg return (dummy)
```
- Tiempo: 0 horas
- Funcional para MVP
- Reemplazar cuando haya backtest data

**Opción B: Calcular On-the-Fly (COMPLEJO)**
```sql
-- Pseudocódigo (complejo, lento > 5 segundos)
WITH historical_signals AS (
  SELECT ticker, signal_date, close_price
  FROM signals_historical  -- Necesitas esta tabla
),
future_returns AS (
  SELECT
    hs.ticker,
    (p_future.close - hs.close_price) / hs.close_price as return_pct
  FROM historical_signals hs
  JOIN prices p_future
    ON hs.ticker = p_future.ticker
    AND p_future.fecha = DATE_ADD(hs.signal_date, INTERVAL 30 DAY)
)
SELECT
  AVG(CASE WHEN return_pct > 0 THEN 1 ELSE 0 END) as win_rate,
  AVG(return_pct) as avg_return
FROM future_returns
WHERE signal_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
```
- Tiempo: 8-12 horas desarrollo + testing
- Performance: 5-10 segundos (LENTO)
- No recomendado para FREE tier

**Opción C: Scheduled Query Pre-calculada** ⭐ RECOMENDADO para producción
```sql
-- Crear tabla derivada actualizada diariamente
CREATE OR REPLACE TABLE `market_data.performance_metrics_30d` AS
WITH signal_performance AS (
  -- Calcular performance de cada señal (ejecutar 1x por día)
  ...
)
SELECT
  CURRENT_DATE() as as_of_date,
  AVG(win) as win_rate_30d,
  AVG(return_pct) as avg_return_30d,
  CURRENT_TIMESTAMP() as updated_at
FROM signal_performance;

-- Query en endpoint sería simplemente:
SELECT * FROM `market_data.performance_metrics_30d` LIMIT 1;
```
- Tiempo: 6-8 horas desarrollo inicial
- Performance: <500ms (RÁPIDO)
- Recomendado para producción
- Requiere configurar Cloud Scheduler

**DECISIÓN RECOMENDADA:**
1. **Fase 1 (MVP):** Opción A - Usar dummies
2. **Fase 2 (Producción):** Opción C - Scheduled query

---

### 2. **Price Targets & Stop Loss NO CALCULADOS** 🟡

**Problema:**
- No existen en BigQuery
- Son **NECESARIOS** para endpoint /signals

**Solución:**

**Algoritmo Simple (recomendado para MVP):**
```sql
-- Basado en strength de la señal
price_target    = price * (1 + (strength * 0.003))  -- Max 30% si strength=100
price_stop_loss = price * (1 - 0.08)                -- 8% stop loss estándar
```

**Algoritmo Avanzado (opcional para producción):**
```sql
-- Basado en volatilidad (ATR) + resistance levels
price_target    = price + (ATR_14 * 3)              -- 3x ATR
price_stop_loss = price - (ATR_14 * 1.5)            -- 1.5x ATR

-- Necesitas calcular ATR_14 primero:
ATR_14 = AVG(high - low) OVER (PARTITION BY ticker ORDER BY fecha ROWS BETWEEN 13 PRECEDING AND CURRENT ROW)
```

**Estimación:**
- Simple: Ya incluido en queries (0 horas adicionales)
- Avanzado: 4-6 horas (calcular ATR, resistance levels)

---

### 3. **ETF Prices Desactualizados** 🟠

**Problema:**
- SPY, QQQ, DIA solo hasta 2025-09-05 (45 días old)
- Stocks están actualizados hasta 2025-10-24

**Causa probable:**
- Pipeline de carga diferente para ETFs vs stocks
- ETFs no se están actualizando

**Solución:**
1. **Verificar pipeline de carga** de ETFs
2. **Actualizar manualmente** mientras se arregla
3. **Fallback:** Usar última fecha disponible (ya en query)

**Estimación:** 2-4 horas (debugging + fix pipeline)

---

### 4. **Top10 y Top500 Desactualizados** 🟡

**Problema:**
- Última fecha: 2025-09-05 (45+ días old)
- No son críticos para FREE tier pero afectan calidad

**Solución:**
- NO usar estas tablas para endpoint /signals
- Generar TOP 5 directamente desde `signals_eod_current_filtered` (ya en query)
- Actualizar scheduled queries de Top10/Top500 (separado)

---

## 📅 ROADMAP DE IMPLEMENTACIÓN

### 🚀 FASE 1: QUICK WINS (Semana 1) - MVP

**Objetivo:** Endpoints funcionales con datos existentes

#### Día 1-2: Endpoint /signals
- [x] Exploración BigQuery ✅
- [ ] Implementar Query 1 (TOP 5 signals)
- [ ] Mapear campos disponibles
- [ ] Usar fórmulas simples para target/stop loss
- [ ] Testing con datos reales

**Deliverables:**
- Endpoint retorna 5 señales
- Campos obligatorios completos (con cálculos simples)

#### Día 3: Endpoint /context
- [ ] Implementar Query 2 (market context)
- [ ] **Usar valores dummy** para win_rate y avg_return
- [ ] Mapear breadth_200d → breadth_pct_above_sma50
- [ ] Testing

**Deliverables:**
- Endpoint retorna contexto de mercado
- ⚠️ Win rate y avg return hardcoded (temporal)

#### Día 4: Endpoints /prices y /etfs
- [ ] Implementar Query 3 (prices)
- [ ] Implementar Query 4 (ETFs)
- [ ] Calcular price_change_pct con LAG()
- [ ] Testing

**Deliverables:**
- Ambos endpoints funcionales
- ⚠️ ETFs con datos de septiembre (aceptable para MVP)

#### Día 5: Integration & Testing
- [ ] Integrar 4 endpoints en Cloudflare Workers
- [ ] End-to-end testing
- [ ] Performance testing (< 2 segundos)
- [ ] Documentación API

**Resultado Fase 1:**
✅ 4 endpoints funcionales
✅ Datos reales de BigQuery
⚠️ Win rate dummy (aceptable para MVP)
⚠️ ETFs algo desactualizados (no crítico)

---

### 🔧 FASE 2: CAMPOS CALCULADOS (Semana 2)

**Objetivo:** Mejorar calidad de datos con cálculos avanzados

#### Tarea 2.1: Price Targets & Stop Loss Avanzados (8 horas)
- [ ] Implementar cálculo de ATR (Average True Range)
- [ ] Calcular resistance/support levels
- [ ] Fórmula mejorada para price_target basada en volatilidad
- [ ] Fórmula mejorada para stop_loss basada en ATR

**SQL Example:**
```sql
WITH atr_calculation AS (
  SELECT
    ticker,
    fecha,
    AVG(high - low) OVER (
      PARTITION BY ticker
      ORDER BY fecha
      ROWS BETWEEN 13 PRECEDING AND CURRENT ROW
    ) as atr_14
  FROM `market_data.Prices`
)
SELECT
  s.ticker,
  s.close_price,
  s.close_price + (atr.atr_14 * 3) as price_target,
  s.close_price - (atr.atr_14 * 1.5) as price_stop_loss
FROM signals s
JOIN atr_calculation atr ON s.ticker = atr.ticker AND s.fecha = atr.fecha
```

#### Tarea 2.2: Separar Lynch/O'Neil/Graham Scores (4 horas)
**Problema:** Solo hay `growth_score` y `value_score`, no hay scores individuales

**Solución:**
```sql
-- Aproximación (ajustar ponderación según tu criterio)
lynch_score  = growth_score * 0.5 + value_score * 0.5  -- Balance growth/value
oneil_score  = growth_score * 1.0                      -- Pure momentum
graham_score = value_score * 1.0                       -- Pure value
```

**O mejor:** Modificar el pipeline de cálculo de Trinity scores para generar 3 scores separados

---

### 📊 FASE 3: PERFORMANCE TRACKING (Semana 3)

**Objetivo:** Implementar win_rate y avg_return reales

#### Tarea 3.1: Crear Tabla de Historical Signals (4 horas)
```sql
CREATE OR REPLACE TABLE `market_data.signals_historical` AS
SELECT
  ticker,
  fecha as signal_date,
  signal,
  strength,
  close_price as entry_price
FROM `market_data.signals_eod_current_filtered`
-- Agregar datos históricos si existen
UNION ALL
SELECT * FROM `analytics.signals_combined_v2`  -- Si tiene formato compatible
ORDER BY signal_date DESC;
```

#### Tarea 3.2: Calcular Performance Metrics (8 horas)
```sql
CREATE OR REPLACE TABLE `market_data.performance_metrics_30d` AS
WITH signal_returns AS (
  SELECT
    sh.ticker,
    sh.signal_date,
    sh.entry_price,
    p_exit.close as exit_price,
    (p_exit.close - sh.entry_price) / sh.entry_price as return_pct,
    CASE
      WHEN p_exit.close > sh.entry_price THEN 1
      ELSE 0
    END as is_win
  FROM `market_data.signals_historical` sh
  JOIN `market_data.Prices` p_exit
    ON sh.ticker = p_exit.ticker
    AND p_exit.fecha = DATE_ADD(sh.signal_date, INTERVAL 30 DAY)
  WHERE sh.signal = 'BUY'
    AND sh.signal_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
)
SELECT
  CURRENT_DATE() as as_of_date,
  AVG(is_win) as win_rate_30d,
  AVG(return_pct) as avg_return_30d,
  COUNT(*) as sample_size,
  CURRENT_TIMESTAMP() as updated_at
FROM signal_returns;
```

#### Tarea 3.3: Scheduled Query en Cloud Scheduler (2 horas)
- [ ] Configurar Cloud Scheduler
- [ ] Ejecutar query diariamente a las 5:00 PM EST (después del cierre)
- [ ] Alertas si falla
- [ ] Monitoring de costo

**Cron expression:** `0 22 * * 1-5` (10 PM UTC, Mon-Fri)

---

### 🔄 FASE 4: OPTIMIZACIÓN & MONITORING (Semana 4)

#### Tarea 4.1: Performance Optimization (4 horas)
- [ ] Crear índices en tablas grandes
- [ ] Particionar tabla `Prices` por fecha (si no está ya)
- [ ] Materializar queries complejos
- [ ] Cache en Cloudflare Workers (5 minutos)

#### Tarea 4.2: Data Quality Monitoring (4 horas)
- [ ] Alertas si datos > 2 días old
- [ ] Alertas si < 5 señales BUY disponibles
- [ ] Validación de cálculos (sanity checks)
- [ ] Dashboard de métricas

#### Tarea 4.3: Fix ETF Pipeline (4 horas)
- [ ] Investigar por qué ETFs no se actualizan
- [ ] Actualizar pipeline de carga
- [ ] Backfill datos faltantes (Sep-Oct)
- [ ] Testing

---

## 🎯 RECOMENDACIONES

### 1. **Arquitectura de Datos**

#### Crear Vista Materializada para Signals (RECOMENDADO)
```sql
CREATE MATERIALIZED VIEW `market_data.signals_enriched_mv` AS
SELECT
  s.ticker,
  s.fecha as signal_date,
  s.signal,
  s.strength,
  s.close_price,
  ts.trinity_score,
  ts.growth_score,
  ts.value_score,
  sector.sector,
  cik.name as company_name
FROM `market_data.signals_eod_current_filtered` s
LEFT JOIN `analytics.trinity_scores_v2` ts
  ON REPLACE(s.ticker, '.US', '') = ts.ticker
LEFT JOIN `analytics.sector_map_v6r2` sector
  ON REPLACE(s.ticker, '.US', '') = sector.ticker_canon
LEFT JOIN (
  SELECT DISTINCT ON (ticker) ticker, name
  FROM `sec_fundamentals.ref_cik_ticker`
  WHERE valid_to IS NULL
) cik ON REPLACE(s.ticker, '.US', '') = cik.ticker
WHERE s.signal = 'BUY';

-- Refresh: Diariamente a las 5:00 PM EST
```

**Beneficios:**
- Query tiempo: < 500ms (vs 2s)
- Menos JOINs en queries
- Auto-refresh configurablediariamente

**Costo:** ~$0.01 por refresh (muy barato)

---

### 2. **Scheduled Queries Recomendados**

#### Query 1: Performance Metrics (Diario 5:00 PM)
```sql
-- Calcular win_rate y avg_return
-- Ya descrito en Fase 3
```

#### Query 2: Top Signals by Profile (Diario 5:00 PM)
```sql
-- Actualizar top10_by_profile_daily
-- Calcular composite_score actualizado
```

#### Query 3: ETF Data Refresh (Diario 4:30 PM)
```sql
-- Actualizar precios de ETFs si no se están cargando
```

**Configuración Cloud Scheduler:**
```bash
gcloud scheduler jobs create http update-performance-metrics \
  --schedule="0 22 * * 1-5" \
  --uri="https://bigquery.googleapis.com/bigquery/v2/projects/PROJECT_ID/jobs" \
  --http-method=POST \
  --message-body='{"query": "..."}'
```

---

### 3. **Cloudflare Workers Implementation**

```javascript
// workers/api/free/signals.js
export default {
  async fetch(request, env) {
    // 1. Cache response 5 minutes
    const cacheKey = new Request(request.url, request);
    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (response) {
      return response;
    }

    // 2. Query BigQuery
    const bigqueryResponse = await fetch(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT_ID}/queries`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GCP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: SIGNALS_QUERY,  // Query 1 de arriba
          useLegacySql: false
        })
      }
    );

    const data = await bigqueryResponse.json();

    // 3. Transform to API format
    const signals = transformBigQueryResponse(data);

    // 4. Create response with CORS
    response = new Response(JSON.stringify(signals), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',  // 5 min cache
        'Access-Control-Allow-Origin': '*'
      }
    });

    // 5. Store in cache
    await cache.put(cacheKey, response.clone());

    return response;
  }
}
```

**Notas:**
- ✅ Cache de 5 minutos (datos EOD no cambian intraday)
- ✅ CORS habilitado para frontend
- ✅ Rate limiting en Cloudflare Workers (100 req/min gratis)

---

### 4. **Data Quality Checks**

```sql
-- Query para validar calidad de datos (ejecutar diariamente)
SELECT
  'signals' as table_name,
  MAX(fecha) as latest_date,
  DATE_DIFF(CURRENT_DATE(), MAX(fecha), DAY) as days_old,
  COUNT(*) as total_rows,
  COUNTIF(signal = 'BUY') as buy_signals,
  CASE
    WHEN DATE_DIFF(CURRENT_DATE(), MAX(fecha), DAY) > 2 THEN '🔴 STALE DATA'
    WHEN COUNTIF(signal = 'BUY') < 5 THEN '🟡 LOW BUY SIGNALS'
    ELSE '✅ OK'
  END as status
FROM `market_data.signals_eod_current_filtered`

UNION ALL

SELECT
  'trinity_scores',
  MAX(run_date),
  DATE_DIFF(CURRENT_DATE(), MAX(run_date), DAY),
  COUNT(*),
  NULL,
  CASE
    WHEN DATE_DIFF(CURRENT_DATE(), MAX(run_date), DAY) > 7 THEN '🔴 STALE'
    ELSE '✅ OK'
  END
FROM `analytics.trinity_scores_v2`

UNION ALL

SELECT
  'prices',
  MAX(fecha),
  DATE_DIFF(CURRENT_DATE(), MAX(fecha), DAY),
  COUNT(*),
  NULL,
  CASE
    WHEN DATE_DIFF(CURRENT_DATE(), MAX(fecha), DAY) > 1 THEN '🔴 STALE'
    ELSE '✅ OK'
  END
FROM `market_data.Prices`;
```

**Enviar a Slack/email si status != OK**

---

## 📊 RESUMEN DE TABLAS BIGQUERY

### Tablas Usadas (CRÍTICAS)

| Tabla | Filas | Última Fecha | Uso | Status |
|-------|-------|--------------|-----|--------|
| `market_data.signals_eod_current_filtered` | 4,034 | 2025-10-10 | Señales principales | ✅ CRÍTICO |
| `analytics.trinity_scores_v2` | 1,780 | 2025-10-16 | Trinity scores | ✅ CRÍTICO |
| `market_data.Prices` | 22.3M | 2025-10-24 | Precios OHLCV | ✅ CRÍTICO |
| `market_data.market_regime_current` | 1 | 2025-10-10 | Régimen mercado | ✅ CRÍTICO |
| `analytics.sector_map_v6r2` | 8,113 | - | Sectores | ✅ IMPORTANTE |
| `sec_fundamentals.ref_cik_ticker` | 50K | 2025-10-29 | Company names | ✅ IMPORTANTE |

### Tablas NO Usadas (Desactualizadas)

| Tabla | Filas | Última Fecha | Razón |
|-------|-------|--------------|-------|
| `market_data.top10_by_profile_daily` | 30 | 2025-09-05 | ⚠️ Desactualizado (45+ días) |
| `market_data.top500` | 500 | 2025-09-05 | ⚠️ Desactualizado |
| `analytics.backtest_results` | 0 | - | ❌ VACÍA |

---

## 💰 ESTIMACIÓN DE COSTOS BIGQUERY

### Queries por Día (FREE Tier)

| Endpoint | Queries/día | Bytes procesados | Costo/día |
|----------|-------------|------------------|-----------|
| /signals | 100 | 50 MB x 100 = 5 GB | $0.03 |
| /context | 100 | 1 MB x 100 = 100 MB | $0.00 |
| /prices | 50 | 10 MB x 50 = 500 MB | $0.00 |
| /etfs | 50 | 1 MB x 50 = 50 MB | $0.00 |
| **TOTAL** | **300** | **~6 GB** | **~$0.03/día** |

**Costo mensual:** ~$0.90 (MUY BARATO, dentro de free tier de $300/mes)

**Con cache de 5 minutos:**
- Requests reducidas 90%
- Costo: ~$0.003/día = **$0.10/mes**

---

## ⏱️ ESTIMACIÓN DE TIEMPOS

| Fase | Tareas | Tiempo | Prioridad |
|------|--------|--------|-----------|
| **Fase 1: MVP** | 4 endpoints funcionales | 5 días | 🔴 CRÍTICO |
| **Fase 2: Cálculos** | Price targets, scores separados | 3 días | 🟡 IMPORTANTE |
| **Fase 3: Performance** | Win rate, avg return reales | 4 días | 🟡 IMPORTANTE |
| **Fase 4: Optimización** | Performance, monitoring | 3 días | 🟢 NICE-TO-HAVE |
| **TOTAL** | | **15 días** (~3 semanas) | |

**Critical Path:**
- Semana 1: Fase 1 (MVP funcional)
- Semana 2: Fase 2 + inicio Fase 3
- Semana 3: Completar Fase 3 + Fase 4

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Pre-requisitos
- [x] BigQuery connection establecida ✅
- [x] Exploración completa de tablas ✅
- [ ] Cloudflare Workers account setup
- [ ] GCP Service Account con permisos BigQuery
- [ ] Ambiente de desarrollo/staging

### Fase 1 (MVP)
- [ ] Implementar Query 1 (/signals)
- [ ] Implementar Query 2 (/context) con dummies
- [ ] Implementar Query 3 (/prices)
- [ ] Implementar Query 4 (/etfs)
- [ ] Deploy a Cloudflare Workers
- [ ] Testing end-to-end
- [ ] Documentación API

### Fase 2 (Mejoras)
- [ ] Algoritmo avanzado price target/stop loss
- [ ] Separar Lynch/O'Neil/Graham scores
- [ ] Optimizar queries con materialized views
- [ ] Testing de performance

### Fase 3 (Performance Tracking)
- [ ] Crear tabla signals_historical
- [ ] Implementar cálculo de win_rate real
- [ ] Implementar cálculo de avg_return real
- [ ] Scheduled query diaria
- [ ] Reemplazar dummies en /context

### Fase 4 (Producción)
- [ ] Monitoring y alertas
- [ ] Fix ETF pipeline
- [ ] Data quality checks
- [ ] Cache optimization
- [ ] Load testing

---

## 📞 PRÓXIMOS PASOS INMEDIATOS

1. **REVISAR** este análisis completo
2. **APROBAR** queries SQL propuestas
3. **DECIDIR** sobre win_rate/avg_return (dummy vs scheduled query)
4. **IMPLEMENTAR** Fase 1 (MVP) - 5 días
5. **TESTING** con datos reales
6. **DEPLOY** a Cloudflare Workers

**¿Listo para comenzar la implementación?**

---

**Documento generado:** 2025-10-28
**Autor:** Claude Code
**Versión:** 1.0 - Análisis Completo

# BigQuery Database Documentation

**Proyecto:** `sunny-advantage-471523-b3`
**Service Account:** `claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com`
**Fecha de exploración:** 2026-01-15
**Ubicación:** US

---

## Resumen Ejecutivo

El proyecto BigQuery contiene **2 datasets** con un total de **30 tablas** diseñadas para análisis financiero fundamental y señales de inversión basadas en el "Trinity Method".

| Dataset | Descripción | Tablas | Tamaño Total |
|---------|-------------|--------|--------------|
| `IS_Fundamentales` | Datos fundamentales SEC y señales de inversión | 23 | ~26.8 GB |
| `market_data` | Precios históricos de mercado | 7 | ~1.9 GB |

---

## Dataset: IS_Fundamentales

**Descripción:** Fundamentales SEC - Datos raw por quarter (Num, Pre, Sub, Tag)
**Ubicación:** US
**Creado:** 2025-12-02

### Tablas Principales (Core Data)

#### 1. `Num` - SEC EDGAR Numeric Data
| Campo | Tipo | Modo | Descripción |
|-------|------|------|-------------|
| `adsh` | STRING | REQUIRED | Accession Number (ID único de filing) |
| `tag` | STRING | REQUIRED | XBRL tag name |
| `version` | STRING | REQUIRED | Versión del tag |
| `ddate` | INTEGER | REQUIRED | Date of data (YYYYMMDD) |
| `qtrs` | INTEGER | REQUIRED | Número de quarters cubiertos |
| `uom` | STRING | REQUIRED | Unit of measure |
| `segments` | STRING | NULLABLE | Segmento de reporte |
| `coreg` | STRING | NULLABLE | Co-registrant |
| `value` | FLOAT | NULLABLE | Valor numérico |
| `footnote` | STRING | NULLABLE | Notas al pie |
| `filed_date` | DATE | REQUIRED | Fecha de filing |
| `quarter` | STRING | NULLABLE | Quarter (YYYYQN) |

**Estadísticas:**
- Filas: **138,538,865**
- Tamaño: **20,183 MB**

---

#### 2. `Sub` - SEC EDGAR Submissions
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `adsh` | STRING | Accession Number |
| `cik` | INTEGER | Central Index Key |
| `name` | STRING | Company name |
| `sic` | INTEGER | Standard Industrial Classification |
| `form` | STRING | Form type (10-K, 10-Q, etc.) |
| `filed` | INTEGER | Filing date |
| `period` | INTEGER | Period end date |
| `fy` | INTEGER | Fiscal year |
| `fp` | STRING | Fiscal period |
| ... | ... | +28 campos adicionales |

**Estadísticas:**
- Filas: **308,780**
- Tamaño: **103 MB**

---

#### 3. `Pre` - SEC EDGAR Presentation
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `adsh` | STRING | Accession Number |
| `report` | INTEGER | Report number |
| `line` | INTEGER | Line number |
| `stmt` | STRING | Statement type |
| `tag` | STRING | XBRL tag |
| `plabel` | STRING | Presentation label |

**Estadísticas:**
- Filas: **33,129,343**
- Tamaño: **5,257 MB**

---

#### 4. `Tag` - SEC EDGAR Tag Dictionary
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tag` | STRING | Tag name |
| `version` | STRING | Tag version |
| `custom` | INTEGER | Is custom tag |
| `datatype` | STRING | Data type |
| `tlabel` | STRING | Tag label |
| `doc` | STRING | Documentation |

**Estadísticas:**
- Filas: **3,355,974**
- Tamaño: **804 MB**

---

### Tablas Derivadas (Processed Data)

#### 5. `fundamentals_timeseries` - Financial Statements Normalizados
Contiene Income Statement + Balance Sheet + Cash Flow normalizados.

| Categoría | Campos |
|-----------|--------|
| **Identificación** | ticker, cik, company_name, fiscal_year, fiscal_period, period_end_date |
| **Income Statement** | revenues, cost_of_revenue, gross_profit, operating_income, net_income, eps_basic, eps_diluted |
| **Balance Sheet** | assets, current_assets, cash_and_equivalents, liabilities, stockholders_equity |
| **Cash Flow** | operating_cash_flow, investing_cash_flow, financing_cash_flow, capex, free_cash_flow |

**Estadísticas:**
- Filas: **241,343**
- Tamaño: **74 MB**
- Rango de fechas: **2014-07-31** a **2025-08-31**
- Tickers únicos: **6,678**
- CIKs únicos: **5,228**

---

#### 6. `fundamentals_ratios` - Ratios Financieros Calculados
| Categoría | Ratios |
|-----------|--------|
| **Profitability** | gross_margin, operating_margin, net_margin, roe, roa, roic |
| **Liquidity** | current_ratio, quick_ratio, cash_ratio, working_capital |
| **Leverage** | debt_to_equity, debt_to_assets, equity_ratio, interest_coverage |
| **Efficiency** | asset_turnover, inventory_turnover, receivables_turnover, days_sales_outstanding |
| **Cash Flow** | fcf_margin, operating_cf_ratio, cash_flow_to_debt, capex_to_revenue |
| **Growth** | revenue_growth_yoy, net_income_growth_yoy, eps_growth_yoy, fcf_growth_yoy |

**Estadísticas:**
- Filas: **241,342**
- Tamaño: **49 MB**

---

#### 7. `cik_ticker_mapping` - Mapeo CIK-Ticker
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cik` | INTEGER | Central Index Key |
| `ticker` | STRING | Stock ticker |
| `company_name` | STRING | Company name |
| `exchange` | STRING | Stock exchange |
| `sector` | STRING | Business sector |
| `industry` | STRING | Industry classification |
| `sic_code` | INTEGER | SIC code |
| `is_active` | BOOLEAN | Active listing |

**Estadísticas:**
- Filas: **10,175**
- Sectores incluidos: Communication Services, Technology, Healthcare, Financial, etc.

---

### Trinity Method System

#### 8. `trinity_signals_daily` - Señales de Inversión Diarias
Sistema de scoring basado en metodologías de Peter Lynch, William O'Neil y análisis cuantitativo.

| Categoría | Campos |
|-----------|--------|
| **Identificación** | ticker, company_name, sector, industry, signal_date |
| **Precios** | price_current, price_52w_high, price_52w_low, volume_daily |
| **Fundamentales** | eps_ttm, revenues_ttm, net_income_ttm, stockholders_equity |
| **Ratios** | pe_ratio, pb_ratio, ps_ratio, peg_ratio, debt_to_equity |
| **Lynch Score** | lynch_score, lynch_peg_score, lynch_roe_score, lynch_eps_growth_score |
| **O'Neil Score** | oneil_score, oneil_rs_score, oneil_volume_score |
| **Final Score** | trinity_score_weighted, signal_strength |

**Estadísticas:**
- Filas: **6,994**
- Rango de fechas: **2026-01-08** a **2026-01-15**
- Tickers únicos: **3,494**

---

#### 9. `parametros_trinity` - Parámetros Configurables
3 escenarios de inversión con 50 parámetros cada uno:

| Escenario | Descripción |
|-----------|-------------|
| **Conservative** | Menor riesgo, empresas establecidas |
| **Moderate** | Balance riesgo/retorno |
| **Aggressive** | Mayor potencial, mayor riesgo |

**Estadísticas:**
- Filas: **150** (50 params x 3 escenarios)

---

#### 10. `market_regime_daily` - Régimen de Mercado
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `regime_date` | DATE | Fecha |
| `regime_type` | STRING | Tipo de régimen (Bull/Bear/Neutral) |
| `sp500_close` | FLOAT | Cierre S&P 500 |
| `sp500_ytd_change_pct` | FLOAT | Cambio YTD % |
| `vix_close` | FLOAT | Cierre VIX |

**Estadísticas:**
- Filas: **36**

---

### Sistema de API

#### 11. `api_tokens` - Tokens de Acceso API
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `token_id` | STRING | Token único |
| `user_email` | STRING | Email del usuario |
| `plan` | STRING | Plan (FREE, BASIC, BETA) |
| `status` | STRING | Estado (active, expired) |
| `request_count_today` | INTEGER | Requests del día |
| `request_limit_daily` | INTEGER | Límite diario |

**Distribución actual:**
- **beta - active:** 50 tokens
- **free - expired:** 1 token

---

#### 12. `plan_configs` - Configuración de Planes
| Plan | Top Signals | Daily Limit | Trial Days |
|------|-------------|-------------|------------|
| FREE | Limitado | 10 | 0 |
| BASIC | Más | 100 | 7 |
| BETA | Completo | 1000 | 30 |

**Estadísticas:**
- Filas: **3** (3 planes)

---

### Tablas de Backup

| Tabla | Filas | Fecha |
|-------|-------|-------|
| `fundamentals_ratios_BACKUP_20251212` | 241,249 | 2025-12-12 |
| `fundamentals_ratios_BACKUP_PRECOALESCE_20251212` | 241,249 | 2025-12-12 |
| `fundamentals_ratios_BACKUP_PREPERIODFIX_20251212` | 241,249 | 2025-12-12 |
| `fundamentals_timeseries_BACKUP_20251212` | 241,250 | 2025-12-12 |
| `fundamentals_timeseries_BACKUP_EPS_20251205` | 32,796 | 2025-12-05 |
| `fundamentals_timeseries_BACKUP_PREOCFFIX_20251212` | 241,250 | 2025-12-12 |
| `fundamentals_timeseries_BACKUP_PREQTRSFIX_20251213` | 241,343 | 2025-12-14 |

---

## Dataset: market_data

**Descripción:** Datos de precios de mercado
**Ubicación:** US
**Creado:** 2025-09-07

### Tablas Principales

#### 1. `Prices` - Precios Históricos OHLCV
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `origen` | STRING | Fuente de datos |
| `ticker` | STRING | Stock ticker |
| `fecha` | DATE | Fecha |
| `open` | FLOAT | Precio apertura |
| `high` | FLOAT | Precio máximo |
| `low` | FLOAT | Precio mínimo |
| `close` | FLOAT | Precio cierre |
| `vol` | INTEGER | Volumen |

**Estadísticas:**
- Filas: **23,121,002**
- Tamaño: **1,879 MB**
- Rango de fechas: **2010-01-04** a **2026-01-07**
- Tickers únicos: **13,909**

---

#### 2. `ext_polygon_daily` - External Table (Polygon.io)
Tabla externa conectada a Cloud Storage con datos de Polygon.io.

| Campo | Tipo |
|-------|------|
| ticker | STRING |
| date | DATE |
| open, high, low, close | FLOAT |
| volume | INTEGER |
| load_ts | TIMESTAMP |

---

#### 3. `staging_polygon_daily_raw` - Staging Data
Datos de staging de Polygon.io antes de procesamiento.

**Estadísticas:**
- Filas: **92,917**
- Tamaño: **3.6 MB**

---

#### 4. `stooq_ext` - External Table (Stooq)
Tabla externa con datos históricos de Stooq.

---

### Views

#### `stg_prices_polygon_raw`
Vista de staging para datos de Polygon.

#### `v_ticker_norm`
Vista de normalización de tickers.

| Campo | Descripción |
|-------|-------------|
| ticker | Ticker original |
| ticker_norm | Ticker normalizado |

---

#### `audit_runs` - Auditoría de Jobs
| Campo | Tipo | Descripción |
|-------|------|-------------|
| job_name | STRING | Nombre del job |
| shard_date | DATE | Fecha del shard |
| stage | STRING | Etapa |
| state | STRING | Estado |
| rows_written | INTEGER | Filas escritas |

---

## Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                      IS_Fundamentales                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │   Sub    │    │   Num    │    │   Pre    │    │   Tag    │  │
│  │ (adsh)   │───▶│ (adsh,   │───▶│ (adsh,   │    │ (tag,    │  │
│  │          │    │  tag)    │    │  tag)    │◀───│  version)│  │
│  └────┬─────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │                                                         │
│       │ (cik)                                                   │
│       ▼                                                         │
│  ┌─────────────────────┐                                        │
│  │  cik_ticker_mapping │                                        │
│  │ (cik ←→ ticker)     │                                        │
│  └──────────┬──────────┘                                        │
│             │                                                   │
│             │ (ticker)                                          │
│             ▼                                                   │
│  ┌─────────────────────────┐    ┌──────────────────────────┐   │
│  │ fundamentals_timeseries │───▶│   fundamentals_ratios    │   │
│  │ (normalized financials) │    │ (calculated ratios)      │   │
│  └──────────┬──────────────┘    └──────────────────────────┘   │
│             │                                                   │
│             │ (ticker)                                          │
│             ▼                                                   │
│  ┌─────────────────────────┐    ┌──────────────────────────┐   │
│  │  trinity_signals_daily  │◀───│   parametros_trinity     │   │
│  │  (investment signals)   │    │ (scoring parameters)     │   │
│  └─────────────────────────┘    └──────────────────────────┘   │
│             ▲                                                   │
│             │                                                   │
│  ┌──────────┴──────────┐                                        │
│  │  market_regime_daily │                                       │
│  │ (market conditions)  │                                       │
│  └─────────────────────┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        market_data                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                        Prices                             │   │
│  │              (historical OHLCV data)                      │   │
│  │                    ▲         ▲                            │   │
│  │                    │         │                            │   │
│  │          ┌─────────┴─┐     ┌─┴─────────┐                  │   │
│  │          │ stooq_ext │     │ext_polygon│                  │   │
│  │          │ (external)│     │  (external)│                 │   │
│  │          └───────────┘     └───────────┘                  │   │
│  │                                   ▲                       │   │
│  │                                   │                       │   │
│  │                    ┌──────────────┴─────────────┐         │   │
│  │                    │ staging_polygon_daily_raw  │         │   │
│  │                    └────────────────────────────┘         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Conexión Cross-Dataset

```
market_data.Prices.ticker ←→ IS_Fundamentales.cik_ticker_mapping.ticker
                          ←→ IS_Fundamentales.fundamentals_timeseries.ticker
                          ←→ IS_Fundamentales.trinity_signals_daily.ticker
```

---

## Volumen de Datos Total

| Métrica | Valor |
|---------|-------|
| **Total de filas** | ~198M+ |
| **Total de tamaño** | ~28.7 GB |
| **Datasets** | 2 |
| **Tablas** | 30 |
| **Empresas (CIKs)** | 5,228 |
| **Tickers** | 13,909 |
| **Rango temporal (precios)** | 2010 - 2026 |
| **Rango temporal (fundamentales)** | 2014 - 2025 |

---

## Notas de Configuración

### Credenciales
El archivo de credenciales del service account debe configurarse como:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/bigquery-service-account.json"
```

### Conexión Python
```python
from google.cloud import bigquery
client = bigquery.Client()
```

### Queries de Ejemplo

**Obtener señales del día:**
```sql
SELECT ticker, company_name, trinity_score_weighted, signal_strength
FROM IS_Fundamentales.trinity_signals_daily
WHERE signal_date = CURRENT_DATE()
ORDER BY trinity_score_weighted DESC
LIMIT 10;
```

**Obtener fundamentales de una empresa:**
```sql
SELECT *
FROM IS_Fundamentales.fundamentals_timeseries
WHERE ticker = 'AAPL'
ORDER BY period_end_date DESC;
```

**Precios históricos:**
```sql
SELECT fecha, open, high, low, close, vol
FROM market_data.Prices
WHERE ticker = 'AAPL'
AND fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)
ORDER BY fecha DESC;
```

---

*Documentación generada automáticamente el 2026-01-15*

-- ============================================================================
-- TRINITY METHOD CORE - PASO 2: trinity_signals_daily
-- Tabla de señales diarias generadas por Trinity Method
-- ============================================================================

-- DROP IF EXISTS
DROP TABLE IF EXISTS `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`;

-- CREATE TABLE
CREATE TABLE `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
(
  -- =========================================================================
  -- IDENTIFICATION (6 columns)
  -- =========================================================================
  ticker STRING NOT NULL,
  ticker_norm STRING,                    -- Ticker normalizado (sin .US)
  company_name STRING,
  sector STRING,
  industry STRING,
  signal_date DATE NOT NULL,             -- PARTITION KEY

  -- =========================================================================
  -- PRICE DATA (6 columns)
  -- =========================================================================
  price_current FLOAT64,
  price_52w_high FLOAT64,
  price_52w_low FLOAT64,
  volume_daily INT64,
  volume_avg_50d FLOAT64,
  market_cap FLOAT64,

  -- =========================================================================
  -- FUNDAMENTALS TTM (7 columns)
  -- =========================================================================
  eps_ttm FLOAT64,
  revenues_ttm FLOAT64,
  net_income_ttm FLOAT64,
  stockholders_equity FLOAT64,
  current_assets FLOAT64,
  current_liabilities FLOAT64,
  long_term_debt FLOAT64,

  -- =========================================================================
  -- STATIC RATIOS from fundamentals_ratios (5 columns)
  -- =========================================================================
  roe FLOAT64,
  current_ratio FLOAT64,
  revenue_growth_yoy FLOAT64,
  eps_growth_yoy FLOAT64,
  net_income_growth_yoy FLOAT64,

  -- =========================================================================
  -- DYNAMIC RATIOS - calculated with current price (5 columns)
  -- =========================================================================
  pe_ratio FLOAT64,
  pb_ratio FLOAT64,
  ps_ratio FLOAT64,
  peg_ratio FLOAT64,
  debt_to_equity FLOAT64,

  -- =========================================================================
  -- LYNCH SCORES (5 columns)
  -- =========================================================================
  lynch_score FLOAT64,
  lynch_peg_score FLOAT64,
  lynch_roe_score FLOAT64,
  lynch_eps_growth_score FLOAT64,
  lynch_revenue_growth_score FLOAT64,

  -- =========================================================================
  -- ONEIL SCORES (5 columns)
  -- =========================================================================
  oneil_score FLOAT64,
  oneil_rs_score FLOAT64,
  oneil_volume_score FLOAT64,
  oneil_momentum_score FLOAT64,
  oneil_eps_accel_score FLOAT64,

  -- =========================================================================
  -- GRAHAM SCORES (5 columns)
  -- =========================================================================
  graham_score FLOAT64,
  graham_pb_score FLOAT64,
  graham_current_ratio_score FLOAT64,
  graham_debt_score FLOAT64,
  graham_stability_score FLOAT64,

  -- =========================================================================
  -- TRINITY SCORE (1 column)
  -- =========================================================================
  trinity_score FLOAT64,

  -- =========================================================================
  -- SIGNALS (7 columns)
  -- =========================================================================
  signal_strength STRING,                -- STRONG BUY, BUY, HOLD, SELL
  recommendation STRING,                 -- Detailed recommendation text
  confidence_level FLOAT64,              -- 0-100 based on data completeness
  entry_price FLOAT64,                   -- Suggested entry price
  stop_loss FLOAT64,                     -- Suggested stop loss (7% below entry)
  target_price FLOAT64,                  -- Suggested target (20% above entry)
  risk_reward_ratio FLOAT64,             -- (target - entry) / (entry - stop_loss)

  -- =========================================================================
  -- METADATA (6 columns)
  -- =========================================================================
  ranking_position INT64,                -- Daily ranking by trinity_score
  percentile_rank FLOAT64,               -- Percentile rank (0-100)
  data_quality_score FLOAT64,            -- From fundamentals_timeseries
  has_complete_data BOOL,                -- All required fields present
  calculation_timestamp TIMESTAMP,       -- When the signal was calculated
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY signal_date
CLUSTER BY ticker, trinity_score
OPTIONS(
  description='Señales diarias generadas por Trinity Method - particionado por fecha',
  partition_expiration_days=7,
  require_partition_filter=false
);

-- ============================================================================
-- INDEXES/VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for latest signals only
CREATE OR REPLACE VIEW `sunny-advantage-471523-b3.IS_Fundamentales.v_trinity_signals_latest` AS
SELECT *
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_date = (
  SELECT MAX(signal_date)
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
);

-- View for BUY signals only
CREATE OR REPLACE VIEW `sunny-advantage-471523-b3.IS_Fundamentales.v_trinity_buy_signals` AS
SELECT *
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_strength IN ('STRONG BUY', 'BUY')
  AND signal_date = (
    SELECT MAX(signal_date)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
  )
ORDER BY trinity_score DESC;

-- View for TOP 50 daily signals
CREATE OR REPLACE VIEW `sunny-advantage-471523-b3.IS_Fundamentales.v_trinity_top50` AS
SELECT *
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_date = (
  SELECT MAX(signal_date)
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
)
ORDER BY trinity_score DESC
LIMIT 50;

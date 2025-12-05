-- ============================================================================
-- MARKET REGIME DAILY TABLE
-- Tracks daily market conditions for Trinity Method threshold adjustments
-- Dataset: sunny-advantage-471523-b3.IS_Fundamentales
-- ============================================================================

CREATE TABLE IF NOT EXISTS `sunny-advantage-471523-b3.IS_Fundamentales.market_regime_daily` (
  regime_date DATE NOT NULL,
  regime_type STRING NOT NULL,  -- BULL | NEUTRAL | CORRECTION | BEAR
  sp500_close FLOAT64,
  sp500_ytd_start FLOAT64,
  sp500_ytd_change_pct FLOAT64,
  vix_close FLOAT64,
  calculation_method STRING,  -- 'SP500_YTD' or 'MANUAL'
  data_source STRING,  -- 'Yahoo Finance'
  notes STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY regime_date
CLUSTER BY regime_type
OPTIONS(
  description='Daily Market Regime calculation for Trinity Method threshold adjustments',
  partition_expiration_days=NULL  -- Keep all history
);

-- ============================================================================
-- REGIME CLASSIFICATION RULES:
-- ============================================================================
-- S&P 500 YTD Change:
--   >= +20%     : BULL        (Strong bull market)
--   >= +10%     : NEUTRAL     (Moderate positive)
--   >= -10%     : NEUTRAL     (Sideways/consolidation)
--   >= -20%     : CORRECTION  (Market correction)
--   <  -20%     : BEAR        (Bear market)
-- ============================================================================

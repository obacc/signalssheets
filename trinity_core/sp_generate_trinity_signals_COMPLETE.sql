-- ============================================================================
-- SP_GENERATE_TRINITY_SIGNALS - Stored Procedure Completo
-- Genera señales diarias usando Trinity Method (Lynch + O'Neil + Graham)
-- Dataset: sunny-advantage-471523-b3.IS_Fundamentales
-- Autor: Claude Code
-- Fecha: 2025-12-05
-- ============================================================================

CREATE OR REPLACE PROCEDURE `sunny-advantage-471523-b3.IS_Fundamentales.sp_generate_trinity_signals`(
  IN execution_date DATE
)
BEGIN
  -- ========================================================================
  -- PASO 1: DECLARE VARIABLES
  -- ========================================================================
  DECLARE v_scenario STRING DEFAULT 'Moderate';
  DECLARE v_execution_ts TIMESTAMP;
  DECLARE v_rows_processed INT64 DEFAULT 0;
  DECLARE v_rows_inserted INT64 DEFAULT 0;

  -- Lynch Parameters
  DECLARE p_lynch_weight FLOAT64;
  DECLARE p_lynch_peg_max FLOAT64;
  DECLARE p_lynch_eps_growth_min FLOAT64;
  DECLARE p_lynch_roe_min FLOAT64;

  -- O'Neil Parameters
  DECLARE p_oneil_weight FLOAT64;
  DECLARE p_oneil_rs_min FLOAT64;
  DECLARE p_oneil_eps_accel_min FLOAT64;
  DECLARE p_oneil_volume_surge FLOAT64;

  -- Graham Parameters
  DECLARE p_graham_weight FLOAT64;
  DECLARE p_graham_pe_max FLOAT64;
  DECLARE p_graham_pb_max FLOAT64;
  DECLARE p_graham_current_ratio_min FLOAT64;
  DECLARE p_graham_debt_equity_max FLOAT64;

  -- Universe Filters
  DECLARE p_min_market_cap FLOAT64;
  DECLARE p_min_volume FLOAT64;
  DECLARE p_min_price FLOAT64;
  DECLARE p_min_data_quality FLOAT64;

  -- Signal Thresholds
  DECLARE p_strong_buy_threshold FLOAT64;
  DECLARE p_buy_threshold FLOAT64;
  DECLARE p_hold_threshold FLOAT64;

  -- Risk Management
  DECLARE p_stop_loss_pct FLOAT64;
  DECLARE p_target_pct FLOAT64;

  -- Market Regime Variables
  DECLARE v_current_regime STRING DEFAULT 'NEUTRAL';
  DECLARE v_threshold_adjustment FLOAT64 DEFAULT 0;

  SET v_execution_ts = CURRENT_TIMESTAMP();

  -- Default execution_date to today if NULL
  IF execution_date IS NULL THEN
    SET execution_date = CURRENT_DATE();
  END IF;

  -- ========================================================================
  -- PASO 2: LOAD PARAMETERS FROM parametros_trinity
  -- ========================================================================

  -- Lynch weights
  SET p_lynch_weight = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'lynch_weight' AND is_active = TRUE
  );
  SET p_lynch_peg_max = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'lynch_peg_max' AND is_active = TRUE
  );
  SET p_lynch_eps_growth_min = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'lynch_eps_growth_min' AND is_active = TRUE
  );
  SET p_lynch_roe_min = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'lynch_roe_min' AND is_active = TRUE
  );

  -- O'Neil weights
  SET p_oneil_weight = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'oneil_weight' AND is_active = TRUE
  );
  SET p_oneil_rs_min = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'oneil_rs_min' AND is_active = TRUE
  );
  SET p_oneil_eps_accel_min = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'oneil_eps_accel_min' AND is_active = TRUE
  );
  SET p_oneil_volume_surge = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'oneil_volume_surge' AND is_active = TRUE
  );

  -- Graham weights
  SET p_graham_weight = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'graham_weight' AND is_active = TRUE
  );
  SET p_graham_pe_max = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'graham_pe_max' AND is_active = TRUE
  );
  SET p_graham_pb_max = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'graham_pb_max' AND is_active = TRUE
  );
  SET p_graham_current_ratio_min = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'graham_current_ratio_min' AND is_active = TRUE
  );
  SET p_graham_debt_equity_max = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'graham_debt_equity_max' AND is_active = TRUE
  );

  -- Universe filters
  SET p_min_market_cap = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'min_market_cap' AND is_active = TRUE
  );
  SET p_min_volume = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'min_avg_volume' AND is_active = TRUE
  );
  SET p_min_price = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'min_price' AND is_active = TRUE
  );
  SET p_min_data_quality = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'min_data_quality_score' AND is_active = TRUE
  );

  -- Signal thresholds
  SET p_strong_buy_threshold = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'strong_buy_threshold' AND is_active = TRUE
  );
  SET p_buy_threshold = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'buy_threshold' AND is_active = TRUE
  );
  SET p_hold_threshold = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'hold_threshold' AND is_active = TRUE
  );

  -- Risk management
  SET p_stop_loss_pct = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'stop_loss_pct' AND is_active = TRUE
  );
  SET p_target_pct = (
    SELECT CAST(parameter_value AS FLOAT64)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
    WHERE scenario_name = v_scenario AND parameter_name = 'target_pct' AND is_active = TRUE
  );

  -- Set defaults if parameters not found
  SET p_lynch_weight = COALESCE(p_lynch_weight, 0.35);
  SET p_oneil_weight = COALESCE(p_oneil_weight, 0.35);
  SET p_graham_weight = COALESCE(p_graham_weight, 0.30);
  SET p_lynch_peg_max = COALESCE(p_lynch_peg_max, 2.0);
  SET p_lynch_eps_growth_min = COALESCE(p_lynch_eps_growth_min, 15.0);
  SET p_lynch_roe_min = COALESCE(p_lynch_roe_min, 15.0);
  SET p_oneil_rs_min = COALESCE(p_oneil_rs_min, 70.0);
  SET p_oneil_eps_accel_min = COALESCE(p_oneil_eps_accel_min, 20.0);
  SET p_oneil_volume_surge = COALESCE(p_oneil_volume_surge, 1.5);
  SET p_graham_pe_max = COALESCE(p_graham_pe_max, 15.0);
  SET p_graham_pb_max = COALESCE(p_graham_pb_max, 1.5);
  SET p_graham_current_ratio_min = COALESCE(p_graham_current_ratio_min, 2.0);
  SET p_graham_debt_equity_max = COALESCE(p_graham_debt_equity_max, 0.5);
  SET p_min_market_cap = COALESCE(p_min_market_cap, 500000000.0);
  SET p_min_volume = COALESCE(p_min_volume, 100000.0);
  SET p_min_price = COALESCE(p_min_price, 5.0);
  SET p_min_data_quality = COALESCE(p_min_data_quality, 0.6);
  SET p_strong_buy_threshold = COALESCE(p_strong_buy_threshold, 85.0);
  SET p_buy_threshold = COALESCE(p_buy_threshold, 70.0);
  SET p_hold_threshold = COALESCE(p_hold_threshold, 50.0);
  SET p_stop_loss_pct = COALESCE(p_stop_loss_pct, 7.0);
  SET p_target_pct = COALESCE(p_target_pct, 20.0);

  -- ========================================================================
  -- PASO 2.5: READ MARKET REGIME AND ADJUST THRESHOLDS
  -- ========================================================================

  -- Get current market regime
  SET v_current_regime = (
    SELECT regime_type
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.market_regime_daily`
    WHERE regime_date <= execution_date
    ORDER BY regime_date DESC
    LIMIT 1
  );

  -- Default to NEUTRAL if no regime found
  SET v_current_regime = COALESCE(v_current_regime, 'NEUTRAL');

  -- Calculate threshold adjustment based on regime
  -- BULL: Lower thresholds (easier to trigger BUY) -> -5
  -- NEUTRAL: No adjustment -> 0
  -- CORRECTION: Higher thresholds (harder to trigger BUY) -> +5
  -- BEAR: Much higher thresholds -> +10
  SET v_threshold_adjustment = CASE v_current_regime
    WHEN 'BULL' THEN -5.0
    WHEN 'NEUTRAL' THEN 0.0
    WHEN 'CORRECTION' THEN 5.0
    WHEN 'BEAR' THEN 10.0
    ELSE 0.0
  END;

  -- Apply adjustment to thresholds
  SET p_strong_buy_threshold = p_strong_buy_threshold + v_threshold_adjustment;
  SET p_buy_threshold = p_buy_threshold + v_threshold_adjustment;
  SET p_hold_threshold = p_hold_threshold + v_threshold_adjustment;

  -- ========================================================================
  -- PASO 3-12: CREATE TEMP TABLE WITH ALL CALCULATIONS AND INSERT
  -- ========================================================================

  -- Delete existing data for this date (idempotent)
  DELETE FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
  WHERE signal_date = execution_date;

  -- Main calculation and insert
  INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily` (
    ticker, ticker_norm, company_name, sector, industry, signal_date,
    price_current, price_52w_high, price_52w_low, volume_daily, volume_avg_50d, market_cap,
    eps_ttm, revenues_ttm, net_income_ttm, stockholders_equity,
    current_assets, current_liabilities, long_term_debt,
    roe, current_ratio, revenue_growth_yoy, eps_growth_yoy, net_income_growth_yoy,
    pe_ratio, pb_ratio, ps_ratio, peg_ratio, debt_to_equity,
    lynch_score, lynch_peg_score, lynch_roe_score, lynch_eps_growth_score, lynch_revenue_growth_score,
    oneil_score, oneil_rs_score, oneil_volume_score, oneil_momentum_score, oneil_eps_accel_score,
    graham_score, graham_pb_score, graham_current_ratio_score, graham_debt_score, graham_stability_score,
    trinity_score,
    signal_strength, recommendation, confidence_level, entry_price, stop_loss, target_price, risk_reward_ratio,
    ranking_position, percentile_rank, data_quality_score, has_complete_data, calculation_timestamp,
    market_regime
  )
  WITH
  -- PASO 3: Latest prices per ticker
  latest_prices AS (
    SELECT
      p.ticker,
      p.close AS price_current,
      p.vol AS volume_daily,
      p.fecha AS price_date
    FROM `sunny-advantage-471523-b3.market_data.Prices` p
    INNER JOIN (
      SELECT ticker, MAX(fecha) AS max_fecha
      FROM `sunny-advantage-471523-b3.market_data.Prices`
      WHERE fecha <= execution_date
      GROUP BY ticker
    ) mp ON p.ticker = mp.ticker AND p.fecha = mp.max_fecha
  ),

  -- PASO 4: 52-week high/low and volume average
  price_stats AS (
    SELECT
      ticker,
      MAX(high) AS price_52w_high,
      MIN(low) AS price_52w_low,
      AVG(vol) AS volume_avg_50d
    FROM `sunny-advantage-471523-b3.market_data.Prices`
    WHERE fecha > DATE_SUB(execution_date, INTERVAL 365 DAY)
      AND fecha <= execution_date
    GROUP BY ticker
  ),

  -- PASO 5: Latest TTM fundamentals (fiscal year data as proxy for TTM)
  latest_fundamentals AS (
    SELECT
      ft.ticker,
      ft.company_name,
      ft.eps_diluted AS eps_ttm,
      ft.revenues AS revenues_ttm,
      ft.net_income AS net_income_ttm,
      ft.stockholders_equity,
      ft.current_assets,
      ft.current_liabilities,
      ft.long_term_debt,
      ft.data_quality_score,
      ft.fiscal_year,
      ft.period_end_date
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries` ft
    INNER JOIN (
      SELECT ticker, MAX(period_end_date) AS max_period
      FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
      WHERE fiscal_period = 'FY'
        AND period_end_date <= execution_date
      GROUP BY ticker
    ) mf ON ft.ticker = mf.ticker AND ft.period_end_date = mf.max_period
    WHERE ft.fiscal_period = 'FY'
  ),

  -- PASO 6: Latest ratios (use most recent period, not just FY)
  latest_ratios AS (
    SELECT
      ticker,
      roe,
      current_ratio,
      debt_to_equity,
      revenue_growth_yoy,
      eps_growth_yoy,
      net_income_growth_yoy
    FROM (
      SELECT
        fr.ticker,
        fr.roe,
        fr.current_ratio,
        fr.debt_to_equity,
        fr.revenue_growth_yoy,
        fr.eps_growth_yoy,
        fr.net_income_growth_yoy,
        ROW_NUMBER() OVER (PARTITION BY fr.ticker ORDER BY fr.period_end_date DESC) AS rn
      FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_ratios` fr
      WHERE fr.period_end_date <= execution_date
    )
    WHERE rn = 1
  ),

  -- PASO 7: Calculate market cap and dynamic ratios
  base_universe AS (
    SELECT
      lf.ticker,
      LOWER(lf.ticker) AS ticker_norm,
      lf.company_name,
      'Technology' AS sector, -- Placeholder - would need sector data
      'Software' AS industry, -- Placeholder
      execution_date AS signal_date,
      lp.price_current,
      ps.price_52w_high,
      ps.price_52w_low,
      lp.volume_daily,
      ps.volume_avg_50d,
      -- Market cap calculation (price * shares, estimate from stockholders equity / book value per share)
      CASE
        WHEN lf.stockholders_equity > 0 AND lf.eps_ttm > 0
        THEN lp.price_current * (lf.stockholders_equity / (lf.stockholders_equity / NULLIF(lf.net_income_ttm, 0) * lf.eps_ttm))
        ELSE lp.price_current * 1000000000 -- Default estimate
      END AS market_cap,
      lf.eps_ttm,
      lf.revenues_ttm,
      lf.net_income_ttm,
      lf.stockholders_equity,
      lf.current_assets,
      lf.current_liabilities,
      lf.long_term_debt,
      -- Ratios from fundamentals_ratios
      lr.roe * 100 AS roe, -- Convert to percentage
      lr.current_ratio,
      lr.revenue_growth_yoy AS revenue_growth_yoy, -- Already stored as percentage
      lr.eps_growth_yoy AS eps_growth_yoy, -- Already stored as percentage
      lr.net_income_growth_yoy AS net_income_growth_yoy, -- Already stored as percentage
      lr.debt_to_equity,
      -- Dynamic ratios
      CASE WHEN lf.eps_ttm > 0 THEN lp.price_current / lf.eps_ttm ELSE NULL END AS pe_ratio,
      CASE WHEN lf.stockholders_equity > 0
           THEN lp.price_current / (lf.stockholders_equity / NULLIF(lf.net_income_ttm / NULLIF(lf.eps_ttm, 0), 0))
           ELSE NULL END AS pb_ratio,
      CASE WHEN lf.revenues_ttm > 0
           THEN (lp.price_current * COALESCE(lf.net_income_ttm / NULLIF(lf.eps_ttm, 0), 1000000000)) / lf.revenues_ttm
           ELSE NULL END AS ps_ratio,
      -- PEG = P/E / EPS Growth Rate (eps_growth_yoy already as %)
      CASE
        WHEN lf.eps_ttm > 0 AND lr.eps_growth_yoy > 0
        THEN (lp.price_current / lf.eps_ttm) / lr.eps_growth_yoy
        ELSE NULL
      END AS peg_ratio,
      lf.data_quality_score,
      -- Price momentum (relative strength proxy)
      CASE WHEN ps.price_52w_low > 0
           THEN ((lp.price_current - ps.price_52w_low) / ps.price_52w_low) * 100
           ELSE 0 END AS price_momentum,
      -- Volume ratio
      CASE WHEN ps.volume_avg_50d > 0
           THEN lp.volume_daily / ps.volume_avg_50d
           ELSE 1 END AS volume_ratio
    FROM latest_fundamentals lf
    INNER JOIN latest_prices lp ON lf.ticker = lp.ticker
    INNER JOIN price_stats ps ON lf.ticker = ps.ticker
    LEFT JOIN latest_ratios lr ON lf.ticker = lr.ticker
    WHERE lp.price_current >= p_min_price
      AND COALESCE(lf.data_quality_score, 0.7) >= p_min_data_quality
  ),

  -- PASO 8-10: Calculate Lynch, O'Neil, Graham scores
  scored_universe AS (
    SELECT
      bu.*,
      -- ================================================================
      -- LYNCH SCORE (Value + Growth)
      -- ================================================================
      -- PEG Score (lower is better, <1 = 100, <2 = 75, else scaled)
      CASE
        WHEN bu.peg_ratio IS NULL THEN 50
        WHEN bu.peg_ratio <= 0 THEN 0
        WHEN bu.peg_ratio <= 0.5 THEN 100
        WHEN bu.peg_ratio <= 1.0 THEN 90
        WHEN bu.peg_ratio <= 1.5 THEN 75
        WHEN bu.peg_ratio <= p_lynch_peg_max THEN 60
        ELSE GREATEST(0, 100 - (bu.peg_ratio * 20))
      END AS lynch_peg_score,

      -- ROE Score (higher is better)
      CASE
        WHEN bu.roe IS NULL THEN 50
        WHEN bu.roe >= 30 THEN 100
        WHEN bu.roe >= 25 THEN 90
        WHEN bu.roe >= p_lynch_roe_min THEN 75
        WHEN bu.roe >= 10 THEN 60
        WHEN bu.roe >= 5 THEN 40
        ELSE 20
      END AS lynch_roe_score,

      -- EPS Growth Score
      CASE
        WHEN bu.eps_growth_yoy IS NULL THEN 50
        WHEN bu.eps_growth_yoy >= 50 THEN 100
        WHEN bu.eps_growth_yoy >= 30 THEN 90
        WHEN bu.eps_growth_yoy >= p_lynch_eps_growth_min THEN 75
        WHEN bu.eps_growth_yoy >= 10 THEN 60
        WHEN bu.eps_growth_yoy >= 0 THEN 40
        ELSE 20
      END AS lynch_eps_growth_score,

      -- Revenue Growth Score
      CASE
        WHEN bu.revenue_growth_yoy IS NULL THEN 50
        WHEN bu.revenue_growth_yoy >= 30 THEN 100
        WHEN bu.revenue_growth_yoy >= 20 THEN 85
        WHEN bu.revenue_growth_yoy >= 10 THEN 70
        WHEN bu.revenue_growth_yoy >= 5 THEN 55
        WHEN bu.revenue_growth_yoy >= 0 THEN 40
        ELSE 25
      END AS lynch_revenue_growth_score,

      -- ================================================================
      -- O'NEIL SCORE (Momentum + Technical)
      -- ================================================================
      -- Relative Strength Score (price momentum percentile)
      CASE
        WHEN bu.price_momentum >= 100 THEN 100
        WHEN bu.price_momentum >= 75 THEN 90
        WHEN bu.price_momentum >= p_oneil_rs_min THEN 80
        WHEN bu.price_momentum >= 50 THEN 70
        WHEN bu.price_momentum >= 25 THEN 55
        WHEN bu.price_momentum >= 0 THEN 40
        ELSE 20
      END AS oneil_rs_score,

      -- Volume Score
      CASE
        WHEN bu.volume_ratio >= 2.0 THEN 100
        WHEN bu.volume_ratio >= p_oneil_volume_surge THEN 85
        WHEN bu.volume_ratio >= 1.2 THEN 70
        WHEN bu.volume_ratio >= 1.0 THEN 50
        WHEN bu.volume_ratio >= 0.8 THEN 35
        ELSE 20
      END AS oneil_volume_score,

      -- Momentum Score (price relative to 52w range)
      CASE
        WHEN bu.price_52w_high > 0 AND bu.price_52w_low > 0 THEN
          GREATEST(0, LEAST(100,
            ((bu.price_current - bu.price_52w_low) / NULLIF(bu.price_52w_high - bu.price_52w_low, 0)) * 100
          ))
        ELSE 50
      END AS oneil_momentum_score,

      -- EPS Acceleration Score (similar to EPS growth but momentum-focused)
      CASE
        WHEN bu.eps_growth_yoy IS NULL THEN 50
        WHEN bu.eps_growth_yoy >= p_oneil_eps_accel_min * 2 THEN 100
        WHEN bu.eps_growth_yoy >= p_oneil_eps_accel_min THEN 80
        WHEN bu.eps_growth_yoy >= 10 THEN 60
        WHEN bu.eps_growth_yoy >= 0 THEN 40
        ELSE 20
      END AS oneil_eps_accel_score,

      -- ================================================================
      -- GRAHAM SCORE (Deep Value + Safety)
      -- ================================================================
      -- P/B Score (lower is better for value)
      CASE
        WHEN bu.pb_ratio IS NULL THEN 50
        WHEN bu.pb_ratio <= 1.0 THEN 100
        WHEN bu.pb_ratio <= p_graham_pb_max THEN 85
        WHEN bu.pb_ratio <= 2.0 THEN 70
        WHEN bu.pb_ratio <= 3.0 THEN 50
        ELSE GREATEST(0, 100 - (bu.pb_ratio * 15))
      END AS graham_pb_score,

      -- Current Ratio Score (higher is better for safety)
      CASE
        WHEN bu.current_ratio IS NULL THEN 50
        WHEN bu.current_ratio >= 3.0 THEN 100
        WHEN bu.current_ratio >= p_graham_current_ratio_min THEN 85
        WHEN bu.current_ratio >= 1.5 THEN 70
        WHEN bu.current_ratio >= 1.0 THEN 50
        ELSE 25
      END AS graham_current_ratio_score,

      -- Debt Score (lower debt-to-equity is better)
      CASE
        WHEN bu.debt_to_equity IS NULL THEN 50
        WHEN bu.debt_to_equity <= 0.3 THEN 100
        WHEN bu.debt_to_equity <= p_graham_debt_equity_max THEN 85
        WHEN bu.debt_to_equity <= 1.0 THEN 65
        WHEN bu.debt_to_equity <= 2.0 THEN 40
        ELSE 20
      END AS graham_debt_score,

      -- Stability Score (P/E based - moderate P/E preferred)
      CASE
        WHEN bu.pe_ratio IS NULL THEN 50
        WHEN bu.pe_ratio <= 0 THEN 20 -- Negative earnings
        WHEN bu.pe_ratio <= 10 THEN 90
        WHEN bu.pe_ratio <= p_graham_pe_max THEN 80
        WHEN bu.pe_ratio <= 20 THEN 65
        WHEN bu.pe_ratio <= 30 THEN 45
        ELSE GREATEST(0, 100 - (bu.pe_ratio * 2))
      END AS graham_stability_score

    FROM base_universe bu
  ),

  -- PASO 11: Calculate composite scores
  final_scores AS (
    SELECT
      su.*,
      -- Lynch composite (equal weight sub-scores)
      (su.lynch_peg_score * 0.35 + su.lynch_roe_score * 0.25 +
       su.lynch_eps_growth_score * 0.25 + su.lynch_revenue_growth_score * 0.15) AS lynch_score,

      -- O'Neil composite
      (su.oneil_rs_score * 0.30 + su.oneil_volume_score * 0.20 +
       su.oneil_momentum_score * 0.25 + su.oneil_eps_accel_score * 0.25) AS oneil_score,

      -- Graham composite
      (su.graham_pb_score * 0.30 + su.graham_current_ratio_score * 0.25 +
       su.graham_debt_score * 0.25 + su.graham_stability_score * 0.20) AS graham_score
    FROM scored_universe su
  ),

  -- PASO 12: Calculate Trinity score and generate signals
  signals AS (
    SELECT
      fs.*,
      -- Trinity Score = Lynch(35%) + O'Neil(35%) + Graham(30%)
      (fs.lynch_score * p_lynch_weight +
       fs.oneil_score * p_oneil_weight +
       fs.graham_score * p_graham_weight) AS trinity_score
    FROM final_scores fs
  ),

  -- PASO 13: Rank and assign signals
  ranked_signals AS (
    SELECT
      s.*,
      ROW_NUMBER() OVER (ORDER BY s.trinity_score DESC) AS ranking_position,
      PERCENT_RANK() OVER (ORDER BY s.trinity_score) * 100 AS percentile_rank,
      -- Signal strength
      CASE
        WHEN s.trinity_score >= p_strong_buy_threshold THEN 'STRONG BUY'
        WHEN s.trinity_score >= p_buy_threshold THEN 'BUY'
        WHEN s.trinity_score >= p_hold_threshold THEN 'HOLD'
        ELSE 'SELL'
      END AS signal_strength,
      -- Recommendation
      CASE
        WHEN s.trinity_score >= p_strong_buy_threshold THEN 'Aggressive accumulation recommended'
        WHEN s.trinity_score >= p_buy_threshold THEN 'Consider buying on pullback'
        WHEN s.trinity_score >= p_hold_threshold THEN 'Hold current position'
        ELSE 'Consider reducing position'
      END AS recommendation,
      -- Confidence level (based on data quality and score clarity)
      LEAST(100, s.data_quality_score * 100 +
            ABS(s.trinity_score - p_hold_threshold) * 0.5) AS confidence_level,
      -- Entry price (current price)
      s.price_current AS entry_price,
      -- Stop loss
      s.price_current * (1 - p_stop_loss_pct / 100) AS stop_loss,
      -- Target price
      s.price_current * (1 + p_target_pct / 100) AS target_price,
      -- Risk/Reward ratio
      (p_target_pct / p_stop_loss_pct) AS risk_reward_ratio,
      -- Has complete data flag
      CASE
        WHEN s.eps_ttm IS NOT NULL
         AND s.pe_ratio IS NOT NULL
         AND s.roe IS NOT NULL
        THEN TRUE
        ELSE FALSE
      END AS has_complete_data
    FROM signals s
  )

  -- Final SELECT for INSERT
  SELECT
    ticker,
    ticker_norm,
    company_name,
    sector,
    industry,
    signal_date,
    price_current,
    price_52w_high,
    price_52w_low,
    CAST(volume_daily AS INT64) AS volume_daily,
    volume_avg_50d,
    market_cap,
    eps_ttm,
    revenues_ttm,
    net_income_ttm,
    stockholders_equity,
    current_assets,
    current_liabilities,
    long_term_debt,
    roe,
    current_ratio,
    revenue_growth_yoy,
    eps_growth_yoy,
    net_income_growth_yoy,
    pe_ratio,
    pb_ratio,
    ps_ratio,
    peg_ratio,
    debt_to_equity,
    lynch_score,
    lynch_peg_score,
    lynch_roe_score,
    lynch_eps_growth_score,
    lynch_revenue_growth_score,
    oneil_score,
    oneil_rs_score,
    oneil_volume_score,
    oneil_momentum_score,
    oneil_eps_accel_score,
    graham_score,
    graham_pb_score,
    graham_current_ratio_score,
    graham_debt_score,
    graham_stability_score,
    trinity_score,
    signal_strength,
    recommendation,
    confidence_level,
    entry_price,
    stop_loss,
    target_price,
    risk_reward_ratio,
    CAST(ranking_position AS INT64) AS ranking_position,
    percentile_rank,
    data_quality_score,
    has_complete_data,
    v_execution_ts AS calculation_timestamp,
    v_current_regime AS market_regime
  FROM ranked_signals;

  -- ========================================================================
  -- PASO 14: CLEANUP OLD PARTITIONS (>7 days)
  -- ========================================================================
  DELETE FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
  WHERE signal_date < DATE_SUB(execution_date, INTERVAL 7 DAY);

END;

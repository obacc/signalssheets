-- Temporal Coverage Check
-- Detects missing trading days in the last N days
-- Excludes weekends but does NOT exclude market holidays (would need separate calendar)
--
-- Usage:
--   bq query --use_legacy_sql=false < 03_temporal_coverage_check.sql

DECLARE lookback_days INT64 DEFAULT 30;

WITH date_range AS (
  -- Generate all calendar dates in lookback period
  SELECT date
  FROM UNNEST(GENERATE_DATE_ARRAY(
    DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY),
    CURRENT_DATE()
  )) as date
  -- Exclude weekends (1=Sunday, 7=Saturday)
  WHERE EXTRACT(DAYOFWEEK FROM date) NOT IN (1, 7)
),

loaded_dates AS (
  -- Get distinct dates that have been loaded
  SELECT DISTINCT date
  FROM `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw`
  WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY)
),

missing_dates AS (
  -- Find expected dates that are missing
  SELECT dr.date as missing_date
  FROM date_range dr
  LEFT JOIN loaded_dates ld ON dr.date = ld.date
  WHERE ld.date IS NULL
),

coverage_stats AS (
  -- Calculate coverage statistics
  SELECT
    COUNT(*) as expected_trading_days,
    (SELECT COUNT(*) FROM loaded_dates) as actual_loaded_days,
    (SELECT COUNT(*) FROM missing_dates) as missing_days,
    ROUND((SELECT COUNT(*) FROM loaded_dates) * 100.0 / COUNT(*), 2) as coverage_percentage
  FROM date_range
)

-- Return results
SELECT
  'SUMMARY' as section,
  CAST(NULL AS DATE) as missing_date,
  cs.expected_trading_days,
  cs.actual_loaded_days,
  cs.missing_days,
  cs.coverage_percentage,
  CASE
    WHEN cs.coverage_percentage = 100 THEN 'OK: Complete coverage'
    WHEN cs.coverage_percentage >= 95 THEN 'WARNING: Minor gaps'
    WHEN cs.coverage_percentage >= 80 THEN 'ERROR: Significant gaps'
    ELSE 'CRITICAL: Major data gaps'
  END as coverage_status
FROM coverage_stats cs

UNION ALL

-- List all missing dates
SELECT
  'MISSING_DATES' as section,
  missing_date,
  CAST(NULL AS INT64) as expected_trading_days,
  CAST(NULL AS INT64) as actual_loaded_days,
  CAST(NULL AS INT64) as missing_days,
  CAST(NULL AS FLOAT64) as coverage_percentage,
  FORMAT('Missing data for %s (%s)',
    FORMAT_DATE('%Y-%m-%d', missing_date),
    FORMAT_DATE('%A', missing_date)
  ) as coverage_status
FROM missing_dates
ORDER BY section DESC, missing_date DESC;

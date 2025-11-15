-- ================================================================
-- Create View: Missing Trading Days Report
-- ================================================================
-- Identifies gaps in Polygon data loading (excluding weekends)
-- File: 06_create_missing_days_view.sql
-- Project: sunny-advantage-471523-b3
-- Dataset: market_data

CREATE OR REPLACE VIEW `sunny-advantage-471523-b3.market_data.v_missing_days_polygon` AS
WITH date_range AS (
  -- Generate last 90 days of dates
  SELECT date
  FROM UNNEST(GENERATE_DATE_ARRAY(
    DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY),
    CURRENT_DATE()
  )) as date
  WHERE EXTRACT(DAYOFWEEK FROM date) NOT IN (1, 7)  -- Exclude Sunday (1) and Saturday (7)
),
loaded_dates AS (
  -- Get all dates that have been loaded to staging
  SELECT DISTINCT trading_day
  FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
  WHERE source = 'polygon'
    AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
),
prices_dates AS (
  -- Get all dates in Prices table
  SELECT DISTINCT trading_day
  FROM `sunny-advantage-471523-b3.market_data.Prices`
  WHERE source = 'polygon'
    AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
)
SELECT
  dr.date as missing_date,
  'polygon' as source,
  CASE
    WHEN ld.trading_day IS NULL AND pd.trading_day IS NULL THEN 'MISSING_EVERYWHERE'
    WHEN ld.trading_day IS NULL AND pd.trading_day IS NOT NULL THEN 'MISSING_IN_STAGING_ONLY'
    WHEN ld.trading_day IS NOT NULL AND pd.trading_day IS NULL THEN 'MISSING_IN_PRICES_ONLY'
    ELSE 'OK'  -- Should not happen given the WHERE clause
  END as gap_type,
  CURRENT_DATE() as report_date,
  DATE_DIFF(CURRENT_DATE(), dr.date, DAY) as days_ago
FROM date_range dr
LEFT JOIN loaded_dates ld ON dr.date = ld.trading_day
LEFT JOIN prices_dates pd ON dr.date = pd.trading_day
WHERE ld.trading_day IS NULL OR pd.trading_day IS NULL  -- Only show missing dates
ORDER BY dr.date DESC;

-- ================================================================
-- Verify View Creation
-- ================================================================

SELECT
  table_name,
  table_type
FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.TABLES`
WHERE table_name = 'v_missing_days_polygon';

-- ================================================================
-- Usage Examples
-- ================================================================

-- Show all missing days
-- SELECT *
-- FROM `sunny-advantage-471523-b3.market_data.v_missing_days_polygon`
-- ORDER BY missing_date DESC;

-- Show only recent gaps (last 30 days)
-- SELECT *
-- FROM `sunny-advantage-471523-b3.market_data.v_missing_days_polygon`
-- WHERE days_ago <= 30
-- ORDER BY missing_date DESC;

-- Count of missing days by gap type
-- SELECT
--   gap_type,
--   COUNT(*) as missing_count
-- FROM `sunny-advantage-471523-b3.market_data.v_missing_days_polygon`
-- GROUP BY gap_type
-- ORDER BY missing_count DESC;

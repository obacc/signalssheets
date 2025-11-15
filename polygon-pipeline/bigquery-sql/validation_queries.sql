-- ================================================================
-- Polygon Data Quality Validation Queries
-- ================================================================
-- Comprehensive set of validation checks for Polygon data pipeline
-- File: validation_queries.sql
-- Project: sunny-advantage-471523-b3
-- Dataset: market_data
--
-- Run these queries regularly to ensure data quality
-- ================================================================

-- ================================================================
-- Q1: Daily Volume and Ticker Counts (Last 30 Days)
-- ================================================================
-- Expected: ~11,000 tickers per day, no NULLs, no invalid ranges
-- ================================================================

SELECT
  trading_day,
  COUNT(*) as total_records,
  COUNT(DISTINCT ticker) as unique_tickers,
  COUNTIF(open IS NULL) as null_opens,
  COUNTIF(close IS NULL) as null_closes,
  COUNTIF(high IS NULL) as null_highs,
  COUNTIF(low IS NULL) as null_lows,
  COUNTIF(volume IS NULL OR volume = 0) as zero_volume,
  COUNTIF(high < low) as invalid_ranges,
  COUNTIF(open < 0 OR close < 0 OR high < 0 OR low < 0) as negative_prices,
  MIN(ticker) as first_ticker_alphabetically,
  MAX(ticker) as last_ticker_alphabetically,
  CASE
    WHEN COUNT(DISTINCT ticker) < 10000 THEN '⚠️ LOW COVERAGE'
    WHEN COUNTIF(open IS NULL OR close IS NULL) > 0 THEN '❌ NULL PRICES'
    WHEN COUNTIF(high < low) > 0 THEN '❌ INVALID RANGES'
    WHEN COUNTIF(open < 0 OR close < 0) > 0 THEN '❌ NEGATIVE PRICES'
    ELSE '✅ OK'
  END as status
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND source = 'polygon'
GROUP BY trading_day
ORDER BY trading_day DESC;

-- ================================================================
-- Q2: Duplicate Detection in Staging (MUST BE ZERO)
-- ================================================================
-- Expected: 0 rows
-- ================================================================

SELECT
  ticker,
  trading_day,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(load_ts ORDER BY load_ts) as load_timestamps,
  ARRAY_AGG(file_name ORDER BY load_ts) as source_files
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE source = 'polygon'
  AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY ticker, trading_day
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, ticker;

-- ================================================================
-- Q3: Duplicate Detection in Prices (MUST BE ZERO)
-- ================================================================
-- Expected: 0 rows
-- ================================================================

SELECT
  ticker,
  trading_day,
  source,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(last_updated ORDER BY last_updated) as update_timestamps
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE source = 'polygon'
  AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY ticker, trading_day, source
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, ticker;

-- ================================================================
-- Q4: Staging vs Prices Comparison (Last 7 Days)
-- ================================================================
-- Expected: Counts should match within tolerance (±10 records)
-- ================================================================

WITH raw_counts AS (
  SELECT
    trading_day,
    COUNT(*) as raw_count,
    COUNT(DISTINCT ticker) as raw_unique_tickers
  FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
  WHERE source = 'polygon'
    AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  GROUP BY trading_day
),
prices_counts AS (
  SELECT
    trading_day,
    COUNT(*) as prices_count,
    COUNT(DISTINCT ticker) as prices_unique_tickers
  FROM `sunny-advantage-471523-b3.market_data.Prices`
  WHERE source = 'polygon'
    AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  GROUP BY trading_day
)
SELECT
  COALESCE(r.trading_day, p.trading_day) as trading_day,
  IFNULL(r.raw_count, 0) as raw_count,
  IFNULL(p.prices_count, 0) as prices_count,
  IFNULL(p.prices_count, 0) - IFNULL(r.raw_count, 0) as difference,
  IFNULL(r.raw_unique_tickers, 0) as raw_tickers,
  IFNULL(p.prices_unique_tickers, 0) as prices_tickers,
  CASE
    WHEN r.raw_count IS NULL THEN '⚠️ MISSING IN RAW'
    WHEN p.prices_count IS NULL THEN '⚠️ MISSING IN PRICES'
    WHEN ABS(IFNULL(p.prices_count, 0) - IFNULL(r.raw_count, 0)) > 10 THEN '⚠️ COUNT MISMATCH'
    ELSE '✅ ALIGNED'
  END as status
FROM raw_counts r
FULL OUTER JOIN prices_counts p ON r.trading_day = p.trading_day
ORDER BY trading_day DESC;

-- ================================================================
-- Q5: Missing Trading Days (Last 90 Days)
-- ================================================================
-- Uses the v_missing_days_polygon view
-- ================================================================

SELECT
  missing_date,
  gap_type,
  days_ago,
  CASE
    WHEN days_ago <= 3 THEN '🔴 URGENT'
    WHEN days_ago <= 7 THEN '🟠 HIGH'
    WHEN days_ago <= 30 THEN '🟡 MEDIUM'
    ELSE '🟢 LOW'
  END as priority
FROM `sunny-advantage-471523-b3.market_data.v_missing_days_polygon`
ORDER BY missing_date DESC
LIMIT 50;

-- ================================================================
-- Q6: File Registry Status (Last 30 Days)
-- ================================================================
-- Monitor load success rate
-- ================================================================

SELECT
  trade_date,
  status,
  records_count,
  error_msg,
  process_ts,
  file_path
FROM `sunny-advantage-471523-b3.market_data.ingest_file_registry`
WHERE source = 'polygon'
  AND trade_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY trade_date DESC, process_ts DESC;

-- ================================================================
-- Q7: Load Success Rate Summary
-- ================================================================

WITH daily_status AS (
  SELECT
    trade_date,
    MAX(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as has_success,
    MAX(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as has_failure,
    MAX(CASE WHEN status = 'NO_DATA' THEN 1 ELSE 0 END) as has_no_data
  FROM `sunny-advantage-471523-b3.market_data.ingest_file_registry`
  WHERE source = 'polygon'
    AND trade_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY trade_date
)
SELECT
  COUNT(*) as total_days,
  COUNTIF(has_success = 1) as successful_days,
  COUNTIF(has_failure = 1) as failed_days,
  COUNTIF(has_no_data = 1) as no_data_days,
  ROUND(COUNTIF(has_success = 1) * 100.0 / COUNT(*), 2) as success_rate_pct
FROM daily_status;

-- ================================================================
-- Q8: Price Range Anomalies
-- ================================================================
-- Detect potential data quality issues
-- ================================================================

SELECT
  ticker,
  trading_day,
  open,
  high,
  low,
  close,
  volume,
  CASE
    WHEN high < low THEN 'HIGH < LOW'
    WHEN close > high THEN 'CLOSE > HIGH'
    WHEN close < low THEN 'CLOSE < LOW'
    WHEN open > high THEN 'OPEN > HIGH'
    WHEN open < low THEN 'OPEN < LOW'
    WHEN open < 0 OR high < 0 OR low < 0 OR close < 0 THEN 'NEGATIVE PRICE'
    WHEN volume < 0 THEN 'NEGATIVE VOLUME'
    ELSE 'UNKNOWN ANOMALY'
  END as anomaly_type
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND source = 'polygon'
  AND (
    high < low
    OR close > high
    OR close < low
    OR open > high
    OR open < low
    OR open < 0
    OR high < 0
    OR low < 0
    OR close < 0
    OR volume < 0
  )
ORDER BY trading_day DESC, ticker;

-- ================================================================
-- Q9: Volume Statistics
-- ================================================================
-- Identify unusually low/high volume days
-- ================================================================

WITH daily_volume AS (
  SELECT
    trading_day,
    SUM(volume) as total_volume,
    AVG(volume) as avg_volume,
    COUNT(*) as ticker_count
  FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
  WHERE trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    AND source = 'polygon'
  GROUP BY trading_day
),
volume_stats AS (
  SELECT
    AVG(total_volume) as mean_total_volume,
    STDDEV(total_volume) as stddev_total_volume
  FROM daily_volume
)
SELECT
  dv.trading_day,
  dv.total_volume,
  dv.avg_volume,
  dv.ticker_count,
  vs.mean_total_volume,
  CASE
    WHEN dv.total_volume < vs.mean_total_volume - 2 * vs.stddev_total_volume THEN '⚠️ UNUSUALLY LOW'
    WHEN dv.total_volume > vs.mean_total_volume + 2 * vs.stddev_total_volume THEN '⚠️ UNUSUALLY HIGH'
    ELSE '✅ NORMAL'
  END as volume_status
FROM daily_volume dv
CROSS JOIN volume_stats vs
ORDER BY dv.trading_day DESC;

-- ================================================================
-- Q10: Top Tickers by Volume (Last Trading Day)
-- ================================================================

WITH last_trading_day AS (
  SELECT MAX(trading_day) as max_date
  FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
  WHERE source = 'polygon'
)
SELECT
  s.ticker,
  s.trading_day,
  s.close,
  s.volume,
  RANK() OVER (ORDER BY s.volume DESC) as volume_rank
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw` s
CROSS JOIN last_trading_day ltd
WHERE s.trading_day = ltd.max_date
  AND s.source = 'polygon'
ORDER BY s.volume DESC
LIMIT 20;

-- ================================================================
-- Summary: Run All Critical Validations
-- ================================================================
-- For quick daily checks, uncomment and run this section
-- ================================================================

-- SELECT '=== Q1: Daily Counts ===' as check;
-- <paste Q1 query here>

-- SELECT '=== Q2: Duplicates in Staging ===' as check;
-- <paste Q2 query here>

-- SELECT '=== Q3: Duplicates in Prices ===' as check;
-- <paste Q3 query here>

-- SELECT '=== Q4: Staging vs Prices ===' as check;
-- <paste Q4 query here>

-- SELECT '=== Q5: Missing Days ===' as check;
-- <paste Q5 query here>

-- ============================================================================
-- VALIDATION: Data Quality Checks
-- Detect NULLs, duplicates, anomalies in staging data
-- ============================================================================

-- Check 1: NULL values summary
SELECT
    'NULL_CHECK' AS check_type,
    COUNTIF(ticker IS NULL) AS ticker_nulls,
    COUNTIF(date IS NULL) AS date_nulls,
    COUNTIF(close IS NULL) AS close_nulls,
    COUNTIF(volume IS NULL) AS volume_nulls,
    COUNT(*) AS total_rows,
    ROUND(COUNTIF(close IS NULL) * 100.0 / COUNT(*), 2) AS close_null_pct
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);

-- Check 2: Duplicate detection (ticker + date)
SELECT
    'DUPLICATE_CHECK' AS check_type,
    date,
    ticker,
    COUNT(*) AS duplicate_count
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date, ticker
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, date DESC
LIMIT 100;

-- Check 3: Price anomalies
SELECT
    'ANOMALY_CHECK' AS check_type,
    date,
    ticker,
    open,
    high,
    low,
    close,
    volume,
    CASE
        WHEN close < 0 OR open < 0 OR high < 0 OR low < 0 THEN 'NEGATIVE_PRICE'
        WHEN high < low THEN 'HIGH_LT_LOW'
        WHEN close > high OR close < low THEN 'CLOSE_OUT_OF_RANGE'
        WHEN volume < 0 THEN 'NEGATIVE_VOLUME'
        ELSE 'ANOMALY'
    END AS anomaly_type
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND (
      close < 0 OR open < 0 OR high < 0 OR low < 0
      OR high < low
      OR close > high OR close < low
      OR volume < 0
  )
ORDER BY date DESC
LIMIT 100;

-- Check 4: Ticker validation (check for malformed tickers)
SELECT
    'TICKER_FORMAT_CHECK' AS check_type,
    ticker,
    COUNT(*) AS occurrences,
    MIN(date) AS first_seen,
    MAX(date) AS last_seen
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND (
      LENGTH(ticker) < 1
      OR LENGTH(ticker) > 10
      OR ticker LIKE '% %'  -- Contains spaces
      OR ticker LIKE '%..%' -- Double dots
  )
GROUP BY ticker
ORDER BY occurrences DESC
LIMIT 50;

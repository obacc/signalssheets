-- Data Quality Validation Query
-- Validates data quality for a specific date after ingestion
--
-- Parameters:
--   @target_date (DATE): The date to validate
--
-- Usage:
--   bq query --use_legacy_sql=false --parameter=target_date:DATE:2024-11-14 < 02_validation_quality_check.sql

DECLARE target_date DATE DEFAULT @target_date;

-- Comprehensive data quality checks
WITH validation AS (
  SELECT
    date,
    COUNT(*) as total_records,
    COUNT(DISTINCT ticker) as unique_tickers,

    -- Price validation
    COUNTIF(open IS NULL OR high IS NULL OR low IS NULL OR close IS NULL) as null_prices,
    COUNTIF(open <= 0 OR high <= 0 OR low <= 0 OR close <= 0) as zero_or_negative_prices,
    COUNTIF(high < low) as invalid_high_low,
    COUNTIF(high < open OR high < close) as high_lower_than_ohlc,
    COUNTIF(low > open OR low > close) as low_higher_than_ohlc,

    -- Volume validation
    COUNTIF(volume IS NULL) as null_volume,
    COUNTIF(volume = 0) as zero_volume,
    COUNTIF(volume < 0) as negative_volume,

    -- VWAP validation
    COUNTIF(vwap IS NOT NULL AND (vwap < low OR vwap > high)) as vwap_out_of_range,

    -- Statistical outliers (prices more than 3 standard deviations from mean)
    COUNTIF(close > AVG(close) + 3 * STDDEV(close)) as extreme_high_prices,
    COUNTIF(close < AVG(close) - 3 * STDDEV(close)) as extreme_low_prices,

    -- Metadata
    MIN(load_ts) as earliest_load,
    MAX(load_ts) as latest_load

  FROM `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw`
  WHERE date = target_date
  GROUP BY date
),

-- Check for duplicate records
duplicates AS (
  SELECT
    COUNT(*) as duplicate_count
  FROM (
    SELECT ticker, date, COUNT(*) as cnt
    FROM `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw`
    WHERE date = target_date
    GROUP BY ticker, date
    HAVING COUNT(*) > 1
  )
),

-- Compare with expected ticker count (S&P 500 has ~500 stocks)
expected_counts AS (
  SELECT
    CASE
      WHEN unique_tickers < 100 THEN 'CRITICAL: Very low ticker count'
      WHEN unique_tickers < 400 THEN 'WARNING: Low ticker count'
      WHEN unique_tickers BETWEEN 400 AND 600 THEN 'OK: Normal ticker count'
      ELSE 'INFO: High ticker count'
    END as ticker_count_status
  FROM validation
)

-- Final validation report
SELECT
  v.date as validation_date,
  v.total_records,
  v.unique_tickers,

  -- Price quality
  v.null_prices,
  v.zero_or_negative_prices,
  v.invalid_high_low,
  v.high_lower_than_ohlc,
  v.low_higher_than_ohlc,

  -- Volume quality
  v.null_volume,
  v.zero_volume,
  v.negative_volume,

  -- VWAP quality
  v.vwap_out_of_range,

  -- Outliers
  v.extreme_high_prices,
  v.extreme_low_prices,

  -- Duplicates
  d.duplicate_count,

  -- Overall status
  CASE
    WHEN v.total_records = 0 THEN 'ERROR: No data loaded'
    WHEN d.duplicate_count > 0 THEN 'ERROR: Duplicate records found'
    WHEN v.null_prices > 0 THEN 'ERROR: Null prices detected'
    WHEN v.invalid_high_low > 0 THEN 'ERROR: Invalid price ranges (high < low)'
    WHEN v.zero_or_negative_prices > 0 THEN 'ERROR: Zero or negative prices'
    WHEN v.unique_tickers < 100 THEN 'CRITICAL: Very low ticker count'
    WHEN v.unique_tickers < 400 THEN 'WARNING: Low ticker count'
    WHEN v.zero_volume > v.total_records * 0.1 THEN 'WARNING: >10% records with zero volume'
    WHEN v.vwap_out_of_range > 0 THEN 'WARNING: VWAP outside high-low range'
    ELSE 'OK: Data quality passed'
  END as validation_status,

  -- Ticker count assessment
  e.ticker_count_status,

  -- Metadata
  v.earliest_load,
  v.latest_load,
  CURRENT_TIMESTAMP() as validation_run_at

FROM validation v
CROSS JOIN duplicates d
CROSS JOIN expected_counts e;

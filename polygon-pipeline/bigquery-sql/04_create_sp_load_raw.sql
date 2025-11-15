-- ================================================================
-- Stored Procedure: Load Polygon Data from External Table to Staging
-- ================================================================
-- Idempotent procedure to load daily data from GCS to staging table
-- File: 04_create_sp_load_raw.sql
-- Project: sunny-advantage-471523-b3
-- Dataset: market_data

CREATE OR REPLACE PROCEDURE `sunny-advantage-471523-b3.market_data.sp_load_polygon_raw`(
  target_date DATE
)
BEGIN
  DECLARE file_path STRING;
  DECLARE records_loaded INT64;
  DECLARE records_already_exist INT64;

  -- Construct file path
  SET file_path = CONCAT(
    'gs://ss-bucket-polygon-incremental/polygon/daily/polygon_',
    FORMAT_DATE('%Y-%m-%d', target_date),
    '.parquet'
  );

  -- Check if data already exists for this date (idempotency check)
  SET records_already_exist = (
    SELECT COUNT(*)
    FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
    WHERE trading_day = target_date
      AND source = 'polygon'
  );

  IF records_already_exist > 0 THEN
    -- Data already loaded - log and return
    SELECT
      target_date as processed_date,
      records_already_exist as existing_records,
      0 as new_records,
      'ALREADY_LOADED' as status,
      'Data for this date already exists in staging' as message;

    -- Update registry
    INSERT INTO `sunny-advantage-471523-b3.market_data.ingest_file_registry`
    (file_path, source, trade_date, process_ts, status, records_count, error_msg)
    VALUES (
      file_path,
      'polygon',
      target_date,
      CURRENT_TIMESTAMP(),
      'ALREADY_LOADED',
      records_already_exist,
      'Duplicate load attempt - data already exists'
    );

    RETURN;
  END IF;

  -- Load data from external table to staging
  -- Uses INSERT with NOT EXISTS to ensure no duplicates
  INSERT INTO `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
  (ticker, trading_day, open, high, low, close, volume, load_ts, source, file_name)
  SELECT
    ticker,
    date as trading_day,
    open,
    high,
    low,
    close,
    volume,
    CURRENT_TIMESTAMP() as load_ts,
    'polygon' as source,
    FORMAT_DATE('%Y-%m-%d', date) as file_name
  FROM `sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet`
  WHERE date = target_date
    -- Double-check no duplicates (should not happen with above check, but safety measure)
    AND NOT EXISTS (
      SELECT 1
      FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw` s
      WHERE s.ticker = ext_polygon_daily_parquet.ticker
        AND s.trading_day = target_date
        AND s.source = 'polygon'
    );

  -- Get count of records loaded
  SET records_loaded = @@row_count;

  -- Determine status
  DECLARE load_status STRING;
  DECLARE status_msg STRING;

  IF records_loaded = 0 THEN
    SET load_status = 'NO_DATA';
    SET status_msg = 'No records found in external table for this date (weekend/holiday?)';
  ELSIF records_loaded < 10000 THEN
    SET load_status = 'PARTIAL';
    SET status_msg = CONCAT('Loaded ', CAST(records_loaded AS STRING), ' records (expected ~11000)');
  ELSE
    SET load_status = 'SUCCESS';
    SET status_msg = CONCAT('Successfully loaded ', CAST(records_loaded AS STRING), ' records');
  END IF;

  -- Register load in control table
  INSERT INTO `sunny-advantage-471523-b3.market_data.ingest_file_registry`
  (file_path, source, trade_date, process_ts, status, records_count, error_msg)
  VALUES (
    file_path,
    'polygon',
    target_date,
    CURRENT_TIMESTAMP(),
    load_status,
    records_loaded,
    NULL
  );

  -- Return result summary
  SELECT
    target_date as processed_date,
    records_loaded as new_records,
    load_status as status,
    status_msg as message,
    file_path as source_file;

EXCEPTION WHEN ERROR THEN
  -- Handle errors
  DECLARE error_message STRING;
  SET error_message = @@error.message;

  -- Log error to control table
  INSERT INTO `sunny-advantage-471523-b3.market_data.ingest_file_registry`
  (file_path, source, trade_date, process_ts, status, records_count, error_msg)
  VALUES (
    file_path,
    'polygon',
    target_date,
    CURRENT_TIMESTAMP(),
    'FAILED',
    0,
    error_message
  );

  -- Re-raise error
  RAISE USING MESSAGE = error_message;
END;

-- ================================================================
-- Usage Examples
-- ================================================================

-- Load specific date
-- CALL `sunny-advantage-471523-b3.market_data.sp_load_polygon_raw`(DATE('2025-11-14'));

-- Load yesterday
-- CALL `sunny-advantage-471523-b3.market_data.sp_load_polygon_raw`(DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY));

-- Verify procedure exists
-- SELECT
--   routine_name,
--   routine_type,
--   routine_definition
-- FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.ROUTINES`
-- WHERE routine_name = 'sp_load_polygon_raw';

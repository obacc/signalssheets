-- Incremental load from external table to staging table
-- This script loads data for a specific date, avoiding duplicates
--
-- Parameters:
--   @target_date (DATE): The trading date to load (format: YYYY-MM-DD)
--
-- Usage:
--   bq query --use_legacy_sql=false --parameter=target_date:DATE:2024-11-14 < 01_incremental_load.sql

-- Declare parameter with default (yesterday)
DECLARE target_date DATE DEFAULT @target_date;

-- Log start of processing
SELECT CONCAT('Starting incremental load for date: ', CAST(target_date AS STRING)) as log_message;

-- Step 1: Insert new records from external table to staging
-- Only insert if records don't already exist for this date
INSERT INTO `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw`
  (ticker, date, open, high, low, close, volume, vwap, transactions, load_ts, source)
SELECT
  ticker,
  date,
  open,
  high,
  low,
  close,
  volume,
  vwap,
  transactions,
  load_ts,
  'polygon' as source
FROM `sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet`
WHERE date = target_date
  AND NOT EXISTS (
    -- Check if we already have data for this ticker and date
    SELECT 1
    FROM `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw` s
    WHERE s.ticker = ext_polygon_daily_parquet.ticker
      AND s.date = ext_polygon_daily_parquet.date
  );

-- Step 2: Record the ingestion in the file registry
-- Construct the expected file path
DECLARE file_path STRING;
SET file_path = CONCAT(
  'gs://ss-bucket-polygon-incremental/polygon/daily/polygon_',
  FORMAT_DATE('%Y-%m-%d', target_date),
  '.parquet'
);

-- Insert or update registry entry
MERGE `sunny-advantage-471523-b3.market_data.ingest_file_registry` T
USING (
  SELECT
    file_path as file_path,
    'polygon' as source,
    target_date as trade_date,
    CURRENT_TIMESTAMP() as process_ts,
    'SUCCESS' as status,
    (SELECT COUNT(*) FROM `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw`
     WHERE date = target_date) as records_count,
    NULL as error_msg,
    NULL as file_size_bytes,
    'parquet' as file_format
) S
ON T.file_path = S.file_path AND T.trade_date = S.trade_date
WHEN MATCHED THEN
  UPDATE SET
    process_ts = S.process_ts,
    status = S.status,
    records_count = S.records_count,
    error_msg = S.error_msg
WHEN NOT MATCHED THEN
  INSERT (file_path, source, trade_date, process_ts, status, records_count, error_msg, file_format)
  VALUES (S.file_path, S.source, S.trade_date, S.process_ts, S.status, S.records_count, S.error_msg, S.file_format);

-- Step 3: Return summary statistics
SELECT
  target_date as loaded_date,
  COUNT(*) as total_records_in_staging,
  COUNT(DISTINCT ticker) as unique_tickers,
  MIN(open) as min_open_price,
  MAX(close) as max_close_price,
  SUM(volume) as total_volume,
  COUNTIF(open IS NULL OR close IS NULL) as records_with_null_prices,
  CURRENT_TIMESTAMP() as processing_completed_at
FROM `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw`
WHERE date = target_date;

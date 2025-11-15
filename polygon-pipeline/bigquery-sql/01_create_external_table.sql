-- ================================================================
-- Create External Table for Polygon Parquet Files in GCS
-- ================================================================
-- This table provides SQL access to Parquet files without loading data
-- File: 01_create_external_table.sql
-- Project: sunny-advantage-471523-b3
-- Dataset: market_data

-- Drop existing external table if recreating
-- DROP EXTERNAL TABLE IF EXISTS `sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet`;

CREATE OR REPLACE EXTERNAL TABLE `sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet`
(
  ticker STRING OPTIONS(description='Stock ticker symbol'),
  date DATE OPTIONS(description='Trading date'),
  open FLOAT64 OPTIONS(description='Opening price'),
  high FLOAT64 OPTIONS(description='Highest price of the day'),
  low FLOAT64 OPTIONS(description='Lowest price of the day'),
  close FLOAT64 OPTIONS(description='Closing price'),
  volume INT64 OPTIONS(description='Trading volume'),
  load_ts TIMESTAMP OPTIONS(description='Timestamp when data was loaded to GCS')
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://ss-bucket-polygon-incremental/polygon/daily/polygon_*.parquet'],
  description = 'External table over Polygon.io daily Parquet files in GCS',
  max_staleness = INTERVAL 1 HOUR
);

-- Verify table creation
SELECT
  table_name,
  table_type,
  ddl
FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.TABLES`
WHERE table_name = 'ext_polygon_daily_parquet';

-- Test query (optional - comment out if no data yet)
-- SELECT
--   date,
--   COUNT(*) as ticker_count,
--   MIN(ticker) as first_ticker,
--   MAX(ticker) as last_ticker
-- FROM `sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet`
-- WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
-- GROUP BY date
-- ORDER BY date DESC;

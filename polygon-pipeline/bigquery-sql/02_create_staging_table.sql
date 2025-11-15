-- ================================================================
-- Create Staging Table for Polygon Raw Data
-- ================================================================
-- This table stores raw data from GCS before normalization
-- File: 02_create_staging_table.sql
-- Project: sunny-advantage-471523-b3
-- Dataset: market_data

-- WARNING: Only run if table doesn't exist
-- Check first with: bq show sunny-advantage-471523-b3:market_data.stg_prices_polygon_raw

CREATE TABLE IF NOT EXISTS `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
(
  ticker STRING NOT NULL OPTIONS(description='Stock ticker symbol'),
  trading_day DATE NOT NULL OPTIONS(description='Trading date (partition key)'),
  open FLOAT64 OPTIONS(description='Opening price'),
  high FLOAT64 OPTIONS(description='Highest price of the day'),
  low FLOAT64 OPTIONS(description='Lowest price of the day'),
  close FLOAT64 OPTIONS(description='Closing price (unadjusted)'),
  volume INT64 OPTIONS(description='Trading volume'),
  load_ts TIMESTAMP NOT NULL OPTIONS(description='Timestamp when loaded to BigQuery'),
  source STRING NOT NULL DEFAULT 'polygon' OPTIONS(description='Data source identifier'),
  file_name STRING OPTIONS(description='Source file name for traceability')
)
PARTITION BY trading_day
CLUSTER BY ticker
OPTIONS(
  description = 'Staging table for raw daily price data from Polygon.io',
  require_partition_filter = TRUE,
  partition_expiration_days = 30,
  labels = [("source", "polygon"), ("zone", "raw"), ("tier", "staging")]
);

-- Verify table creation
SELECT
  table_name,
  table_type,
  CASE
    WHEN is_partitioning_column = 'YES' THEN 'PARTITIONED'
    ELSE 'NOT_PARTITIONED'
  END as partition_status
FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.TABLES`
WHERE table_name = 'stg_prices_polygon_raw';

-- Show table schema
SELECT
  column_name,
  data_type,
  is_nullable,
  is_partitioning_column,
  clustering_ordinal_position
FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'stg_prices_polygon_raw'
ORDER BY ordinal_position;

-- Show table metadata
SELECT
  option_name,
  option_value
FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.TABLE_OPTIONS`
WHERE table_name = 'stg_prices_polygon_raw';

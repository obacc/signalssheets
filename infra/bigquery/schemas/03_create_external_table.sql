-- Create external table pointing to Parquet files in GCS
-- This allows querying GCS data directly without loading into BigQuery
-- Useful for ad-hoc queries and as source for scheduled ingestion

CREATE OR REPLACE EXTERNAL TABLE `sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet`
(
  ticker STRING,
  date DATE,
  open FLOAT64,
  high FLOAT64,
  low FLOAT64,
  close FLOAT64,
  volume INT64,
  vwap FLOAT64,
  transactions INT64,
  load_ts TIMESTAMP
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://ss-bucket-polygon-incremental/polygon/daily/*.parquet'],
  description = 'External table for Polygon daily Parquet files in GCS',
  max_staleness = INTERVAL 1 HOUR,  -- Cache for 1 hour
  metadata_cache_mode = 'AUTOMATIC'
);

-- Note: This external table automatically picks up new files added to the GCS bucket
-- Query examples:
--   SELECT * FROM `market_data.ext_polygon_daily_parquet` WHERE date = '2024-11-14';
--   SELECT COUNT(DISTINCT ticker) FROM `market_data.ext_polygon_daily_parquet` WHERE date >= '2024-11-01';

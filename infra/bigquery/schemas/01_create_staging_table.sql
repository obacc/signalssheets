-- Create staging table for raw Polygon daily data
-- This table receives data directly from GCS via external table or scheduled queries
-- Partitioned by date for efficient querying
-- Clustered by ticker for fast ticker-based lookups

CREATE TABLE IF NOT EXISTS `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw`
(
  -- Identification fields
  ticker STRING NOT NULL OPTIONS(description='Stock ticker symbol'),
  date DATE NOT NULL OPTIONS(description='Trading date'),

  -- OHLCV data
  open FLOAT64 OPTIONS(description='Opening price'),
  high FLOAT64 OPTIONS(description='Highest price'),
  low FLOAT64 OPTIONS(description='Lowest price'),
  close FLOAT64 OPTIONS(description='Closing price'),
  volume INT64 OPTIONS(description='Trading volume'),

  -- Additional metrics from Polygon
  vwap FLOAT64 OPTIONS(description='Volume-weighted average price'),
  transactions INT64 OPTIONS(description='Number of transactions'),

  -- Metadata
  load_ts TIMESTAMP NOT NULL OPTIONS(description='Timestamp when data was loaded'),
  source STRING DEFAULT 'polygon' OPTIONS(description='Data source identifier')
)
PARTITION BY date
CLUSTER BY ticker
OPTIONS(
  description='Staging table for daily Polygon market data - raw ingestion from GCS',
  require_partition_filter=true,
  partition_expiration_days=null,
  labels=[("environment", "production"), ("source", "polygon"), ("layer", "staging")]
);

-- Add table description with usage notes
-- Note: require_partition_filter=true forces queries to include WHERE date = ... for cost control

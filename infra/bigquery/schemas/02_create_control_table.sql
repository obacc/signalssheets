-- Create file ingestion registry table
-- This table tracks which files have been processed to prevent duplicates
-- and provides audit trail for data lineage

CREATE TABLE IF NOT EXISTS `sunny-advantage-471523-b3.market_data.ingest_file_registry`
(
  -- File identification
  file_path STRING NOT NULL OPTIONS(description='Full GCS path of processed file'),
  source STRING NOT NULL OPTIONS(description='Data source (polygon, alpha_vantage, etc)'),
  trade_date DATE NOT NULL OPTIONS(description='Trading date covered by the file'),

  -- Processing metadata
  process_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP() OPTIONS(description='When file was processed'),
  status STRING OPTIONS(description='Processing status: SUCCESS, FAILED, PARTIAL'),
  records_count INT64 OPTIONS(description='Number of records loaded from file'),
  error_msg STRING OPTIONS(description='Error message if status = FAILED'),

  -- File metadata
  file_size_bytes INT64 OPTIONS(description='File size in bytes'),
  file_format STRING OPTIONS(description='File format: parquet, csv, json'),

  -- Deduplication key
  PRIMARY KEY (file_path, trade_date) NOT ENFORCED
)
PARTITION BY trade_date
CLUSTER BY source, status
OPTIONS(
  description='Registry of ingested files for data lineage and duplicate prevention',
  require_partition_filter=false,
  labels=[("environment", "production"), ("layer", "control")]
);

-- Create index on common query patterns
CREATE INDEX IF NOT EXISTS idx_status_date
ON `sunny-advantage-471523-b3.market_data.ingest_file_registry`(status, trade_date)
OPTIONS(description='Index for querying failed/successful loads by date');

-- ================================================================
-- Create File Ingestion Control Table
-- ================================================================
-- Tracks all file loads for auditing and monitoring
-- File: 03_create_control_table.sql
-- Project: sunny-advantage-471523-b3
-- Dataset: market_data

CREATE TABLE IF NOT EXISTS `sunny-advantage-471523-b3.market_data.ingest_file_registry`
(
  file_path STRING NOT NULL OPTIONS(description='Full GCS path to processed file'),
  source STRING NOT NULL OPTIONS(description='Data source identifier (e.g., polygon, stooq)'),
  trade_date DATE NOT NULL OPTIONS(description='Trading date of the data (partition key)'),
  process_ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() OPTIONS(description='When the file was processed'),
  status STRING OPTIONS(description='Processing status: SUCCESS, FAILED, NO_DATA, PARTIAL'),
  records_count INT64 OPTIONS(description='Number of records loaded from file'),
  error_msg STRING OPTIONS(description='Error message if status=FAILED')
)
PARTITION BY trade_date
OPTIONS(
  description = 'Registry of all file ingestion operations across data sources',
  require_partition_filter = FALSE,
  labels = [("zone", "control"), ("tier", "metadata")]
);

-- Verify table creation
SELECT
  table_name,
  table_type
FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.TABLES`
WHERE table_name = 'ingest_file_registry';

-- Show schema
SELECT
  column_name,
  data_type,
  is_nullable
FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'ingest_file_registry'
ORDER BY ordinal_position;

-- Test query (will be empty initially)
SELECT
  source,
  status,
  COUNT(*) as file_count,
  SUM(records_count) as total_records
FROM `sunny-advantage-471523-b3.market_data.ingest_file_registry`
GROUP BY source, status
ORDER BY source, status;

#!/bin/bash
# Script to create BigQuery Scheduled Query for daily data ingestion
# This query runs daily at 7:00 PM EST (1 hour after Cloud Function execution)

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
DATASET="market_data"
LOCATION="us"
DISPLAY_NAME="polygon_daily_load"
SCHEDULE="every day 19:00"  # 7:00 PM UTC-5 (EST)
TIME_ZONE="America/New_York"

echo "========================================="
echo "Setting up BigQuery Scheduled Query"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Display Name: $DISPLAY_NAME"
echo "Schedule: $SCHEDULE ($TIME_ZONE)"
echo ""

# Set the active project
gcloud config set project $PROJECT_ID

# Read the SQL query from file
QUERY_FILE="../bigquery/queries/01_incremental_load.sql"

if [ ! -f "$QUERY_FILE" ]; then
    echo "❌ Error: Query file not found: $QUERY_FILE"
    exit 1
fi

# Read query content and prepare it for scheduled query
# Remove DECLARE statement as parameters are passed differently in scheduled queries
QUERY_SQL=$(cat $QUERY_FILE | grep -v "^DECLARE target_date")

# Create the scheduled query using bq command
echo "Creating scheduled query..."
echo "Note: The query will run daily and load data for the previous trading day"
echo ""

# Create temporary SQL file with parameter
cat > /tmp/polygon_scheduled_query.sql <<'EOF'
-- Incremental load scheduled query
-- Runs daily at 7 PM EST to load previous trading day's data

DECLARE target_date DATE DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY);

-- Log start
SELECT CONCAT('Loading data for: ', CAST(target_date AS STRING)) as log_message;

-- Insert data from external table
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
    SELECT 1
    FROM `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw` s
    WHERE s.ticker = ext_polygon_daily_parquet.ticker
      AND s.date = ext_polygon_daily_parquet.date
  );

-- Update file registry
DECLARE file_path STRING;
SET file_path = CONCAT(
  'gs://ss-bucket-polygon-incremental/polygon/daily/polygon_',
  FORMAT_DATE('%Y-%m-%d', target_date),
  '.parquet'
);

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
    'parquet' as file_format
) S
ON T.file_path = S.file_path AND T.trade_date = S.trade_date
WHEN MATCHED THEN
  UPDATE SET
    process_ts = S.process_ts,
    status = S.status,
    records_count = S.records_count
WHEN NOT MATCHED THEN
  INSERT (file_path, source, trade_date, process_ts, status, records_count, error_msg, file_format)
  VALUES (S.file_path, S.source, S.trade_date, S.process_ts, S.status, S.records_count, S.error_msg, S.file_format);
EOF

# Create scheduled query using bq
bq mk \
    --project_id=$PROJECT_ID \
    --transfer_config \
    --data_source=scheduled_query \
    --display_name="$DISPLAY_NAME" \
    --target_dataset=$DATASET \
    --schedule="$SCHEDULE" \
    --location=$LOCATION \
    --params="{\"query\":\"$(cat /tmp/polygon_scheduled_query.sql | tr '\n' ' ')\"}" \
    || echo "Note: Transfer config may already exist. Use 'bq update' to modify."

echo ""
echo "========================================="
echo "Scheduled Query setup completed!"
echo "========================================="
echo ""

# List all scheduled queries
echo "Current scheduled queries in project:"
bq ls \
    --project_id=$PROJECT_ID \
    --transfer_config \
    --transfer_location=$LOCATION \
    --data_source=scheduled_query

echo ""
echo "To run the query manually:"
echo "  bq query --project_id=$PROJECT_ID --use_legacy_sql=false --parameter=target_date:DATE:$(date -d 'yesterday' +%Y-%m-%d) < $QUERY_FILE"
echo ""
echo "To view scheduled query runs:"
echo "  bq ls --project_id=$PROJECT_ID --transfer_config --transfer_location=$LOCATION"
echo ""

# Cleanup
rm -f /tmp/polygon_scheduled_query.sql

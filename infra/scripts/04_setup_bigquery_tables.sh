#!/bin/bash
# Script to create all BigQuery tables and schemas
# Creates staging, control, and external tables in the market_data dataset

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
DATASET="market_data"
LOCATION="US"

echo "========================================="
echo "Setting up BigQuery Tables"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Dataset: $DATASET"
echo "Location: $LOCATION"
echo ""

# Set the active project
gcloud config set project $PROJECT_ID

# Create dataset if it doesn't exist
echo "Creating/verifying dataset..."
if ! bq show --project_id=$PROJECT_ID $DATASET &>/dev/null; then
    bq mk \
        --project_id=$PROJECT_ID \
        --location=$LOCATION \
        --dataset \
        --description="Market data from various sources (Polygon, etc)" \
        --label=environment:production \
        $DATASET
    echo "✓ Dataset created"
else
    echo "✓ Dataset already exists"
fi

echo ""

# Create staging table
echo "Creating staging table..."
bq query \
    --project_id=$PROJECT_ID \
    --use_legacy_sql=false \
    < ../bigquery/schemas/01_create_staging_table.sql

echo "✓ Staging table created/verified"
echo ""

# Create control table
echo "Creating control/registry table..."
bq query \
    --project_id=$PROJECT_ID \
    --use_legacy_sql=false \
    < ../bigquery/schemas/02_create_control_table.sql

echo "✓ Control table created/verified"
echo ""

# Create external table
echo "Creating external table..."
bq query \
    --project_id=$PROJECT_ID \
    --use_legacy_sql=false \
    < ../bigquery/schemas/03_create_external_table.sql

echo "✓ External table created/verified"
echo ""

echo "========================================="
echo "BigQuery tables setup completed!"
echo "========================================="
echo ""

# Show table information
echo "Verifying created tables:"
echo ""

echo "1. Staging table:"
bq show --project_id=$PROJECT_ID --format=prettyjson ${DATASET}.staging_polygon_daily_raw | head -20

echo ""
echo "2. Control table:"
bq show --project_id=$PROJECT_ID --format=prettyjson ${DATASET}.ingest_file_registry | head -20

echo ""
echo "3. External table:"
bq show --project_id=$PROJECT_ID --format=prettyjson ${DATASET}.ext_polygon_daily_parquet | head -20

echo ""
echo "Query the tables with:"
echo "  bq query --use_legacy_sql=false 'SELECT COUNT(*) FROM \`${PROJECT_ID}.${DATASET}.staging_polygon_daily_raw\` WHERE date >= CURRENT_DATE() - 7'"
echo ""

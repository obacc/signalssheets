#!/bin/bash
# ================================================================
# Deploy BigQuery Tables, Procedures, and Views
# ================================================================
# File: 04_deploy_bigquery.sh
# Description: Creates all BigQuery objects for Polygon pipeline

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
DATASET="market_data"
SQL_DIR="../bigquery-sql"

echo "========================================="
echo "Polygon Pipeline - BigQuery Deployment"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Dataset: $DATASET"
echo ""

# Verify SQL directory exists
if [ ! -d "$SQL_DIR" ]; then
    echo "❌ Error: SQL directory not found: $SQL_DIR"
    exit 1
fi

# Set active project
echo "Setting active GCP project..."
gcloud config set project $PROJECT_ID

# Verify dataset exists
echo "Verifying dataset exists..."
if bq show --project_id=$PROJECT_ID $DATASET &> /dev/null; then
    echo "✅ Dataset $DATASET exists"
else
    echo "❌ Error: Dataset $DATASET does not exist"
    echo "Create it first with:"
    echo "  bq mk --project_id=$PROJECT_ID --location=US $DATASET"
    exit 1
fi

# Deploy SQL scripts in order
echo ""
echo "========================================="
echo "Deploying SQL objects..."
echo "========================================="

# 1. External Table
echo ""
echo "1/6 Creating external table..."
if bq query --project_id=$PROJECT_ID --use_legacy_sql=false < "$SQL_DIR/01_create_external_table.sql"; then
    echo "✅ External table created"
else
    echo "⚠️  External table creation had warnings (may already exist)"
fi

# 2. Staging Table
echo ""
echo "2/6 Creating staging table..."
if bq query --project_id=$PROJECT_ID --use_legacy_sql=false < "$SQL_DIR/02_create_staging_table.sql"; then
    echo "✅ Staging table created"
else
    echo "⚠️  Staging table creation had warnings (may already exist)"
fi

# 3. Control Table
echo ""
echo "3/6 Creating control table..."
if bq query --project_id=$PROJECT_ID --use_legacy_sql=false < "$SQL_DIR/03_create_control_table.sql"; then
    echo "✅ Control table created"
else
    echo "⚠️  Control table creation had warnings (may already exist)"
fi

# 4. Load Procedure
echo ""
echo "4/6 Creating sp_load_polygon_raw procedure..."
if bq query --project_id=$PROJECT_ID --use_legacy_sql=false < "$SQL_DIR/04_create_sp_load_raw.sql"; then
    echo "✅ Load procedure created"
else
    echo "❌ Failed to create load procedure"
    exit 1
fi

# 5. Merge Procedure
echo ""
echo "5/6 Creating sp_merge_polygon_to_prices procedure..."
if bq query --project_id=$PROJECT_ID --use_legacy_sql=false < "$SQL_DIR/05_create_sp_merge_prices.sql"; then
    echo "✅ Merge procedure created"
else
    echo "❌ Failed to create merge procedure"
    exit 1
fi

# 6. Missing Days View
echo ""
echo "6/6 Creating v_missing_days_polygon view..."
if bq query --project_id=$PROJECT_ID --use_legacy_sql=false < "$SQL_DIR/06_create_missing_days_view.sql"; then
    echo "✅ Missing days view created"
else
    echo "❌ Failed to create missing days view"
    exit 1
fi

# Verify deployments
echo ""
echo "========================================="
echo "Verifying deployments..."
echo "========================================="

echo ""
echo "Tables:"
bq ls --project_id=$PROJECT_ID $DATASET | grep -E "(ext_polygon|stg_prices_polygon|ingest_file|Prices)"

echo ""
echo "Views:"
bq ls --project_id=$PROJECT_ID $DATASET | grep "v_missing_days"

echo ""
echo "Procedures:"
bq ls --project_id=$PROJECT_ID --routines $DATASET | grep -E "sp_(load|merge)"

echo ""
echo "========================================="
echo "✅ BigQuery deployment complete!"
echo "========================================="
echo ""
echo "Created objects:"
echo "- ext_polygon_daily_parquet (external table)"
echo "- stg_prices_polygon_raw (staging table)"
echo "- ingest_file_registry (control table)"
echo "- sp_load_polygon_raw (stored procedure)"
echo "- sp_merge_polygon_to_prices (stored procedure)"
echo "- v_missing_days_polygon (view)"
echo ""
echo "Next steps:"
echo "1. Verify Prices table exists (should already exist)"
echo "2. Run 05_test_pipeline.sh to test end-to-end"
echo "3. Setup scheduled query for daily automation"

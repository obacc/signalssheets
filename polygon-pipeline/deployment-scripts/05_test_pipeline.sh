#!/bin/bash
# ================================================================
# Test Polygon Pipeline End-to-End
# ================================================================
# File: 05_test_pipeline.sh
# Description: Tests complete pipeline with a specific date

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
REGION="us-central1"
FUNCTION_NAME="polygon-daily-loader"
DATASET="market_data"

# Test date (use a recent trading day)
TEST_DATE="${1:-2025-11-14}"  # Default or from command line argument

echo "========================================="
echo "Polygon Pipeline - End-to-End Test"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Test Date: $TEST_DATE"
echo ""

# Validate date format
if ! date -d "$TEST_DATE" &> /dev/null; then
    echo "❌ Error: Invalid date format: $TEST_DATE"
    echo "Usage: $0 [YYYY-MM-DD]"
    exit 1
fi

echo "This test will:"
echo "1. Trigger Cloud Function to download data"
echo "2. Load data to staging table"
echo "3. Merge data to Prices table"
echo "4. Run validation queries"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Test cancelled"
    exit 0
fi

# Step 1: Trigger Cloud Function
echo ""
echo "========================================="
echo "Step 1: Triggering Cloud Function"
echo "========================================="
echo "Downloading data for $TEST_DATE..."

gcloud functions call $FUNCTION_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --gen2 \
    --data="{\"date\":\"$TEST_DATE\"}"

echo ""
echo "Waiting 10 seconds for download to complete..."
sleep 10

# Check function logs
echo ""
echo "Function logs:"
gcloud functions logs read $FUNCTION_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --limit=10

# Verify file in GCS
echo ""
echo "Verifying file in GCS..."
EXPECTED_FILE="gs://ss-bucket-polygon-incremental/polygon/daily/polygon_${TEST_DATE}.parquet"
if gsutil ls "$EXPECTED_FILE" &> /dev/null; then
    FILE_SIZE=$(gsutil du -h "$EXPECTED_FILE" | awk '{print $1}')
    echo "✅ File exists: $EXPECTED_FILE"
    echo "   Size: $FILE_SIZE"
else
    echo "❌ File not found: $EXPECTED_FILE"
    echo "Check function logs above for errors"
    exit 1
fi

# Step 2: Load to staging
echo ""
echo "========================================="
echo "Step 2: Loading to Staging Table"
echo "========================================="

bq query --project_id=$PROJECT_ID --use_legacy_sql=false \
    "CALL \`${PROJECT_ID}.${DATASET}.sp_load_polygon_raw\`(DATE('$TEST_DATE'));"

# Verify staging data
echo ""
echo "Verifying staging data..."
STAGING_COUNT=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
    "SELECT COUNT(*) as count
     FROM \`${PROJECT_ID}.${DATASET}.stg_prices_polygon_raw\`
     WHERE trading_day = '$TEST_DATE' AND source = 'polygon'" | tail -1)

echo "Records in staging: $STAGING_COUNT"

if [ "$STAGING_COUNT" -lt 10000 ]; then
    echo "⚠️  Warning: Expected ~11,000 records, got $STAGING_COUNT"
else
    echo "✅ Staging count looks good"
fi

# Step 3: Merge to Prices
echo ""
echo "========================================="
echo "Step 3: Merging to Prices Table"
echo "========================================="

bq query --project_id=$PROJECT_ID --use_legacy_sql=false \
    "CALL \`${PROJECT_ID}.${DATASET}.sp_merge_polygon_to_prices\`(DATE('$TEST_DATE'));"

# Verify Prices data
echo ""
echo "Verifying Prices data..."
PRICES_COUNT=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
    "SELECT COUNT(*) as count
     FROM \`${PROJECT_ID}.${DATASET}.Prices\`
     WHERE trading_day = '$TEST_DATE' AND source = 'polygon'" | tail -1)

echo "Records in Prices: $PRICES_COUNT"

if [ "$STAGING_COUNT" = "$PRICES_COUNT" ]; then
    echo "✅ Staging and Prices counts match"
else
    echo "⚠️  Warning: Staging ($STAGING_COUNT) and Prices ($PRICES_COUNT) counts differ"
fi

# Step 4: Run validation queries
echo ""
echo "========================================="
echo "Step 4: Running Validation Checks"
echo "========================================="

# Check for duplicates in staging
echo ""
echo "Checking for duplicates in staging..."
STAGING_DUPES=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
    "SELECT COUNT(*) as count
     FROM (
       SELECT ticker, trading_day, COUNT(*) as cnt
       FROM \`${PROJECT_ID}.${DATASET}.stg_prices_polygon_raw\`
       WHERE trading_day = '$TEST_DATE' AND source = 'polygon'
       GROUP BY ticker, trading_day
       HAVING COUNT(*) > 1
     )" | tail -1)

if [ "$STAGING_DUPES" -eq 0 ]; then
    echo "✅ No duplicates in staging"
else
    echo "❌ Found $STAGING_DUPES duplicate groups in staging"
fi

# Check for duplicates in Prices
echo ""
echo "Checking for duplicates in Prices..."
PRICES_DUPES=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
    "SELECT COUNT(*) as count
     FROM (
       SELECT ticker, trading_day, source, COUNT(*) as cnt
       FROM \`${PROJECT_ID}.${DATASET}.Prices\`
       WHERE trading_day = '$TEST_DATE' AND source = 'polygon'
       GROUP BY ticker, trading_day, source
       HAVING COUNT(*) > 1
     )" | tail -1)

if [ "$PRICES_DUPES" -eq 0 ]; then
    echo "✅ No duplicates in Prices"
else
    echo "❌ Found $PRICES_DUPES duplicate groups in Prices"
fi

# Check for NULL prices
echo ""
echo "Checking for NULL prices..."
NULL_PRICES=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
    "SELECT COUNT(*) as count
     FROM \`${PROJECT_ID}.${DATASET}.stg_prices_polygon_raw\`
     WHERE trading_day = '$TEST_DATE'
       AND source = 'polygon'
       AND (open IS NULL OR close IS NULL)" | tail -1)

if [ "$NULL_PRICES" -eq 0 ]; then
    echo "✅ No NULL prices found"
else
    echo "⚠️  Found $NULL_PRICES records with NULL prices"
fi

# Check file registry
echo ""
echo "Checking file registry..."
bq query --project_id=$PROJECT_ID --use_legacy_sql=false \
    "SELECT
       trade_date,
       status,
       records_count,
       process_ts
     FROM \`${PROJECT_ID}.${DATASET}.ingest_file_registry\`
     WHERE trade_date = '$TEST_DATE' AND source = 'polygon'
     ORDER BY process_ts DESC
     LIMIT 5"

# Final summary
echo ""
echo "========================================="
echo "Test Summary for $TEST_DATE"
echo "========================================="
echo "✅ Cloud Function: SUCCESS"
echo "✅ GCS File: $FILE_SIZE"
echo "✅ Staging Records: $STAGING_COUNT"
echo "✅ Prices Records: $PRICES_COUNT"
echo "✅ Duplicates (Staging): $STAGING_DUPES"
echo "✅ Duplicates (Prices): $PRICES_DUPES"
echo "✅ NULL Prices: $NULL_PRICES"
echo ""

# Final validation
if [ "$STAGING_COUNT" -gt 10000 ] && \
   [ "$STAGING_COUNT" = "$PRICES_COUNT" ] && \
   [ "$STAGING_DUPES" -eq 0 ] && \
   [ "$PRICES_DUPES" -eq 0 ] && \
   [ "$NULL_PRICES" -eq 0 ]; then
    echo "✅✅✅ ALL CHECKS PASSED! Pipeline is working correctly."
    echo ""
    echo "Next step: Setup scheduled query for daily automation"
else
    echo "⚠️⚠️⚠️ Some checks failed. Review output above."
fi

echo ""
echo "========================================="

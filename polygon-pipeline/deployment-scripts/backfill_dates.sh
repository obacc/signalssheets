#!/bin/bash
# ================================================================
# Backfill Polygon Data for Date Range
# ================================================================
# File: backfill_dates.sh
# Description: Downloads and processes Polygon data for multiple dates
# Usage: ./backfill_dates.sh START_DATE END_DATE
#        ./backfill_dates.sh 2025-11-01 2025-11-15

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
REGION="us-central1"
FUNCTION_NAME="polygon-daily-loader"
DATASET="market_data"

# Get date range from arguments
START_DATE="${1}"
END_DATE="${2}"

# Validate arguments
if [ -z "$START_DATE" ] || [ -z "$END_DATE" ]; then
    echo "Usage: $0 START_DATE END_DATE"
    echo "Example: $0 2025-11-01 2025-11-15"
    exit 1
fi

# Validate date formats
if ! date -d "$START_DATE" &> /dev/null; then
    echo "❌ Error: Invalid start date: $START_DATE"
    exit 1
fi

if ! date -d "$END_DATE" &> /dev/null; then
    echo "❌ Error: Invalid end date: $END_DATE"
    exit 1
fi

echo "========================================="
echo "Polygon Pipeline - Backfill Dates"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Date Range: $START_DATE to $END_DATE"
echo ""

# Calculate number of days
DAYS=$(( ( $(date -d "$END_DATE" +%s) - $(date -d "$START_DATE" +%s) ) / 86400 + 1 ))
echo "Total days: $DAYS"
echo ""

read -p "This will process $DAYS dates. Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Backfill cancelled"
    exit 0
fi

# Initialize counters
SUCCESS_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

# Process each date
current_date="$START_DATE"
while [[ "$current_date" < "$END_DATE" ]] || [[ "$current_date" == "$END_DATE" ]]; do
    echo ""
    echo "========================================="
    echo "Processing: $current_date"
    echo "========================================="

    # Skip weekends
    DAY_OF_WEEK=$(date -d "$current_date" +%u)  # 1=Monday, 7=Sunday
    if [ "$DAY_OF_WEEK" -eq 6 ] || [ "$DAY_OF_WEEK" -eq 7 ]; then
        echo "⏭️  Skipping $current_date (weekend)"
        ((SKIPPED_COUNT++))
        current_date=$(date -I -d "$current_date + 1 day")
        continue
    fi

    # Check if already loaded
    EXISTING_COUNT=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
        "SELECT COUNT(*) as count
         FROM \`${PROJECT_ID}.${DATASET}.stg_prices_polygon_raw\`
         WHERE trading_day = '$current_date' AND source = 'polygon'" 2>/dev/null | tail -1 || echo "0")

    if [ "$EXISTING_COUNT" -gt 0 ]; then
        echo "ℹ️  Data already exists ($EXISTING_COUNT records), skipping..."
        ((SKIPPED_COUNT++))
        current_date=$(date -I -d "$current_date + 1 day")
        continue
    fi

    # Step 1: Download from Polygon
    echo "1/3 Downloading from Polygon..."
    if gcloud functions call $FUNCTION_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --gen2 \
        --data="{\"date\":\"$current_date\"}" &> /tmp/cf_output.txt; then
        echo "✅ Download successful"
    else
        echo "❌ Download failed"
        cat /tmp/cf_output.txt
        ((FAILED_COUNT++))
        current_date=$(date -I -d "$current_date + 1 day")
        continue
    fi

    # Wait for file to be written
    sleep 5

    # Step 2: Load to staging
    echo "2/3 Loading to staging..."
    if bq query --project_id=$PROJECT_ID --use_legacy_sql=false \
        "CALL \`${PROJECT_ID}.${DATASET}.sp_load_polygon_raw\`(DATE('$current_date'));" \
        &> /tmp/bq_load_output.txt; then
        echo "✅ Staging load successful"
    else
        echo "❌ Staging load failed"
        cat /tmp/bq_load_output.txt
        ((FAILED_COUNT++))
        current_date=$(date -I -d "$current_date + 1 day")
        continue
    fi

    # Step 3: Merge to Prices
    echo "3/3 Merging to Prices..."
    if bq query --project_id=$PROJECT_ID --use_legacy_sql=false \
        "CALL \`${PROJECT_ID}.${DATASET}.sp_merge_polygon_to_prices\`(DATE('$current_date'));" \
        &> /tmp/bq_merge_output.txt; then
        echo "✅ Merge successful"
        ((SUCCESS_COUNT++))
    else
        echo "❌ Merge failed"
        cat /tmp/bq_merge_output.txt
        ((FAILED_COUNT++))
        current_date=$(date -I -d "$current_date + 1 day")
        continue
    fi

    # Verify
    FINAL_COUNT=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
        "SELECT COUNT(*) as count
         FROM \`${PROJECT_ID}.${DATASET}.Prices\`
         WHERE trading_day = '$current_date' AND source = 'polygon'" | tail -1)

    echo "✅ $current_date complete ($FINAL_COUNT records in Prices)"

    # Move to next date
    current_date=$(date -I -d "$current_date + 1 day")

    # Rate limiting: pause between requests
    echo "Waiting 5 seconds before next date..."
    sleep 5
done

# Final summary
echo ""
echo "========================================="
echo "Backfill Summary"
echo "========================================="
echo "Date Range: $START_DATE to $END_DATE"
echo "Total Days: $DAYS"
echo "✅ Successful: $SUCCESS_COUNT"
echo "❌ Failed: $FAILED_COUNT"
echo "⏭️  Skipped: $SKIPPED_COUNT"
echo ""

if [ "$FAILED_COUNT" -eq 0 ]; then
    echo "✅✅✅ Backfill completed successfully!"
else
    echo "⚠️  Backfill completed with $FAILED_COUNT failures"
    echo "Review logs above for details"
fi

echo ""
echo "Verify results with:"
echo "bq query --use_legacy_sql=false \"
SELECT trading_day, COUNT(*) as records
FROM \\\`${PROJECT_ID}.${DATASET}.Prices\\\`
WHERE trading_day BETWEEN '$START_DATE' AND '$END_DATE'
  AND source = 'polygon'
GROUP BY trading_day
ORDER BY trading_day
\""

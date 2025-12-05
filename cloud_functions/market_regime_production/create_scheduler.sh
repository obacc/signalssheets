#!/bin/bash
# Create Cloud Scheduler for Market Regime Update
# Schedule: 2:00 AM EST daily (07:00 UTC)

set -e

PROJECT_ID="sunny-advantage-471523-b3"
JOB_NAME="market-regime-daily"
FUNCTION_NAME="market-regime-update"
REGION="us-central1"
SCHEDULE="0 7 * * *"  # 07:00 UTC = 02:00 AM EST
TIMEZONE="America/New_York"

echo "========================================"
echo "Creating Cloud Scheduler Job"
echo "========================================"
echo "Project:   $PROJECT_ID"
echo "Job Name:  $JOB_NAME"
echo "Schedule:  $SCHEDULE ($TIMEZONE)"
echo "           = 2:00 AM EST daily"
echo "========================================"

# Function URL
FUNCTION_URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME"

# Create scheduler job
gcloud scheduler jobs create http $JOB_NAME \
    --project=$PROJECT_ID \
    --location=$REGION \
    --schedule="$SCHEDULE" \
    --time-zone="$TIMEZONE" \
    --uri="$FUNCTION_URL" \
    --http-method=POST \
    --description="Daily Market Regime calculation at 2:00 AM EST"

echo ""
echo "========================================"
echo "Scheduler Created!"
echo "========================================"
echo ""
echo "View in console:"
echo "  https://console.cloud.google.com/cloudscheduler?project=$PROJECT_ID"
echo ""
echo "Run manually:"
echo "  gcloud scheduler jobs run $JOB_NAME --project=$PROJECT_ID --location=$REGION"
echo ""

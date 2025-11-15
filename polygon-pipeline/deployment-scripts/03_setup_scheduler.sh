#!/bin/bash
# ================================================================
# Setup Cloud Scheduler for Daily Polygon Downloads
# ================================================================
# File: 03_setup_scheduler.sh
# Description: Creates Cloud Scheduler job to trigger Cloud Function daily

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
REGION="us-central1"
JOB_NAME="polygon-daily-download"
FUNCTION_NAME="polygon-daily-loader"
SCHEDULE="0 18 * * 1-5"  # Mon-Fri at 6:00 PM EST
TIMEZONE="America/New_York"
DESCRIPTION="Daily Polygon.io data download (D-1 automatic)"

echo "========================================="
echo "Polygon Pipeline - Cloud Scheduler Setup"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Job: $JOB_NAME"
echo "Schedule: $SCHEDULE ($TIMEZONE)"
echo ""

# Set active project
echo "Setting active GCP project..."
gcloud config set project $PROJECT_ID

# Get Cloud Function URL and service account
echo ""
echo "Retrieving Cloud Function details..."
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --gen2 \
    --format='value(serviceConfig.uri)')

FUNCTION_SA=$(gcloud functions describe $FUNCTION_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --gen2 \
    --format='value(serviceConfig.serviceAccountEmail)')

echo "Function URL: $FUNCTION_URL"
echo "Function SA: $FUNCTION_SA"

# Check if job already exists
echo ""
echo "Checking if scheduler job exists..."
if gcloud scheduler jobs describe $JOB_NAME --location=$REGION --project=$PROJECT_ID &> /dev/null; then
    echo "⚠️  Scheduler job '$JOB_NAME' already exists"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Updating scheduler job..."
        gcloud scheduler jobs update http $JOB_NAME \
            --project=$PROJECT_ID \
            --location=$REGION \
            --schedule="$SCHEDULE" \
            --time-zone="$TIMEZONE" \
            --uri="$FUNCTION_URL" \
            --http-method=POST \
            --oidc-service-account-email="$FUNCTION_SA" \
            --message-body='{}' \
            --description="$DESCRIPTION"
        echo "✅ Scheduler job updated"
    else
        echo "Skipping job creation"
        exit 0
    fi
else
    echo "Creating new scheduler job..."
    gcloud scheduler jobs create http $JOB_NAME \
        --project=$PROJECT_ID \
        --location=$REGION \
        --schedule="$SCHEDULE" \
        --time-zone="$TIMEZONE" \
        --uri="$FUNCTION_URL" \
        --http-method=POST \
        --oidc-service-account-email="$FUNCTION_SA" \
        --message-body='{}' \
        --description="$DESCRIPTION"
    echo "✅ Scheduler job created"
fi

# Verify job
echo ""
echo "Verifying scheduler job..."
gcloud scheduler jobs describe $JOB_NAME \
    --location=$REGION \
    --project=$PROJECT_ID

# Test run (optional)
echo ""
read -p "Do you want to trigger a test run now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Triggering manual run..."
    gcloud scheduler jobs run $JOB_NAME \
        --location=$REGION \
        --project=$PROJECT_ID

    echo ""
    echo "Job triggered. Checking function logs in 10 seconds..."
    sleep 10

    echo ""
    gcloud functions logs read $FUNCTION_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --limit=20
fi

echo ""
echo "========================================="
echo "✅ Cloud Scheduler setup complete!"
echo "========================================="
echo ""
echo "Schedule Details:"
echo "- Cron: $SCHEDULE"
echo "- Timezone: $TIMEZONE"
echo "- Next runs: Every weekday at 6:00 PM EST"
echo ""
echo "Useful commands:"
echo "- List jobs:"
echo "  gcloud scheduler jobs list --location=$REGION"
echo ""
echo "- View job details:"
echo "  gcloud scheduler jobs describe $JOB_NAME --location=$REGION"
echo ""
echo "- Trigger manual run:"
echo "  gcloud scheduler jobs run $JOB_NAME --location=$REGION"
echo ""
echo "- Pause job:"
echo "  gcloud scheduler jobs pause $JOB_NAME --location=$REGION"
echo ""
echo "- Resume job:"
echo "  gcloud scheduler jobs resume $JOB_NAME --location=$REGION"
echo ""
echo "Next step: Run 04_deploy_bigquery.sh"

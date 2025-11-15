#!/bin/bash
# Script to set up Cloud Scheduler for daily Polygon data download
# Scheduler runs Mon-Fri at 6:00 PM EST (after market close at 4:00 PM EST)

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
JOB_NAME="polygon-daily-download"
REGION="us-central1"
SCHEDULE="0 18 * * 1-5"  # 6 PM EST, Monday-Friday
TIME_ZONE="America/New_York"
FUNCTION_NAME="polygon-daily-loader"

echo "========================================="
echo "Setting up Cloud Scheduler"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Job Name: $JOB_NAME"
echo "Schedule: $SCHEDULE (Mon-Fri 6:00 PM EST)"
echo ""

# Set the active project
gcloud config set project $PROJECT_ID

# Get the Cloud Function URL
echo "Retrieving Cloud Function URL..."
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME \
    --gen2 \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format="value(serviceConfig.uri)")

if [ -z "$FUNCTION_URL" ]; then
    echo "❌ Error: Could not retrieve function URL. Make sure the function is deployed first."
    echo "Run: ./02_deploy_cloud_function.sh"
    exit 1
fi

echo "✓ Function URL: $FUNCTION_URL"
echo ""

# Get service account for OIDC authentication
SERVICE_ACCOUNT_EMAIL="polygon-loader@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if job already exists
if gcloud scheduler jobs describe $JOB_NAME --location=$REGION --project=$PROJECT_ID &>/dev/null; then
    echo "Job '$JOB_NAME' already exists. Updating..."

    gcloud scheduler jobs update http $JOB_NAME \
        --location=$REGION \
        --project=$PROJECT_ID \
        --schedule="$SCHEDULE" \
        --time-zone="$TIME_ZONE" \
        --uri="$FUNCTION_URL" \
        --http-method=POST \
        --headers="Content-Type=application/json" \
        --message-body='{}' \
        --oidc-service-account-email="$SERVICE_ACCOUNT_EMAIL" \
        --oidc-token-audience="$FUNCTION_URL"

    echo "✓ Job updated successfully"
else
    echo "Creating new scheduled job..."

    gcloud scheduler jobs create http $JOB_NAME \
        --location=$REGION \
        --project=$PROJECT_ID \
        --schedule="$SCHEDULE" \
        --time-zone="$TIME_ZONE" \
        --uri="$FUNCTION_URL" \
        --http-method=POST \
        --headers="Content-Type=application/json" \
        --message-body='{}' \
        --oidc-service-account-email="$SERVICE_ACCOUNT_EMAIL" \
        --oidc-token-audience="$FUNCTION_URL"

    echo "✓ Job created successfully"
fi

echo ""
echo "========================================="
echo "Cloud Scheduler setup completed!"
echo "========================================="
echo ""
echo "Job details:"
gcloud scheduler jobs describe $JOB_NAME \
    --location=$REGION \
    --project=$PROJECT_ID

echo ""
echo "Run the job manually to test:"
echo "  gcloud scheduler jobs run $JOB_NAME --location=$REGION --project=$PROJECT_ID"
echo ""
echo "View execution logs:"
echo "  gcloud scheduler jobs describe $JOB_NAME --location=$REGION --project=$PROJECT_ID"
echo ""
echo "Pause the job:"
echo "  gcloud scheduler jobs pause $JOB_NAME --location=$REGION --project=$PROJECT_ID"
echo ""
echo "Resume the job:"
echo "  gcloud scheduler jobs resume $JOB_NAME --location=$REGION --project=$PROJECT_ID"
echo ""

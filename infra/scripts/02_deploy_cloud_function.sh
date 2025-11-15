#!/bin/bash
# Script to deploy Polygon Daily Loader Cloud Function
# This function downloads daily market data from Polygon.io and stores it in GCS

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
FUNCTION_NAME="polygon-daily-loader"
REGION="us-central1"
RUNTIME="python311"
ENTRY_POINT="process_daily_trigger"
MEMORY="512MB"
TIMEOUT="540s"  # 9 minutes
MAX_INSTANCES="1"

# Environment variables
GCS_BUCKET_NAME="ss-bucket-polygon-incremental"
GCS_PREFIX="polygon/daily"
OUTPUT_FORMAT="parquet"

# Service account (will be created if doesn't exist)
SERVICE_ACCOUNT_NAME="polygon-loader"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Source directory
SOURCE_DIR="../cloud_functions/polygon_daily_loader"

echo "========================================="
echo "Deploying Cloud Function"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo "Runtime: $RUNTIME"
echo ""

# Set the active project
gcloud config set project $PROJECT_ID

# Create service account if it doesn't exist
echo "Creating/verifying service account..."
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL --project=$PROJECT_ID &>/dev/null; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --project=$PROJECT_ID \
        --description="Service account for Polygon daily data loader" \
        --display-name="Polygon Loader"
    echo "✓ Service account created"
else
    echo "✓ Service account already exists"
fi

# Grant necessary permissions to service account
echo "Granting permissions to service account..."

# Secret Manager access (to read API key)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None 2>/dev/null || echo "✓ Secret Manager access already granted"

# GCS access (to write data)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectCreator" \
    --condition=None 2>/dev/null || echo "✓ Storage Object Creator already granted"

# Cloud Functions invoker (for HTTP trigger)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudfunctions.invoker" \
    --condition=None 2>/dev/null || echo "✓ Cloud Functions invoker already granted"

echo "✓ Permissions configured"
echo ""

# Deploy the function
echo "Deploying Cloud Function..."
echo "This may take a few minutes..."
echo ""

gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --region=$REGION \
    --runtime=$RUNTIME \
    --source=$SOURCE_DIR \
    --entry-point=$ENTRY_POINT \
    --trigger-http \
    --allow-unauthenticated \
    --service-account=$SERVICE_ACCOUNT_EMAIL \
    --memory=$MEMORY \
    --timeout=$TIMEOUT \
    --max-instances=$MAX_INSTANCES \
    --set-env-vars="GCS_BUCKET_NAME=$GCS_BUCKET_NAME,GCS_PROJECT_ID=$PROJECT_ID,GCS_PREFIX=$GCS_PREFIX,OUTPUT_FORMAT=$OUTPUT_FORMAT,POLYGON_SECRET_NAME=polygon-api-key" \
    --project=$PROJECT_ID

echo ""
echo "========================================="
echo "Cloud Function deployed successfully!"
echo "========================================="
echo ""

# Get function URL
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME \
    --gen2 \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format="value(serviceConfig.uri)")

echo "Function URL: $FUNCTION_URL"
echo ""
echo "Test the function with:"
echo "  curl -X POST $FUNCTION_URL -H 'Content-Type: application/json' -d '{\"date\": \"2024-11-14\"}'"
echo ""
echo "View logs with:"
echo "  gcloud functions logs read $FUNCTION_NAME --gen2 --region=$REGION --project=$PROJECT_ID --limit=50"
echo ""

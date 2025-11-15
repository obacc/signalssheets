#!/bin/bash
# ================================================================
# Deploy Polygon Daily Loader Cloud Function
# ================================================================
# File: 02_deploy_cloud_function.sh
# Description: Deploys Cloud Function (Gen 2) for Polygon data download

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
REGION="us-central1"
FUNCTION_NAME="polygon-daily-loader"
RUNTIME="python311"
ENTRY_POINT="polygon_daily_loader"
MEMORY="512MB"
TIMEOUT="540s"  # 9 minutes
SOURCE_DIR="../cloud-function"

echo "========================================="
echo "Polygon Pipeline - Cloud Function Deploy"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Function: $FUNCTION_NAME"
echo ""

# Verify we're in the right directory
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Cloud function source directory not found: $SOURCE_DIR"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Verify required files exist
echo "Verifying source files..."
required_files=("main.py" "procedimiento_carga_bucket.py" "requirements.txt")
for file in "${required_files[@]}"; do
    if [ ! -f "$SOURCE_DIR/$file" ]; then
        echo "❌ Error: Required file not found: $SOURCE_DIR/$file"
        exit 1
    fi
    echo "✅ Found: $file"
done

# Set active project
echo ""
echo "Setting active GCP project..."
gcloud config set project $PROJECT_ID

# Deploy function
echo ""
echo "Deploying Cloud Function (this may take 2-3 minutes)..."
gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --runtime=$RUNTIME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --source=$SOURCE_DIR \
    --entry-point=$ENTRY_POINT \
    --trigger-http \
    --allow-unauthenticated=false \
    --timeout=$TIMEOUT \
    --memory=$MEMORY \
    --max-instances=1 \
    --min-instances=0 \
    --set-env-vars="GCS_BUCKET_NAME=ss-bucket-polygon-incremental,GCS_PROJECT_ID=$PROJECT_ID"

echo ""
echo "✅ Cloud Function deployed successfully!"

# Get function URL
echo ""
echo "Retrieving function URL..."
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --gen2 \
    --format='value(serviceConfig.uri)')

echo "Function URL: $FUNCTION_URL"

# Get service account
echo ""
echo "Retrieving service account..."
SERVICE_ACCOUNT=$(gcloud functions describe $FUNCTION_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --gen2 \
    --format='value(serviceConfig.serviceAccountEmail)')

echo "Service Account: $SERVICE_ACCOUNT"

# Test function (optional)
echo ""
read -p "Do you want to test the function now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Testing function with yesterday's date..."
    gcloud functions call $FUNCTION_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --gen2
    echo ""
    echo "Check the output above for success/errors"
fi

# Show logs command
echo ""
echo "========================================="
echo "✅ Deployment complete!"
echo "========================================="
echo ""
echo "Useful commands:"
echo "- View logs:"
echo "  gcloud functions logs read $FUNCTION_NAME --region=$REGION --limit=50"
echo ""
echo "- Test function:"
echo "  gcloud functions call $FUNCTION_NAME --region=$REGION --data='{\"date\":\"2025-11-14\"}'"
echo ""
echo "- Describe function:"
echo "  gcloud functions describe $FUNCTION_NAME --region=$REGION --gen2"
echo ""
echo "Next step: Run 03_setup_scheduler.sh"

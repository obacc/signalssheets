#!/bin/bash
# Deploy Market Regime Cloud Function
# Run from: cloud_functions/market_regime_production/

set -e

PROJECT_ID="sunny-advantage-471523-b3"
FUNCTION_NAME="market-regime-update"
REGION="us-central1"
RUNTIME="python311"
ENTRY_POINT="market_regime_update"
MEMORY="512MB"
TIMEOUT="120s"

echo "========================================"
echo "Deploying Market Regime Cloud Function"
echo "========================================"
echo "Project:     $PROJECT_ID"
echo "Function:    $FUNCTION_NAME"
echo "Region:      $REGION"
echo "Runtime:     $RUNTIME"
echo "Entry Point: $ENTRY_POINT"
echo "Memory:      $MEMORY"
echo "Timeout:     $TIMEOUT"
echo "========================================"

# Deploy the function
gcloud functions deploy $FUNCTION_NAME \
    --project=$PROJECT_ID \
    --region=$REGION \
    --runtime=$RUNTIME \
    --entry-point=$ENTRY_POINT \
    --trigger-http \
    --allow-unauthenticated \
    --memory=$MEMORY \
    --timeout=$TIMEOUT \
    --set-env-vars PROJECT_ID=$PROJECT_ID \
    --source=.

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Test the function with:"
echo "  curl -X POST https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME"
echo ""

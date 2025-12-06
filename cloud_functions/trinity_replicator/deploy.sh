#!/bin/bash
# =============================================================================
# Trinity Replicator - Deployment Script
# =============================================================================
# This script deploys the trinity-replicator Cloud Function to GCP
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - .env.yaml configured with actual secrets
#   - Service account with BigQuery read permissions
#
# Usage:
#   ./deploy.sh
# =============================================================================

set -e

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
REGION="us-central1"
FUNCTION_NAME="trinity-replicator"
RUNTIME="python311"
ENTRY_POINT="trinity_replicator"
SERVICE_ACCOUNT="claudecode@${PROJECT_ID}.iam.gserviceaccount.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "=============================================="
echo "  TRINITY REPLICATOR - DEPLOYMENT"
echo "=============================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}ERROR: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if .env.yaml exists
if [ ! -f ".env.yaml" ]; then
    echo -e "${RED}ERROR: .env.yaml not found${NC}"
    echo "Copy .env.yaml.template to .env.yaml and fill in the values"
    exit 1
fi

# Check if PENDING_CREATION is still in .env.yaml
if grep -q "PENDING_CREATION" .env.yaml; then
    echo -e "${YELLOW}WARNING: .env.yaml still contains PENDING_CREATION${NC}"
    echo "Please update CLOUDFLARE_KV_NAMESPACE_ID with the actual ID"
    echo ""
    read -p "Continue anyway? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        exit 1
    fi
fi

echo -e "${GREEN}Deploying ${FUNCTION_NAME} to ${PROJECT_ID}...${NC}"
echo ""

# Deploy the function
gcloud functions deploy ${FUNCTION_NAME} \
    --gen2 \
    --runtime=${RUNTIME} \
    --region=${REGION} \
    --source=. \
    --entry-point=${ENTRY_POINT} \
    --trigger-http \
    --allow-unauthenticated \
    --memory=512MB \
    --timeout=300s \
    --env-vars-file=.env.yaml \
    --service-account=${SERVICE_ACCOUNT} \
    --project=${PROJECT_ID}

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""

# Get the function URL
FUNCTION_URL=$(gcloud functions describe ${FUNCTION_NAME} \
    --gen2 \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format='value(serviceConfig.uri)')

echo "=============================================="
echo "  DEPLOYMENT SUMMARY"
echo "=============================================="
echo ""
echo "Function Name: ${FUNCTION_NAME}"
echo "Region: ${REGION}"
echo "Runtime: ${RUNTIME}"
echo "URL: ${FUNCTION_URL}"
echo ""
echo "To test the function:"
echo "  curl -X POST ${FUNCTION_URL}"
echo ""
echo "To view logs:"
echo "  gcloud functions logs read ${FUNCTION_NAME} --region=${REGION} --limit=50"
echo ""

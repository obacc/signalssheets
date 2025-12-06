#!/bin/bash
# =============================================================================
# Trinity Replicator - Cloud Scheduler Setup
# =============================================================================
# This script creates a Cloud Scheduler job to run the replicator daily
# at 3:05 AM EST (8:05 AM UTC)
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - trinity-replicator function already deployed
#
# Usage:
#   ./setup_scheduler.sh
# =============================================================================

set -e

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
REGION="us-central1"
FUNCTION_NAME="trinity-replicator"
JOB_NAME="trinity-replicator-daily"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "=============================================="
echo "  CLOUD SCHEDULER SETUP"
echo "=============================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}ERROR: gcloud CLI is not installed${NC}"
    exit 1
fi

# Get the function URL
echo "Getting function URL..."
FUNCTION_URL=$(gcloud functions describe ${FUNCTION_NAME} \
    --gen2 \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format='value(serviceConfig.uri)' 2>/dev/null)

if [ -z "$FUNCTION_URL" ]; then
    echo -e "${RED}ERROR: Function ${FUNCTION_NAME} not found${NC}"
    echo "Please deploy the function first using ./deploy.sh"
    exit 1
fi

echo "Function URL: ${FUNCTION_URL}"
echo ""

# Check if job already exists
if gcloud scheduler jobs describe ${JOB_NAME} --location=${REGION} --project=${PROJECT_ID} &>/dev/null; then
    echo -e "${YELLOW}Job ${JOB_NAME} already exists. Updating...${NC}"

    gcloud scheduler jobs update http ${JOB_NAME} \
        --location=${REGION} \
        --schedule="5 8 * * *" \
        --time-zone="UTC" \
        --uri="${FUNCTION_URL}" \
        --http-method=POST \
        --headers="Content-Type=application/json" \
        --message-body='{}' \
        --description="Daily Trinity signals replication at 3:05 AM EST (8:05 AM UTC)" \
        --attempt-deadline=360s \
        --project=${PROJECT_ID}
else
    echo "Creating scheduler job..."

    gcloud scheduler jobs create http ${JOB_NAME} \
        --location=${REGION} \
        --schedule="5 8 * * *" \
        --time-zone="UTC" \
        --uri="${FUNCTION_URL}" \
        --http-method=POST \
        --headers="Content-Type=application/json" \
        --message-body='{}' \
        --description="Daily Trinity signals replication at 3:05 AM EST (8:05 AM UTC)" \
        --attempt-deadline=360s \
        --project=${PROJECT_ID}
fi

echo ""
echo -e "${GREEN}Scheduler setup complete!${NC}"
echo ""
echo "=============================================="
echo "  SCHEDULER SUMMARY"
echo "=============================================="
echo ""
echo "Job Name: ${JOB_NAME}"
echo "Schedule: 5 8 * * * (8:05 AM UTC = 3:05 AM EST)"
echo "Target: ${FUNCTION_URL}"
echo ""
echo "To test the scheduler (run now):"
echo "  gcloud scheduler jobs run ${JOB_NAME} --location=${REGION}"
echo ""
echo "To view job details:"
echo "  gcloud scheduler jobs describe ${JOB_NAME} --location=${REGION}"
echo ""

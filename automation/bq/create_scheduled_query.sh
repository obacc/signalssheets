#!/bin/bash
##############################################################################
# CREATE SCHEDULED QUERY FOR POLYGON PIPELINE
# This script creates a BigQuery Scheduled Query using Data Transfer Service
##############################################################################

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load config
if [ -f "$SCRIPT_DIR/../config/.env" ]; then
    source "$SCRIPT_DIR/../config/.env"
else
    source "$SCRIPT_DIR/../config/env.example"
fi

echo "Creating Scheduled Query..."
echo "  Project: $PROJECT_ID"
echo "  Schedule: ${CRON_SCHEDULE} ${TIMEZONE}"
echo "  SP: $STORED_PROCEDURE"
echo ""

# Note: Email notifications must be configured via Console
# This creates the basic scheduled query

gcloud scheduler jobs create http polygon-daily-merge \
    --location="${REGION}" \
    --schedule="${CRON_SCHEDULE}" \
    --time-zone="${TIMEZONE}" \
    --uri="https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT_ID}/queries" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{
        \"query\": \"CALL \\\`${FULL_STORED_PROCEDURE}\\\`();\",
        \"useLegacySql\": false
    }" \
    --oidc-service-account-email="${SERVICE_ACCOUNT_EMAIL}" \
    --description="Daily Polygon data merge from staging to Prices"

echo ""
echo "✓ Scheduled Query created"
echo ""
echo "Next steps:"
echo "  1. Configure email notifications in Console"
echo "  2. Test execution: gcloud scheduler jobs run polygon-daily-merge --location=${REGION}"
echo "  3. View logs: gcloud scheduler jobs describe polygon-daily-merge --location=${REGION}"

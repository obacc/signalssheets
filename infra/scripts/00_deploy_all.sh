#!/bin/bash
# Master deployment script for Polygon → GCS → BigQuery automation
# Executes all setup steps in the correct order
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - bq CLI installed
#   - Proper IAM permissions on GCP project
#
# Usage:
#   ./00_deploy_all.sh [--skip-secrets] [--skip-function] [--skip-scheduler] [--skip-bigquery]

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
SKIP_SECRETS=false
SKIP_FUNCTION=false
SKIP_SCHEDULER=false
SKIP_BIGQUERY=false

for arg in "$@"; do
    case $arg in
        --skip-secrets)
            SKIP_SECRETS=true
            ;;
        --skip-function)
            SKIP_FUNCTION=true
            ;;
        --skip-scheduler)
            SKIP_SCHEDULER=true
            ;;
        --skip-bigquery)
            SKIP_BIGQUERY=true
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-secrets     Skip Secret Manager setup"
            echo "  --skip-function    Skip Cloud Function deployment"
            echo "  --skip-scheduler   Skip Cloud Scheduler setup"
            echo "  --skip-bigquery    Skip BigQuery tables and scheduled query setup"
            echo "  --help             Show this help message"
            exit 0
            ;;
    esac
done

echo -e "${GREEN}"
echo "========================================="
echo "Polygon Data Pipeline - Full Deployment"
echo "========================================="
echo -e "${NC}"
echo "This script will deploy the complete end-to-end pipeline:"
echo "  1. Secret Manager (Polygon API Key)"
echo "  2. Cloud Function (Daily data download)"
echo "  3. Cloud Scheduler (Daily trigger)"
echo "  4. BigQuery Tables (Staging, Control, External)"
echo "  5. BigQuery Scheduled Query (Daily ingestion)"
echo ""
echo -e "${YELLOW}Press ENTER to continue or Ctrl+C to cancel...${NC}"
read

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
START_TIME=$(date +%s)

echo ""
echo -e "${GREEN}Project: $PROJECT_ID${NC}"
echo ""

# Verify gcloud is authenticated
echo "Verifying authentication..."
gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1 || {
    echo -e "${RED}❌ Error: gcloud not authenticated${NC}"
    echo "Please run: gcloud auth login"
    exit 1
}
echo -e "${GREEN}✓ Authenticated${NC}"

# Set active project
gcloud config set project $PROJECT_ID
echo ""

# ===========================================
# STEP 1: Secret Manager Setup
# ===========================================
if [ "$SKIP_SECRETS" = false ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}STEP 1: Setting up Secret Manager${NC}"
    echo -e "${GREEN}=========================================${NC}"
    ./01_setup_secret_manager.sh
    echo -e "${GREEN}✓ Secret Manager setup completed${NC}"
    echo ""
else
    echo -e "${YELLOW}⊘ Skipping Secret Manager setup${NC}"
    echo ""
fi

# ===========================================
# STEP 2: Deploy Cloud Function
# ===========================================
if [ "$SKIP_FUNCTION" = false ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}STEP 2: Deploying Cloud Function${NC}"
    echo -e "${GREEN}=========================================${NC}"
    ./02_deploy_cloud_function.sh
    echo -e "${GREEN}✓ Cloud Function deployed${NC}"
    echo ""
else
    echo -e "${YELLOW}⊘ Skipping Cloud Function deployment${NC}"
    echo ""
fi

# ===========================================
# STEP 3: Setup Cloud Scheduler
# ===========================================
if [ "$SKIP_SCHEDULER" = false ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}STEP 3: Setting up Cloud Scheduler${NC}"
    echo -e "${GREEN}=========================================${NC}"
    ./03_setup_cloud_scheduler.sh
    echo -e "${GREEN}✓ Cloud Scheduler configured${NC}"
    echo ""
else
    echo -e "${YELLOW}⊘ Skipping Cloud Scheduler setup${NC}"
    echo ""
fi

# ===========================================
# STEP 4: Create BigQuery Tables
# ===========================================
if [ "$SKIP_BIGQUERY" = false ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}STEP 4: Creating BigQuery Tables${NC}"
    echo -e "${GREEN}=========================================${NC}"
    ./04_setup_bigquery_tables.sh
    echo -e "${GREEN}✓ BigQuery tables created${NC}"
    echo ""

    # ===========================================
    # STEP 5: Setup BigQuery Scheduled Query
    # ===========================================
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}STEP 5: Setting up Scheduled Query${NC}"
    echo -e "${GREEN}=========================================${NC}"
    ./05_setup_scheduled_query.sh
    echo -e "${GREEN}✓ Scheduled Query configured${NC}"
    echo ""
else
    echo -e "${YELLOW}⊘ Skipping BigQuery setup${NC}"
    echo ""
fi

# ===========================================
# Deployment Summary
# ===========================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}     DEPLOYMENT COMPLETED!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Total deployment time: ${DURATION}s"
echo ""
echo -e "${GREEN}Pipeline Components:${NC}"
echo "  ✓ Secret Manager: Polygon API key stored securely"
echo "  ✓ Cloud Function: polygon-daily-loader (runs on HTTP trigger)"
echo "  ✓ Cloud Scheduler: Runs Mon-Fri at 6:00 PM EST"
echo "  ✓ BigQuery Tables:"
echo "      - staging_polygon_daily_raw (staging table)"
echo "      - ingest_file_registry (control table)"
echo "      - ext_polygon_daily_parquet (external table)"
echo "  ✓ Scheduled Query: Runs daily at 7:00 PM EST"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Test the Cloud Function manually:"
echo "   FUNCTION_URL=\$(gcloud functions describe polygon-daily-loader --gen2 --region=us-central1 --format='value(serviceConfig.uri)')"
echo "   curl -X POST \$FUNCTION_URL -H 'Content-Type: application/json' -d '{\"date\": \"2024-11-14\"}'"
echo ""
echo "2. Trigger Cloud Scheduler manually to test end-to-end:"
echo "   gcloud scheduler jobs run polygon-daily-download --location=us-central1"
echo ""
echo "3. Validate data quality:"
echo "   bq query --use_legacy_sql=false --parameter=target_date:DATE:2024-11-14 < ../bigquery/queries/02_validation_quality_check.sql"
echo ""
echo "4. Check temporal coverage:"
echo "   bq query --use_legacy_sql=false < ../bigquery/queries/03_temporal_coverage_check.sql"
echo ""
echo "5. Monitor Cloud Function logs:"
echo "   gcloud functions logs read polygon-daily-loader --gen2 --region=us-central1 --limit=50"
echo ""
echo -e "${GREEN}Documentation:${NC} See ../README.md for detailed usage and troubleshooting"
echo ""

#!/bin/bash
# ================================================================
# Validate Polygon Pipeline Deployment
# ================================================================
# File: validate_deployment.sh
# Description: Comprehensive validation of all deployed components
# Usage: ./validate_deployment.sh [test_date]

set -e

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
REGION="us-central1"
FUNCTION_NAME="polygon-daily-loader"
SCHEDULER_JOB="polygon-daily-download"
DATASET="market_data"
TEST_DATE="${1:-2025-11-13}"

echo "========================================="
echo "Polygon Pipeline - Deployment Validation"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Test Date: $TEST_DATE"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

# ================================================================
# SECTION 1: Secret Manager
# ================================================================
echo ""
echo "========================================="
echo "1. Secret Manager Validation"
echo "========================================="

# Check if secret exists
if gcloud secrets describe polygon-api-key --project=$PROJECT_ID &> /dev/null; then
    check_pass "Secret 'polygon-api-key' exists"

    # Check secret length
    SECRET_VALUE=$(gcloud secrets versions access latest --secret=polygon-api-key --project=$PROJECT_ID)
    SECRET_LEN=${#SECRET_VALUE}

    if [ "$SECRET_LEN" -gt 20 ]; then
        check_pass "Secret has valid length ($SECRET_LEN characters)"
    else
        check_fail "Secret seems too short ($SECRET_LEN characters)"
    fi
else
    check_fail "Secret 'polygon-api-key' not found"
fi

# ================================================================
# SECTION 2: Cloud Function
# ================================================================
echo ""
echo "========================================="
echo "2. Cloud Function Validation"
echo "========================================="

# Check if function exists
if gcloud functions describe $FUNCTION_NAME --region=$REGION --project=$PROJECT_ID --gen2 &> /dev/null; then
    check_pass "Cloud Function '$FUNCTION_NAME' exists"

    # Check runtime
    RUNTIME=$(gcloud functions describe $FUNCTION_NAME --region=$REGION --project=$PROJECT_ID --gen2 --format="value(buildConfig.runtime)")
    if [[ "$RUNTIME" == python* ]]; then
        check_pass "Runtime: $RUNTIME"
    else
        check_warn "Runtime: $RUNTIME (expected python3xx)"
    fi

    # Check timeout
    TIMEOUT=$(gcloud functions describe $FUNCTION_NAME --region=$REGION --project=$PROJECT_ID --gen2 --format="value(serviceConfig.timeoutSeconds)")
    if [ "$TIMEOUT" -ge 540 ]; then
        check_pass "Timeout: ${TIMEOUT}s (sufficient)"
    else
        check_warn "Timeout: ${TIMEOUT}s (may be too short)"
    fi

    # Check environment variables
    BUCKET_ENV=$(gcloud functions describe $FUNCTION_NAME --region=$REGION --project=$PROJECT_ID --gen2 --format="value(serviceConfig.environmentVariables.GCS_BUCKET_NAME)")
    if [[ "$BUCKET_ENV" == "ss-bucket-polygon-incremental" ]]; then
        check_pass "Environment variable GCS_BUCKET_NAME: $BUCKET_ENV"
    else
        check_fail "Environment variable GCS_BUCKET_NAME incorrect or missing"
    fi
else
    check_fail "Cloud Function '$FUNCTION_NAME' not found"
fi

# ================================================================
# SECTION 3: Cloud Scheduler
# ================================================================
echo ""
echo "========================================="
echo "3. Cloud Scheduler Validation"
echo "========================================="

# Check if scheduler job exists
if gcloud scheduler jobs describe $SCHEDULER_JOB --location=$REGION --project=$PROJECT_ID &> /dev/null; then
    check_pass "Scheduler job '$SCHEDULER_JOB' exists"

    # Check schedule
    SCHEDULE=$(gcloud scheduler jobs describe $SCHEDULER_JOB --location=$REGION --project=$PROJECT_ID --format="value(schedule)")
    if [[ "$SCHEDULE" == "0 18 * * 1-5" ]]; then
        check_pass "Schedule: $SCHEDULE (Mon-Fri 6PM EST)"
    else
        check_warn "Schedule: $SCHEDULE (expected '0 18 * * 1-5')"
    fi

    # Check timezone
    TIMEZONE=$(gcloud scheduler jobs describe $SCHEDULER_JOB --location=$REGION --project=$PROJECT_ID --format="value(timeZone)")
    if [[ "$TIMEZONE" == "America/New_York" ]]; then
        check_pass "Timezone: $TIMEZONE"
    else
        check_warn "Timezone: $TIMEZONE (expected America/New_York)"
    fi

    # Check state
    STATE=$(gcloud scheduler jobs describe $SCHEDULER_JOB --location=$REGION --project=$PROJECT_ID --format="value(state)")
    if [[ "$STATE" == "ENABLED" ]]; then
        check_pass "State: $STATE"
    else
        check_warn "State: $STATE (should be ENABLED)"
    fi
else
    check_fail "Scheduler job '$SCHEDULER_JOB' not found"
fi

# ================================================================
# SECTION 4: BigQuery Objects
# ================================================================
echo ""
echo "========================================="
echo "4. BigQuery Objects Validation"
echo "========================================="

# Check dataset
if bq show --project_id=$PROJECT_ID $DATASET &> /dev/null; then
    check_pass "Dataset '$DATASET' exists"
else
    check_fail "Dataset '$DATASET' not found"
fi

# Check tables
REQUIRED_TABLES=(
    "ext_polygon_daily_parquet"
    "stg_prices_polygon_raw"
    "ingest_file_registry"
    "Prices"
)

for table in "${REQUIRED_TABLES[@]}"; do
    if bq show --project_id=$PROJECT_ID ${DATASET}.${table} &> /dev/null; then
        check_pass "Table '$table' exists"
    else
        check_fail "Table '$table' not found"
    fi
done

# Check procedures
REQUIRED_PROCEDURES=(
    "sp_load_polygon_raw"
    "sp_merge_polygon_to_prices"
)

for proc in "${REQUIRED_PROCEDURES[@]}"; do
    if bq show --project_id=$PROJECT_ID --routine ${DATASET}.${proc} &> /dev/null; then
        check_pass "Procedure '$proc' exists"
    else
        check_fail "Procedure '$proc' not found"
    fi
done

# Check view
if bq show --project_id=$PROJECT_ID ${DATASET}.v_missing_days_polygon &> /dev/null; then
    check_pass "View 'v_missing_days_polygon' exists"
else
    check_fail "View 'v_missing_days_polygon' not found"
fi

# ================================================================
# SECTION 5: Data Validation (if test date provided)
# ================================================================
echo ""
echo "========================================="
echo "5. Data Validation (Date: $TEST_DATE)"
echo "========================================="

# Check if GCS file exists
EXPECTED_FILE="gs://ss-bucket-polygon-incremental/polygon/daily/polygon_${TEST_DATE}.parquet"
if gsutil ls "$EXPECTED_FILE" &> /dev/null; then
    FILE_SIZE=$(gsutil du -h "$EXPECTED_FILE" | awk '{print $1}')
    check_pass "GCS file exists: $EXPECTED_FILE ($FILE_SIZE)"
else
    check_warn "GCS file not found: $EXPECTED_FILE (run test to create)"
fi

# Check staging data
STAGING_COUNT=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
    "SELECT COUNT(*) FROM \`${PROJECT_ID}.${DATASET}.stg_prices_polygon_raw\`
     WHERE trading_day = '$TEST_DATE' AND source = 'polygon'" 2>/dev/null | tail -1)

if [ ! -z "$STAGING_COUNT" ] && [ "$STAGING_COUNT" -gt 0 ]; then
    if [ "$STAGING_COUNT" -gt 10000 ]; then
        check_pass "Staging has $STAGING_COUNT records for $TEST_DATE"
    else
        check_warn "Staging has only $STAGING_COUNT records (expected ~11,000)"
    fi
else
    check_warn "No staging data for $TEST_DATE (run test to populate)"
fi

# Check Prices data
PRICES_COUNT=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
    "SELECT COUNT(*) FROM \`${PROJECT_ID}.${DATASET}.Prices\`
     WHERE trading_day = '$TEST_DATE' AND source = 'polygon'" 2>/dev/null | tail -1)

if [ ! -z "$PRICES_COUNT" ] && [ "$PRICES_COUNT" -gt 0 ]; then
    if [ "$PRICES_COUNT" -gt 10000 ]; then
        check_pass "Prices has $PRICES_COUNT records for $TEST_DATE"
    else
        check_warn "Prices has only $PRICES_COUNT records (expected ~11,000)"
    fi
else
    check_warn "No Prices data for $TEST_DATE (run test to populate)"
fi

# Check for duplicates
if [ ! -z "$PRICES_COUNT" ] && [ "$PRICES_COUNT" -gt 0 ]; then
    DUPES=$(bq query --project_id=$PROJECT_ID --use_legacy_sql=false --format=csv \
        "SELECT COUNT(*) FROM (
           SELECT ticker, trading_day, source, COUNT(*) as cnt
           FROM \`${PROJECT_ID}.${DATASET}.Prices\`
           WHERE trading_day = '$TEST_DATE' AND source = 'polygon'
           GROUP BY 1,2,3
           HAVING COUNT(*) > 1
         )" 2>/dev/null | tail -1)

    if [ "$DUPES" -eq 0 ]; then
        check_pass "No duplicates in Prices for $TEST_DATE"
    else
        check_fail "Found $DUPES duplicate groups in Prices for $TEST_DATE"
    fi
fi

# ================================================================
# SECTION 6: Permissions & IAM
# ================================================================
echo ""
echo "========================================="
echo "6. Permissions Validation"
echo "========================================="

# Check Cloud Function service account
CF_SA=$(gcloud functions describe $FUNCTION_NAME --region=$REGION --project=$PROJECT_ID --gen2 --format="value(serviceConfig.serviceAccountEmail)" 2>/dev/null || echo "")

if [ ! -z "$CF_SA" ]; then
    check_pass "Cloud Function service account: $CF_SA"

    # Check Secret Manager IAM binding
    if gcloud secrets get-iam-policy polygon-api-key --project=$PROJECT_ID 2>/dev/null | grep -q "$CF_SA"; then
        check_pass "Service account has Secret Manager access"
    else
        check_warn "Service account may not have Secret Manager access"
    fi
fi

# ================================================================
# FINAL SUMMARY
# ================================================================
echo ""
echo "========================================="
echo "VALIDATION SUMMARY"
echo "========================================="
echo -e "${GREEN}Checks Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Checks Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅✅✅ ALL CRITICAL CHECKS PASSED!${NC}"
    echo "Pipeline deployment is valid and ready for production."
    exit 0
else
    echo -e "${RED}❌ DEPLOYMENT HAS ISSUES!${NC}"
    echo "Please review failed checks above and fix issues."
    exit 1
fi

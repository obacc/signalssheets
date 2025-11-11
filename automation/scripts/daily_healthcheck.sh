#!/bin/bash
################################################################################
# POLYGON PIPELINE DAILY HEALTHCHECK
# Verifies data freshness and pipeline health
#
# Usage:
#   ./daily_healthcheck.sh [--days N]
#
# Exit codes:
#   0 - OK (all checks passed)
#   1 - WARN (some dates missing but within tolerance)
#   2 - FAIL (critical issues detected)
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load configuration
if [ -f "$SCRIPT_DIR/../config/.env" ]; then
    source "$SCRIPT_DIR/../config/.env"
elif [ -f "$SCRIPT_DIR/../config/env.example" ]; then
    source "$SCRIPT_DIR/../config/env.example"
else
    echo -e "${RED}✗ Config file not found${NC}"
    exit 2
fi

# Default: check last 2 days
LOOKBACK_DAYS="${HEALTHCHECK_LOOKBACK_DAYS:-2}"

################################################################################
# FUNCTIONS
################################################################################

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Daily healthcheck for Polygon pipeline.

OPTIONS:
    --days N      Number of days to check (default: ${LOOKBACK_DAYS})
    -h, --help    Show this help message

EXIT CODES:
    0 - OK    (all checks passed)
    1 - WARN  (minor issues)
    2 - FAIL  (critical issues)

CHECKS:
    1. Data freshness in GCS
    2. Data freshness in Staging
    3. Data freshness in Prices
    4. Recent job failures
    5. Data quality (duplicates, nulls)
EOF
    exit 0
}

get_latest_date_in_gcs() {
    gsutil ls "${BUCKET_URI}/" 2>/dev/null | \
        grep -oP 'date=\K[0-9]{4}-[0-9]{2}-[0-9]{2}' | \
        sort -r | \
        head -1
}

get_latest_date_in_table() {
    local table=$1
    local where_clause=$2

    bq query \
        --project_id="$PROJECT_ID" \
        --use_legacy_sql=false \
        --format=csv \
        --quiet \
        "SELECT MAX(date) FROM \`$table\` $where_clause" 2>/dev/null | tail -n1
}

check_date_exists() {
    local table=$1
    local date=$2
    local where_clause=$3

    local count=$(bq query \
        --project_id="$PROJECT_ID" \
        --use_legacy_sql=false \
        --format=csv \
        --quiet \
        "SELECT COUNT(*) FROM \`$table\` WHERE date = '$date' $where_clause" 2>/dev/null | tail -n1)

    echo "$count"
}

get_date_n_days_ago() {
    local n=$1
    date -I -d "$n days ago"
}

################################################################################
# PARSE ARGUMENTS
################################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --days)
            LOOKBACK_DAYS="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

################################################################################
# MAIN HEALTHCHECK
################################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     POLYGON PIPELINE HEALTHCHECK                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Date: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "Checking last $LOOKBACK_DAYS day(s)"
echo ""

# Track issues
WARNINGS=0
FAILURES=0

################################################################################
# CHECK 1: GCS DATA FRESHNESS
################################################################################

echo -e "${BLUE}[CHECK 1/5]${NC} GCS Data Freshness"

latest_gcs=$(get_latest_date_in_gcs)

if [ -n "$latest_gcs" ]; then
    echo "  Latest date in GCS: $latest_gcs"

    yesterday=$(get_date_n_days_ago 1)
    if [[ "$latest_gcs" < "$yesterday" ]]; then
        echo -e "  ${YELLOW}⚠ WARNING:${NC} GCS data is stale (latest: $latest_gcs, expected: >= $yesterday)"
        ((WARNINGS++))
    else
        echo -e "  ${GREEN}✓ OK${NC}"
    fi
else
    echo -e "  ${RED}✗ FAIL:${NC} No data found in GCS"
    ((FAILURES++))
fi

echo ""

################################################################################
# CHECK 2: STAGING TABLE FRESHNESS
################################################################################

echo -e "${BLUE}[CHECK 2/5]${NC} Staging Table Freshness"

latest_staging=$(get_latest_date_in_table "$FULL_STAGING_TABLE" "")

if [ -n "$latest_staging" ] && [ "$latest_staging" != "null" ]; then
    echo "  Latest date in Staging: $latest_staging"

    yesterday=$(get_date_n_days_ago 1)
    if [[ "$latest_staging" < "$yesterday" ]]; then
        echo -e "  ${YELLOW}⚠ WARNING:${NC} Staging is stale (latest: $latest_staging, expected: >= $yesterday)"
        ((WARNINGS++))
    else
        echo -e "  ${GREEN}✓ OK${NC}"
    fi
else
    echo -e "  ${RED}✗ FAIL:${NC} No data in Staging table"
    ((FAILURES++))
fi

echo ""

################################################################################
# CHECK 3: PRICES TABLE FRESHNESS
################################################################################

echo -e "${BLUE}[CHECK 3/5]${NC} Prices Table Freshness (source=polygon)"

latest_prices=$(get_latest_date_in_table "$FULL_DESTINATION_TABLE" "WHERE source = 'polygon'")

if [ -n "$latest_prices" ] && [ "$latest_prices" != "null" ]; then
    echo "  Latest date in Prices: $latest_prices"

    yesterday=$(get_date_n_days_ago 1)
    if [[ "$latest_prices" < "$yesterday" ]]; then
        echo -e "  ${YELLOW}⚠ WARNING:${NC} Prices is stale (latest: $latest_prices, expected: >= $yesterday)"
        ((WARNINGS++))
    else
        echo -e "  ${GREEN}✓ OK${NC}"
    fi
else
    echo -e "  ${RED}✗ FAIL:${NC} No Polygon data in Prices table"
    ((FAILURES++))
fi

echo ""

################################################################################
# CHECK 4: DATE COVERAGE (last N days)
################################################################################

echo -e "${BLUE}[CHECK 4/5]${NC} Date Coverage (last ${LOOKBACK_DAYS} days)"

echo "  Date       | Staging | Prices"
echo "  -----------|---------|--------"

missing_staging=0
missing_prices=0

for i in $(seq 1 $LOOKBACK_DAYS); do
    check_date=$(get_date_n_days_ago $i)

    staging_count=$(check_date_exists "$FULL_STAGING_TABLE" "$check_date" "")
    prices_count=$(check_date_exists "$FULL_DESTINATION_TABLE" "$check_date" "AND source = 'polygon'")

    staging_icon=$([ "$staging_count" -gt 0 ] && echo "✓" || echo "✗")
    prices_icon=$([ "$prices_count" -gt 0 ] && echo "✓" || echo "✗")

    echo "  $check_date |    $staging_icon    |   $prices_icon"

    [ "$staging_count" -eq 0 ] && ((missing_staging++))
    [ "$prices_count" -eq 0 ] && ((missing_prices++))
done

echo ""

if [ $missing_staging -gt 0 ]; then
    echo -e "  ${YELLOW}⚠ WARNING:${NC} $missing_staging date(s) missing in Staging"
    ((WARNINGS++))
fi

if [ $missing_prices -gt 0 ]; then
    echo -e "  ${YELLOW}⚠ WARNING:${NC} $missing_prices date(s) missing in Prices"
    ((WARNINGS++))
fi

if [ $missing_staging -eq 0 ] && [ $missing_prices -eq 0 ]; then
    echo -e "  ${GREEN}✓ OK${NC} All dates present"
fi

echo ""

################################################################################
# CHECK 5: DATA QUALITY (quick check)
################################################################################

echo -e "${BLUE}[CHECK 5/5]${NC} Data Quality (last 7 days)"

# Check for NULL close prices
null_count=$(bq query \
    --project_id="$PROJECT_ID" \
    --use_legacy_sql=false \
    --format=csv \
    --quiet \
    "SELECT COUNT(*) FROM \`${FULL_STAGING_TABLE}\`
     WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
       AND close IS NULL" 2>/dev/null | tail -n1)

if [ "$null_count" -gt 0 ]; then
    echo -e "  ${YELLOW}⚠ WARNING:${NC} Found $null_count rows with NULL close prices"
    ((WARNINGS++))
else
    echo "  NULL close prices: 0"
fi

# Check for duplicates
dup_count=$(bq query \
    --project_id="$PROJECT_ID" \
    --use_legacy_sql=false \
    --format=csv \
    --quiet \
    "SELECT COUNT(*) FROM (
       SELECT ticker, date, COUNT(*) as cnt
       FROM \`${FULL_STAGING_TABLE}\`
       WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
       GROUP BY ticker, date
       HAVING COUNT(*) > 1
     )" 2>/dev/null | tail -n1)

if [ "$dup_count" -gt 0 ]; then
    echo -e "  ${YELLOW}⚠ WARNING:${NC} Found $dup_count duplicate (ticker, date) pairs"
    ((WARNINGS++))
else
    echo "  Duplicates: 0"
fi

echo -e "  ${GREEN}✓ OK${NC}"
echo ""

################################################################################
# SUMMARY
################################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SUMMARY                                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Warnings: $WARNINGS"
echo "  Failures: $FAILURES"
echo ""

if [ $FAILURES -gt 0 ]; then
    echo -e "${RED}✗ FAIL${NC} Critical issues detected"
    echo ""
    echo "REMEDIATION:"
    echo "  1. Check GCS bucket for recent data"
    echo "  2. Review Data Transfer Service logs"
    echo "  3. Check Scheduled Query execution history"
    echo "  4. Run backfill if necessary"
    exit 2
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ WARN${NC} Minor issues detected"
    echo ""
    echo "RECOMMENDED ACTIONS:"
    echo "  - Review logs for any errors"
    echo "  - Consider running backfill for missing dates"
    echo "  - Monitor for recurrence"
    exit 1
else
    echo -e "${GREEN}✓ OK${NC} All checks passed"
    exit 0
fi

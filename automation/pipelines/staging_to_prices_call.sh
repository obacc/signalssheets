#!/bin/bash
################################################################################
# STAGING → PRICES STORED PROCEDURE CALLER
# Invokes sp_merge_polygon_prices to move data from staging to Prices table
#
# Usage:
#   ./staging_to_prices_call.sh [--plan]
#   ./staging_to_prices_call.sh --from 2025-11-01 --to 2025-11-10 [--plan]
#
# Options:
#   --from DATE       Start date (for verification only)
#   --to DATE         End date (for verification only)
#   --plan            Dry-run mode
#   --force           Skip confirmation
#
# Note: The stored procedure processes ALL data in staging.
#       Date range is used only for pre/post validation.
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
    echo -e "${RED}✗ No config file found${NC}"
    exit 1
fi

# Variables
FROM_DATE=""
TO_DATE=""
PLAN_MODE=false
FORCE_MODE=false

################################################################################
# FUNCTIONS
################################################################################

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Invoke stored procedure to merge staging data into Prices table.

OPTIONS:
    --from DATE       Start date for validation (YYYY-MM-DD)
    --to DATE         End date for validation (YYYY-MM-DD)
    --plan            Dry-run mode (show what would be executed)
    --force           Skip confirmation prompts
    -h, --help        Show this help message

EXAMPLES:
    # Execute SP (processes ALL staging data)
    $0

    # Dry-run
    $0 --plan

    # Execute with date range validation
    $0 --from 2025-11-01 --to 2025-11-10

NOTES:
    - The SP processes ALL data in staging table
    - Date range is only used for pre/post validation
    - SP should be idempotent (uses MERGE statement)
EOF
    exit 0
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

get_row_count() {
    local table=$1
    local from_date=$2
    local to_date=$3

    local where_clause=""
    if [ -n "$from_date" ] && [ -n "$to_date" ]; then
        where_clause="WHERE date >= '$from_date' AND date <= '$to_date'"
    fi

    local query="SELECT COUNT(*) as cnt FROM \`$table\` $where_clause"

    bq query \
        --project_id="$PROJECT_ID" \
        --use_legacy_sql=false \
        --format=csv \
        --quiet \
        "$query" 2>/dev/null | tail -n1
}

validate_sp_exists() {
    log_info "Checking if stored procedure exists..."

    if bq show --routine "${FULL_STORED_PROCEDURE}" &>/dev/null; then
        log_success "Stored procedure exists: ${FULL_STORED_PROCEDURE}"
        return 0
    else
        log_error "Stored procedure not found: ${FULL_STORED_PROCEDURE}"
        return 1
    fi
}

run_pre_checks() {
    log_info "Running pre-execution checks..."

    # Check staging row count
    local staging_count=$(get_row_count "$FULL_STAGING_TABLE" "$FROM_DATE" "$TO_DATE")
    echo "  Staging table rows: $staging_count"

    if [ "$staging_count" -eq 0 ]; then
        log_warning "Staging table is empty!"
        return 1
    fi

    # Check prices row count (before)
    local prices_before=$(get_row_count "$FULL_DESTINATION_TABLE" "$FROM_DATE" "$TO_DATE")
    echo "  Prices table rows (before): $prices_before"

    echo "$staging_count|$prices_before"
}

run_post_checks() {
    local staging_count=$1
    local prices_before=$2

    log_info "Running post-execution checks..."

    # Check prices row count (after)
    local prices_after=$(get_row_count "$FULL_DESTINATION_TABLE" "$FROM_DATE" "$TO_DATE")
    echo "  Prices table rows (after): $prices_after"

    local diff=$((prices_after - prices_before))
    echo "  Rows added: $diff"

    if [ $diff -gt 0 ]; then
        log_success "Data successfully merged to Prices table"
    elif [ $diff -eq 0 ]; then
        log_warning "No new rows added (data already exists or idempotent merge)"
    else
        log_error "Rows decreased! Something went wrong."
        return 1
    fi
}

execute_sp() {
    log_info "Executing stored procedure: ${STORED_PROCEDURE}"

    if [ "$PLAN_MODE" = true ]; then
        echo -e "${YELLOW}[PLAN]${NC} Would execute: CALL \`${FULL_STORED_PROCEDURE}\`();"
        return 0
    fi

    local start_time=$(date +%s)

    # Execute SP
    bq query \
        --project_id="$PROJECT_ID" \
        --use_legacy_sql=false \
        --format=prettyjson \
        "CALL \`${FULL_STORED_PROCEDURE}\`();" > "/tmp/sp_result_$(date +%Y%m%d_%H%M%S).json"

    local exit_code=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ $exit_code -eq 0 ]; then
        log_success "Stored procedure completed in ${duration}s"
        return 0
    else
        log_error "Stored procedure failed (exit code: $exit_code)"
        return 1
    fi
}

################################################################################
# PARSE ARGUMENTS
################################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --from)
            FROM_DATE="$2"
            shift 2
            ;;
        --to)
            TO_DATE="$2"
            shift 2
            ;;
        --plan)
            PLAN_MODE=true
            shift
            ;;
        --force)
            FORCE_MODE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

################################################################################
# MAIN EXECUTION
################################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     STAGING → PRICES (SP EXECUTION)                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_info "Configuration:"
echo "  Project:      $PROJECT_ID"
echo "  SP:           $STORED_PROCEDURE"
echo "  Staging:      $STAGING_TABLE"
echo "  Destination:  $DESTINATION_TABLE"
echo "  Mode:         $([ "$PLAN_MODE" = true ] && echo "DRY-RUN (plan)" || echo "EXECUTE")"
if [ -n "$FROM_DATE" ] && [ -n "$TO_DATE" ]; then
    echo "  Validation:   $FROM_DATE to $TO_DATE"
fi
echo ""

# Validate SP exists
if ! validate_sp_exists; then
    exit 1
fi

# Pre-checks
counts=$(run_pre_checks)
IFS='|' read -r staging_count prices_before <<< "$counts"

if [ "$PLAN_MODE" = false ] && [ "$FORCE_MODE" = false ]; then
    echo ""
    read -p "Proceed with SP execution? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Aborted by user"
        exit 0
    fi
fi

echo ""

# Execute SP
if execute_sp; then
    if [ "$PLAN_MODE" = false ]; then
        echo ""
        run_post_checks "$staging_count" "$prices_before"
    fi
    echo ""
    log_success "Process completed successfully"
    exit 0
else
    log_error "Process failed"
    exit 1
fi

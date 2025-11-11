#!/bin/bash
################################################################################
# POLYGON PIPELINE BACKFILL ORCHESTRATOR
# Orchestrates end-to-end backfill: GCS → Staging → Prices
#
# Usage:
#   ./backfill_polygon.sh --from 2025-11-01 --to 2025-11-10 [--plan]
#
# This script:
#   1. Detects missing dates (compares GCS vs Staging vs Prices)
#   2. Loads missing data from GCS to Staging
#   3. Executes SP to merge Staging to Prices
#   4. Validates results
#
# Options:
#   --from DATE        Start date (YYYY-MM-DD)
#   --to DATE          End date (YYYY-MM-DD)
#   --plan             Dry-run mode
#   --force            Skip confirmation
#   --skip-detection   Skip gap detection, process all dates in range
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load configuration
if [ -f "$SCRIPT_DIR/config/.env" ]; then
    source "$SCRIPT_DIR/config/.env"
elif [ -f "$SCRIPT_DIR/config/env.example" ]; then
    source "$SCRIPT_DIR/config/env.example"
else
    echo -e "${RED}✗ No config file found${NC}"
    exit 1
fi

# Variables
FROM_DATE=""
TO_DATE=""
PLAN_MODE=false
FORCE_MODE=false
SKIP_DETECTION=false

# Logging
LOG_FILE="/tmp/backfill_polygon_$(date +%Y%m%d_%H%M%S).log"

################################################################################
# FUNCTIONS
################################################################################

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Orchestrate backfill of Polygon data from GCS through to Prices table.

OPTIONS:
    --from DATE        Start date (YYYY-MM-DD)
    --to DATE          End date (YYYY-MM-DD)
    --plan             Dry-run mode (show plan without executing)
    --force            Skip confirmation prompts
    --skip-detection   Process all dates without gap detection
    -h, --help         Show this help message

EXAMPLES:
    # Plan backfill for a date range
    $0 --from 2025-11-01 --to 2025-11-10 --plan

    # Execute backfill
    $0 --from 2025-11-01 --to 2025-11-10

    # Force execution without prompts
    $0 --from 2025-11-01 --to 2025-11-10 --force

WORKFLOW:
    1. Gap Detection: Find dates missing in Staging/Prices
    2. GCS → Staging: Load missing dates from GCS
    3. Staging → Prices: Execute SP to merge data
    4. Validation: Verify data integrity

LOGS:
    Execution log: $LOG_FILE
EOF
    exit 0
}

log_info() {
    local msg="[INFO] $(date '+%Y-%m-%d %H:%M:%S') $1"
    echo -e "${BLUE}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

log_success() {
    local msg="[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') $1"
    echo -e "${GREEN}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

log_warning() {
    local msg="[WARNING] $(date '+%Y-%m-%d %H:%M:%S') $1"
    echo -e "${YELLOW}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

log_error() {
    local msg="[ERROR] $(date '+%Y-%m-%d %H:%M:%S') $1"
    echo -e "${RED}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

generate_date_range() {
    local start=$1
    local end=$2
    local current=$start

    while [[ "$current" < "$end" ]] || [[ "$current" == "$end" ]]; do
        echo "$current"
        current=$(date -I -d "$current + 1 day")
    done
}

check_gcs_exists() {
    local date=$1
    local gcs_path="${BUCKET_URI}/date=${date}/"

    if gsutil ls "$gcs_path" &>/dev/null; then
        echo "1"
    else
        echo "0"
    fi
}

check_staging_exists() {
    local date=$1

    local count=$(bq query \
        --project_id="$PROJECT_ID" \
        --use_legacy_sql=false \
        --format=csv \
        --quiet \
        "SELECT COUNT(*) FROM \`${FULL_STAGING_TABLE}\` WHERE date = '$date'" 2>/dev/null | tail -n1)

    if [ "$count" -gt 0 ]; then
        echo "1"
    else
        echo "0"
    fi
}

check_prices_exists() {
    local date=$1

    local count=$(bq query \
        --project_id="$PROJECT_ID" \
        --use_legacy_sql=false \
        --format=csv \
        --quiet \
        "SELECT COUNT(*) FROM \`${FULL_DESTINATION_TABLE}\` WHERE date = '$date' AND source = 'polygon'" 2>/dev/null | tail -n1)

    if [ "$count" -gt 0 ]; then
        echo "1"
    else
        echo "0"
    fi
}

detect_gaps() {
    local from=$1
    local to=$2

    log_info "Detecting gaps for date range: $from to $to"

    local dates=()
    while IFS= read -r date; do
        dates+=("$date")
    done < <(generate_date_range "$from" "$to")

    local missing_in_staging=()
    local missing_in_prices=()

    echo ""
    echo -e "${CYAN}Date        | GCS | Staging | Prices | Status${NC}"
    echo "------------|-----|---------|--------|------------------"

    for date in "${dates[@]}"; do
        local in_gcs=$(check_gcs_exists "$date")
        local in_staging=$(check_staging_exists "$date")
        local in_prices=$(check_prices_exists "$date")

        local gcs_icon=$([ "$in_gcs" -eq 1 ] && echo "✓" || echo "✗")
        local staging_icon=$([ "$in_staging" -eq 1 ] && echo "✓" || echo "✗")
        local prices_icon=$([ "$in_prices" -eq 1 ] && echo "✓" || echo "✗")

        local status="OK"
        if [ "$in_gcs" -eq 1 ] && [ "$in_staging" -eq 0 ]; then
            status="MISSING_IN_STAGING"
            missing_in_staging+=("$date")
        elif [ "$in_staging" -eq 1 ] && [ "$in_prices" -eq 0 ]; then
            status="MISSING_IN_PRICES"
            missing_in_prices+=("$date")
        elif [ "$in_gcs" -eq 0 ]; then
            status="NO_GCS_DATA"
        fi

        printf "%s |  %s  |    %s    |   %s    | %s\n" "$date" "$gcs_icon" "$staging_icon" "$prices_icon" "$status"
    done

    echo ""
    log_info "Gap detection summary:"
    echo "  Dates missing in Staging: ${#missing_in_staging[@]}"
    echo "  Dates missing in Prices:  ${#missing_in_prices[@]}"

    # Export to temp files
    printf "%s\n" "${missing_in_staging[@]}" > /tmp/backfill_missing_staging.txt
    printf "%s\n" "${missing_in_prices[@]}" > /tmp/backfill_missing_prices.txt
}

load_to_staging() {
    local dates_file=$1

    if [ ! -s "$dates_file" ]; then
        log_info "No dates to load to staging"
        return 0
    fi

    local dates=()
    while IFS= read -r date; do
        dates+=("$date")
    done < "$dates_file"

    log_info "Loading ${#dates[@]} date(s) to staging..."

    local first_date="${dates[0]}"
    local last_date="${dates[-1]}"

    local plan_flag=""
    [ "$PLAN_MODE" = true ] && plan_flag="--plan"

    "$SCRIPT_DIR/pipelines/gcs_to_staging_load.sh" \
        --from "$first_date" \
        --to "$last_date" \
        --force \
        $plan_flag

    return $?
}

merge_to_prices() {
    log_info "Executing SP to merge staging to prices..."

    local plan_flag=""
    [ "$PLAN_MODE" = true ] && plan_flag="--plan"

    "$SCRIPT_DIR/pipelines/staging_to_prices_call.sh" \
        --from "$FROM_DATE" \
        --to "$TO_DATE" \
        --force \
        $plan_flag

    return $?
}

validate_results() {
    log_info "Validating backfill results..."

    # Re-check gaps
    local dates=()
    while IFS= read -r date; do
        dates+=("$date")
    done < <(generate_date_range "$FROM_DATE" "$TO_DATE")

    local still_missing=0

    for date in "${dates[@]}"; do
        local in_prices=$(check_prices_exists "$date")
        if [ "$in_prices" -eq 0 ]; then
            log_warning "Date still missing in Prices: $date"
            ((still_missing++))
        fi
    done

    if [ $still_missing -eq 0 ]; then
        log_success "All dates successfully backfilled"
        return 0
    else
        log_error "$still_missing date(s) still missing in Prices"
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
        --skip-detection)
            SKIP_DETECTION=true
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
# VALIDATE INPUTS
################################################################################

if [ -z "$FROM_DATE" ] || [ -z "$TO_DATE" ]; then
    log_error "Must specify both --from and --to dates"
    usage
fi

################################################################################
# MAIN EXECUTION
################################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     POLYGON PIPELINE BACKFILL                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_info "Backfill configuration:"
echo "  Date range:     $FROM_DATE to $TO_DATE"
echo "  Mode:           $([ "$PLAN_MODE" = true ] && echo "DRY-RUN (plan)" || echo "EXECUTE")"
echo "  Gap detection:  $([ "$SKIP_DETECTION" = true ] && echo "SKIPPED" || echo "ENABLED")"
echo "  Log file:       $LOG_FILE"
echo ""

# Initialize log
echo "=== Polygon Backfill Log ===" > "$LOG_FILE"
echo "Start time: $(date)" >> "$LOG_FILE"
echo "Date range: $FROM_DATE to $TO_DATE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Step 1: Detect gaps (unless skipped)
if [ "$SKIP_DETECTION" = false ]; then
    detect_gaps "$FROM_DATE" "$TO_DATE"
else
    log_warning "Skipping gap detection, will process all dates"
    generate_date_range "$FROM_DATE" "$TO_DATE" > /tmp/backfill_missing_staging.txt
    generate_date_range "$FROM_DATE" "$TO_DATE" > /tmp/backfill_missing_prices.txt
fi

# Confirmation
if [ "$PLAN_MODE" = false ] && [ "$FORCE_MODE" = false ]; then
    echo ""
    read -p "Proceed with backfill? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Aborted by user"
        exit 0
    fi
fi

echo ""

# Step 2: Load to staging
if load_to_staging "/tmp/backfill_missing_staging.txt"; then
    log_success "Step 1/2: GCS → Staging completed"
else
    log_error "Step 1/2: GCS → Staging failed"
    exit 1
fi

echo ""

# Step 3: Merge to prices
if merge_to_prices; then
    log_success "Step 2/2: Staging → Prices completed"
else
    log_error "Step 2/2: Staging → Prices failed"
    exit 1
fi

echo ""

# Step 4: Validate (only in execute mode)
if [ "$PLAN_MODE" = false ]; then
    if validate_results; then
        log_success "Validation passed"
    else
        log_warning "Validation found issues (see above)"
    fi
fi

# Cleanup temp files
rm -f /tmp/backfill_missing_*.txt

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     BACKFILL COMPLETED                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
log_info "Log file: $LOG_FILE"

exit 0

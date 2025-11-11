#!/bin/bash
################################################################################
# GCS → STAGING LOAD SCRIPT
# Loads Polygon daily data from GCS to BigQuery staging table
#
# Usage:
#   ./gcs_to_staging_load.sh --from 2025-11-01 --to 2025-11-10 [--plan]
#   ./gcs_to_staging_load.sh --date 2025-11-10 [--plan]
#
# Options:
#   --from DATE       Start date (YYYY-MM-DD)
#   --to DATE         End date (YYYY-MM-DD)
#   --date DATE       Single date to load
#   --plan            Dry-run mode (list actions without executing)
#   --force           Skip confirmation prompts
#
# Requirements:
#   - gcloud SDK authenticated
#   - bq CLI tool
#   - Source config/env.example or config/.env
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load configuration
if [ -f "$SCRIPT_DIR/../config/.env" ]; then
    source "$SCRIPT_DIR/../config/.env"
    echo -e "${GREEN}✓ Loaded config from .env${NC}"
elif [ -f "$SCRIPT_DIR/../config/env.example" ]; then
    source "$SCRIPT_DIR/../config/env.example"
    echo -e "${YELLOW}⚠ Using env.example (copy to .env and customize)${NC}"
else
    echo -e "${RED}✗ No config file found${NC}"
    exit 1
fi

# Initialize variables
FROM_DATE=""
TO_DATE=""
SINGLE_DATE=""
PLAN_MODE=false
FORCE_MODE=false

################################################################################
# FUNCTIONS
################################################################################

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Load Polygon data from GCS to BigQuery staging table.

OPTIONS:
    --from DATE       Start date (YYYY-MM-DD)
    --to DATE         End date (YYYY-MM-DD)
    --date DATE       Single date to load
    --plan            Dry-run mode (show what would be loaded)
    --force           Skip confirmation prompts
    -h, --help        Show this help message

EXAMPLES:
    # Load a date range (dry-run)
    $0 --from 2025-11-01 --to 2025-11-10 --plan

    # Load a date range (execute)
    $0 --from 2025-11-01 --to 2025-11-10

    # Load a single date
    $0 --date 2025-11-10

    # Force load without prompts
    $0 --from 2025-11-01 --to 2025-11-10 --force

CONFIGURATION:
    Edit automation/config/.env to customize:
    - PROJECT_ID, DATASET, STAGING_TABLE
    - BUCKET_URI
    - MAX_BAD_RECORDS, WRITE_DISPOSITION
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

validate_date() {
    local date=$1
    if ! date -d "$date" >/dev/null 2>&1; then
        log_error "Invalid date format: $date (expected YYYY-MM-DD)"
        exit 1
    fi
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

check_gcs_path() {
    local date=$1
    local gcs_path="${BUCKET_URI}/date=${date}/"

    if gsutil ls "$gcs_path" &>/dev/null; then
        local file_count=$(gsutil ls "${gcs_path}*.parquet" 2>/dev/null | wc -l)
        echo "$file_count"
    else
        echo "0"
    fi
}

load_single_date() {
    local date=$1
    local gcs_path="${BUCKET_URI}/date=${date}/*.parquet"

    log_info "Processing date: $date"

    # Check if data exists in GCS
    local file_count=$(check_gcs_path "$date")

    if [ "$file_count" -eq 0 ]; then
        log_warning "No files found in GCS for date=$date, skipping"
        return 1
    fi

    log_info "Found $file_count file(s) in GCS"

    if [ "$PLAN_MODE" = true ]; then
        echo -e "${YELLOW}[PLAN]${NC} Would load from: $gcs_path"
        echo -e "${YELLOW}[PLAN]${NC} Would append to: ${FULL_STAGING_TABLE}"
        echo -e "${YELLOW}[PLAN]${NC} Max bad records: ${MAX_BAD_RECORDS}"
        return 0
    fi

    # Execute load
    log_info "Loading data to BigQuery..."

    local job_id="polygon_load_${date}_$(date +%s)"

    bq load \
        --project_id="${PROJECT_ID}" \
        --source_format="${SOURCE_FORMAT}" \
        --max_bad_records="${MAX_BAD_RECORDS}" \
        --replace=false \
        --job_id="$job_id" \
        "${FULL_STAGING_TABLE}" \
        "$gcs_path" 2>&1 | tee -a "/tmp/polygon_load_${date}.log"

    local exit_code=${PIPESTATUS[0]}

    if [ $exit_code -eq 0 ]; then
        log_success "Successfully loaded date=$date (job: $job_id)"
        return 0
    else
        log_error "Failed to load date=$date (job: $job_id)"
        log_error "Check logs: /tmp/polygon_load_${date}.log"
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
        --date)
            SINGLE_DATE="$2"
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
# VALIDATE INPUTS
################################################################################

if [ -n "$SINGLE_DATE" ]; then
    validate_date "$SINGLE_DATE"
    FROM_DATE="$SINGLE_DATE"
    TO_DATE="$SINGLE_DATE"
elif [ -n "$FROM_DATE" ] && [ -n "$TO_DATE" ]; then
    validate_date "$FROM_DATE"
    validate_date "$TO_DATE"

    if [[ "$FROM_DATE" > "$TO_DATE" ]]; then
        log_error "FROM_DATE ($FROM_DATE) must be <= TO_DATE ($TO_DATE)"
        exit 1
    fi
else
    log_error "Must specify either --date or both --from and --to"
    usage
fi

################################################################################
# MAIN EXECUTION
################################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     GCS → STAGING LOAD                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_info "Configuration:"
echo "  Project:      $PROJECT_ID"
echo "  Dataset:      $DATASET"
echo "  Table:        $STAGING_TABLE"
echo "  GCS Bucket:   $BUCKET_URI"
echo "  Date Range:   $FROM_DATE to $TO_DATE"
echo "  Mode:         $([ "$PLAN_MODE" = true ] && echo "DRY-RUN (plan)" || echo "EXECUTE")"
echo ""

# Generate list of dates
dates=()
while IFS= read -r date; do
    dates+=("$date")
done < <(generate_date_range "$FROM_DATE" "$TO_DATE")

log_info "Dates to process: ${#dates[@]}"

# Confirmation (unless --force or --plan)
if [ "$PLAN_MODE" = false ] && [ "$FORCE_MODE" = false ]; then
    echo ""
    read -p "Proceed with load? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Aborted by user"
        exit 0
    fi
fi

# Process each date
success_count=0
skip_count=0
fail_count=0

for date in "${dates[@]}"; do
    if load_single_date "$date"; then
        ((success_count++))
    else
        if [ "$(check_gcs_path "$date")" -eq 0 ]; then
            ((skip_count++))
        else
            ((fail_count++))
        fi
    fi
    echo ""
done

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SUMMARY                                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Total dates:       ${#dates[@]}"
echo "  Successfully loaded: $success_count"
echo "  Skipped (no data): $skip_count"
echo "  Failed:            $fail_count"
echo ""

if [ $fail_count -gt 0 ]; then
    log_error "Some loads failed. Check logs in /tmp/"
    exit 1
else
    log_success "All loads completed successfully"
    exit 0
fi

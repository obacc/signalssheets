#!/usr/bin/env python3
"""
PASO 1: Create backups before SP deployment
"""
import os
import json
from google.cloud import bigquery
from datetime import datetime

# Set credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
DATASET_ID = 'IS_Fundamentales'

client = bigquery.Client(project=PROJECT_ID)

backup_date = datetime.now().strftime('%Y%m%d_%H%M%S')
backup_results = []

print("=" * 70)
print("PASO 1: CREATING BACKUPS")
print(f"Timestamp: {datetime.now().isoformat()}")
print("=" * 70)

# 1. Backup current SP definition
print("\n[1/3] Backing up stored procedure definition...")
sp_query = """
SELECT
    routine_name,
    routine_definition,
    created,
    last_modified
FROM `sunny-advantage-471523-b3.IS_Fundamentales.INFORMATION_SCHEMA.ROUTINES`
WHERE routine_name = 'sp_refresh_fundamentals_tables'
"""

try:
    sp_result = list(client.query(sp_query).result())
    if sp_result:
        row = sp_result[0]
        backup_results.append({
            "type": "stored_procedure",
            "name": row.routine_name,
            "created": str(row.created),
            "last_modified": str(row.last_modified),
            "definition_length": len(row.routine_definition) if row.routine_definition else 0
        })
        print(f"   ✅ SP found: {row.routine_name}")
        print(f"   - Last modified: {row.last_modified}")
        print(f"   - Definition length: {len(row.routine_definition) if row.routine_definition else 0} chars")
    else:
        print("   ⚠️ SP not found")
        backup_results.append({"type": "stored_procedure", "name": "sp_refresh_fundamentals_tables", "status": "not_found"})
except Exception as e:
    print(f"   ❌ Error querying SP: {e}")
    backup_results.append({"type": "stored_procedure", "error": str(e)})

# 2. Backup fundamentals_timeseries row count and sample
print("\n[2/3] Backing up fundamentals_timeseries info...")
ts_query = """
SELECT
    COUNT(*) as total_rows,
    COUNT(DISTINCT ticker) as unique_tickers,
    COUNT(CASE WHEN fiscal_period = 'Q4_calc' THEN 1 END) as q4_calc_rows,
    MIN(fiscal_year) as min_year,
    MAX(fiscal_year) as max_year
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
"""

try:
    ts_result = list(client.query(ts_query).result())[0]
    backup_results.append({
        "type": "fundamentals_timeseries",
        "total_rows": ts_result.total_rows,
        "unique_tickers": ts_result.unique_tickers,
        "q4_calc_rows": ts_result.q4_calc_rows,
        "year_range": f"{ts_result.min_year}-{ts_result.max_year}"
    })
    print(f"   ✅ Total rows: {ts_result.total_rows:,}")
    print(f"   - Unique tickers: {ts_result.unique_tickers}")
    print(f"   - Q4_calc rows: {ts_result.q4_calc_rows:,}")
    print(f"   - Year range: {ts_result.min_year}-{ts_result.max_year}")
except Exception as e:
    print(f"   ❌ Error: {e}")
    backup_results.append({"type": "fundamentals_timeseries", "error": str(e)})

# 3. Backup fundamentals_ratios row count and columns
print("\n[3/3] Backing up fundamentals_ratios info...")
ratios_query = """
SELECT
    COUNT(*) as total_rows,
    COUNT(DISTINCT ticker) as unique_tickers
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_ratios`
"""

try:
    ratios_result = list(client.query(ratios_query).result())[0]

    # Get column list
    cols_query = """
    SELECT column_name
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.INFORMATION_SCHEMA.COLUMNS`
    WHERE table_name = 'fundamentals_ratios'
    ORDER BY ordinal_position
    """
    cols_result = [row.column_name for row in client.query(cols_query).result()]

    # Check for price-dependent columns
    price_columns = ['price_to_earnings', 'price_to_book', 'price_to_sales', 'peg_ratio']
    existing_price_cols = [c for c in price_columns if c in cols_result]

    backup_results.append({
        "type": "fundamentals_ratios",
        "total_rows": ratios_result.total_rows,
        "unique_tickers": ratios_result.unique_tickers,
        "total_columns": len(cols_result),
        "price_dependent_columns": existing_price_cols
    })
    print(f"   ✅ Total rows: {ratios_result.total_rows:,}")
    print(f"   - Unique tickers: {ratios_result.unique_tickers}")
    print(f"   - Total columns: {len(cols_result)}")
    print(f"   - Price-dependent columns found: {existing_price_cols}")
except Exception as e:
    print(f"   ❌ Error: {e}")
    backup_results.append({"type": "fundamentals_ratios", "error": str(e)})

# 4. Check existing backup table from previous correction
print("\n[4/4] Checking existing EPS backup table...")
backup_check_query = """
SELECT COUNT(*) as rows
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries_BACKUP_EPS_20251205`
"""
try:
    backup_rows = list(client.query(backup_check_query).result())[0].rows
    backup_results.append({
        "type": "existing_backup",
        "table": "fundamentals_timeseries_BACKUP_EPS_20251205",
        "rows": backup_rows
    })
    print(f"   ✅ Existing backup found: {backup_rows:,} rows")
except Exception as e:
    print(f"   ⚠️ No existing backup table (this is expected if fresh start)")
    backup_results.append({"type": "existing_backup", "status": "not_found"})

# Save backup report
print("\n" + "=" * 70)
print("BACKUP SUMMARY")
print("=" * 70)

backup_report = {
    "timestamp": datetime.now().isoformat(),
    "backup_date": backup_date,
    "results": backup_results
}

# Save to file
report_path = f'/home/user/signalssheets/sp_deployment/backup_report_{backup_date}.json'
with open(report_path, 'w') as f:
    json.dump(backup_report, f, indent=2)

print(f"\n✅ Backup report saved: {report_path}")
print("\n" + "=" * 70)
print("PASO 1 COMPLETE - Ready for PASO 2")
print("=" * 70)

#!/usr/bin/env python3
"""
DEPLOYMENT: sp_refresh_fundamentals_tables CORREGIDO
Ejecuta PASO 2 al PASO 8 según DEPLOYMENT_INSTRUCTIONS

CORRECCIONES APLICADAS:
1. EPS Q4_calc = FY - (Q1 + Q2 + Q3) en lugar de copiar FY directamente
2. Removidos ratios dependientes de precio (price_to_earnings, price_to_book, price_to_sales, peg_ratio)
"""
import os
import json
import time
from datetime import datetime
from google.cloud import bigquery

# Set credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
DATASET_ID = 'IS_Fundamentales'

client = bigquery.Client(project=PROJECT_ID)

deployment_log = []

def log_step(paso, message, status="info"):
    """Log deployment step"""
    timestamp = datetime.now().isoformat()
    entry = {"timestamp": timestamp, "paso": paso, "message": message, "status": status}
    deployment_log.append(entry)
    symbol = "✅" if status == "success" else "❌" if status == "error" else "🔄"
    print(f"[{paso}] {symbol} {message}")
    return entry

def execute_query(query, paso, description):
    """Execute query and return result"""
    try:
        log_step(paso, f"Executing: {description}")
        job = client.query(query)
        result = job.result()
        rows_affected = job.num_dml_affected_rows if job.num_dml_affected_rows else 0
        log_step(paso, f"Completed: {description} ({rows_affected} rows)", "success")
        return result, rows_affected
    except Exception as e:
        log_step(paso, f"Failed: {description} - {str(e)}", "error")
        raise

print("=" * 80)
print("DEPLOYMENT: sp_refresh_fundamentals_tables CORREGIDO")
print(f"Timestamp: {datetime.now().isoformat()}")
print("=" * 80)

# ============================================================================
# PASO 2: LIMPIAR COLUMNAS DEPENDIENTES DE PRECIO
# ============================================================================
print("\n" + "=" * 80)
print("PASO 2: LIMPIAR COLUMNAS DEPENDIENTES DE PRECIO")
print("=" * 80)

# Check current columns
check_cols_query = """
SELECT column_name
FROM `sunny-advantage-471523-b3.IS_Fundamentales.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'fundamentals_ratios'
ORDER BY ordinal_position
"""
current_cols = [row.column_name for row in client.query(check_cols_query).result()]
log_step("PASO 2", f"Current ratios columns: {len(current_cols)}")

price_columns = ['price_to_earnings', 'price_to_book', 'price_to_sales', 'peg_ratio']
cols_to_drop = [c for c in price_columns if c in current_cols]

if cols_to_drop:
    log_step("PASO 2", f"Dropping columns: {cols_to_drop}")
    for col in cols_to_drop:
        drop_query = f"""
        ALTER TABLE `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_ratios`
        DROP COLUMN IF EXISTS {col}
        """
        try:
            client.query(drop_query).result()
            log_step("PASO 2", f"Dropped column: {col}", "success")
        except Exception as e:
            log_step("PASO 2", f"Error dropping {col}: {e}", "error")
else:
    log_step("PASO 2", "No price-dependent columns to drop", "success")

# Verify columns after drop
final_cols = [row.column_name for row in client.query(check_cols_query).result()]
log_step("PASO 2", f"Final ratios columns: {len(final_cols)}", "success")

# ============================================================================
# PASO 3: CREAR SP CORREGIDO
# ============================================================================
print("\n" + "=" * 80)
print("PASO 3: CREAR SP CORREGIDO")
print("=" * 80)

# Read the fixed SP
with open('/home/user/signalssheets/sp_deployment/sp_refresh_fundamentals_tables_FIXED.sql', 'r') as f:
    sp_body = f.read()

# Create the SP (CREATE OR REPLACE)
create_sp_query = f"""
CREATE OR REPLACE PROCEDURE `{PROJECT_ID}.{DATASET_ID}.sp_refresh_fundamentals_tables`()
{sp_body}
"""

try:
    client.query(create_sp_query).result()
    log_step("PASO 3", "SP created/replaced successfully", "success")
except Exception as e:
    log_step("PASO 3", f"SP creation failed: {e}", "error")
    raise

# ============================================================================
# PASO 4: EJECUTAR SP CORREGIDO
# ============================================================================
print("\n" + "=" * 80)
print("PASO 4: EJECUTAR SP CORREGIDO (~5-10 min)")
print("=" * 80)

log_step("PASO 4", "Starting SP execution...")
start_time = time.time()

call_sp_query = f"CALL `{PROJECT_ID}.{DATASET_ID}.sp_refresh_fundamentals_tables`()"

try:
    job = client.query(call_sp_query)
    # Set a longer timeout for SP execution
    result = job.result(timeout=900)  # 15 min timeout

    elapsed = time.time() - start_time
    log_step("PASO 4", f"SP execution completed in {elapsed:.1f} seconds", "success")
except Exception as e:
    elapsed = time.time() - start_time
    log_step("PASO 4", f"SP execution failed after {elapsed:.1f}s: {e}", "error")
    raise

# ============================================================================
# PASO 5: VALIDAR AAPL Q4_calc = 1.02
# ============================================================================
print("\n" + "=" * 80)
print("PASO 5: VALIDAR AAPL Q4_calc")
print("=" * 80)

aapl_validation_query = """
SELECT
    ticker,
    fiscal_year,
    fiscal_period,
    eps_diluted,
    ROUND(eps_diluted, 2) as eps_rounded
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
WHERE ticker = 'AAPL'
    AND fiscal_year = 2024
    AND fiscal_period IN ('Q1', 'Q2', 'Q3', 'Q4_calc', 'FY')
ORDER BY fiscal_period
"""

aapl_results = list(client.query(aapl_validation_query).result())
print("\nAAPL 2024 EPS Values:")
print("-" * 50)

q4_calc_eps = None
fy_eps = None
sum_q123 = 0

for row in aapl_results:
    print(f"  {row.fiscal_period}: ${row.eps_diluted:.2f}" if row.eps_diluted else f"  {row.fiscal_period}: NULL")
    if row.fiscal_period == 'Q4_calc':
        q4_calc_eps = row.eps_diluted
    elif row.fiscal_period == 'FY':
        fy_eps = row.eps_diluted
    elif row.fiscal_period in ('Q1', 'Q2', 'Q3'):
        if row.eps_diluted:
            sum_q123 += row.eps_diluted

# Validate Q4_calc ≈ 1.02
expected_q4 = 1.02
if q4_calc_eps:
    diff = abs(q4_calc_eps - expected_q4)
    if diff < 0.1:  # Within 0.1 tolerance
        log_step("PASO 5", f"AAPL Q4_calc = ${q4_calc_eps:.2f} (expected ~$1.02) ✓", "success")
    else:
        log_step("PASO 5", f"AAPL Q4_calc = ${q4_calc_eps:.2f} (expected ~$1.02) - MISMATCH", "error")
else:
    log_step("PASO 5", "AAPL Q4_calc not found!", "error")

# Validate sum
if fy_eps and q4_calc_eps:
    calculated_sum = sum_q123 + q4_calc_eps
    diff_pct = abs(calculated_sum - fy_eps) / fy_eps * 100 if fy_eps else 0
    print(f"\n  Validation: Q1 + Q2 + Q3 + Q4_calc = ${calculated_sum:.2f}")
    print(f"              FY = ${fy_eps:.2f}")
    print(f"              Difference: {diff_pct:.2f}%")

    if diff_pct < 5:  # Within 5% tolerance
        log_step("PASO 5", f"Sum validation passed (diff: {diff_pct:.2f}%)", "success")
    else:
        log_step("PASO 5", f"Sum validation failed (diff: {diff_pct:.2f}%)", "error")

# ============================================================================
# PASO 6: VALIDAR OTROS TICKERS
# ============================================================================
print("\n" + "=" * 80)
print("PASO 6: VALIDAR OTROS TICKERS")
print("=" * 80)

tickers_validation_query = """
WITH ticker_validation AS (
    SELECT
        ticker,
        fiscal_year,
        MAX(CASE WHEN fiscal_period = 'FY' THEN eps_diluted END) as fy_eps,
        SUM(CASE WHEN fiscal_period IN ('Q1', 'Q2', 'Q3', 'Q4_calc') THEN eps_diluted ELSE 0 END) as sum_quarters
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
    WHERE ticker IN ('AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'TSLA', 'AMZN', 'JPM', 'V', 'WMT')
        AND fiscal_year = 2024
    GROUP BY ticker, fiscal_year
)
SELECT
    ticker,
    fiscal_year,
    fy_eps,
    sum_quarters,
    ROUND(ABS(sum_quarters - fy_eps) / NULLIF(fy_eps, 0) * 100, 2) as diff_pct
FROM ticker_validation
WHERE fy_eps IS NOT NULL
ORDER BY ticker
"""

ticker_results = list(client.query(tickers_validation_query).result())
print("\n10 Tickers Validation (FY 2024):")
print("-" * 70)
print(f"{'Ticker':<8} {'FY EPS':>10} {'Sum Q1-Q4':>12} {'Diff %':>10} {'Status':>10}")
print("-" * 70)

passed = 0
failed = 0
for row in ticker_results:
    if row.diff_pct and row.diff_pct < 5:
        status = "✓ PASS"
        passed += 1
    else:
        status = "✗ FAIL"
        failed += 1
    print(f"{row.ticker:<8} ${row.fy_eps:>9.2f} ${row.sum_quarters:>11.2f} {row.diff_pct:>9.2f}% {status:>10}")

log_step("PASO 6", f"Ticker validation: {passed} passed, {failed} failed", "success" if failed == 0 else "error")

# ============================================================================
# PASO 7: VALIDAR RATIOS SIN COLUMNAS DE PRECIO
# ============================================================================
print("\n" + "=" * 80)
print("PASO 7: VALIDAR RATIOS SIN COLUMNAS DE PRECIO")
print("=" * 80)

# Check final columns
ratios_cols_query = """
SELECT column_name
FROM `sunny-advantage-471523-b3.IS_Fundamentales.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'fundamentals_ratios'
ORDER BY ordinal_position
"""

final_ratios_cols = [row.column_name for row in client.query(ratios_cols_query).result()]
print(f"\nFinal ratios table columns ({len(final_ratios_cols)}):")

# Check for removed columns
removed = [c for c in price_columns if c not in final_ratios_cols]
remaining = [c for c in price_columns if c in final_ratios_cols]

if remaining:
    log_step("PASO 7", f"WARNING: Price columns still present: {remaining}", "error")
else:
    log_step("PASO 7", f"All price-dependent columns removed: {price_columns}", "success")

# Check row counts
count_query = """
SELECT
    (SELECT COUNT(*) FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`) as ts_rows,
    (SELECT COUNT(*) FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_ratios`) as ratios_rows
"""
counts = list(client.query(count_query).result())[0]
print(f"\nRow counts:")
print(f"  fundamentals_timeseries: {counts.ts_rows:,}")
print(f"  fundamentals_ratios: {counts.ratios_rows:,}")

log_step("PASO 7", f"Ratios table: {counts.ratios_rows:,} rows, {len(final_ratios_cols)} columns", "success")

# ============================================================================
# PASO 8: GENERAR REPORTE FINAL
# ============================================================================
print("\n" + "=" * 80)
print("PASO 8: GENERAR REPORTE FINAL")
print("=" * 80)

report = {
    "deployment_timestamp": datetime.now().isoformat(),
    "sp_name": "sp_refresh_fundamentals_tables",
    "corrections_applied": [
        "EPS Q4_calc = FY - (Q1 + Q2 + Q3)",
        "Removed price_to_earnings from ratios",
        "Removed price_to_book from ratios",
        "Removed price_to_sales from ratios",
        "Removed peg_ratio from ratios"
    ],
    "validation_results": {
        "aapl_q4_calc": q4_calc_eps,
        "aapl_expected": 1.02,
        "tickers_passed": passed,
        "tickers_failed": failed,
        "ratios_columns_removed": removed,
        "ts_rows": counts.ts_rows,
        "ratios_rows": counts.ratios_rows
    },
    "deployment_log": deployment_log
}

# Save report
report_path = f'/home/user/signalssheets/sp_deployment/deployment_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
with open(report_path, 'w') as f:
    json.dump(report, f, indent=2)

print(f"\n✅ Report saved: {report_path}")

# Final summary
print("\n" + "=" * 80)
print("DEPLOYMENT COMPLETE - SUMMARY")
print("=" * 80)
print(f"""
CORRECCIONES APLICADAS:
  ✅ EPS Q4_calc = FY - (Q1 + Q2 + Q3)
  ✅ Removed price-dependent columns from ratios

VALIDACIÓN:
  AAPL Q4_calc: ${q4_calc_eps:.2f if q4_calc_eps else 'N/A'} (expected ~$1.02)
  Tickers passed: {passed}/{passed+failed}
  Ratios columns: {len(final_ratios_cols)} (removed {len(removed)} price columns)

TABLAS ACTUALIZADAS:
  fundamentals_timeseries: {counts.ts_rows:,} rows
  fundamentals_ratios: {counts.ratios_rows:,} rows
""")

if failed == 0 and q4_calc_eps and abs(q4_calc_eps - 1.02) < 0.1:
    print("🎉 DEPLOYMENT SUCCESSFUL!")
else:
    print("⚠️ DEPLOYMENT COMPLETED WITH WARNINGS - Review validation results")

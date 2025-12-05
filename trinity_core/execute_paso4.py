#!/usr/bin/env python3
"""
PASO 4: Ejecutar SP sp_generate_trinity_signals y validar resultados
"""
import os
from google.cloud import bigquery
from datetime import datetime
import pandas as pd

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
client = bigquery.Client(project=PROJECT_ID)

execution_date = datetime.now().strftime('%Y-%m-%d')
start_time = datetime.now()

print("=" * 70)
print("PASO 4: EJECUTAR SP Y VALIDAR RESULTADOS")
print(f"Timestamp: {start_time.isoformat()}")
print(f"Execution Date: {execution_date}")
print("=" * 70)

# Log file
log_lines = []
log_lines.append("=" * 70)
log_lines.append("TRINITY METHOD - EXECUTION LOG")
log_lines.append(f"Execution Start: {start_time.isoformat()}")
log_lines.append(f"Signal Date: {execution_date}")
log_lines.append("=" * 70)

# Step 1: Execute the stored procedure
print("\n[1] Executing stored procedure...")
log_lines.append("\n[1] EXECUTION")
try:
    call_sp = f"""
    CALL `sunny-advantage-471523-b3.IS_Fundamentales.sp_generate_trinity_signals`(DATE('{execution_date}'))
    """
    job = client.query(call_sp)
    job.result()  # Wait for completion
    print("    ✅ SP executed successfully")
    log_lines.append("    Status: SUCCESS")
except Exception as e:
    print(f"    ❌ Error: {e}")
    log_lines.append(f"    Status: ERROR - {e}")
    exit(1)

exec_time = (datetime.now() - start_time).total_seconds()
log_lines.append(f"    Execution time: {exec_time:.2f} seconds")

# Step 2: Validate row counts
print("\n[2] Validating results...")
log_lines.append("\n[2] VALIDATION")

count_query = f"""
SELECT
  COUNT(*) as total_rows,
  COUNT(DISTINCT ticker) as unique_tickers,
  COUNTIF(signal_strength = 'STRONG BUY') as strong_buy,
  COUNTIF(signal_strength = 'BUY') as buy,
  COUNTIF(signal_strength = 'HOLD') as hold,
  COUNTIF(signal_strength = 'SELL') as sell,
  COUNTIF(has_complete_data = TRUE) as complete_data,
  AVG(trinity_score) as avg_score,
  MAX(trinity_score) as max_score,
  MIN(trinity_score) as min_score
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_date = DATE('{execution_date}')
"""

try:
    results = list(client.query(count_query).result())
    if results:
        row = results[0]
        print(f"    Total rows: {row.total_rows}")
        print(f"    Unique tickers: {row.unique_tickers}")
        print(f"\n    Signal distribution:")
        print(f"      STRONG BUY: {row.strong_buy}")
        print(f"      BUY: {row.buy}")
        print(f"      HOLD: {row.hold}")
        print(f"      SELL: {row.sell}")
        print(f"\n    Trinity Score stats:")
        print(f"      Average: {row.avg_score:.2f}" if row.avg_score else "      Average: N/A")
        print(f"      Max: {row.max_score:.2f}" if row.max_score else "      Max: N/A")
        print(f"      Min: {row.min_score:.2f}" if row.min_score else "      Min: N/A")
        print(f"\n    Complete data: {row.complete_data}")

        log_lines.append(f"    Total rows: {row.total_rows}")
        log_lines.append(f"    Unique tickers: {row.unique_tickers}")
        log_lines.append(f"    Signal distribution:")
        log_lines.append(f"      STRONG BUY: {row.strong_buy}")
        log_lines.append(f"      BUY: {row.buy}")
        log_lines.append(f"      HOLD: {row.hold}")
        log_lines.append(f"      SELL: {row.sell}")
        log_lines.append(f"    Trinity Score: avg={row.avg_score:.2f if row.avg_score else 0}, max={row.max_score:.2f if row.max_score else 0}, min={row.min_score:.2f if row.min_score else 0}")
except Exception as e:
    print(f"    ❌ Validation error: {e}")
    log_lines.append(f"    Validation error: {e}")

# Step 3: Export TOP 50
print("\n[3] Exporting TOP 50 signals...")
log_lines.append("\n[3] TOP 50 EXPORT")

top50_query = f"""
SELECT
  ranking_position,
  ticker,
  company_name,
  signal_strength,
  trinity_score,
  lynch_score,
  oneil_score,
  graham_score,
  price_current,
  pe_ratio,
  peg_ratio,
  roe,
  eps_growth_yoy,
  entry_price,
  stop_loss,
  target_price,
  confidence_level,
  has_complete_data
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_date = DATE('{execution_date}')
ORDER BY trinity_score DESC
LIMIT 50
"""

try:
    df = client.query(top50_query).to_dataframe()
    if len(df) > 0:
        output_file = f'/home/user/signalssheets/trinity_core/trinity_signals_top50_{execution_date}.csv'
        df.to_csv(output_file, index=False)
        print(f"    ✅ Exported {len(df)} rows to: {output_file}")
        log_lines.append(f"    Exported: {output_file}")
        log_lines.append(f"    Rows: {len(df)}")

        # Show preview
        print("\n    TOP 10 Preview:")
        print("-" * 90)
        for _, r in df.head(10).iterrows():
            print(f"    {r['ranking_position']:3d}. {r['ticker']:<6} | {r['signal_strength']:<10} | Trinity: {r['trinity_score']:.1f} | Price: ${r['price_current']:.2f if r['price_current'] else 0}")
    else:
        print("    ⚠️ No data to export")
        log_lines.append("    No data exported")
except Exception as e:
    print(f"    ❌ Export error: {e}")
    log_lines.append(f"    Export error: {e}")

# Step 4: Show sample buy signals
print("\n[4] Sample BUY/STRONG BUY signals...")
log_lines.append("\n[4] BUY SIGNALS SAMPLE")

buy_query = f"""
SELECT
  ticker,
  company_name,
  signal_strength,
  trinity_score,
  pe_ratio,
  peg_ratio,
  roe,
  entry_price,
  stop_loss,
  target_price,
  risk_reward_ratio
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_date = DATE('{execution_date}')
  AND signal_strength IN ('STRONG BUY', 'BUY')
ORDER BY trinity_score DESC
LIMIT 20
"""

try:
    buy_df = client.query(buy_query).to_dataframe()
    if len(buy_df) > 0:
        print(f"\n    Found {len(buy_df)} BUY signals:")
        print("-" * 100)
        for _, r in buy_df.iterrows():
            print(f"    {r['ticker']:<6} | {r['signal_strength']:<10} | Trinity: {r['trinity_score']:.1f} | Entry: ${r['entry_price']:.2f if r['entry_price'] else 0} | Target: ${r['target_price']:.2f if r['target_price'] else 0}")
        log_lines.append(f"    BUY signals found: {len(buy_df)}")
    else:
        print("    ⚠️ No BUY signals found")
        log_lines.append("    No BUY signals found")
except Exception as e:
    print(f"    ❌ Error: {e}")
    log_lines.append(f"    Error: {e}")

# Step 5: Score distribution by category
print("\n[5] Score distribution analysis...")
log_lines.append("\n[5] SCORE DISTRIBUTION")

dist_query = f"""
SELECT
  signal_strength,
  COUNT(*) as count,
  ROUND(AVG(trinity_score), 2) as avg_trinity,
  ROUND(AVG(lynch_score), 2) as avg_lynch,
  ROUND(AVG(oneil_score), 2) as avg_oneil,
  ROUND(AVG(graham_score), 2) as avg_graham
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_date = DATE('{execution_date}')
GROUP BY signal_strength
ORDER BY avg_trinity DESC
"""

try:
    dist_df = client.query(dist_query).to_dataframe()
    if len(dist_df) > 0:
        print("\n    Signal   | Count | Trinity | Lynch | O'Neil | Graham")
        print("    " + "-" * 60)
        for _, r in dist_df.iterrows():
            print(f"    {r['signal_strength']:<10} | {r['count']:5d} | {r['avg_trinity']:6.1f} | {r['avg_lynch']:5.1f} | {r['avg_oneil']:6.1f} | {r['avg_graham']:6.1f}")
except Exception as e:
    print(f"    ⚠️ {e}")

# Save execution log
end_time = datetime.now()
total_time = (end_time - start_time).total_seconds()

log_lines.append("\n" + "=" * 70)
log_lines.append("EXECUTION SUMMARY")
log_lines.append("=" * 70)
log_lines.append(f"Start: {start_time.isoformat()}")
log_lines.append(f"End: {end_time.isoformat()}")
log_lines.append(f"Total time: {total_time:.2f} seconds")
log_lines.append("=" * 70)

log_file = f'/home/user/signalssheets/trinity_core/execution_log_{execution_date}.txt'
with open(log_file, 'w') as f:
    f.write('\n'.join(log_lines))

print("\n" + "=" * 70)
print("EXECUTION SUMMARY")
print("=" * 70)
print(f"Total execution time: {total_time:.2f} seconds")
print(f"Log file: {log_file}")
print("=" * 70)
print("✅ PASO 4 COMPLETADO")
print("=" * 70)

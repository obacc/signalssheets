#!/usr/bin/env python3
"""
PASO 3: Crear stored procedure sp_generate_trinity_signals
"""
import os
from google.cloud import bigquery
from datetime import datetime

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
client = bigquery.Client(project=PROJECT_ID)

print("=" * 70)
print("PASO 3: CREAR SP sp_generate_trinity_signals")
print(f"Timestamp: {datetime.now().isoformat()}")
print("=" * 70)

# Read the SP SQL file
sp_file = '/home/user/signalssheets/trinity_core/sp_generate_trinity_signals_COMPLETE.sql'
with open(sp_file, 'r') as f:
    sp_sql = f.read()

# Step 1: Create the stored procedure
print("\n[1] Creating stored procedure...")
try:
    # Execute the CREATE PROCEDURE statement
    job = client.query(sp_sql)
    job.result()  # Wait for completion
    print("    ✅ Stored procedure created successfully")
except Exception as e:
    print(f"    ❌ Error creating SP: {e}")
    exit(1)

# Step 2: Verify the SP exists
print("\n[2] Verifying stored procedure...")
verify_query = """
SELECT routine_name, routine_type, created, last_altered
FROM `sunny-advantage-471523-b3.IS_Fundamentales.INFORMATION_SCHEMA.ROUTINES`
WHERE routine_name = 'sp_generate_trinity_signals'
"""
try:
    results = list(client.query(verify_query).result())
    if results:
        for row in results:
            print(f"    ✅ SP found: {row.routine_name}")
            print(f"       Type: {row.routine_type}")
            print(f"       Created: {row.created}")
            print(f"       Last altered: {row.last_altered}")
    else:
        print("    ❌ SP not found in INFORMATION_SCHEMA")
        exit(1)
except Exception as e:
    print(f"    ⚠️ Could not verify: {e}")

# Step 3: Show SP signature
print("\n[3] Stored procedure details...")
print("""
    SP Name: sp_generate_trinity_signals
    Dataset: IS_Fundamentales

    Parameters:
      - execution_date DATE (defaults to CURRENT_DATE if NULL)

    Steps:
      1. Load parameters from parametros_trinity (Moderate scenario)
      2. Get latest prices from market_data.Prices
      3. Calculate 52-week high/low and volume averages
      4. Get latest TTM fundamentals
      5. Get latest ratios
      6. Build base universe with filters
      7. Calculate Lynch scores (PEG, ROE, EPS growth, Revenue growth)
      8. Calculate O'Neil scores (RS, Volume, Momentum, EPS acceleration)
      9. Calculate Graham scores (P/B, Current ratio, Debt, Stability)
      10. Calculate composite scores
      11. Calculate Trinity score (Lynch 35% + O'Neil 35% + Graham 30%)
      12. Generate signals (STRONG BUY, BUY, HOLD, SELL)
      13. Insert into trinity_signals_daily
      14. Cleanup old partitions (>7 days)
""")

print("\n" + "=" * 70)
print("✅ PASO 3 COMPLETADO")
print("=" * 70)
print("\nPara ejecutar el SP:")
print("  CALL `sunny-advantage-471523-b3.IS_Fundamentales.sp_generate_trinity_signals`(CURRENT_DATE());")
print("\nO ejecuta: python3 execute_paso4.py")

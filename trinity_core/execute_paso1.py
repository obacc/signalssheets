#!/usr/bin/env python3
"""
PASO 1: Crear tabla parametros_trinity y poblar con 150 registros (50 params × 3 scenarios)
"""
import os
from google.cloud import bigquery
from datetime import datetime

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
DATASET_ID = 'IS_Fundamentales'

client = bigquery.Client(project=PROJECT_ID)

print("=" * 70)
print("PASO 1: CREAR TABLA parametros_trinity")
print(f"Timestamp: {datetime.now().isoformat()}")
print("=" * 70)

# Read SQL file
with open('/home/user/signalssheets/trinity_core/parametros_trinity_DDL_DATA.sql', 'r') as f:
    sql_content = f.read()

# Split into individual statements
statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

# Execute each statement
for i, stmt in enumerate(statements):
    if not stmt or stmt.startswith('--'):
        continue

    # Determine statement type
    stmt_upper = stmt.upper().strip()
    if stmt_upper.startswith('DROP'):
        stmt_type = "DROP TABLE"
    elif stmt_upper.startswith('CREATE TABLE'):
        stmt_type = "CREATE TABLE"
    elif stmt_upper.startswith('INSERT'):
        stmt_type = "INSERT"
    elif stmt_upper.startswith('SELECT'):
        stmt_type = "SELECT (validation)"
    else:
        stmt_type = "OTHER"

    print(f"\n[{i+1}] Executing: {stmt_type}...")

    try:
        job = client.query(stmt + ';')
        result = job.result()

        if stmt_type == "SELECT (validation)":
            rows = list(result)
            print(f"    Results:")
            for row in rows:
                print(f"      {dict(row)}")
        else:
            print(f"    ✅ Success")

    except Exception as e:
        if "Not found" in str(e) and "DROP" in stmt_type:
            print(f"    ⚠️ Table didn't exist (OK)")
        else:
            print(f"    ❌ Error: {e}")

# Final validation
print("\n" + "=" * 70)
print("VALIDATION")
print("=" * 70)

validation_query = """
SELECT
    scenario_name,
    COUNT(*) as total_params,
    COUNT(DISTINCT category) as categories
FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
GROUP BY scenario_name
ORDER BY scenario_name
"""

result = client.query(validation_query).result()
print("\nParameters by scenario:")
total = 0
for row in result:
    print(f"  {row.scenario_name}: {row.total_params} params, {row.categories} categories")
    total += row.total_params

print(f"\n✅ Total records inserted: {total}")
print("=" * 70)

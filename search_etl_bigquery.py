#!/usr/bin/env python3
"""
Búsqueda exhaustiva de procesos ETL que actualicen analytics.top10_v2
"""
import os
from google.cloud import bigquery
import json

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/tmp/gcp-sa-key.json'

PROJECT_ID = "sunny-advantage-471523-b3"
client = bigquery.Client(project=PROJECT_ID)

results = {
    "stored_procedures": [],
    "jobs_recent": [],
    "table_metadata": {},
    "routines_found": []
}

print("="*80)
print("🔍 BÚSQUEDA DE PROCESOS ETL - analytics.top10_v2")
print("="*80)

# 1. Buscar stored procedures que mencionen top10_v2
print("\n1️⃣ BUSCANDO STORED PROCEDURES...")
print("-"*80)

query_routines = """
SELECT
  routine_schema,
  routine_name,
  routine_type,
  routine_definition,
  created,
  last_altered
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.ROUTINES`
WHERE LOWER(routine_definition) LIKE '%top10_v2%'
   OR LOWER(routine_name) LIKE '%top10%'
"""

try:
    routine_results = client.query(query_routines).result()
    for row in routine_results:
        proc_info = {
            "schema": row.routine_schema,
            "name": row.routine_name,
            "type": row.routine_type,
            "created": str(row.created) if row.created else None,
            "last_altered": str(row.last_altered) if row.last_altered else None,
            "definition": row.routine_definition[:500] if row.routine_definition else None
        }
        results["stored_procedures"].append(proc_info)

        print(f"\n✅ ENCONTRADO: {row.routine_schema}.{row.routine_name}")
        print(f"   Tipo: {row.routine_type}")
        print(f"   Creado: {row.created}")
        print(f"   Modificado: {row.last_altered}")
        print(f"   Definición (primeros 200 chars):")
        print(f"   {row.routine_definition[:200] if row.routine_definition else 'N/A'}...")

except Exception as e:
    print(f"❌ Error: {e}")

# 2. Buscar en market_data también
print("\n\n2️⃣ BUSCANDO EN market_data.ROUTINES...")
print("-"*80)

query_routines_md = """
SELECT
  routine_schema,
  routine_name,
  routine_type,
  routine_definition
FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.ROUTINES`
WHERE LOWER(routine_definition) LIKE '%top10%'
   OR LOWER(routine_definition) LIKE '%signal%'
   OR LOWER(routine_name) LIKE '%top10%'
"""

try:
    routine_results_md = client.query(query_routines_md).result()
    found_md = False
    for row in routine_results_md:
        found_md = True
        print(f"\n✅ ENCONTRADO: {row.routine_schema}.{row.routine_name}")
        print(f"   Tipo: {row.routine_type}")
        print(f"   Definición (primeros 200 chars):")
        print(f"   {row.routine_definition[:200] if row.routine_definition else 'N/A'}...")

        results["routines_found"].append({
            "schema": row.routine_schema,
            "name": row.routine_name,
            "type": row.routine_type
        })

    if not found_md:
        print("   No se encontraron routines relacionadas")

except Exception as e:
    print(f"❌ Error: {e}")

# 3. Ver metadata de la tabla top10_v2
print("\n\n3️⃣ METADATA DE analytics.top10_v2...")
print("-"*80)

try:
    table = client.get_table('sunny-advantage-471523-b3.analytics.top10_v2')

    results["table_metadata"] = {
        "created": str(table.created),
        "modified": str(table.modified),
        "num_rows": table.num_rows,
        "num_bytes": table.num_bytes,
        "description": table.description if table.description else None,
        "labels": dict(table.labels) if table.labels else {}
    }

    print(f"   Creada: {table.created}")
    print(f"   Modificada: {table.modified}")
    print(f"   Filas: {table.num_rows}")
    print(f"   Descripción: {table.description if table.description else 'N/A'}")
    print(f"   Labels: {table.labels if table.labels else 'N/A'}")

except Exception as e:
    print(f"❌ Error: {e}")

# 4. Buscar vistas que dependan de top10_v2
print("\n\n4️⃣ VISTAS QUE USAN top10_v2...")
print("-"*80)

query_views = """
SELECT
  table_schema,
  table_name,
  view_definition
FROM `sunny-advantage-471523-b3.INFORMATION_SCHEMA.VIEWS`
WHERE LOWER(view_definition) LIKE '%top10_v2%'
"""

try:
    view_results = client.query(query_views).result()
    for row in view_results:
        print(f"\n✅ Vista: {row.table_schema}.{row.table_name}")
        print(f"   Usa top10_v2 en su definición")

except Exception as e:
    print(f"❌ Error: {e}")

# 5. Buscar tablas relacionadas con top10
print("\n\n5️⃣ TODAS LAS TABLAS/VISTAS CON 'top10'...")
print("-"*80)

query_all_top10 = """
SELECT
  table_schema,
  table_name,
  table_type,
  creation_time
FROM `sunny-advantage-471523-b3.INFORMATION_SCHEMA.TABLES`
WHERE LOWER(table_name) LIKE '%top10%'
ORDER BY table_schema, table_name
"""

try:
    top10_tables = client.query(query_all_top10).result()
    for row in top10_tables:
        print(f"   {row.table_schema}.{row.table_name} ({row.table_type}) - Created: {row.creation_time}")

except Exception as e:
    print(f"❌ Error: {e}")

# Guardar resultados
output_file = "/home/user/signalssheets/bigquery_etl_search_results.json"
with open(output_file, 'w') as f:
    json.dump(results, f, indent=2, default=str)

print(f"\n\n{'='*80}")
print(f"✅ Resultados guardados en: {output_file}")
print(f"{'='*80}")

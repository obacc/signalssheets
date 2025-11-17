#!/usr/bin/env python3
"""
Script para explorar la estructura de BigQuery y encontrar las tablas correctas
"""
import os
from google.cloud import bigquery

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/tmp/gcp-sa-key.json'

PROJECT_ID = "sunny-advantage-471523-b3"

print("🔍 Explorando estructura de BigQuery...")
print("="*80)

client = bigquery.Client(project=PROJECT_ID)

# 1. Listar todos los datasets
print("\n📁 DATASETS DISPONIBLES:")
print("-"*80)
datasets = list(client.list_datasets())

if datasets:
    for dataset in datasets:
        print(f"  • {dataset.dataset_id}")

        # Listar tablas en cada dataset
        dataset_ref = client.dataset(dataset.dataset_id)
        tables = list(client.list_tables(dataset_ref))

        if tables:
            for table in tables:
                table_type = "TABLE" if table.table_type == "TABLE" else "VIEW"
                print(f"    └─ {table.table_id} ({table_type})")
        else:
            print(f"    └─ (vacío)")
        print()
else:
    print("  ❌ No se encontraron datasets")

print("="*80)

# 2. Buscar tablas que contengan "price" en el nombre
print("\n🔍 BUSCANDO TABLAS CON 'PRICE' EN EL NOMBRE:")
print("-"*80)

for dataset in datasets:
    dataset_ref = client.dataset(dataset.dataset_id)
    tables = list(client.list_tables(dataset_ref))

    for table in tables:
        if 'price' in table.table_id.lower():
            full_table_id = f"{PROJECT_ID}.{dataset.dataset_id}.{table.table_id}"
            print(f"  ✅ Encontrada: {full_table_id}")

            # Obtener info de la tabla
            table_ref = dataset_ref.table(table.table_id)
            table_info = client.get_table(table_ref)

            print(f"     Tipo: {table_info.table_type}")
            print(f"     Filas: {table_info.num_rows if table_info.num_rows else 'N/A'}")
            print(f"     Tamaño: {table_info.num_bytes / (1024*1024):.2f} MB" if table_info.num_bytes else "     Tamaño: N/A")
            print()

print("="*80)

# 3. Ver detalles de analytics.v_api_free_signals
print("\n📊 DETALLES DE analytics.v_api_free_signals:")
print("-"*80)

try:
    view_ref = client.dataset('analytics').table('v_api_free_signals')
    view = client.get_table(view_ref)

    print(f"  Tipo: {view.table_type}")
    print(f"  Creada: {view.created}")
    print(f"  Modificada: {view.modified}")
    print(f"\n  Definición de la vista:")
    print(f"  {'-'*76}")
    if view.view_query:
        # Mostrar primeras 500 caracteres de la query
        query = view.view_query[:500]
        print(f"  {query}...")

    print(f"\n  Schema (primeros 10 campos):")
    print(f"  {'-'*76}")
    for i, field in enumerate(view.schema[:10]):
        print(f"    {field.name}: {field.field_type}")

except Exception as e:
    print(f"  ❌ Error: {e}")

print("\n" + "="*80)

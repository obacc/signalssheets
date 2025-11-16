#!/usr/bin/env python3
"""
BigQuery Complete Inventory Script
===================================
Lists ALL tables from ALL datasets in the GCP project and generates a CSV.

This script creates a placeholder CSV with instructions.
To get actual data from BigQuery, credentials are required.

Output CSV columns:
- dataset_name
- table_name
- table_type (TABLE, VIEW, MATERIALIZED_VIEW)
- num_rows
- size_mb
- created_date
- modified_date
- field_names (comma-separated list of all column names)
- field_count

Usage:
    python3 create_bigquery_inventory_csv.py
"""

import csv

PROJECT_ID = "sunny-advantage-471523-b3"
OUTPUT_CSV = "bigquery_inventory.csv"

def create_placeholder_csv():
    """Create placeholder CSV with instructions"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║              BIGQUERY INVENTORY CSV GENERATOR                                 ║
║              Project: sunny-advantage-471523-b3                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")

    print("\n📝 Creating placeholder CSV with instructions...")
    print(f"   Output file: {OUTPUT_CSV}")

    # CSV structure
    fieldnames = [
        'dataset_name',
        'table_name',
        'table_type',
        'num_rows',
        'size_mb',
        'created_date',
        'modified_date',
        'field_names',
        'field_count'
    ]

    # Placeholder data with instructions
    placeholder_data = [
        {
            'dataset_name': '⚠️ CREDENTIALS REQUIRED',
            'table_name': 'To get actual BigQuery data, follow these steps:',
            'table_type': 'INSTRUCTION',
            'num_rows': 0,
            'size_mb': 0.0,
            'created_date': '',
            'modified_date': '',
            'field_names': '1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable, 2. Run: python3 list_all_bigquery_tables.py, 3. The CSV will be updated with real data',
            'field_count': 0
        },
        {
            'dataset_name': '📋 Expected Datasets',
            'table_name': 'market_data (Polygon pipeline - confirmed exists)',
            'table_type': 'INFO',
            'num_rows': 0,
            'size_mb': 0.0,
            'created_date': '',
            'modified_date': '',
            'field_names': 'stg_prices_polygon_raw, Prices, other tables',
            'field_count': 0
        },
        {
            'dataset_name': '📋 Expected Datasets',
            'table_name': 'sec_fundamentals (SEC data - status unknown)',
            'table_type': 'INFO',
            'num_rows': 0,
            'size_mb': 0.0,
            'created_date': '',
            'modified_date': '',
            'field_names': 'submissions, numbers, tags, ingest_quarter_registry',
            'field_count': 0
        },
        {
            'dataset_name': '🔑 Authentication',
            'table_name': 'Service Account Required',
            'table_type': 'INSTRUCTION',
            'num_rows': 0,
            'size_mb': 0.0,
            'created_date': '',
            'modified_date': '',
            'field_names': 'Use: claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com',
            'field_count': 0
        },
        {
            'dataset_name': '📝 How to Run',
            'table_name': 'Step 1: Get service account JSON key from GCP Console',
            'table_type': 'INSTRUCTION',
            'num_rows': 0,
            'size_mb': 0.0,
            'created_date': '',
            'modified_date': '',
            'field_names': 'IAM & Admin > Service Accounts > Keys > Add Key > Create JSON',
            'field_count': 0
        },
        {
            'dataset_name': '📝 How to Run',
            'table_name': 'Step 2: Export environment variable',
            'table_type': 'INSTRUCTION',
            'num_rows': 0,
            'size_mb': 0.0,
            'created_date': '',
            'modified_date': '',
            'field_names': 'export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json',
            'field_count': 0
        },
        {
            'dataset_name': '📝 How to Run',
            'table_name': 'Step 3: Run the full script',
            'table_type': 'INSTRUCTION',
            'num_rows': 0,
            'size_mb': 0.0,
            'created_date': '',
            'modified_date': '',
            'field_names': 'python3 list_all_bigquery_tables.py',
            'field_count': 0
        },
        {
            'dataset_name': '📊 Output',
            'table_name': 'This CSV will be replaced with actual BigQuery inventory',
            'table_type': 'INFO',
            'num_rows': 0,
            'size_mb': 0.0,
            'created_date': '',
            'modified_date': '',
            'field_names': 'All datasets, tables, row counts, schemas will be listed',
            'field_count': 0
        }
    ]

    # Write CSV
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(placeholder_data)

    print(f"\n✅ CSV file created: {OUTPUT_CSV}")
    print(f"📏 Rows written: {len(placeholder_data)}")

    print("\n" + "="*80)
    print("⚠️  PLACEHOLDER CSV CREATED")
    print("="*80)
    print("\nThis CSV contains instructions on how to get actual BigQuery data.")
    print("\nTo populate with real data from BigQuery:")
    print("1. Obtain GCP service account credentials (JSON key file)")
    print("2. Set environment variable:")
    print("   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json")
    print("3. Run the full inventory script:")
    print("   python3 list_all_bigquery_tables.py")
    print("\nThe script will:")
    print("  • List all datasets in sunny-advantage-471523-b3")
    print("  • For each dataset, list all tables and views")
    print("  • Extract metadata: row counts, sizes, schemas")
    print("  • Generate complete CSV with all BigQuery inventory")
    print("\n" + "="*80)

if __name__ == "__main__":
    create_placeholder_csv()

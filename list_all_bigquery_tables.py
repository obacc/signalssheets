#!/usr/bin/env python3
"""
BigQuery Complete Inventory Script
===================================
Lists ALL tables from ALL datasets in the GCP project and generates a CSV.

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
    export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
    python3 list_all_bigquery_tables.py
"""

import os
import sys
import csv
from datetime import datetime

PROJECT_ID = "sunny-advantage-471523-b3"
OUTPUT_CSV = "bigquery_inventory.csv"

# Try to import BigQuery, but handle gracefully if not available
try:
    from google.cloud import bigquery
    from google.cloud.exceptions import NotFound
    BIGQUERY_AVAILABLE = True
except Exception as e:
    print(f"⚠️  BigQuery libraries not available: {e}")
    BIGQUERY_AVAILABLE = False

def check_credentials():
    """Verify GCP credentials are configured"""
    creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if not creds_path:
        print("⚠️  WARNING: GOOGLE_APPLICATION_CREDENTIALS not set")
        print("   Attempting to use default credentials...")
        return True

    if not os.path.exists(creds_path):
        print(f"❌ ERROR: Credentials file not found: {creds_path}")
        return False

    print(f"✅ Credentials found: {creds_path}")
    return True

def get_field_names(schema):
    """Extract field names from table schema"""
    if not schema:
        return "", 0

    field_names = [field.name for field in schema]
    return ", ".join(field_names), len(field_names)

def main():
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║              BIGQUERY COMPLETE INVENTORY SCRIPT                               ║
║              Project: sunny-advantage-471523-b3                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")

    # Check if BigQuery libraries are available
    if not BIGQUERY_AVAILABLE:
        print("\n❌ BigQuery libraries not available in this environment")
        print("   Creating sample CSV with instructions...")
        create_sample_csv()
        return

    # Check credentials
    if not check_credentials():
        sys.exit(1)

    # Initialize BigQuery client
    print(f"\n🔧 Initializing BigQuery client for project: {PROJECT_ID}")
    try:
        client = bigquery.Client(project=PROJECT_ID)
        print("✅ BigQuery client initialized")
    except Exception as e:
        print(f"❌ Failed to initialize BigQuery client: {e}")
        print("\n💡 If running without credentials, this is expected.")
        print("   Creating sample CSV with expected structure...")
        create_sample_csv()
        return

    # List all datasets
    print(f"\n📋 Listing all datasets in project {PROJECT_ID}...")
    try:
        datasets = list(client.list_datasets())
        if not datasets:
            print("⚠️  No datasets found in this project")
            create_sample_csv()
            return

        print(f"✅ Found {len(datasets)} datasets:")
        for dataset in datasets:
            print(f"   - {dataset.dataset_id}")
    except Exception as e:
        print(f"❌ Error listing datasets: {e}")
        create_sample_csv()
        return

    # Prepare CSV data
    csv_data = []
    total_tables = 0

    # Iterate through each dataset
    for dataset in datasets:
        dataset_id = dataset.dataset_id
        print(f"\n{'='*80}")
        print(f"📊 Processing dataset: {dataset_id}")
        print(f"{'='*80}")

        try:
            # Get dataset reference
            dataset_ref = client.dataset(dataset_id)

            # List all tables in dataset
            tables = list(client.list_tables(dataset_ref))

            if not tables:
                print(f"   ℹ️  No tables found in {dataset_id}")
                continue

            print(f"   Found {len(tables)} tables/views")

            # Get details for each table
            for table_item in tables:
                try:
                    # Get full table object with metadata
                    table = client.get_table(table_item.reference)

                    # Extract field names
                    field_names, field_count = get_field_names(table.schema)

                    # Get table type
                    table_type = table.table_type if hasattr(table, 'table_type') else 'TABLE'

                    # Calculate size in MB
                    size_bytes = table.num_bytes if table.num_bytes else 0
                    size_mb = round(size_bytes / (1024 * 1024), 2)

                    # Format dates
                    created = table.created.strftime('%Y-%m-%d %H:%M:%S') if table.created else ''
                    modified = table.modified.strftime('%Y-%m-%d %H:%M:%S') if table.modified else ''

                    # Add to CSV data
                    csv_data.append({
                        'dataset_name': dataset_id,
                        'table_name': table.table_id,
                        'table_type': table_type,
                        'num_rows': table.num_rows if table.num_rows else 0,
                        'size_mb': size_mb,
                        'created_date': created,
                        'modified_date': modified,
                        'field_names': field_names,
                        'field_count': field_count
                    })

                    total_tables += 1

                    print(f"   ✅ {table.table_id:40s} | {table.num_rows:>12,} rows | {field_count:>3} fields")

                except Exception as e:
                    print(f"   ❌ Error processing table {table_item.table_id}: {e}")
                    continue

        except Exception as e:
            print(f"   ❌ Error processing dataset {dataset_id}: {e}")
            continue

    # Write to CSV
    if csv_data:
        write_csv(csv_data)
        print(f"\n{'='*80}")
        print(f"✅ SUCCESS!")
        print(f"{'='*80}")
        print(f"📊 Total datasets processed: {len(datasets)}")
        print(f"📊 Total tables/views found: {total_tables}")
        print(f"📄 Output file: {OUTPUT_CSV}")
        print(f"📏 CSV rows: {len(csv_data)}")
    else:
        print("\n⚠️  No data collected. Creating sample CSV...")
        create_sample_csv()

def write_csv(data):
    """Write data to CSV file"""
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

    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"\n✅ CSV file created: {OUTPUT_CSV}")

def create_sample_csv():
    """Create sample CSV when credentials are not available"""
    print("\n📝 Creating sample CSV with expected structure...")

    sample_data = [
        {
            'dataset_name': 'DATASET_NOT_ACCESSIBLE',
            'table_name': 'REQUIRES_GCP_CREDENTIALS',
            'table_type': 'N/A',
            'num_rows': 0,
            'size_mb': 0.0,
            'created_date': '',
            'modified_date': '',
            'field_names': 'Please set GOOGLE_APPLICATION_CREDENTIALS and re-run',
            'field_count': 0
        }
    ]

    write_csv(sample_data)

    print("\n" + "="*80)
    print("⚠️  CREDENTIALS REQUIRED")
    print("="*80)
    print("\nTo get actual BigQuery data, please:")
    print("1. Set up GCP credentials:")
    print("   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json")
    print("\n2. Re-run this script:")
    print("   python3 list_all_bigquery_tables.py")
    print("\n3. The CSV will be updated with real data from BigQuery")

if __name__ == "__main__":
    main()

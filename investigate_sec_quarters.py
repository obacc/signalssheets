#!/usr/bin/env python3
"""
SEC Fundamentals Quarter Investigation Script
==============================================
Investigates the state of SEC quarterly data loading in BigQuery.

Project: sunny-advantage-471523-b3
Dataset: sec_fundamentals
Expected: 22 quarters (2020q1 - 2025q2)
Reported: Only 1 quarter loaded (2020q1)

Usage:
    export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
    python3 investigate_sec_quarters.py
"""

import os
import sys
import json
from datetime import datetime
from google.cloud import bigquery
from google.cloud.exceptions import NotFound

PROJECT_ID = "sunny-advantage-471523-b3"
DATASET_ID = "sec_fundamentals"

def check_credentials():
    """Verify GCP credentials are configured"""
    creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if not creds_path:
        print("❌ ERROR: GOOGLE_APPLICATION_CREDENTIALS not set")
        print("\nPlease set credentials:")
        print("  export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json")
        print("\nFor this project, use the claudecode service account key")
        return False

    if not os.path.exists(creds_path):
        print(f"❌ ERROR: Credentials file not found: {creds_path}")
        return False

    print(f"✅ Credentials found: {creds_path}")
    return True

def run_query(client, query, description):
    """Execute a BigQuery query and return results"""
    print(f"\n{'='*80}")
    print(f"📊 {description}")
    print(f"{'='*80}")
    print(f"\nQuery:\n{query}\n")

    try:
        query_job = client.query(query)
        results = list(query_job.result())

        if not results:
            print("⚠️  No results returned")
            return []

        # Print results as table
        if results:
            # Get column names
            schema = query_job.schema
            headers = [field.name for field in schema]

            # Print headers
            print(" | ".join(headers))
            print("-" * 80)

            # Print rows
            for row in results:
                values = [str(row[field.name]) for field in schema]
                print(" | ".join(values))

        print(f"\n✅ Returned {len(results)} rows")
        return results

    except Exception as e:
        print(f"❌ Error executing query: {e}")
        return None

def main():
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║           SEC FUNDAMENTALS QUARTER INVESTIGATION                              ║
║           Project: sunny-advantage-471523-b3                                  ║
║           Dataset: sec_fundamentals                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")

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
        sys.exit(1)

    # Check if dataset exists
    print(f"\n🔍 Checking if dataset '{DATASET_ID}' exists...")
    try:
        dataset_ref = client.dataset(DATASET_ID)
        dataset = client.get_dataset(dataset_ref)
        print(f"✅ Dataset found: {dataset.full_dataset_id}")
        print(f"   Created: {dataset.created}")
        print(f"   Location: {dataset.location}")
    except NotFound:
        print(f"❌ Dataset '{DATASET_ID}' not found!")
        print("\n⚠️  CRITICAL: The sec_fundamentals dataset doesn't exist in this project.")
        print("   This suggests the SEC data pipeline has never been set up.")
        sys.exit(1)

    # List tables in dataset
    print(f"\n📋 Listing tables in {DATASET_ID}...")
    tables = list(client.list_tables(dataset_ref))
    if tables:
        print(f"✅ Found {len(tables)} tables:")
        for table in tables:
            table_full = client.get_table(table.reference)
            print(f"   - {table.table_id} ({table_full.num_rows:,} rows)")
    else:
        print("⚠️  No tables found in dataset")
        return

    # QUERY 1: Check audit/registry table for loaded quarters
    query1 = f"""
    SELECT
      quarter,
      status,
      submissions_rows,
      numbers_rows,
      tags_rows,
      ROUND(file_size_bytes / 1024 / 1024, 1) as file_size_mb,
      processing_time_seconds,
      load_start_ts,
      load_end_ts
    FROM `{PROJECT_ID}.{DATASET_ID}.ingest_quarter_registry`
    ORDER BY quarter
    """
    results1 = run_query(client, query1, "QUERY 1: Quarters in audit/registry table")

    # QUERY 2: Count submissions by quarter
    query2 = f"""
    SELECT
      EXTRACT(YEAR FROM period) as year,
      EXTRACT(QUARTER FROM period) as quarter,
      COUNT(*) as num_submissions,
      MIN(period) as min_period,
      MAX(period) as max_period
    FROM `{PROJECT_ID}.{DATASET_ID}.submissions`
    GROUP BY year, quarter
    ORDER BY year, quarter
    """
    results2 = run_query(client, query2, "QUERY 2: Submissions count by quarter")

    # QUERY 3: Count numbers by quarter
    query3 = f"""
    SELECT
      EXTRACT(YEAR FROM ddate) as year,
      EXTRACT(QUARTER FROM ddate) as quarter,
      COUNT(*) as num_records,
      COUNT(DISTINCT adsh) as unique_adsh,
      COUNT(DISTINCT tag) as unique_tags
    FROM `{PROJECT_ID}.{DATASET_ID}.numbers`
    GROUP BY year, quarter
    ORDER BY year, quarter
    """
    results3 = run_query(client, query3, "QUERY 3: Numbers table by quarter")

    # QUERY 4: Check critical tags
    query4 = f"""
    SELECT
      tag,
      COUNT(*) as occurrences
    FROM `{PROJECT_ID}.{DATASET_ID}.numbers`
    GROUP BY tag
    ORDER BY occurrences DESC
    LIMIT 20
    """
    results4 = run_query(client, query4, "QUERY 4: Top 20 tags in numbers table")

    # QUERY 5: Temporal range
    query5 = f"""
    SELECT
      'submissions' as tabla,
      MIN(period) as fecha_min,
      MAX(period) as fecha_max,
      COUNT(*) as total_rows
    FROM `{PROJECT_ID}.{DATASET_ID}.submissions`
    UNION ALL
    SELECT
      'numbers' as tabla,
      MIN(ddate) as fecha_min,
      MAX(ddate) as fecha_max,
      COUNT(*) as total_rows
    FROM `{PROJECT_ID}.{DATASET_ID}.numbers`
    """
    results5 = run_query(client, query5, "QUERY 5: Temporal range across tables")

    # QUERY 6: Check staging tables for residual data
    staging_tables = [
        'staging_submissions_raw',
        'staging_numbers_raw',
        'staging_tags_raw'
    ]

    for staging_table in staging_tables:
        query_staging = f"""
        SELECT
          _file,
          COUNT(*) as rows,
          MAX(_load_ts) as last_load
        FROM `{PROJECT_ID}.{DATASET_ID}.{staging_table}`
        GROUP BY _file
        ORDER BY last_load DESC
        LIMIT 10
        """
        run_query(client, query_staging, f"STAGING: {staging_table}")

    # Generate summary report
    print("\n" + "="*80)
    print("📊 INVESTIGATION SUMMARY")
    print("="*80)

    # Analyze results
    if results1:
        loaded_quarters = [row['quarter'] for row in results1 if row['status'] == 'SUCCESS']
        print(f"\n✅ Loaded quarters (from registry): {len(loaded_quarters)}")
        for q in loaded_quarters:
            print(f"   - {q}")
    else:
        print("\n⚠️  No audit/registry data found")

    # Expected quarters from 2020q1 to 2025q2
    expected_quarters = []
    for year in range(2020, 2026):
        for quarter in range(1, 5):
            q_str = f"{year}q{quarter}"
            expected_quarters.append(q_str)
            if q_str == "2025q2":
                break

    print(f"\n📋 Expected quarters: {len(expected_quarters)}")
    print(f"   Range: 2020q1 to 2025q2")

    if results1:
        loaded_set = set(row['quarter'] for row in results1)
        expected_set = set(expected_quarters)
        missing_quarters = expected_set - loaded_set

        print(f"\n❌ Missing quarters: {len(missing_quarters)}")
        if missing_quarters:
            missing_sorted = sorted(list(missing_quarters))
            for q in missing_sorted[:10]:  # Show first 10
                print(f"   - {q}")
            if len(missing_quarters) > 10:
                print(f"   ... and {len(missing_quarters) - 10} more")

    print("\n" + "="*80)
    print("✅ Investigation complete!")
    print("="*80)

if __name__ == "__main__":
    main()

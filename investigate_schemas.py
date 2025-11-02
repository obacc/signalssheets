#!/usr/bin/env python3
"""
Investigate BigQuery table schemas to understand actual column names.
"""

import os
from google.cloud import bigquery
from google.oauth2 import service_account

PROJECT_ID = "sunny-advantage-471523-b3"
CREDENTIALS_PATH = "/home/user/signalssheets/bigquery-credentials.json"

def main():
    # Initialize client
    credentials = service_account.Credentials.from_service_account_file(CREDENTIALS_PATH)
    client = bigquery.Client(credentials=credentials, project=PROJECT_ID)

    # Tables to investigate
    tables_to_check = [
        ("analytics", "top10_v2"),
        ("sec_fundamentals", "ref_cik_ticker"),
        ("market_data", "Prices"),
        ("analytics", "sector_map_v6r2"),
    ]

    for dataset, table in tables_to_check:
        print(f"\n{'='*80}")
        print(f"Table: {dataset}.{table}")
        print(f"{'='*80}")

        # Get schema
        query = f"""
        SELECT column_name, data_type
        FROM `{PROJECT_ID}.{dataset}.INFORMATION_SCHEMA.COLUMNS`
        WHERE table_name = '{table}'
        ORDER BY ordinal_position
        """

        try:
            results = client.query(query).result()
            print("\nColumns:")
            for row in results:
                print(f"  - {row.column_name}: {row.data_type}")

            # Get sample data
            print(f"\nSample data (first row):")
            sample_query = f"SELECT * FROM `{PROJECT_ID}.{dataset}.{table}` LIMIT 1"
            sample_results = client.query(sample_query).result()
            for row in sample_results:
                row_dict = dict(row)
                for key, value in row_dict.items():
                    print(f"  {key}: {value}")
                break

        except Exception as e:
            print(f"  ❌ Error: {e}")

    # Check if v_market_calendar exists
    print(f"\n{'='*80}")
    print(f"Checking for v_market_calendar view")
    print(f"{'='*80}")
    try:
        query = f"""
        SELECT * FROM `{PROJECT_ID}.analytics.v_market_calendar`
        WHERE is_trading_day
        LIMIT 5
        """
        results = client.query(query).result()
        print("✅ v_market_calendar exists and has data")
        for row in results:
            print(f"  {dict(row)}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
        print("  Need to check if this view exists or use alternative")

    # Check if signals_eod exists
    print(f"\n{'='*80}")
    print(f"Checking for signals_eod table")
    print(f"{'='*80}")
    try:
        query = f"""
        SELECT column_name, data_type
        FROM `{PROJECT_ID}.market_data.INFORMATION_SCHEMA.COLUMNS`
        WHERE table_name = 'signals_eod'
        ORDER BY ordinal_position
        """
        results = client.query(query).result()
        print("✅ signals_eod columns:")
        for row in results:
            print(f"  - {row.column_name}: {row.data_type}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

if __name__ == "__main__":
    main()

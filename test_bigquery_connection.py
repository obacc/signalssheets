#!/usr/bin/env python3
"""Test BigQuery connection and list available resources."""

import os
from google.cloud import bigquery
from google.oauth2 import service_account

def test_connection():
    """Test connection to BigQuery and list available datasets."""

    # Set up credentials
    credentials_path = '/home/user/signalssheets/.config/gcp/credentials.json'

    print("=" * 60)
    print("Testing BigQuery Connection")
    print("=" * 60)

    try:
        # Create credentials from service account file
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        # Create BigQuery client
        client = bigquery.Client(
            credentials=credentials,
            project=credentials.project_id
        )

        print(f"\n✓ Successfully connected to BigQuery!")
        print(f"✓ Project ID: {client.project}")
        print(f"✓ Service Account: {credentials.service_account_email}")

        # List datasets
        print(f"\n{'='*60}")
        print("Available Datasets:")
        print("=" * 60)

        datasets = list(client.list_datasets())

        if datasets:
            for dataset in datasets:
                print(f"\n  Dataset: {dataset.dataset_id}")
                print(f"  Full ID: {dataset.full_dataset_id}")

                # List tables in this dataset
                dataset_ref = client.dataset(dataset.dataset_id)
                tables = list(client.list_tables(dataset_ref))

                if tables:
                    print(f"  Tables ({len(tables)}):")
                    for table in tables:
                        print(f"    - {table.table_id}")

                        # Get table info
                        table_ref = dataset_ref.table(table.table_id)
                        table_obj = client.get_table(table_ref)
                        print(f"      Rows: {table_obj.num_rows:,}")
                        print(f"      Columns: {len(table_obj.schema)}")
                        print(f"      Size: {table_obj.num_bytes / 1024 / 1024:.2f} MB")
                else:
                    print("  No tables found in this dataset")
        else:
            print("  No datasets found in this project")
            print("\n  Note: You may need to create datasets first.")

        print(f"\n{'='*60}")
        print("Connection Test Complete!")
        print("=" * 60)

        return True

    except Exception as e:
        print(f"\n✗ Error connecting to BigQuery: {e}")
        print(f"\n  Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    success = test_connection()
    exit(0 if success else 1)

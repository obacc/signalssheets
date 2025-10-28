#!/usr/bin/env python3
"""Check schemas of key tables to understand structure."""

from bigquery_utils import BigQueryClient

def main():
    bq = BigQueryClient()

    tables_to_check = [
        ('market_data', 'signals_eod_current_filtered'),
        ('market_data', 'market_regime_current'),
        ('analytics', 'trinity_scores_v2'),
        ('market_data', 'Prices'),
    ]

    for dataset_id, table_id in tables_to_check:
        print(f"\n{'='*80}")
        print(f"Table: {dataset_id}.{table_id}")
        print('='*80)

        try:
            info = bq.get_table_info(dataset_id, table_id)
            print(f"Rows: {info['num_rows']:,}")
            print(f"Size: {info['size_mb']:.2f} MB")
            print(f"\nColumns ({info['num_columns']}):")

            for col in info['schema']:
                print(f"  - {col['name']:<30} {col['type']}")

            # Preview data
            print(f"\nPreview (first 3 rows):")
            preview = bq.preview_table(dataset_id, table_id, limit=3)
            if preview:
                for i, row in enumerate(preview, 1):
                    print(f"\n  Row {i}:")
                    for key, value in row.items():
                        print(f"    {key}: {value}")
            else:
                print("  (No data)")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
BigQuery utility functions for Claude Code.
This module provides easy access to BigQuery for development, integration, maintenance, and auditing.
"""

import os
from typing import List, Dict, Any, Optional
from google.cloud import bigquery
from google.oauth2 import service_account
import json
from datetime import datetime

class BigQueryClient:
    """Wrapper class for BigQuery operations."""

    def __init__(self, credentials_path: str = None):
        """Initialize BigQuery client with credentials."""
        if credentials_path is None:
            credentials_path = '/home/user/signalssheets/.config/gcp/credentials.json'

        # Create credentials from service account file
        self.credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        # Create BigQuery client
        self.client = bigquery.Client(
            credentials=self.credentials,
            project=self.credentials.project_id
        )

        self.project_id = self.credentials.project_id

    def query(self, sql: str, timeout: int = 30) -> List[Dict[str, Any]]:
        """
        Execute a SQL query and return results as list of dictionaries.

        Args:
            sql: SQL query string
            timeout: Query timeout in seconds (default: 30)

        Returns:
            List of dictionaries with query results
        """
        try:
            query_job = self.client.query(sql)
            results = query_job.result(timeout=timeout)

            # Convert to list of dicts
            rows = []
            for row in results:
                rows.append(dict(row))

            return rows
        except Exception as e:
            print(f"Error executing query: {e}")
            raise

    def query_to_dataframe(self, sql: str):
        """
        Execute a SQL query and return results as pandas DataFrame.
        Requires pandas to be installed.

        Args:
            sql: SQL query string

        Returns:
            pandas DataFrame with query results
        """
        try:
            import pandas as pd
            query_job = self.client.query(sql)
            return query_job.to_dataframe()
        except ImportError:
            print("pandas is not installed. Use 'pip install pandas' to use this function.")
            raise
        except Exception as e:
            print(f"Error executing query: {e}")
            raise

    def get_table_schema(self, dataset_id: str, table_id: str) -> List[Dict[str, str]]:
        """
        Get schema for a specific table.

        Args:
            dataset_id: Dataset ID
            table_id: Table ID

        Returns:
            List of dictionaries with column information
        """
        table_ref = self.client.dataset(dataset_id).table(table_id)
        table = self.client.get_table(table_ref)

        schema = []
        for field in table.schema:
            schema.append({
                'name': field.name,
                'type': field.field_type,
                'mode': field.mode,
                'description': field.description or ''
            })

        return schema

    def get_table_info(self, dataset_id: str, table_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a table.

        Args:
            dataset_id: Dataset ID
            table_id: Table ID

        Returns:
            Dictionary with table information
        """
        table_ref = self.client.dataset(dataset_id).table(table_id)
        table = self.client.get_table(table_ref)

        return {
            'project': table.project,
            'dataset': table.dataset_id,
            'table': table.table_id,
            'num_rows': table.num_rows,
            'num_bytes': table.num_bytes,
            'size_mb': table.num_bytes / 1024 / 1024,
            'num_columns': len(table.schema),
            'created': table.created.isoformat() if table.created else None,
            'modified': table.modified.isoformat() if table.modified else None,
            'schema': [{'name': f.name, 'type': f.field_type} for f in table.schema]
        }

    def list_datasets(self) -> List[str]:
        """List all datasets in the project."""
        datasets = list(self.client.list_datasets())
        return [dataset.dataset_id for dataset in datasets]

    def list_tables(self, dataset_id: str) -> List[str]:
        """List all tables in a dataset."""
        dataset_ref = self.client.dataset(dataset_id)
        tables = list(self.client.list_tables(dataset_ref))
        return [table.table_id for table in tables]

    def preview_table(self, dataset_id: str, table_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Preview first N rows of a table.

        Args:
            dataset_id: Dataset ID
            table_id: Table ID
            limit: Number of rows to return (default: 10)

        Returns:
            List of dictionaries with row data
        """
        sql = f"""
        SELECT *
        FROM `{self.project_id}.{dataset_id}.{table_id}`
        LIMIT {limit}
        """
        return self.query(sql)

    def get_row_count(self, dataset_id: str, table_id: str) -> int:
        """Get row count for a table."""
        sql = f"""
        SELECT COUNT(*) as count
        FROM `{self.project_id}.{dataset_id}.{table_id}`
        """
        result = self.query(sql)
        return result[0]['count'] if result else 0

    def execute_dry_run(self, sql: str) -> Dict[str, Any]:
        """
        Execute a dry run of a query to estimate bytes processed.

        Args:
            sql: SQL query string

        Returns:
            Dictionary with dry run information
        """
        job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
        query_job = self.client.query(sql, job_config=job_config)

        return {
            'total_bytes_processed': query_job.total_bytes_processed,
            'total_bytes_billed': query_job.total_bytes_billed,
            'estimated_cost_usd': (query_job.total_bytes_billed / (1024**4)) * 6.25  # $6.25 per TB
        }


# Convenience functions for common queries

def get_latest_signals(client: BigQueryClient, limit: int = 100) -> List[Dict[str, Any]]:
    """Get latest trading signals."""
    sql = f"""
    SELECT *
    FROM `{client.project_id}.market_data.signals_eod_current_filtered`
    ORDER BY fecha DESC
    LIMIT {limit}
    """
    return client.query(sql)


def get_trinity_scores(client: BigQueryClient, ticker: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get Trinity scores, optionally filtered by ticker."""
    where_clause = f"WHERE ticker = '{ticker}'" if ticker else ""

    sql = f"""
    SELECT *
    FROM `{client.project_id}.analytics.trinity_scores_v2`
    {where_clause}
    ORDER BY trinity_score DESC
    """
    return client.query(sql)


def get_market_regime(client: BigQueryClient) -> Dict[str, Any]:
    """Get current market regime."""
    sql = f"""
    SELECT *
    FROM `{client.project_id}.market_data.market_regime_current`
    ORDER BY as_of_date DESC
    LIMIT 1
    """
    results = client.query(sql)
    return results[0] if results else {}


def get_top_signals(client: BigQueryClient, profile: str = "balanceado") -> List[Dict[str, Any]]:
    """
    Get top signals by investment profile.

    Args:
        profile: Investment profile ('agresivo', 'balanceado', 'conservador')
    """
    sql = f"""
    SELECT *
    FROM `{client.project_id}.market_data.top10_by_profile_daily`
    WHERE profile = '{profile}'
    ORDER BY rank
    LIMIT 10
    """
    return client.query(sql)


def search_ticker(client: BigQueryClient, ticker: str) -> List[Dict[str, Any]]:
    """Search for a ticker across signals and prices."""
    sql = f"""
    SELECT
        ticker,
        fecha,
        close,
        vol as volume,
        high,
        low
    FROM `{client.project_id}.market_data.Prices`
    WHERE ticker = '{ticker.upper()}'
    ORDER BY fecha DESC
    LIMIT 30
    """
    return client.query(sql)


# Main execution for testing
if __name__ == "__main__":
    print("Initializing BigQuery client...")
    bq = BigQueryClient()

    print(f"Connected to project: {bq.project_id}")
    print(f"\nAvailable datasets: {', '.join(bq.list_datasets())}")

    print("\n" + "="*60)
    print("Testing queries:")
    print("="*60)

    # Test 1: Get latest signals count
    print("\n1. Latest signals count:")
    signals = get_latest_signals(bq, limit=5)
    print(f"   Found {len(signals)} signals")
    if signals:
        print(f"   Sample: {signals[0].get('ticker', 'N/A')}")

    # Test 2: Market regime
    print("\n2. Current market regime:")
    regime = get_market_regime(bq)
    if regime:
        print(f"   Date: {regime.get('as_of_date', 'N/A')}")
        print(f"   Regime: {regime.get('regime', 'N/A')}")

    # Test 3: Trinity scores count
    print("\n3. Trinity scores:")
    scores = get_trinity_scores(bq)
    print(f"   Total scores: {len(scores)}")
    if scores:
        print(f"   Top ticker: {scores[0].get('ticker', 'N/A')} - Score: {scores[0].get('trinity_score', 'N/A')}")

    print("\n" + "="*60)
    print("BigQuery client ready for use!")
    print("="*60)

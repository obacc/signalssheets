"""
Polygon.io Daily Data Download Script
Downloads daily aggregate bars for all tickers and saves to GCS as Parquet

Usage:
    # Download yesterday's data (default)
    python procedimiento_carga_bucket.py

    # Download specific date
    python procedimiento_carga_bucket.py --date 2025-11-14

Environment Variables:
    POLYGON_API_KEY: Polygon.io API key
    GCS_BUCKET_NAME: Target GCS bucket (default: ss-bucket-polygon-incremental)
    GCS_PROJECT_ID: GCP project ID (default: sunny-advantage-471523-b3)
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests
import pyarrow as pa
import pyarrow.parquet as pq
from google.cloud import storage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
POLYGON_API_KEY = os.getenv('POLYGON_API_KEY')
GCS_BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'ss-bucket-polygon-incremental')
GCS_PROJECT_ID = os.getenv('GCS_PROJECT_ID', 'sunny-advantage-471523-b3')
POLYGON_API_BASE = "https://api.polygon.io"


class PolygonDownloader:
    """Downloads daily aggregate data from Polygon.io"""

    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("POLYGON_API_KEY environment variable not set")
        self.api_key = api_key
        self.session = requests.Session()
        self.session.params = {'apiKey': api_key}

    def get_grouped_daily(self, date: str) -> Dict:
        """
        Get grouped daily bars for all tickers for a specific date

        Args:
            date: Date in YYYY-MM-DD format

        Returns:
            Dict with results from Polygon API

        Reference:
            https://polygon.io/docs/stocks/get_v2_aggs_grouped_locale_us_market_stocks__date
        """
        url = f"{POLYGON_API_BASE}/v2/aggs/grouped/locale/us/market/stocks/{date}"

        logger.info(f"Fetching data from Polygon for date: {date}")

        try:
            response = self.session.get(url, params={'adjusted': 'true'}, timeout=300)
            response.raise_for_status()
            data = response.json()

            if data.get('status') != 'OK':
                logger.error(f"API returned status: {data.get('status')}")
                logger.error(f"API message: {data.get('message', 'No message')}")
                return {'status': 'ERROR', 'results': []}

            results_count = data.get('resultsCount', 0)
            logger.info(f"Successfully retrieved {results_count} ticker results")

            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            raise

    def transform_to_dataframe_schema(self, results: List[Dict], date: str) -> pa.Table:
        """
        Transform Polygon API results to Arrow Table with target schema

        Args:
            results: List of ticker result dicts from API
            date: Trading date in YYYY-MM-DD format

        Returns:
            PyArrow Table with standardized schema
        """
        # Extract data from Polygon format
        tickers = []
        dates = []
        opens = []
        highs = []
        lows = []
        closes = []
        volumes = []
        load_timestamps = []

        load_ts = datetime.utcnow()
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()

        for item in results:
            # Polygon API response structure:
            # {
            #   "T": "AAPL",      # ticker
            #   "o": 150.25,      # open
            #   "h": 152.30,      # high
            #   "l": 149.80,      # low
            #   "c": 151.50,      # close
            #   "v": 75000000,    # volume
            #   "t": 1699315200000 # timestamp (milliseconds)
            # }

            tickers.append(item.get('T'))
            dates.append(date_obj)
            opens.append(float(item.get('o', 0)))
            highs.append(float(item.get('h', 0)))
            lows.append(float(item.get('l', 0)))
            closes.append(float(item.get('c', 0)))
            volumes.append(int(item.get('v', 0)))
            load_timestamps.append(load_ts)

        # Create Arrow Table
        table = pa.table({
            'ticker': pa.array(tickers, type=pa.string()),
            'date': pa.array(dates, type=pa.date32()),
            'open': pa.array(opens, type=pa.float64()),
            'high': pa.array(highs, type=pa.float64()),
            'low': pa.array(lows, type=pa.float64()),
            'close': pa.array(closes, type=pa.float64()),
            'volume': pa.array(volumes, type=pa.int64()),
            'load_ts': pa.array(load_timestamps, type=pa.timestamp('us'))
        })

        logger.info(f"Transformed {len(tickers)} records to Arrow Table")
        logger.debug(f"Schema: {table.schema}")

        return table


class GCSUploader:
    """Uploads Parquet files to Google Cloud Storage"""

    def __init__(self, bucket_name: str, project_id: str):
        self.bucket_name = bucket_name
        self.project_id = project_id
        self.client = storage.Client(project=project_id)
        self.bucket = self.client.bucket(bucket_name)

    def upload_parquet(self, table: pa.Table, date: str) -> str:
        """
        Upload Arrow Table as Parquet file to GCS

        Args:
            table: PyArrow Table to upload
            date: Date in YYYY-MM-DD format

        Returns:
            GCS path of uploaded file
        """
        # File naming convention: polygon_YYYY-MM-DD.parquet
        blob_name = f"polygon/daily/polygon_{date}.parquet"
        blob = self.bucket.blob(blob_name)

        # Write to temporary file
        temp_file = f"/tmp/polygon_{date}.parquet"
        pq.write_table(
            table,
            temp_file,
            compression='snappy',
            use_dictionary=True,
            write_statistics=True
        )

        # Upload to GCS
        logger.info(f"Uploading to gs://{self.bucket_name}/{blob_name}")
        blob.upload_from_filename(temp_file)

        # Clean up
        os.remove(temp_file)

        gcs_path = f"gs://{self.bucket_name}/{blob_name}"
        logger.info(f"Successfully uploaded to {gcs_path}")

        return gcs_path


def process_daily(date: Optional[str] = None) -> Dict:
    """
    Main processing function: Download from Polygon and upload to GCS

    Args:
        date: Date in YYYY-MM-DD format. If None, uses yesterday (D-1)

    Returns:
        Dict with processing results
    """
    # Determine target date
    if date is None:
        target_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    else:
        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
            target_date = date
        except ValueError:
            logger.error(f"Invalid date format: {date}. Expected YYYY-MM-DD")
            return {
                'success': False,
                'error': 'Invalid date format',
                'date': date
            }

    logger.info(f"Starting processing for date: {target_date}")

    try:
        # Step 1: Download from Polygon
        downloader = PolygonDownloader(POLYGON_API_KEY)
        data = downloader.get_grouped_daily(target_date)

        if data.get('status') != 'OK':
            return {
                'success': False,
                'error': f"Polygon API error: {data.get('message', 'Unknown error')}",
                'date': target_date
            }

        results = data.get('results', [])
        if not results:
            logger.warning(f"No data returned for {target_date} (possibly weekend/holiday)")
            return {
                'success': False,
                'error': 'No data available for date (weekend/holiday?)',
                'date': target_date,
                'tickers_count': 0
            }

        # Step 2: Transform to Arrow Table
        table = downloader.transform_to_dataframe_schema(results, target_date)

        # Step 3: Upload to GCS
        uploader = GCSUploader(GCS_BUCKET_NAME, GCS_PROJECT_ID)
        gcs_path = uploader.upload_parquet(table, target_date)

        # Success
        return {
            'success': True,
            'date': target_date,
            'tickers_count': len(results),
            'gcs_path': gcs_path,
            'file_size_mb': round(len(table) * table.nbytes / 1024 / 1024, 2)
        }

    except Exception as e:
        logger.exception(f"Processing failed for {target_date}")
        return {
            'success': False,
            'error': str(e),
            'date': target_date
        }


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Download Polygon.io daily data to GCS')
    parser.add_argument('--date', type=str, help='Date in YYYY-MM-DD format (default: yesterday)')
    args = parser.parse_args()

    result = process_daily(args.date)

    print(json.dumps(result, indent=2))

    if not result.get('success'):
        sys.exit(1)


if __name__ == '__main__':
    main()

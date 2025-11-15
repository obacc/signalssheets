"""
Cloud Function to download daily Polygon.io market data and upload to GCS.

This function:
1. Reads Polygon API key from Secret Manager
2. Fetches daily aggregated bars (OHLCV) for all tickers
3. Converts to Parquet format
4. Uploads to GCS bucket
5. Logs execution metrics

Trigger: Cloud Scheduler (HTTP) or Pub/Sub
Runtime: Python 3.11
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import functions_framework
from google.cloud import secretmanager
from google.cloud import storage
import pandas as pd
import requests
from flask import Request

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
GCS_BUCKET_NAME = os.environ.get('GCS_BUCKET_NAME', 'ss-bucket-polygon-incremental')
GCS_PROJECT_ID = os.environ.get('GCS_PROJECT_ID', 'sunny-advantage-471523-b3')
GCS_PREFIX = os.environ.get('GCS_PREFIX', 'polygon/daily')
POLYGON_SECRET_NAME = os.environ.get('POLYGON_SECRET_NAME', 'polygon-api-key')
OUTPUT_FORMAT = os.environ.get('OUTPUT_FORMAT', 'parquet')

# Polygon API configuration
POLYGON_BASE_URL = "https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks"


def get_secret(project_id: str, secret_id: str, version_id: str = "latest") -> str:
    """
    Retrieve secret from Google Secret Manager.

    Args:
        project_id: GCP project ID
        secret_id: Secret identifier
        version_id: Secret version (default: latest)

    Returns:
        Secret value as string
    """
    try:
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
        response = client.access_secret_version(request={"name": name})
        secret_value = response.payload.data.decode('UTF-8')
        logger.info(f"Successfully retrieved secret: {secret_id}")
        return secret_value
    except Exception as e:
        logger.error(f"Error retrieving secret {secret_id}: {str(e)}")
        raise


def fetch_polygon_grouped_daily(api_key: str, date: str, max_retries: int = 3) -> List[Dict[str, Any]]:
    """
    Fetch grouped daily bars from Polygon.io for all tickers.

    Args:
        api_key: Polygon.io API key
        date: Date in YYYY-MM-DD format
        max_retries: Maximum number of retry attempts

    Returns:
        List of ticker data dictionaries
    """
    url = f"{POLYGON_BASE_URL}/{date}"
    params = {
        'adjusted': 'true',
        'apiKey': api_key
    }

    for attempt in range(max_retries):
        try:
            logger.info(f"Fetching Polygon data for {date} (attempt {attempt + 1}/{max_retries})")
            response = requests.get(url, params=params, timeout=60)
            response.raise_for_status()

            data = response.json()

            if data.get('status') != 'OK':
                logger.warning(f"Polygon API returned status: {data.get('status')}")
                if attempt < max_retries - 1:
                    continue
                raise ValueError(f"Polygon API error: {data.get('status')}")

            results = data.get('results', [])
            logger.info(f"Successfully fetched {len(results)} tickers for {date}")
            return results

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error on attempt {attempt + 1}: {str(e)}")
            if attempt == max_retries - 1:
                raise

        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise

    return []


def transform_to_dataframe(results: List[Dict[str, Any]], trade_date: str) -> pd.DataFrame:
    """
    Transform Polygon API results to structured DataFrame.

    Args:
        results: List of ticker data from Polygon API
        trade_date: Trading date in YYYY-MM-DD format

    Returns:
        Pandas DataFrame with standardized schema
    """
    if not results:
        logger.warning("No results to transform")
        return pd.DataFrame()

    # Extract and rename fields
    records = []
    for item in results:
        record = {
            'ticker': item.get('T'),
            'date': trade_date,
            'open': item.get('o'),
            'high': item.get('h'),
            'low': item.get('l'),
            'close': item.get('c'),
            'volume': item.get('v'),
            'vwap': item.get('vw'),
            'transactions': item.get('n'),
            'load_ts': datetime.utcnow().isoformat()
        }
        records.append(record)

    df = pd.DataFrame(records)

    # Data quality checks
    logger.info(f"DataFrame shape: {df.shape}")
    logger.info(f"Unique tickers: {df['ticker'].nunique()}")
    logger.info(f"Null counts:\n{df.isnull().sum()}")

    # Remove records with missing critical fields
    critical_fields = ['ticker', 'open', 'high', 'low', 'close']
    before_count = len(df)
    df = df.dropna(subset=critical_fields)
    after_count = len(df)

    if before_count > after_count:
        logger.warning(f"Dropped {before_count - after_count} records with missing critical fields")

    return df


def upload_to_gcs(
    df: pd.DataFrame,
    bucket_name: str,
    prefix: str,
    trade_date: str,
    output_format: str = 'parquet'
) -> str:
    """
    Upload DataFrame to Google Cloud Storage.

    Args:
        df: DataFrame to upload
        bucket_name: GCS bucket name
        prefix: GCS prefix/folder
        trade_date: Trading date for filename
        output_format: Output format (parquet or csv)

    Returns:
        GCS URI of uploaded file
    """
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)

        # Generate filename
        filename = f"polygon_{trade_date}.{output_format}"
        blob_name = f"{prefix}/{filename}"
        blob = bucket.blob(blob_name)

        # Convert DataFrame to bytes
        if output_format == 'parquet':
            import pyarrow as pa
            import pyarrow.parquet as pq

            # Create Parquet file in memory
            table = pa.Table.from_pandas(df)
            import io
            buf = io.BytesIO()
            pq.write_table(table, buf, compression='snappy')
            buf.seek(0)

            # Upload
            blob.upload_from_file(buf, content_type='application/octet-stream')

        elif output_format == 'csv':
            csv_data = df.to_csv(index=False)
            blob.upload_from_string(csv_data, content_type='text/csv')

        else:
            raise ValueError(f"Unsupported output format: {output_format}")

        gcs_uri = f"gs://{bucket_name}/{blob_name}"
        logger.info(f"Successfully uploaded {len(df)} records to {gcs_uri}")
        logger.info(f"File size: {blob.size / 1024 / 1024:.2f} MB")

        return gcs_uri

    except Exception as e:
        logger.error(f"Error uploading to GCS: {str(e)}")
        raise


def get_previous_trading_day(reference_date: Optional[str] = None) -> str:
    """
    Get the previous trading day (excluding weekends).

    Args:
        reference_date: Reference date in YYYY-MM-DD format (default: today)

    Returns:
        Previous trading day in YYYY-MM-DD format
    """
    if reference_date:
        base_date = datetime.strptime(reference_date, '%Y-%m-%d')
    else:
        base_date = datetime.now()

    # Go back one day
    prev_date = base_date - timedelta(days=1)

    # Skip weekends (Saturday=5, Sunday=6)
    while prev_date.weekday() >= 5:
        prev_date -= timedelta(days=1)

    return prev_date.strftime('%Y-%m-%d')


@functions_framework.http
def process_daily_trigger(request: Request):
    """
    Main Cloud Function entry point (HTTP trigger).

    Request body (optional JSON):
    {
        "date": "YYYY-MM-DD"  // Optional: specific date to process
    }

    Returns:
        JSON response with execution results
    """
    try:
        # Parse request
        request_json = request.get_json(silent=True)

        # Determine target date
        if request_json and 'date' in request_json:
            target_date = request_json['date']
            logger.info(f"Processing specific date from request: {target_date}")
        else:
            target_date = get_previous_trading_day()
            logger.info(f"Processing previous trading day: {target_date}")

        # Validate date format
        try:
            datetime.strptime(target_date, '%Y-%m-%d')
        except ValueError:
            return {
                'status': 'error',
                'message': f'Invalid date format: {target_date}. Use YYYY-MM-DD'
            }, 400

        # Get Polygon API key from Secret Manager
        api_key = get_secret(GCS_PROJECT_ID, POLYGON_SECRET_NAME)

        # Fetch data from Polygon
        results = fetch_polygon_grouped_daily(api_key, target_date)

        if not results:
            logger.warning(f"No data returned from Polygon for {target_date}")
            return {
                'status': 'warning',
                'message': f'No data available for {target_date}',
                'date': target_date,
                'records': 0
            }, 200

        # Transform to DataFrame
        df = transform_to_dataframe(results, target_date)

        if df.empty:
            return {
                'status': 'warning',
                'message': 'No valid records after transformation',
                'date': target_date,
                'records': 0
            }, 200

        # Upload to GCS
        gcs_uri = upload_to_gcs(df, GCS_BUCKET_NAME, GCS_PREFIX, target_date, OUTPUT_FORMAT)

        # Success response
        response = {
            'status': 'success',
            'message': f'Successfully processed {len(df)} records',
            'date': target_date,
            'records': len(df),
            'unique_tickers': df['ticker'].nunique(),
            'gcs_uri': gcs_uri,
            'timestamp': datetime.utcnow().isoformat()
        }

        logger.info(f"Execution completed successfully: {json.dumps(response)}")
        return response, 200

    except Exception as e:
        error_msg = f"Error processing daily trigger: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            'status': 'error',
            'message': error_msg,
            'timestamp': datetime.utcnow().isoformat()
        }, 500


@functions_framework.cloud_event
def process_daily_pubsub(cloud_event):
    """
    Alternative entry point for Pub/Sub trigger.

    Message data (base64 encoded JSON):
    {
        "date": "YYYY-MM-DD"  // Optional
    }
    """
    import base64

    try:
        # Decode Pub/Sub message
        pubsub_message = base64.b64decode(cloud_event.data["message"]["data"]).decode()
        message_json = json.loads(pubsub_message) if pubsub_message else {}

        logger.info(f"Received Pub/Sub message: {message_json}")

        # Create mock request for reusing HTTP handler
        class MockRequest:
            def get_json(self, silent=True):
                return message_json

        # Reuse HTTP handler logic
        response, status_code = process_daily_trigger(MockRequest())

        logger.info(f"Pub/Sub processing completed with status: {status_code}")

    except Exception as e:
        logger.error(f"Error processing Pub/Sub trigger: {str(e)}", exc_info=True)
        raise

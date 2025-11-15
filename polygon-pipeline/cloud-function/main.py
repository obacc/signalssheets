"""
Cloud Function Entry Point for Polygon Daily Loader

This function is triggered by Cloud Scheduler and downloads daily market data
from Polygon.io API, saving it to Google Cloud Storage as Parquet files.

Deployment:
    gcloud functions deploy polygon-daily-loader \
        --gen2 \
        --runtime=python311 \
        --region=us-central1 \
        --source=. \
        --entry-point=polygon_daily_loader \
        --trigger-http \
        --timeout=540s \
        --memory=512MB \
        --set-env-vars="GCS_BUCKET_NAME=ss-bucket-polygon-incremental,GCS_PROJECT_ID=sunny-advantage-471523-b3"

Environment Variables:
    GCS_BUCKET_NAME: Target GCS bucket
    GCS_PROJECT_ID: GCP project ID
    GCP_PROJECT: Alternative project ID variable

Secrets (from Secret Manager):
    polygon-api-key: Polygon.io API key
"""

import os
import json
import logging
from datetime import datetime, timedelta
from google.cloud import secretmanager
import functions_framework
from flask import Request

# Import core processing logic
from procedimiento_carga_bucket import process_daily

# Configure logging for Cloud Functions
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_polygon_api_key() -> str:
    """
    Retrieve Polygon API key from Secret Manager

    Returns:
        API key string

    Raises:
        RuntimeError: If secret cannot be accessed
    """
    project_id = os.getenv('GCP_PROJECT') or os.getenv('GCS_PROJECT_ID', 'sunny-advantage-471523-b3')
    secret_name = f"projects/{project_id}/secrets/polygon-api-key/versions/latest"

    try:
        client = secretmanager.SecretManagerServiceClient()
        response = client.access_secret_version(request={"name": secret_name})
        api_key = response.payload.data.decode('UTF-8')
        logger.info("Successfully retrieved API key from Secret Manager")
        return api_key

    except Exception as e:
        logger.error(f"Failed to retrieve secret: {e}")

        # Fallback to environment variable (for local dev/testing only)
        env_key = os.getenv('POLYGON_API_KEY')
        if env_key:
            logger.warning("Using POLYGON_API_KEY from environment variable (not recommended for production)")
            return env_key

        raise RuntimeError(f"Cannot access Polygon API key: {e}")


@functions_framework.http
def polygon_daily_loader(request: Request):
    """
    HTTP Cloud Function entry point

    Accepts:
        GET: Process yesterday's data (D-1)
        POST: Process specific date from JSON body

    Request Body (POST):
        {
          "date": "YYYY-MM-DD"  # Optional, defaults to yesterday
        }

    Response:
        {
          "success": true/false,
          "date": "YYYY-MM-DD",
          "tickers_count": 11234,
          "gcs_path": "gs://bucket/path/to/file.parquet",
          "error": "error message if failed"
        }

    Status Codes:
        200: Success
        400: Invalid request (bad date format)
        500: Processing error
    """
    # Set API key from Secret Manager
    try:
        os.environ['POLYGON_API_KEY'] = get_polygon_api_key()
    except RuntimeError as e:
        error_msg = str(e)
        logger.error(f"Secret Manager error: {error_msg}")
        return (
            {
                "success": False,
                "error": f"Configuration error: {error_msg}",
                "timestamp": datetime.utcnow().isoformat()
            },
            500
        )

    # Determine target date
    target_date = None

    if request.method == 'POST':
        try:
            request_json = request.get_json(silent=True)
            if request_json and 'date' in request_json:
                target_date = request_json['date']
                logger.info(f"Processing date from request body: {target_date}")
        except Exception as e:
            logger.error(f"Error parsing request body: {e}")
            return (
                {
                    "success": False,
                    "error": "Invalid JSON in request body",
                    "timestamp": datetime.utcnow().isoformat()
                },
                400
            )
    else:
        # GET request - use yesterday
        target_date = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')
        logger.info(f"GET request - processing yesterday: {target_date}")

    # Validate date format if provided
    if target_date:
        try:
            datetime.strptime(target_date, '%Y-%m-%d')
        except ValueError:
            logger.error(f"Invalid date format: {target_date}")
            return (
                {
                    "success": False,
                    "error": f"Invalid date format: {target_date}. Expected YYYY-MM-DD",
                    "timestamp": datetime.utcnow().isoformat()
                },
                400
            )

    # Execute processing
    try:
        logger.info(f"Starting Polygon data download for {target_date or 'yesterday'}")

        result = process_daily(target_date)

        # Add timestamp to result
        result['timestamp'] = datetime.utcnow().isoformat()

        # Structured logging for Cloud Logging
        log_entry = {
            "severity": "INFO" if result.get('success') else "ERROR",
            "message": "POLYGON_DAILY_LOAD",
            "date": result.get('date'),
            "tickers_count": result.get('tickers_count', 0),
            "gcs_path": result.get('gcs_path'),
            "status": "SUCCESS" if result.get('success') else "FAILED",
            "error": result.get('error')
        }
        print(json.dumps(log_entry))

        # Return response
        if result.get('success'):
            return (result, 200)
        else:
            # Differentiate between no data (weekend) vs actual errors
            error_msg = result.get('error', 'Unknown error')
            if 'No data available' in error_msg or 'weekend' in error_msg.lower():
                # Weekend/holiday - not an error
                return (result, 200)
            else:
                # Actual error
                return (result, 500)

    except Exception as e:
        error_msg = str(e)
        logger.exception(f"Unhandled exception in polygon_daily_loader")

        error_response = {
            "success": False,
            "date": target_date,
            "error": error_msg,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Log structured error
        print(json.dumps({
            "severity": "ERROR",
            "message": "POLYGON_DAILY_LOAD_EXCEPTION",
            "error": error_msg,
            "date": target_date
        }))

        return (error_response, 500)

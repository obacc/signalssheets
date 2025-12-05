# Market Regime System - Deployment Guide

## Overview
This system calculates and stores daily market regime based on S&P 500 YTD performance using Yahoo Finance data.

## Files Structure
```
market_regime/
├── update_market_regime.py      # Standalone script (local execution)
├── market_regime_daily_DDL.sql  # BigQuery table DDL
├── DEPLOYMENT.md                # This file
└── market_regime_*.csv/.txt     # Validation exports

cloud_functions/market_regime/
├── main.py                      # Cloud Function entry point
└── requirements.txt             # Python dependencies
```

## BigQuery Table
```
Project: sunny-advantage-471523-b3
Dataset: IS_Fundamentales
Table: market_regime_daily
```

## Regime Classification Rules
| S&P 500 YTD Change | Regime Type |
|-------------------|-------------|
| >= +20% | BULL |
| >= +10% to < +20% | NEUTRAL |
| >= -10% to < +10% | NEUTRAL |
| >= -20% to < -10% | CORRECTION |
| < -20% | BEAR |

---

## Deployment Steps

### Step 1: Deploy Cloud Function

```bash
cd cloud_functions/market_regime

gcloud functions deploy market-regime-update \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=market_regime_update \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=120s \
  --set-env-vars=PROJECT_ID=sunny-advantage-471523-b3 \
  --service-account=claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com
```

Wait 2-3 minutes for deployment to complete.

### Step 2: Get Function URL

```bash
FUNCTION_URL=$(gcloud functions describe market-regime-update \
  --gen2 \
  --region=us-central1 \
  --format='value(serviceConfig.uri)')

echo "Function URL: $FUNCTION_URL"
```

### Step 3: Test Function

```bash
curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{
  "status": "success",
  "message": "Market regime updated successfully",
  "data": {
    "regime_date": "2025-12-05",
    "regime_type": "NEUTRAL",
    "sp500_close": 6090.27,
    "sp500_ytd_change_pct": 3.55,
    "vix_close": 13.5,
    "data_source": "Yahoo Finance"
  }
}
```

### Step 4: Validate BigQuery Data

```sql
SELECT
  regime_date,
  regime_type,
  ROUND(sp500_close, 2) as sp500_close,
  ROUND(sp500_ytd_start, 2) as sp500_ytd_start,
  ROUND(sp500_ytd_change_pct, 2) as ytd_change_pct,
  ROUND(vix_close, 2) as vix_close,
  data_source
FROM `sunny-advantage-471523-b3.IS_Fundamentales.market_regime_daily`
ORDER BY regime_date DESC
LIMIT 5;
```

Verify:
- `data_source` = 'Yahoo Finance'
- `sp500_close` matches current S&P 500 price (±1%)
- `sp500_ytd_change_pct` is realistic for 2025

### Step 5: Create Cloud Scheduler (Daily Automation)

```bash
gcloud scheduler jobs create http market-regime-daily-update \
  --location=us-central1 \
  --schedule="0 6 * * *" \
  --time-zone="America/New_York" \
  --uri="$FUNCTION_URL" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{}' \
  --description="Daily market regime update at 6am EST"
```

### Step 6: Verify Scheduler

```bash
gcloud scheduler jobs describe market-regime-daily-update --location=us-central1
```

---

## Monitoring

### View Logs
```bash
gcloud functions logs read market-regime-update \
  --region=us-central1 \
  --limit=50
```

### Manual Trigger (Testing)
```bash
gcloud scheduler jobs run market-regime-daily-update --location=us-central1
```

---

## Local Testing

For local development/testing:

```bash
cd market_regime
pip install yfinance google-cloud-bigquery

# Set credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Run
python update_market_regime.py
```

---

## Troubleshooting

### yfinance Import Error
If yfinance fails to import, check:
1. requirements.txt includes `yfinance==0.2.33`
2. Cloud Function has enough memory (512MB minimum)

### BigQuery Permission Error
Ensure service account has:
- `roles/bigquery.dataEditor` on dataset
- `roles/bigquery.jobUser` on project

### Yahoo Finance Data Error
Yahoo Finance may be temporarily unavailable. The function will return an error (not fallback data) and should be retried later.

---

## Important Notes

1. **No Fallback Data**: This system does NOT use estimated/hardcoded values. If Yahoo Finance is unavailable, the function fails explicitly.

2. **Idempotent**: The MERGE query ensures running multiple times per day updates (not duplicates) the record.

3. **Data Source Verification**: Always verify `data_source = 'Yahoo Finance'` in BigQuery. Any other value indicates a problem.

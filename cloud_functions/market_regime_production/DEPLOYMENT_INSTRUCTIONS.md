# Market Regime Cloud Function - Deployment Instructions

## Overview
This Cloud Function calculates the daily market regime based on S&P 500 YTD performance and updates BigQuery.

**Schedule:** 2:00 AM EST daily (07:00 UTC)
**Project:** sunny-advantage-471523-b3
**Table:** IS_Fundamentales.market_regime_daily

## Regime Classification Rules

| S&P 500 YTD | Regime | Description |
|-------------|--------|-------------|
| >= +20% | BULL | Strong bull market |
| >= +10% | NEUTRAL | Moderate positive |
| >= -10% | NEUTRAL | Sideways/consolidation |
| >= -20% | CORRECTION | Market correction |
| < -20% | BEAR | Bear market |

## Deployment Steps

### Prerequisites
1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project sunny-advantage-471523-b3`

### Step 1: Deploy Cloud Function
```bash
cd cloud_functions/market_regime_production
chmod +x deploy_market_regime.sh
./deploy_market_regime.sh
```

### Step 2: Test the Function
```bash
curl -X POST https://us-central1-sunny-advantage-471523-b3.cloudfunctions.net/market-regime-update
```

Expected response:
```json
{
  "status": "success",
  "message": "Market regime updated successfully",
  "data": {
    "regime_date": "2025-12-05",
    "regime_type": "BULL",
    "sp500_close": 6086.47,
    "sp500_ytd_change_pct": 27.65,
    "vix_close": 13.45,
    "data_source": "Yahoo Finance"
  }
}
```

### Step 3: Verify BigQuery Update
```sql
SELECT * FROM `sunny-advantage-471523-b3.IS_Fundamentales.market_regime_daily`
ORDER BY regime_date DESC LIMIT 5;
```

### Step 4: Create Scheduler (Automation)
```bash
chmod +x create_scheduler.sh
./create_scheduler.sh
```

### Step 5: Test Scheduler
```bash
gcloud scheduler jobs run market-regime-daily \
    --project=sunny-advantage-471523-b3 \
    --location=us-central1
```

## Files

| File | Description |
|------|-------------|
| main.py | Cloud Function entry point |
| requirements.txt | Python dependencies |
| deploy_market_regime.sh | Deployment script |
| create_scheduler.sh | Scheduler creation script |

## Monitoring

### View Logs
```bash
gcloud functions logs read market-regime-update \
    --project=sunny-advantage-471523-b3 \
    --region=us-central1 \
    --limit=50
```

### Console Links
- **Cloud Functions:** https://console.cloud.google.com/functions?project=sunny-advantage-471523-b3
- **Cloud Scheduler:** https://console.cloud.google.com/cloudscheduler?project=sunny-advantage-471523-b3
- **BigQuery:** https://console.cloud.google.com/bigquery?project=sunny-advantage-471523-b3

## Integration with Trinity SP

The Trinity SP (`sp_generate_trinity_signals`) reads from `market_regime_daily` to adjust thresholds:

| Regime | Threshold Adjustment |
|--------|---------------------|
| BULL | -5 (easier to trigger BUY) |
| NEUTRAL | 0 (no adjustment) |
| CORRECTION | +5 (harder to trigger BUY) |
| BEAR | +10 (much harder to trigger BUY) |

## Troubleshooting

### Function Fails with Yahoo Finance Error
- Yahoo Finance may be temporarily unavailable
- Check logs for specific error message
- Function will retry on next scheduled run

### BigQuery Permission Error
- Ensure Cloud Function service account has BigQuery Data Editor role
- Project: sunny-advantage-471523-b3

### Scheduler Not Running
- Check scheduler state: `gcloud scheduler jobs list --project=sunny-advantage-471523-b3`
- Verify timezone is correct (America/New_York)

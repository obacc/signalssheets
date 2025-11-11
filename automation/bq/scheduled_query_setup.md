# SCHEDULED QUERY CONFIGURATION

## Overview

This Scheduled Query executes daily at **1:00 AM America/Chicago** to merge Polygon data from staging to the Prices table.

## Configuration

- **Name:** `polygon_daily_merge`
- **Schedule:** `every day 01:00` (cron: `0 1 * * *`)
- **Timezone:** `America/Chicago`
- **Query:** `CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices\`();`
- **Notification:** Email on failure
- **Service Account:** Data Transfer Service SA

## Prerequisites

1. **Stored Procedure exists:**
   ```bash
   bq show --routine sunny-advantage-471523-b3:market_data.sp_merge_polygon_prices
   ```

2. **Service Account has permissions:**
   - `roles/bigquery.dataEditor` on `market_data` dataset
   - `roles/bigquery.jobUser` on project

3. **Email notification configured** (see setup instructions below)

## Setup Method 1: Using BigQuery Console (Recommended)

1. Open BigQuery Console: https://console.cloud.google.com/bigquery
2. Navigate to **Scheduled Queries** (left sidebar)
3. Click **Create Scheduled Query**
4. Configure:
   - **Query:**
     ```sql
     CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();
     ```
   - **Schedule options:**
     - Repeats: Daily
     - Start time: 01:00
     - Timezone: America/Chicago
   - **Notification options:**
     - ☑ Email notifications
     - ☑ Send email if query fails
     - Email: your-email@example.com
   - **Destination dataset:** (leave empty, SP writes to Prices table)
   - **Advanced options:**
     - Display name: `polygon_daily_merge`
5. Click **Save**

## Setup Method 2: Using gcloud CLI

Run the provided script:

```bash
cd automation/bq
./create_scheduled_query.sh
```

See `create_scheduled_query.sh` for details.

## Setup Method 3: Using bq CLI (Manual)

```bash
# First, save the query to a file
cat > /tmp/polygon_merge.sql <<'EOF'
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();
EOF

# Create the scheduled query
bq query \
  --project_id=sunny-advantage-471523-b3 \
  --use_legacy_sql=false \
  --display_name="polygon_daily_merge" \
  --schedule="every day 01:00" \
  --location=US \
  --time_zone="America/Chicago" \
  --destination_dataset=market_data \
  --replace \
  < /tmp/polygon_merge.sql
```

**Note:** Email notifications must be configured separately via Console or API.

## Verification

1. **List scheduled queries:**
   ```bash
   bq ls --transfer_config --project_id=sunny-advantage-471523-b3
   ```

2. **Get specific config:**
   ```bash
   bq show --transfer_config projects/PROJECT_NUMBER/locations/us/transferConfigs/CONFIG_ID
   ```

3. **View recent runs:**
   ```bash
   bq ls --transfer_run --transfer_config=CONFIG_ID --max_results=10
   ```

## Monitoring

### Check if query ran today:

```bash
bq ls --transfer_run \
  --transfer_config=projects/PROJECT_NUMBER/locations/us/transferConfigs/CONFIG_ID \
  --max_results=5 \
  --format=json | jq '.[] | {runTime, state, errorStatus}'
```

### View logs:

```bash
gcloud logging read "
  resource.type=\"bigquery_dts_config\"
  AND resource.labels.config_id=\"CONFIG_ID\"
  AND timestamp >= \"$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)\"
" --project=sunny-advantage-471523-b3 --limit=50
```

## Email Notification Setup

### Option 1: Via Console
1. Go to BigQuery → Scheduled Queries
2. Click on your query
3. Click **Edit Schedule**
4. Under **Notification options**:
   - Check "Send email notifications"
   - Check "Send email if query fails"
   - Enter email address
5. Save

### Option 2: Via Cloud Monitoring (for advanced alerting)
1. Create Log-based Metric:
   ```bash
   gcloud logging metrics create polygon_scheduled_query_failures \
     --description="Count of Polygon scheduled query failures" \
     --log-filter='
       resource.type="bigquery_dts_config"
       AND jsonPayload.status="FAILED"
       AND resource.labels.config_id="YOUR_CONFIG_ID"
     '
   ```

2. Create Alert Policy in Cloud Monitoring console based on this metric

## Troubleshooting

### Query not executing

1. Check schedule is active:
   ```bash
   bq show --transfer_config CONFIG_ID
   ```

2. Check service account permissions:
   ```bash
   # Get the DTS service account
   PROJECT_NUMBER=$(gcloud projects describe sunny-advantage-471523-b3 --format="value(projectNumber)")
   SA="service-${PROJECT_NUMBER}@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com"

   # Check IAM bindings
   bq show --format=prettyjson sunny-advantage-471523-b3:market_data | \
     jq '.access[] | select(.userByEmail == "'$SA'")'
   ```

### Query failing

1. Check recent error:
   ```bash
   bq ls --transfer_run --transfer_config=CONFIG_ID --max_results=1 --format=json | \
     jq '.[0].errorStatus'
   ```

2. Test SP manually:
   ```bash
   bq query --use_legacy_sql=false \
     "CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices\`();"
   ```

### No email notifications

1. Verify notification settings in Console
2. Check spam folder
3. Ensure your email is verified in Google Cloud

## Cost Estimation

- **Scheduled Query execution:** $0 (included in BigQuery)
- **SP execution cost:** ~$0.05/day (depends on data volume)
- **Total:** ~$1.50/month

## Maintenance

- **Review logs weekly:** Check for errors or warnings
- **Monitor execution time:** Investigate if duration increases significantly
- **Update schedule if needed:** Adjust time based on GCS data arrival

## Next Steps

After setting up the Scheduled Query:

1. ✅ Verify it runs successfully tomorrow
2. ✅ Confirm email notification works (test by causing a failure)
3. ✅ Add to runbook monitoring checklist
4. ✅ Document in team wiki/confluence

---

**Created:** 2025-11-11
**Owner:** Data Engineering Team
**Contact:** your-team@example.com

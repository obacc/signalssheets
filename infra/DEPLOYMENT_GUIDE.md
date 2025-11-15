# Polygon Pipeline Deployment Guide

Step-by-step guide to deploy the complete Polygon → GCS → BigQuery automation pipeline.

## Prerequisites Checklist

- [ ] GCP Project: `sunny-advantage-471523-b3`
- [ ] gcloud CLI installed and authenticated
- [ ] BigQuery API enabled
- [ ] Cloud Functions API enabled
- [ ] Cloud Scheduler API enabled
- [ ] Secret Manager API enabled
- [ ] Polygon.io API key: `hb4SJORyGfIXhczEGpiIvq3Smt21_OgO`
- [ ] GCS bucket exists: `ss-bucket-polygon-incremental`

## Enable Required APIs

```bash
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  bigquery.googleapis.com \
  bigquerydatatransfer.googleapis.com \
  storage-api.googleapis.com \
  --project=sunny-advantage-471523-b3
```

## One-Command Deployment

```bash
cd infra/scripts
./00_deploy_all.sh
```

Wait 5-10 minutes for complete deployment.

## Step-by-Step Deployment (Alternative)

### Step 1: Secret Manager (2 minutes)

```bash
cd infra/scripts
./01_setup_secret_manager.sh
```

**Expected Output**:
```
✓ Secret created successfully
✓ API key added successfully
```

**Verify**:
```bash
gcloud secrets versions access latest --secret=polygon-api-key
# Should output: hb4SJORyGfIXhczEGpiIvq3Smt21_OgO
```

### Step 2: Cloud Function (5-7 minutes)

```bash
./02_deploy_cloud_function.sh
```

**Expected Output**:
```
✓ Service account created
✓ Permissions configured
Deploying function (may take a few minutes)...
✓ Cloud Function deployed successfully!
Function URL: https://polygon-daily-loader-XXXX.run.app
```

**Verify**:
```bash
# Test function with a recent trading day
FUNCTION_URL=$(gcloud functions describe polygon-daily-loader \
  --gen2 --region=us-central1 \
  --format='value(serviceConfig.uri)')

curl -X POST $FUNCTION_URL \
  -H 'Content-Type: application/json' \
  -d '{"date": "2024-11-14"}'
```

**Expected Response**:
```json
{
  "status": "success",
  "date": "2024-11-14",
  "records": 8543,
  "unique_tickers": 503,
  "gcs_uri": "gs://ss-bucket-polygon-incremental/polygon/daily/polygon_2024-11-14.parquet"
}
```

### Step 3: Cloud Scheduler (1 minute)

```bash
./03_setup_cloud_scheduler.sh
```

**Expected Output**:
```
✓ Function URL retrieved
✓ Job created successfully
```

**Verify**:
```bash
gcloud scheduler jobs describe polygon-daily-download \
  --location=us-central1
```

**Test Manual Run**:
```bash
gcloud scheduler jobs run polygon-daily-download \
  --location=us-central1

# Wait 30 seconds, then check logs
gcloud functions logs read polygon-daily-loader \
  --gen2 --region=us-central1 \
  --limit=20
```

### Step 4: BigQuery Tables (2 minutes)

```bash
./04_setup_bigquery_tables.sh
```

**Expected Output**:
```
✓ Dataset created/verified
✓ Staging table created/verified
✓ Control table created/verified
✓ External table created/verified
```

**Verify**:
```bash
# List tables
bq ls market_data

# Should show:
# - staging_polygon_daily_raw
# - ingest_file_registry
# - ext_polygon_daily_parquet
```

**Query External Table** (if you ran function test above):
```bash
bq query --use_legacy_sql=false "
  SELECT
    date,
    COUNT(*) as ticker_count,
    MIN(ticker) as first_ticker,
    MAX(ticker) as last_ticker
  FROM \`sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet\`
  WHERE date = '2024-11-14'
  GROUP BY date
"
```

### Step 5: Scheduled Query (2 minutes)

```bash
./05_setup_scheduled_query.sh
```

**Expected Output**:
```
✓ Scheduled query created
```

**Verify**:
```bash
bq ls --transfer_config --transfer_location=us
```

## Post-Deployment Validation

### 1. Verify Complete Pipeline (End-to-End Test)

```bash
# 1. Trigger function for yesterday
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)
FUNCTION_URL=$(gcloud functions describe polygon-daily-loader \
  --gen2 --region=us-central1 \
  --format='value(serviceConfig.uri)')

curl -X POST $FUNCTION_URL \
  -H 'Content-Type: application/json' \
  -d "{\"date\": \"$YESTERDAY\"}"

# 2. Wait 1 minute for upload to complete
sleep 60

# 3. Verify file in GCS
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/ | grep $YESTERDAY

# 4. Load into BigQuery manually (scheduled query runs at 7 PM)
cd ../bigquery/queries
bq query --use_legacy_sql=false \
  --parameter=target_date:DATE:$YESTERDAY \
  < 01_incremental_load.sql

# 5. Validate data quality
bq query --use_legacy_sql=false \
  --parameter=target_date:DATE:$YESTERDAY \
  < 02_validation_quality_check.sql
```

### 2. Check Data Quality

**Expected Validation Output**:
```
validation_status: OK: Data quality passed
total_records: 8000-9000 (typical range)
unique_tickers: 480-520 (typical range)
null_prices: 0
invalid_high_low: 0
duplicate_count: 0
```

### 3. Verify Temporal Coverage

```bash
bq query --use_legacy_sql=false < 03_temporal_coverage_check.sql
```

**Expected Output**:
```
coverage_status: OK: Complete coverage
missing_days: 0-2 (recent days may not be loaded yet)
```

## Deployment Checklist

After deployment, verify each component:

- [ ] **Secret Manager**
  - [ ] Secret `polygon-api-key` exists
  - [ ] Can access secret value
  - [ ] Service account has `secretAccessor` role

- [ ] **Cloud Function**
  - [ ] Function `polygon-daily-loader` deployed
  - [ ] HTTP trigger responds (test curl)
  - [ ] Logs show successful execution
  - [ ] File appears in GCS after run

- [ ] **Cloud Scheduler**
  - [ ] Job `polygon-daily-download` created
  - [ ] Schedule: Mon-Fri @ 6:00 PM EST
  - [ ] Manual run succeeds
  - [ ] Logs show successful trigger

- [ ] **GCS Bucket**
  - [ ] Files in `gs://ss-bucket-polygon-incremental/polygon/daily/`
  - [ ] Parquet format, Snappy compression
  - [ ] File size 30-100MB (typical)

- [ ] **BigQuery Tables**
  - [ ] `staging_polygon_daily_raw` exists
  - [ ] `ingest_file_registry` exists
  - [ ] `ext_polygon_daily_parquet` exists
  - [ ] External table can query GCS files

- [ ] **Scheduled Query**
  - [ ] Transfer config created
  - [ ] Schedule: Daily @ 7:00 PM EST
  - [ ] Manual run succeeds
  - [ ] Data appears in staging table

- [ ] **Data Quality**
  - [ ] Validation query passes
  - [ ] No duplicates
  - [ ] No null prices
  - [ ] Ticker count in expected range

## Common Deployment Issues

### Issue: API not enabled

**Error**: `API [cloudscheduler.googleapis.com] not enabled`

**Fix**:
```bash
gcloud services enable cloudscheduler.googleapis.com
```

### Issue: Insufficient permissions

**Error**: `Permission denied`

**Fix**: Ensure your account has these roles:
```bash
gcloud projects add-iam-policy-binding sunny-advantage-471523-b3 \
  --member="user:YOUR_EMAIL@domain.com" \
  --role="roles/editor"
```

### Issue: Function deployment fails

**Error**: `Build failed`

**Fix**: Check `requirements.txt` for invalid dependencies:
```bash
cd ../cloud_functions/polygon_daily_loader
cat requirements.txt
# Verify all package versions are valid
```

### Issue: Scheduled query creation fails

**Error**: `BigQuery Data Transfer API not enabled`

**Fix**:
```bash
gcloud services enable bigquerydatatransfer.googleapis.com
```

### Issue: GCS bucket not found

**Error**: `404 Bucket not found`

**Fix**: Create bucket:
```bash
gsutil mb -p sunny-advantage-471523-b3 \
  -c STANDARD \
  -l US \
  gs://ss-bucket-polygon-incremental/
```

## Rollback Procedures

### Rollback Cloud Function

```bash
# List versions
gcloud functions describe polygon-daily-loader \
  --gen2 --region=us-central1

# Rollback to previous version (not supported in Gen2)
# Instead: redeploy from previous code
```

### Rollback BigQuery Table

```bash
# Use time travel to query previous state
SELECT * FROM `market_data.staging_polygon_daily_raw`
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
WHERE date = '2024-11-14';
```

### Delete All Resources

```bash
# Stop scheduled query
bq update --transfer_config --disable <CONFIG_ID>

# Delete Cloud Scheduler job
gcloud scheduler jobs delete polygon-daily-download \
  --location=us-central1

# Delete Cloud Function
gcloud functions delete polygon-daily-loader \
  --gen2 --region=us-central1

# Delete Secret
gcloud secrets delete polygon-api-key

# Delete BigQuery tables (CAUTION: DATA LOSS)
bq rm -f -t market_data.staging_polygon_daily_raw
bq rm -f -t market_data.ingest_file_registry
bq rm -f -t market_data.ext_polygon_daily_parquet

# Delete GCS files (CAUTION: DATA LOSS)
gsutil -m rm -r gs://ss-bucket-polygon-incremental/polygon/daily/*
```

## Monitoring Setup

### Set Up Alerting

```bash
# Create alert for Cloud Function failures
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Polygon Function Failures" \
  --condition-display-name="Function error rate > 10%" \
  --condition-threshold-value=0.1 \
  --condition-threshold-duration=300s
```

### Create Dashboard

1. Go to Cloud Console → Monitoring → Dashboards
2. Create dashboard "Polygon Pipeline"
3. Add widgets:
   - Cloud Function invocations
   - Cloud Function errors
   - Cloud Scheduler job runs
   - BigQuery bytes processed
   - GCS bucket size

## Next Steps After Deployment

1. **Wait for First Scheduled Run**
   - Next trading day @ 6:00 PM EST
   - Monitor Cloud Function logs
   - Verify file appears in GCS

2. **Validate Data Quality**
   - Run validation queries daily
   - Set up alerts for anomalies

3. **Backfill Historical Data** (optional)
   - Use function to load past dates:
   ```bash
   for date in 2024-11-{01..13}; do
     curl -X POST $FUNCTION_URL \
       -H 'Content-Type: application/json' \
       -d "{\"date\": \"$date\"}"
     sleep 30  # Rate limit
   done
   ```

4. **Integrate with Downstream Systems**
   - Create views for analytics
   - Connect to BI tools
   - Set up data exports

---

**Deployment Time**: 10-15 minutes
**Difficulty**: Intermediate
**Support**: See README.md for troubleshooting

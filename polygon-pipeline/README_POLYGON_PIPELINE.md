# Polygon Daily Pipeline - Operational Guide

**Quick Reference Guide for Day-to-Day Operations**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Daily Monitoring](#daily-monitoring)
3. [Common Operations](#common-operations)
4. [Troubleshooting](#troubleshooting)
5. [Emergency Procedures](#emergency-procedures)
6. [Reference Links](#reference-links)

---

## Quick Start

### Architecture Overview

```
Polygon API → Cloud Function → GCS → BigQuery RAW → BigQuery Prices
    ↓              ↓             ↓         ↓              ↓
  18:00 EST    Downloads     Stores    19:00 EST    Final Table
```

### Key Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| **Cloud Function** | `polygon-daily-loader` (us-central1) | Downloads daily data |
| **Scheduler Job** | `polygon-daily-download` | Triggers function Mon-Fri 6PM EST |
| **GCS Bucket** | `gs://ss-bucket-polygon-incremental/polygon/daily/` | Stores Parquet files |
| **Staging Table** | `market_data.stg_prices_polygon_raw` | Temporary storage (30 days) |
| **Final Table** | `market_data.Prices` | Consolidated data |
| **Control Table** | `market_data.ingest_file_registry` | Load tracking |

---

## Daily Monitoring

### 5-Minute Health Check

Run these commands each morning to verify yesterday's data:

```bash
# Set variables
PROJECT_ID="sunny-advantage-471523-b3"
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)

# 1. Check latest GCS file
gsutil ls -lh gs://ss-bucket-polygon-incremental/polygon/daily/ | tail -3

# 2. Check staging table
bq query --project_id=$PROJECT_ID --use_legacy_sql=false "
SELECT MAX(trading_day) as last_date,
       COUNT(*) as total_records,
       COUNT(DISTINCT ticker) as unique_tickers
FROM \`sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw\`
WHERE trading_day >= '$YESTERDAY'
"

# 3. Check Prices table
bq query --project_id=$PROJECT_ID --use_legacy_sql=false "
SELECT MAX(trading_day) as last_date,
       COUNT(*) as total_records,
       COUNT(DISTINCT ticker) as unique_tickers
FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE source = 'polygon'
  AND trading_day >= '$YESTERDAY'
"

# 4. Check for missing days (last 7 days)
bq query --project_id=$PROJECT_ID --use_legacy_sql=false "
SELECT * FROM \`sunny-advantage-471523-b3.market_data.v_missing_days_polygon\`
WHERE days_ago <= 7
ORDER BY missing_date DESC
"
```

### Expected Results

✅ **Good Health**:
- GCS: File exists for yesterday (10-15 MB)
- Staging: ~11,000 records for yesterday
- Prices: Same count as staging
- Missing Days: 0 or 1 (today)

⚠️ **Needs Attention**:
- Staging count < 10,000
- Staging ≠ Prices count
- Missing days > 1

---

## Common Operations

### Manual Trigger for Specific Date

```bash
# Trigger Cloud Function for specific date
gcloud functions call polygon-daily-loader \
  --region=us-central1 \
  --project=sunny-advantage-471523-b3 \
  --gen2 \
  --data='{"date":"2025-11-14"}'

# Check logs
gcloud functions logs read polygon-daily-loader \
  --region=us-central1 \
  --limit=20
```

### Re-process Existing Data

```bash
# Re-run load and merge for specific date
DATE="2025-11-14"

# Step 1: Load to staging (idempotent)
bq query --use_legacy_sql=false "
CALL \`sunny-advantage-471523-b3.market_data.sp_load_polygon_raw\`(DATE('$DATE'));
"

# Step 2: Merge to Prices (idempotent)
bq query --use_legacy_sql=false "
CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices\`(DATE('$DATE'));
"
```

### Backfill Multiple Dates

```bash
cd polygon-pipeline/deployment-scripts

# Backfill date range (skips weekends)
./backfill_dates.sh 2025-11-01 2025-11-15
```

### View Recent Loads

```bash
bq query --use_legacy_sql=false "
SELECT
  trade_date,
  status,
  records_count,
  FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', process_ts) as processed_at
FROM \`sunny-advantage-471523-b3.market_data.ingest_file_registry\`
WHERE source = 'polygon'
ORDER BY trade_date DESC
LIMIT 10
"
```

### Check Data Quality

```bash
# Run validation queries
bq query --use_legacy_sql=false < polygon-pipeline/bigquery-sql/validation_queries.sql
```

---

## Troubleshooting

### Problem 1: No File in GCS

**Symptoms**: Cloud Function ran but no Parquet file created

**Diagnosis**:
```bash
# Check function logs
gcloud functions logs read polygon-daily-loader \
  --region=us-central1 \
  --limit=50 \
  --format="table(time, message)"

# Check scheduler executions
gcloud scheduler jobs describe polygon-daily-download \
  --location=us-central1
```

**Common Causes**:
- API key expired/invalid
- Polygon API rate limit exceeded
- Weekend/holiday (no market data)
- Network timeout

**Solution**:
```bash
# Re-trigger manually
gcloud functions call polygon-daily-loader \
  --region=us-central1 \
  --data='{"date":"2025-11-14"}'
```

---

### Problem 2: File in GCS but Not in Staging

**Symptoms**: Parquet exists but staging table empty

**Diagnosis**:
```bash
# Check if external table can read file
bq query --use_legacy_sql=false "
SELECT date, COUNT(*) as records
FROM \`sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet\`
WHERE date = '2025-11-14'
GROUP BY date
"

# Check BigQuery job history
bq ls --jobs --max_results=20
```

**Solution**:
```bash
# Re-run load procedure
bq query --use_legacy_sql=false "
CALL \`sunny-advantage-471523-b3.market_data.sp_load_polygon_raw\`(DATE('2025-11-14'));
"
```

---

### Problem 3: Data in Staging but Not in Prices

**Symptoms**: Staging has data, Prices doesn't

**Diagnosis**:
```bash
# Check for merge errors
bq query --use_legacy_sql=false "
SELECT
  creation_time,
  job_id,
  error_result.reason as error_reason,
  error_result.message as error_message
FROM \`sunny-advantage-471523-b3.region-us.INFORMATION_SCHEMA.JOBS_BY_PROJECT\`
WHERE query LIKE '%sp_merge_polygon_to_prices%'
  AND creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
ORDER BY creation_time DESC
LIMIT 5
"
```

**Solution**:
```bash
# Re-run merge
bq query --use_legacy_sql=false "
CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices\`(DATE('2025-11-14'));
"
```

---

### Problem 4: Duplicate Records

**Symptoms**: Same ticker+date appears multiple times

**Diagnosis**:
```bash
# Check for duplicates
bq query --use_legacy_sql=false "
SELECT ticker, trading_day, COUNT(*) as count
FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE source = 'polygon'
  AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY ticker, trading_day
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 10
"
```

**Solution**:
```sql
-- Create deduplicated temp table
CREATE OR REPLACE TABLE `sunny-advantage-471523-b3.market_data.Prices_temp` AS
SELECT * EXCEPT(row_num)
FROM (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY ticker, trading_day, source
      ORDER BY last_updated DESC
    ) as row_num
  FROM `sunny-advantage-471523-b3.market_data.Prices`
  WHERE source = 'polygon'
)
WHERE row_num = 1;

-- Backup original
CREATE TABLE `sunny-advantage-471523-b3.market_data.Prices_backup_YYYYMMDD` AS
SELECT * FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE source = 'polygon';

-- Delete duplicates
DELETE FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE source = 'polygon';

-- Restore from deduplicated
INSERT INTO `sunny-advantage-471523-b3.market_data.Prices`
SELECT * FROM `sunny-advantage-471523-b3.market_data.Prices_temp`;

-- Clean up
DROP TABLE `sunny-advantage-471523-b3.market_data.Prices_temp`;
```

---

### Problem 5: Low Ticker Count

**Symptoms**: Only 5,000 tickers instead of 11,000

**Possible Causes**:
- Polygon API partial response
- Network interruption during download
- API rate limiting

**Solution**:
```bash
# Delete partial data
bq query --use_legacy_sql=false "
DELETE FROM \`sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw\`
WHERE trading_day = '2025-11-14' AND source = 'polygon';

DELETE FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE trading_day = '2025-11-14' AND source = 'polygon';
"

# Re-download from scratch
gcloud functions call polygon-daily-loader \
  --region=us-central1 \
  --data='{"date":"2025-11-14"}'

# Wait and re-process
sleep 30

bq query --use_legacy_sql=false "
CALL \`sunny-advantage-471523-b3.market_data.sp_load_polygon_raw\`(DATE('2025-11-14'));
CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices\`(DATE('2025-11-14'));
"
```

---

## Emergency Procedures

### Pause Automation

```bash
# Pause Cloud Scheduler (stops automatic downloads)
gcloud scheduler jobs pause polygon-daily-download \
  --location=us-central1 \
  --project=sunny-advantage-471523-b3

# Verify
gcloud scheduler jobs describe polygon-daily-download \
  --location=us-central1 \
  | grep state
# Should show: state: PAUSED
```

### Resume Automation

```bash
# Resume Cloud Scheduler
gcloud scheduler jobs resume polygon-daily-download \
  --location=us-central1 \
  --project=sunny-advantage-471523-b3

# Verify
gcloud scheduler jobs describe polygon-daily-download \
  --location=us-central1 \
  | grep state
# Should show: state: ENABLED
```

### Disaster Recovery

If Prices table is corrupted and staging is expired:

```bash
# Option 1: Restore from Prices table snapshot (if available)
bq cp sunny-advantage-471523-b3:market_data.Prices@SNAPSHOT_TIMESTAMP \
      sunny-advantage-471523-b3:market_data.Prices

# Option 2: Re-download from Polygon (limited by API rate limits)
# Use backfill script for date range
cd polygon-pipeline/deployment-scripts
./backfill_dates.sh START_DATE END_DATE
```

---

## Reference Links

### GCP Console

- [Cloud Functions](https://console.cloud.google.com/functions/list?project=sunny-advantage-471523-b3)
- [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler?project=sunny-advantage-471523-b3)
- [BigQuery Datasets](https://console.cloud.google.com/bigquery?project=sunny-advantage-471523-b3&page=dataset)
- [GCS Buckets](https://console.cloud.google.com/storage/browser?project=sunny-advantage-471523-b3)
- [Logs Explorer](https://console.cloud.google.com/logs?project=sunny-advantage-471523-b3)

### Documentation

- [Main Documentation](docs/DOCUMENTO_COMPLETO_AUTOMATIZACION_RAW_PRICES.md)
- [BigQuery SQL Scripts](bigquery-sql/)
- [Deployment Scripts](deployment-scripts/)

### Command Aliases

Add these to your `~/.bashrc` for quick access:

```bash
# Polygon Pipeline Aliases
alias polygon-logs='gcloud functions logs read polygon-daily-loader --region=us-central1 --limit=20'
alias polygon-test='gcloud functions call polygon-daily-loader --region=us-central1'
alias polygon-scheduler='gcloud scheduler jobs describe polygon-daily-download --location=us-central1'
alias polygon-missing='bq query --use_legacy_sql=false "SELECT * FROM \`sunny-advantage-471523-b3.market_data.v_missing_days_polygon\` WHERE days_ago <= 7"'
```

---

## Support

For issues or questions:

1. Check this guide first
2. Review [main documentation](docs/DOCUMENTO_COMPLETO_AUTOMATIZACION_RAW_PRICES.md)
3. Check GCP logs for errors
4. Run validation queries to diagnose

---

**Last Updated**: 2025-11-15
**Version**: 1.0

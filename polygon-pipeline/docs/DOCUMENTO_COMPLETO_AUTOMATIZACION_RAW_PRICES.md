# Polygon Pipeline - Complete Automation Documentation

**Project:** sunny-advantage-471523-b3
**Dataset:** market_data
**Author:** Claude Code
**Date:** 2025-11-15
**Version:** 1.0

---

## EXECUTIVE SUMMARY

This document describes the complete end-to-end automation for the Polygon.io data pipeline, from API ingestion to final consolidated Prices table in BigQuery.

### Pipeline Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Polygon.io API                                               │
│  (Market data source)                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Cloud Function: polygon-daily-loader                        │
│  Trigger: Cloud Scheduler (daily 18:00 EST)                  │
│  Action: Download D-1 data from Polygon API                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Google Cloud Storage (GCS)                                   │
│  Bucket: ss-bucket-polygon-incremental                       │
│  Path: polygon/daily/polygon_YYYY-MM-DD.parquet              │
│  Format: Parquet (compressed)                                │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  BigQuery External Table: ext_polygon_daily_parquet          │
│  Purpose: Direct access to Parquet files                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Stored Procedure: sp_load_polygon_raw()                     │
│  Trigger: Scheduled Query (daily 19:00 EST)                  │
│  Action: Load from external table to staging                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  BigQuery Staging: stg_prices_polygon_raw                    │
│  Type: Native table (partitioned by trading_day)             │
│  Retention: 30 days                                          │
│  Clustering: ticker                                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Stored Procedure: sp_merge_polygon_to_prices()              │
│  Trigger: Same Scheduled Query (after load)                  │
│  Action: MERGE staging into Prices (idempotent)              │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  BigQuery Final: Prices                                      │
│  Type: Consolidated multi-source table                       │
│  Partitioning: trading_day                                   │
│  Clustering: ticker, source                                  │
│  Retention: Unlimited (historical data)                      │
└──────────────────────────────────────────────────────────────┘
```

---

## CURRENT STATE (AS-IS)

### Existing Resources

Based on the audit performed (see `auditoria/AUDITORIA_POLYGON.md`), the following resources exist:

| Resource | Type | Status | Notes |
|----------|------|--------|-------|
| `market_data.Prices` | Table | ✅ Exists | Multi-source consolidated table |
| `market_data.stg_prices_polygon_raw` | Table | ⚠️ May exist | Needs validation |
| `market_data.sp_merge_polygon_prices` | Procedure | ⚠️ May exist | Needs idempotency check |
| GCS Bucket | Storage | ✅ Exists | `ss-bucket-polygon-incremental` |
| Cloud Function | Compute | ❌ Missing | Needs creation |
| Cloud Scheduler | Orchestration | ❌ Missing | Needs creation |
| Scheduled Query | Orchestration | ❌ Missing | Needs creation |

### Known Issues

1. **Manual Process**: Data loading is currently manual
2. **No Automation**: No scheduled jobs configured
3. **Potential Gaps**: Missing dates in staging vs GCS
4. **Idempotency Unknown**: Merge procedure may not be idempotent
5. **No Monitoring**: No alerts or dashboards

---

## TARGET STATE (TO-BE)

### Design Principles

1. **Idempotency**: All operations can be re-run safely
2. **Observability**: Full logging and monitoring at each stage
3. **Fault Tolerance**: Automatic retries and error handling
4. **Cost Optimization**: Partitioning, clustering, and retention policies
5. **Security**: Secrets in Secret Manager, minimal IAM permissions

### Key Components

#### 1. Cloud Function: `polygon-daily-loader`

**Purpose**: Download daily market data from Polygon.io API

**Configuration**:
- Runtime: Python 3.11
- Memory: 512 MB
- Timeout: 540s (9 minutes)
- Trigger: HTTP (called by Cloud Scheduler)
- Schedule: Daily at 18:00 EST (after market close)
- Environment Variables:
  - `GCS_BUCKET_NAME=ss-bucket-polygon-incremental`
  - `GCS_PROJECT_ID=sunny-advantage-471523-b3`

**Secrets**:
- `polygon-api-key` (from Secret Manager)

**Output**:
- File: `gs://ss-bucket-polygon-incremental/polygon/daily/polygon_YYYY-MM-DD.parquet`
- Format: Parquet with Snappy compression
- Expected size: ~10-15 MB per day
- Expected records: ~11,000 tickers

#### 2. BigQuery Tables

##### A. External Table: `ext_polygon_daily_parquet`

```sql
CREATE EXTERNAL TABLE `sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet`
(
  ticker STRING,
  date DATE,
  open FLOAT64,
  high FLOAT64,
  low FLOAT64,
  close FLOAT64,
  volume INT64,
  load_ts TIMESTAMP
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://ss-bucket-polygon-incremental/polygon/daily/polygon_*.parquet'],
  max_staleness = INTERVAL 1 HOUR
);
```

**Purpose**: Provides SQL access to Parquet files without loading data

##### B. Staging Table: `stg_prices_polygon_raw`

```sql
CREATE TABLE `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
(
  ticker STRING NOT NULL,
  trading_day DATE NOT NULL,
  open FLOAT64,
  high FLOAT64,
  low FLOAT64,
  close FLOAT64,
  volume INT64,
  load_ts TIMESTAMP NOT NULL,
  source STRING NOT NULL DEFAULT 'polygon',
  file_name STRING
)
PARTITION BY trading_day
CLUSTER BY ticker
OPTIONS(
  partition_expiration_days = 30,
  require_partition_filter = TRUE,
  labels = [("source", "polygon"), ("zone", "raw")]
);
```

**Key Features**:
- Partitioned by `trading_day` for cost optimization
- Clustered by `ticker` for query performance
- 30-day retention (old partitions auto-deleted)
- Requires partition filter (prevents expensive full scans)

##### C. Control Table: `ingest_file_registry`

```sql
CREATE TABLE `sunny-advantage-471523-b3.market_data.ingest_file_registry`
(
  file_path STRING NOT NULL,
  source STRING NOT NULL,
  trade_date DATE NOT NULL,
  process_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  status STRING,
  records_count INT64,
  error_msg STRING
)
PARTITION BY trade_date
OPTIONS(
  description = 'Tracks all file ingestion operations',
  require_partition_filter = FALSE
);
```

**Purpose**: Audit trail of all file loads

##### D. Final Table: `Prices`

Assumed to already exist. Expected schema:

```sql
-- Reference only - DO NOT recreate if exists
ticker STRING NOT NULL,
trading_day DATE NOT NULL,
source STRING NOT NULL,
open FLOAT64,
high FLOAT64,
low FLOAT64,
close FLOAT64,
adj_close FLOAT64,
volume INT64,
last_updated TIMESTAMP
```

#### 3. Stored Procedures

##### A. `sp_load_polygon_raw(target_date DATE)`

**Purpose**: Load data from external table to staging

**Logic**:
1. Validate target_date exists in external table
2. Check if already loaded (idempotency)
3. Insert new records (avoiding duplicates)
4. Update `ingest_file_registry`

**Idempotency**: Uses `NOT EXISTS` to prevent duplicates

##### B. `sp_merge_polygon_to_prices(target_date DATE)`

**Purpose**: Merge staging data into final Prices table

**Logic**:
1. Deduplicate staging data (if needed)
2. MERGE into Prices (UPDATE existing, INSERT new)
3. Return statistics

**Idempotency**: Uses MERGE statement with proper ON clause

#### 4. Scheduled Query

**Name**: "Polygon Daily: RAW to Prices"

**Schedule**: Daily at 19:00 EST (1 hour after Cloud Function)

**Query**:
```sql
DECLARE target_date DATE DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY);

-- Step 1: Load to staging
CALL `sunny-advantage-471523-b3.market_data.sp_load_polygon_raw`(target_date);

-- Step 2: Merge to Prices
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices`(target_date);

-- Step 3: Validation
SELECT
  target_date as processed_date,
  (SELECT COUNT(*) FROM `sunny-advantage-471523-b3.market_data.Prices`
   WHERE trading_day = target_date AND source = 'polygon') as records_in_prices,
  CURRENT_TIMESTAMP() as completion_ts;
```

#### 5. Monitoring Views

##### `v_missing_days_polygon`

```sql
CREATE OR REPLACE VIEW `sunny-advantage-471523-b3.market_data.v_missing_days_polygon` AS
WITH date_range AS (
  SELECT date
  FROM UNNEST(GENERATE_DATE_ARRAY(
    DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY),
    CURRENT_DATE()
  )) as date
  WHERE EXTRACT(DAYOFWEEK FROM date) NOT IN (1, 7) -- Exclude weekends
),
loaded_dates AS (
  SELECT DISTINCT trading_day
  FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
  WHERE source = 'polygon'
    AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
)
SELECT
  dr.date as missing_date,
  'polygon' as source,
  CURRENT_DATE() as report_date
FROM date_range dr
LEFT JOIN loaded_dates ld ON dr.date = ld.trading_day
WHERE ld.trading_day IS NULL
ORDER BY dr.date DESC;
```

---

## DATA QUALITY STANDARDS

### Expected Metrics (Daily)

| Metric | Minimum | Maximum | Action if Failed |
|--------|---------|---------|------------------|
| Unique tickers | 11,000 | 12,000 | Alert + Investigate |
| NULL prices | 0 | 0 | Critical Error |
| Duplicate records | 0 | 0 | Clean + Re-process |
| High < Low violations | 0 | 0 | Data validation error |
| Negative prices/volume | 0 | 0 | Data validation error |

### Validation Queries

See `bigquery-sql/validation_queries.sql` for complete set of validation checks.

---

## SECURITY CONFIGURATION

### IAM Permissions

#### Cloud Function Service Account

Required roles:
- `roles/secretmanager.secretAccessor` (read Polygon API key)
- `roles/storage.objectCreator` (write to GCS bucket)

#### Data Transfer Service Account

```bash
service-{PROJECT_NUMBER}@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com
```

Required roles:
- `roles/storage.objectViewer` on `ss-bucket-polygon-incremental`
- `roles/bigquery.dataEditor` on `market_data` dataset
- `roles/bigquery.jobUser` on project

### Secret Management

```bash
# Polygon API Key stored in Secret Manager
SECRET_NAME: polygon-api-key
VALUE: hb4SJORyGfIXhczEGpiIvq3Smt21_OgO
ACCESS: Cloud Function service account only
```

**Note**: API key shown here for deployment only. In production, rotate regularly.

---

## DEPLOYMENT CHECKLIST

### Phase 0: Prerequisites

- [ ] GCP Project: `sunny-advantage-471523-b3` accessible
- [ ] Permissions: Editor or Owner role
- [ ] `gcloud` CLI installed and authenticated
- [ ] `bq` CLI installed
- [ ] Polygon API key verified and active

### Phase 1: Secret Manager

- [ ] Create secret `polygon-api-key`
- [ ] Add API key as version
- [ ] Grant Cloud Function SA access

### Phase 2: Cloud Function

- [ ] Deploy `polygon-daily-loader` function
- [ ] Test with manual invocation
- [ ] Verify Parquet created in GCS
- [ ] Check logs for errors

### Phase 3: Cloud Scheduler

- [ ] Create job `polygon-daily-download`
- [ ] Set schedule: `0 18 * * 1-5` (Mon-Fri 6PM EST)
- [ ] Test with manual run
- [ ] Verify function execution

### Phase 4: BigQuery Tables

- [ ] Create `ext_polygon_daily_parquet` external table
- [ ] Create `stg_prices_polygon_raw` table
- [ ] Create `ingest_file_registry` table
- [ ] Validate `Prices` table schema

### Phase 5: Stored Procedures

- [ ] Deploy `sp_load_polygon_raw`
- [ ] Deploy `sp_merge_polygon_to_prices`
- [ ] Test with sample date
- [ ] Verify idempotency (run twice)

### Phase 6: Scheduled Query

- [ ] Create scheduled query
- [ ] Set schedule: `0 19 * * *` (daily 7PM EST)
- [ ] Configure email alerts on failure
- [ ] Test with manual run

### Phase 7: Monitoring

- [ ] Create `v_missing_days_polygon` view
- [ ] Deploy validation queries
- [ ] Set up Cloud Monitoring alerts
- [ ] Create dashboard (optional)

### Phase 8: Validation

- [ ] Run end-to-end test for specific date
- [ ] Verify data in all layers (GCS → RAW → Prices)
- [ ] Check data quality metrics
- [ ] Confirm no duplicates

---

## OPERATIONAL PROCEDURES

### Daily Monitoring (5 minutes)

```bash
# 1. Check latest file in GCS
gsutil ls -lh gs://ss-bucket-polygon-incremental/polygon/daily/ | tail -3

# 2. Check latest load in staging
bq query --use_legacy_sql=false "
SELECT MAX(trading_day) as last_date, COUNT(*) as records
FROM \`sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw\`
WHERE trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
"

# 3. Check latest in Prices
bq query --use_legacy_sql=false "
SELECT MAX(trading_day) as last_date, COUNT(*) as records
FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE source = 'polygon' AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
"

# 4. Check for missing days
bq query --use_legacy_sql=false "
SELECT * FROM \`sunny-advantage-471523-b3.market_data.v_missing_days_polygon\`
LIMIT 10
"
```

### Troubleshooting Common Issues

#### Issue 1: Cloud Function Failed

**Symptoms**: No new Parquet file in GCS

**Diagnosis**:
```bash
gcloud functions logs read polygon-daily-loader --limit=50 --region=us-central1
```

**Common Causes**:
- API key expired or invalid
- API rate limit exceeded
- Network timeout
- Insufficient permissions

**Solution**:
```bash
# Re-trigger manually
gcloud functions call polygon-daily-loader \
  --region=us-central1 \
  --data='{"date":"2025-11-14"}'
```

#### Issue 2: Data in GCS but not in Staging

**Symptoms**: Parquet exists, but staging table empty for date

**Diagnosis**:
```sql
-- Check external table can read file
SELECT COUNT(*)
FROM `sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet`
WHERE date = '2025-11-14';
```

**Solution**:
```sql
-- Re-run load procedure
CALL `sunny-advantage-471523-b3.market_data.sp_load_polygon_raw`(DATE('2025-11-14'));
```

#### Issue 3: Data in Staging but not in Prices

**Symptoms**: Staging has records, Prices doesn't

**Diagnosis**:
```sql
-- Check for errors in BigQuery jobs
SELECT creation_time, error_result
FROM `sunny-advantage-471523-b3.region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE query LIKE '%sp_merge_polygon_to_prices%'
ORDER BY creation_time DESC
LIMIT 5;
```

**Solution**:
```sql
-- Re-run merge
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices`(DATE('2025-11-14'));
```

### Backfill Procedure

When multiple days are missing:

```bash
#!/bin/bash
# backfill_polygon.sh
START_DATE="2025-11-01"
END_DATE="2025-11-15"

current_date=$START_DATE
while [[ "$current_date" < "$END_DATE" ]]; do
  echo "Processing $current_date..."

  # Step 1: Trigger Cloud Function
  gcloud functions call polygon-daily-loader \
    --region=us-central1 \
    --data="{\"date\":\"$current_date\"}"

  sleep 10

  # Step 2: Load to BigQuery
  bq query --use_legacy_sql=false \
    "CALL \`sunny-advantage-471523-b3.market_data.sp_load_polygon_raw\`(DATE('$current_date'));
     CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices\`(DATE('$current_date'));"

  current_date=$(date -I -d "$current_date + 1 day")
done
```

---

## COST ESTIMATION

### Monthly Costs (Estimated)

| Component | Cost |
|-----------|------|
| GCS Storage (900 GB) | $18 |
| BigQuery Storage | $106 |
| BigQuery Compute | $12 |
| Cloud Function (750 invocations) | $0.10 |
| Cloud Scheduler (30 jobs) | $0.30 |
| **Total** | **~$136.40/month** |

### Optimization Opportunities

1. Reduce staging retention: 30 → 7 days (-$14/month)
2. GCS lifecycle to Nearline after 30 days (-$9/month)
3. Optimize query patterns (clustering already implemented)

---

## DISASTER RECOVERY

### Backup Strategy

1. **GCS Files**: Retained for 90 days (primary backup)
2. **Staging Table**: 30-day partition retention
3. **Prices Table**: No expiration (permanent)

### Recovery Scenarios

#### Scenario 1: Accidental Deletion of Prices Data

```sql
-- Recovery from staging (if within 30 days)
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices`(DATE('2025-11-14'));
```

#### Scenario 2: Corrupted Data in Prices

```sql
-- Step 1: Identify date range affected
-- Step 2: Delete corrupted data
DELETE FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE trading_day BETWEEN '2025-11-10' AND '2025-11-14'
  AND source = 'polygon';

-- Step 3: Re-process from staging
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices`(DATE('2025-11-10'));
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices`(DATE('2025-11-11'));
-- ... repeat for each date
```

#### Scenario 3: Complete Data Loss

If staging expired and Prices corrupted:

```bash
# Re-download from Polygon API using backfill script
# Note: Subject to API rate limits and historical data availability
```

---

## CHANGE LOG

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-15 | 1.0 | Claude Code | Initial documentation |

---

## APPENDIX

### A. File Structure

```
polygon-pipeline/
├── cloud-function/
│   ├── main.py                    # Cloud Function entry point
│   ├── procedimiento_carga_bucket.py  # Core download logic
│   ├── requirements.txt           # Python dependencies
│   └── .env.example              # Environment template
├── bigquery-sql/
│   ├── 01_create_external_table.sql
│   ├── 02_create_staging_table.sql
│   ├── 03_create_control_table.sql
│   ├── 04_create_sp_load_raw.sql
│   ├── 05_create_sp_merge_prices.sql
│   ├── 06_create_missing_days_view.sql
│   └── validation_queries.sql
├── deployment-scripts/
│   ├── 01_setup_secrets.sh
│   ├── 02_deploy_cloud_function.sh
│   ├── 03_setup_scheduler.sh
│   ├── 04_deploy_bigquery.sh
│   ├── 05_test_pipeline.sh
│   └── backfill_dates.sh
└── docs/
    ├── DOCUMENTO_COMPLETO_AUTOMATIZACION_RAW_PRICES.md  # This file
    └── README_POLYGON_PIPELINE.md  # Operational guide
```

### B. Contact Information

**Project Owner**: Data Engineering Team
**GCP Project**: sunny-advantage-471523-b3
**Support**: Refer to deployment scripts and validation queries

---

**END OF DOCUMENT**

# Polygon → GCS → BigQuery Automation Pipeline

Complete end-to-end automation for downloading daily market data from Polygon.io, storing in Google Cloud Storage, and loading into BigQuery.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Components](#components)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Usage](#usage)
- [Monitoring & Validation](#monitoring--validation)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         DAILY PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Cloud Scheduler                                             │
│     ├─ Trigger: Mon-Fri @ 6:00 PM EST                          │
│     └─ Action: HTTP POST to Cloud Function                     │
│                      ↓                                          │
│  2. Cloud Function (polygon-daily-loader)                       │
│     ├─ Fetch: Polygon API (grouped daily bars)                 │
│     ├─ Transform: JSON → Parquet                               │
│     └─ Upload: GCS bucket                                      │
│                      ↓                                          │
│  3. Google Cloud Storage                                        │
│     ├─ Bucket: ss-bucket-polygon-incremental                   │
│     ├─ Path: polygon/daily/polygon_YYYY-MM-DD.parquet          │
│     └─ Format: Snappy-compressed Parquet                       │
│                      ↓                                          │
│  4. BigQuery External Table                                     │
│     ├─ Table: ext_polygon_daily_parquet                        │
│     └─ Reads: GCS files directly (zero copy)                   │
│                      ↓                                          │
│  5. BigQuery Scheduled Query                                    │
│     ├─ Trigger: Daily @ 7:00 PM EST                            │
│     ├─ Action: Load external → staging (incremental)           │
│     └─ Registry: Track processed files                         │
│                      ↓                                          │
│  6. BigQuery Staging Table                                      │
│     ├─ Table: staging_polygon_daily_raw                        │
│     ├─ Partitioned: By date                                    │
│     └─ Clustered: By ticker                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **18:00 EST**: Cloud Scheduler triggers Cloud Function
2. **18:00-18:05**: Function downloads data from Polygon API
3. **18:05**: Parquet file uploaded to GCS (`polygon_2024-11-14.parquet`)
4. **19:00 EST**: BigQuery Scheduled Query runs
5. **19:00-19:02**: Data loaded from GCS → BigQuery staging table
6. **19:02**: File registry updated, validation complete

---

## 📦 Components

### 1. Cloud Function (`polygon-daily-loader`)

**Purpose**: Download and store daily market data

**Trigger**: HTTP (called by Cloud Scheduler)

**Runtime**: Python 3.11

**Key Features**:
- Reads API key from Secret Manager (no hardcoded credentials)
- Fetches all tickers for a given date (grouped daily bars)
- Validates data quality before upload
- Structured logging to Cloud Logging
- Retry logic for API failures

**Environment Variables**:
```bash
GCS_BUCKET_NAME=ss-bucket-polygon-incremental
GCS_PROJECT_ID=sunny-advantage-471523-b3
GCS_PREFIX=polygon/daily
OUTPUT_FORMAT=parquet
POLYGON_SECRET_NAME=polygon-api-key
```

### 2. Cloud Scheduler

**Job Name**: `polygon-daily-download`

**Schedule**: `0 18 * * 1-5` (Mon-Fri @ 6:00 PM EST)

**Trigger**: OIDC-authenticated HTTP POST to Cloud Function

**Payload**: `{}` (uses default: previous trading day)

### 3. BigQuery Tables

#### Staging Table: `staging_polygon_daily_raw`

```sql
CREATE TABLE staging_polygon_daily_raw (
  ticker STRING NOT NULL,
  date DATE NOT NULL,
  open FLOAT64,
  high FLOAT64,
  low FLOAT64,
  close FLOAT64,
  volume INT64,
  vwap FLOAT64,
  transactions INT64,
  load_ts TIMESTAMP NOT NULL,
  source STRING DEFAULT 'polygon'
)
PARTITION BY date
CLUSTER BY ticker;
```

**Features**:
- Partitioned by date (cost optimization)
- Clustered by ticker (query performance)
- Requires partition filter (prevents full scans)

#### Control Table: `ingest_file_registry`

Tracks processed files to prevent duplicates:

```sql
CREATE TABLE ingest_file_registry (
  file_path STRING NOT NULL,
  source STRING NOT NULL,
  trade_date DATE NOT NULL,
  process_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  status STRING,  -- SUCCESS, FAILED, PARTIAL
  records_count INT64,
  error_msg STRING,
  PRIMARY KEY (file_path, trade_date) NOT ENFORCED
)
PARTITION BY trade_date;
```

#### External Table: `ext_polygon_daily_parquet`

Points to GCS bucket, queries data in-place:

```sql
CREATE EXTERNAL TABLE ext_polygon_daily_parquet
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://ss-bucket-polygon-incremental/polygon/daily/*.parquet']
);
```

### 4. BigQuery Scheduled Query

**Name**: `polygon_daily_load`

**Schedule**: Every day @ 19:00 EST

**Query**: Incremental load from external table → staging table

**Key Logic**:
- Checks for existing records (prevents duplicates)
- Loads only new data for target date
- Updates file registry
- Returns summary statistics

---

## ⚙️ Prerequisites

### Required Software

```bash
# Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Verify installation
gcloud --version
bq --version
```

### GCP Permissions

Your service account needs:
- `roles/secretmanager.admin` - Create/manage secrets
- `roles/cloudfunctions.developer` - Deploy functions
- `roles/cloudscheduler.admin` - Create scheduler jobs
- `roles/bigquery.admin` - Create tables and scheduled queries
- `roles/storage.admin` - Access GCS bucket
- `roles/iam.serviceAccountUser` - Create service accounts

### GCP Configuration

```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project sunny-advantage-471523-b3

# Verify
gcloud config list
```

---

## 🚀 Quick Start

### Full Deployment (One Command)

```bash
cd infra/scripts
./00_deploy_all.sh
```

This script:
1. Creates Secret Manager secret for Polygon API key
2. Deploys Cloud Function
3. Configures Cloud Scheduler
4. Creates BigQuery tables
5. Sets up Scheduled Query

**Duration**: ~5-10 minutes

---

## 📝 Detailed Setup

### Step 1: Secret Manager

```bash
cd infra/scripts
./01_setup_secret_manager.sh
```

**What it does**:
- Creates secret `polygon-api-key`
- Stores API key: `hb4SJORyGfIXhczEGpiIvq3Smt21_OgO`
- Grants access to Cloud Function service account

**Verify**:
```bash
gcloud secrets describe polygon-api-key
gcloud secrets versions access latest --secret=polygon-api-key
```

### Step 2: Deploy Cloud Function

```bash
./02_deploy_cloud_function.sh
```

**What it does**:
- Creates service account `polygon-loader@PROJECT_ID.iam.gserviceaccount.com`
- Grants necessary IAM permissions
- Deploys Gen2 Cloud Function to `us-central1`
- Sets environment variables

**Verify**:
```bash
# Get function URL
FUNCTION_URL=$(gcloud functions describe polygon-daily-loader \
  --gen2 --region=us-central1 \
  --format='value(serviceConfig.uri)')

# Test function
curl -X POST $FUNCTION_URL \
  -H 'Content-Type: application/json' \
  -d '{"date": "2024-11-14"}'
```

### Step 3: Configure Cloud Scheduler

```bash
./03_setup_cloud_scheduler.sh
```

**What it does**:
- Creates scheduler job `polygon-daily-download`
- Configures Mon-Fri @ 6:00 PM EST trigger
- Sets up OIDC authentication

**Verify**:
```bash
gcloud scheduler jobs describe polygon-daily-download \
  --location=us-central1

# Run manually
gcloud scheduler jobs run polygon-daily-download \
  --location=us-central1
```

### Step 4: Create BigQuery Tables

```bash
./04_setup_bigquery_tables.sh
```

**What it does**:
- Creates dataset `market_data` (if doesn't exist)
- Creates staging table `staging_polygon_daily_raw`
- Creates control table `ingest_file_registry`
- Creates external table `ext_polygon_daily_parquet`

**Verify**:
```bash
bq ls market_data
bq show market_data.staging_polygon_daily_raw
```

### Step 5: Setup Scheduled Query

```bash
./05_setup_scheduled_query.sh
```

**What it does**:
- Creates BigQuery Data Transfer (scheduled query)
- Runs daily @ 7:00 PM EST
- Loads data from external table to staging

**Verify**:
```bash
bq ls --transfer_config --transfer_location=us
```

---

## 💻 Usage

### Manual Execution

#### Run Cloud Function for Specific Date

```bash
FUNCTION_URL=$(gcloud functions describe polygon-daily-loader \
  --gen2 --region=us-central1 \
  --format='value(serviceConfig.uri)')

curl -X POST $FUNCTION_URL \
  -H 'Content-Type: application/json' \
  -d '{"date": "2024-11-14"}'
```

#### Run Incremental Load Manually

```bash
cd infra/bigquery/queries

bq query --use_legacy_sql=false \
  --parameter=target_date:DATE:2024-11-14 \
  < 01_incremental_load.sql
```

#### Query External Table Directly

```sql
SELECT
  date,
  COUNT(*) as ticker_count,
  SUM(volume) as total_volume
FROM `sunny-advantage-471523-b3.market_data.ext_polygon_daily_parquet`
WHERE date = '2024-11-14'
GROUP BY date;
```

#### Query Staging Table

```sql
SELECT
  ticker,
  date,
  close,
  volume
FROM `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw`
WHERE date BETWEEN '2024-11-01' AND '2024-11-15'
  AND ticker IN ('AAPL', 'MSFT', 'GOOGL')
ORDER BY date DESC, ticker;
```

---

## 📊 Monitoring & Validation

### 1. Data Quality Check

```bash
cd infra/bigquery/queries

bq query --use_legacy_sql=false \
  --parameter=target_date:DATE:2024-11-14 \
  < 02_validation_quality_check.sql
```

**Checks**:
- Total records and unique tickers
- Null prices, zero volume
- Invalid price ranges (high < low)
- VWAP validation
- Statistical outliers
- Duplicate detection

**Expected Output**:
```
validation_status: OK: Data quality passed
total_records: 8500
unique_tickers: 503
null_prices: 0
invalid_high_low: 0
```

### 2. Temporal Coverage Check

```bash
bq query --use_legacy_sql=false \
  < 03_temporal_coverage_check.sql
```

**Checks**:
- Missing trading days in last 30 days
- Coverage percentage
- Lists all gaps

**Expected Output**:
```
coverage_percentage: 100.0
coverage_status: OK: Complete coverage
missing_days: 0
```

### 3. Cloud Function Logs

```bash
# Recent logs
gcloud functions logs read polygon-daily-loader \
  --gen2 --region=us-central1 \
  --limit=50

# Follow logs (tail)
gcloud functions logs read polygon-daily-loader \
  --gen2 --region=us-central1 \
  --limit=50 \
  --filter="severity>=WARNING"
```

### 4. Cloud Scheduler Execution History

```bash
gcloud scheduler jobs describe polygon-daily-download \
  --location=us-central1 \
  --format=json | jq '.status'
```

### 5. File Registry Audit

```sql
SELECT
  trade_date,
  status,
  records_count,
  file_path,
  process_ts
FROM `sunny-advantage-471523-b3.market_data.ingest_file_registry`
WHERE trade_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
ORDER BY trade_date DESC;
```

### 6. GCS Bucket Inventory

```bash
gsutil ls -l gs://ss-bucket-polygon-incremental/polygon/daily/ \
  | grep $(date -d '7 days ago' +%Y-%m)
```

---

## 🔧 Troubleshooting

### Issue: "No data loaded for date X"

**Diagnosis**:
```bash
# 1. Check if file exists in GCS
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/ | grep 2024-11-14

# 2. Check Cloud Function logs
gcloud functions logs read polygon-daily-loader --gen2 --region=us-central1 --limit=20

# 3. Check external table can read file
bq query --use_legacy_sql=false "
  SELECT COUNT(*) FROM \`market_data.ext_polygon_daily_parquet\`
  WHERE date = '2024-11-14'
"
```

**Common Causes**:
- Weekend/holiday (no market data)
- Cloud Function failed (check logs)
- Polygon API rate limit
- Invalid API key

### Issue: "Duplicate records detected"

**Diagnosis**:
```sql
SELECT ticker, date, COUNT(*) as count
FROM `staging_polygon_daily_raw`
WHERE date = '2024-11-14'
GROUP BY ticker, date
HAVING COUNT(*) > 1;
```

**Fix**:
```sql
-- Delete duplicates, keeping latest load_ts
DELETE FROM `staging_polygon_daily_raw`
WHERE (ticker, date, load_ts) NOT IN (
  SELECT ticker, date, MAX(load_ts)
  FROM `staging_polygon_daily_raw`
  WHERE date = '2024-11-14'
  GROUP BY ticker, date
)
AND date = '2024-11-14';
```

### Issue: "Cloud Function timeout"

**Symptoms**: Function logs show timeout after 540s

**Fix**:
```bash
# Increase timeout to max (9 minutes)
gcloud functions deploy polygon-daily-loader \
  --gen2 --region=us-central1 \
  --timeout=540s \
  --update-env-vars=TIMEOUT=540
```

### Issue: "Permission denied" when accessing Secret Manager

**Diagnosis**:
```bash
# Check service account permissions
gcloud secrets get-iam-policy polygon-api-key
```

**Fix**:
```bash
gcloud secrets add-iam-policy-binding polygon-api-key \
  --member="serviceAccount:polygon-loader@sunny-advantage-471523-b3.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Issue: "Scheduled query not running"

**Diagnosis**:
```bash
# List transfer configs
bq ls --transfer_config --transfer_location=us

# Check run history
bq ls --transfer_config --transfer_location=us --max_results=10
```

**Fix**:
```bash
# Enable BigQuery Data Transfer API
gcloud services enable bigquerydatatransfer.googleapis.com

# Re-create scheduled query
cd infra/scripts
./05_setup_scheduled_query.sh
```

---

## 💰 Cost Estimation

### Monthly Costs (assuming 21 trading days/month)

| Service | Usage | Cost |
|---------|-------|------|
| **Cloud Function** | 21 invocations × 5min × 512MB | $0.05 |
| **Cloud Scheduler** | 21 invocations | $0.10 |
| **Secret Manager** | 21 secret accesses | $0.00 |
| **GCS Storage** | 21 files × 50MB = ~1GB/month | $0.02 |
| **BigQuery Storage** | ~10GB/month (compressed) | $0.20 |
| **BigQuery Queries** | Scheduled query × 21 days × 1GB scanned | $0.10 |
| **BigQuery Streaming** | N/A (using load jobs) | $0.00 |
| **Total** | | **~$0.50/month** |

**Cost Optimization Tips**:
1. Use partitioned tables (already implemented)
2. Enable partition expiration if data retention < infinite
3. Use external tables for ad-hoc queries (no storage cost)
4. Compress Parquet with Snappy (already implemented)
5. Cluster tables by frequently queried columns (already implemented)

---

## 📚 Additional Resources

### Project Structure

```
infra/
├── README.md (this file)
├── cloud_functions/
│   └── polygon_daily_loader/
│       ├── main.py
│       └── requirements.txt
├── bigquery/
│   ├── schemas/
│   │   ├── 01_create_staging_table.sql
│   │   ├── 02_create_control_table.sql
│   │   └── 03_create_external_table.sql
│   └── queries/
│       ├── 01_incremental_load.sql
│       ├── 02_validation_quality_check.sql
│       └── 03_temporal_coverage_check.sql
└── scripts/
    ├── 00_deploy_all.sh (master script)
    ├── 01_setup_secret_manager.sh
    ├── 02_deploy_cloud_function.sh
    ├── 03_setup_cloud_scheduler.sh
    ├── 04_setup_bigquery_tables.sh
    └── 05_setup_scheduled_query.sh
```

### Related Documentation

- [Polygon.io API Docs](https://polygon.io/docs/stocks/get_v2_aggs_grouped_locale_us_market_stocks__date)
- [Cloud Functions Gen2 Docs](https://cloud.google.com/functions/docs/2nd-gen/overview)
- [BigQuery Scheduled Queries](https://cloud.google.com/bigquery/docs/scheduling-queries)
- [Cloud Scheduler Docs](https://cloud.google.com/scheduler/docs)

### Support & Contributing

For issues or questions:
1. Check troubleshooting section above
2. Review Cloud Function logs
3. Validate data quality with provided queries
4. Open an issue in the repository

---

**Last Updated**: 2025-11-15
**Version**: 1.0
**Author**: Claude Code
**License**: MIT

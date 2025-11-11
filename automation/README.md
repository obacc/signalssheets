# 🚀 POLYGON PIPELINE AUTOMATION

Complete automation and monitoring toolkit for the Polygon → BigQuery data pipeline.

## 📦 What's Included

```
automation/
├── README.md                          ← You are here
├── RUNBOOK_POLYGON.md                 ← Operations manual (READ THIS!)
├── backfill_polygon.sh                ← Orchestrated backfill script
├── config/
│   └── env.example                    ← Configuration template
├── pipelines/
│   ├── gcs_to_staging_load.sh         ← GCS → Staging loader
│   └── staging_to_prices_call.sh      ← Staging → Prices (SP caller)
├── scripts/
│   └── daily_healthcheck.sh           ← Daily health verification
├── sql/
│   ├── validate_coverage.sql          ← Coverage validation query
│   └── validate_data_quality.sql      ← Data quality checks
└── bq/
    ├── scheduled_query_setup.md       ← Scheduled Query guide
    └── create_scheduled_query.sh      ← SQ creation script
```

---

## ⚡ Quick Start

### 1. Setup Configuration

```bash
cd automation/config
cp env.example .env

# Edit .env with your values
nano .env
```

**Critical variables to set:**
- `PROJECT_ID`
- `SERVICE_ACCOUNT_KEY_PATH`
- `ALERT_EMAIL`
- `DTS_SERVICE_ACCOUNT` (get your project number first)

### 2. Authenticate

```bash
# Set credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Authenticate gcloud
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
gcloud config set project sunny-advantage-471523-b3
```

### 3. Make Scripts Executable

```bash
cd automation
chmod +x backfill_polygon.sh
chmod +x pipelines/*.sh
chmod +x scripts/*.sh
chmod +x bq/*.sh
```

### 4. Run Daily Healthcheck

```bash
cd automation/scripts
./daily_healthcheck.sh
```

Expected output:
```
✓ OK - All checks passed
```

---

## 🎯 Common Use Cases

### Use Case 1: Daily Monitoring

```bash
# Run this every morning after 9 AM CT
cd automation/scripts
./daily_healthcheck.sh

# Check last 7 days
./daily_healthcheck.sh --days 7
```

### Use Case 2: Load a Missing Date

```bash
# Scenario: Nov 10 is missing in staging

cd automation/pipelines
./gcs_to_staging_load.sh --date 2025-11-10

# Then merge to Prices
./staging_to_prices_call.sh
```

### Use Case 3: Backfill a Date Range

```bash
cd automation

# Always plan first!
./backfill_polygon.sh --from 2025-11-01 --to 2025-11-10 --plan

# Review the plan, then execute
./backfill_polygon.sh --from 2025-11-01 --to 2025-11-10
```

### Use Case 4: Verify Data Coverage

```bash
# Run SQL validation
cd automation/sql
bq query --use_legacy_sql=false < validate_coverage.sql

# Check for data quality issues
bq query --use_legacy_sql=false < validate_data_quality.sql
```

### Use Case 5: Setup Automated Scheduled Query

Follow the guide:
```bash
less automation/bq/scheduled_query_setup.md
```

Or use the script (requires additional setup):
```bash
cd automation/bq
./create_scheduled_query.sh
```

---

## 📊 Script Reference

### `gcs_to_staging_load.sh`

Loads data from GCS to BigQuery staging table.

**Usage:**
```bash
# Load a single date
./gcs_to_staging_load.sh --date 2025-11-10

# Load a date range
./gcs_to_staging_load.sh --from 2025-11-01 --to 2025-11-10

# Dry-run (plan mode)
./gcs_to_staging_load.sh --from 2025-11-01 --to 2025-11-10 --plan

# Force (skip confirmation)
./gcs_to_staging_load.sh --date 2025-11-10 --force
```

**Features:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Checks if data exists in GCS before loading
- ✅ Supports batch loading with date ranges
- ✅ Dry-run mode to preview actions
- ✅ Detailed logging to `/tmp/`

---

### `staging_to_prices_call.sh`

Executes the stored procedure to merge staging data into Prices table.

**Usage:**
```bash
# Execute SP (processes ALL staging data)
./staging_to_prices_call.sh

# With date range validation
./staging_to_prices_call.sh --from 2025-11-01 --to 2025-11-10

# Dry-run
./staging_to_prices_call.sh --plan
```

**Features:**
- ✅ Pre/post validation of row counts
- ✅ Verifies SP exists before execution
- ✅ Shows duration and result summary
- ✅ Saves execution results to `/tmp/`

**Note:** The SP processes ALL data in staging. Date range is only for validation.

---

### `backfill_polygon.sh`

Orchestrates end-to-end backfill (GCS → Staging → Prices).

**Usage:**
```bash
# Plan backfill
./backfill_polygon.sh --from 2025-11-01 --to 2025-11-10 --plan

# Execute backfill
./backfill_polygon.sh --from 2025-11-01 --to 2025-11-10

# Skip gap detection (process all dates)
./backfill_polygon.sh --from 2025-11-01 --to 2025-11-10 --skip-detection
```

**Features:**
- ✅ Gap detection (shows which dates are missing)
- ✅ Orchestrates both load steps automatically
- ✅ Validates results after completion
- ✅ Comprehensive logging
- ✅ Safe batch processing

**Workflow:**
1. Detects missing dates (GCS vs Staging vs Prices)
2. Loads missing dates to staging
3. Executes SP to merge to Prices
4. Validates all dates are now present

---

### `daily_healthcheck.sh`

Verifies pipeline health and data freshness.

**Usage:**
```bash
# Check last 2 days (default)
./daily_healthcheck.sh

# Check last 7 days
./daily_healthcheck.sh --days 7
```

**Exit Codes:**
- `0` = OK (all checks passed)
- `1` = WARN (minor issues)
- `2` = FAIL (critical issues)

**Checks Performed:**
1. ✅ GCS data freshness
2. ✅ Staging table freshness
3. ✅ Prices table freshness (source=polygon)
4. ✅ Date coverage (last N days)
5. ✅ Data quality (NULLs, duplicates)

**Integration:** Can be run via cron or Cloud Scheduler for daily monitoring.

---

## 🔧 Configuration Reference

All scripts use `automation/config/.env` for configuration.

**Key Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `PROJECT_ID` | GCP project | `sunny-advantage-471523-b3` |
| `DATASET` | BigQuery dataset | `market_data` |
| `STAGING_TABLE` | Staging table name | `stg_prices_polygon_raw` |
| `DESTINATION_TABLE` | Final table name | `Prices` |
| `BUCKET_URI` | GCS bucket path | `gs://ss-bucket.../polygon/daily` |
| `TIMEZONE` | Schedule timezone | `America/Chicago` |
| `RUN_HOUR` | Daily run hour | `1` (1 AM) |
| `ALERT_EMAIL` | Email for alerts | `your-email@example.com` |

See `config/env.example` for full list.

---

## 🚨 Troubleshooting

### Problem: Script says "Config file not found"

**Solution:**
```bash
cd automation/config
cp env.example .env
# Edit .env with your values
```

### Problem: "Permission denied" errors

**Solution:**
```bash
# Make scripts executable
cd automation
chmod +x backfill_polygon.sh pipelines/*.sh scripts/*.sh bq/*.sh

# Verify authentication
gcloud auth list
```

### Problem: "No data found in GCS"

**Diagnosis:**
```bash
# Verify data exists
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/ | grep date=

# Check specific date
gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/date=2025-11-10/
```

**Solution:**
- If data doesn't exist upstream, nothing to load
- If data exists but script can't see it, check SA permissions

### Problem: Healthcheck shows FAIL

**Solution:**
1. Read the healthcheck output carefully
2. Identify which check failed
3. Consult [RUNBOOK_POLYGON.md](./RUNBOOK_POLYGON.md) for specific remediation steps

### Problem: Backfill fails partway through

**Solution:**
1. Check logs: `/tmp/backfill_polygon_*.log`
2. Identify which date failed
3. Fix the issue (see runbook)
4. Re-run backfill (it's idempotent, safe to retry)

---

## 📅 Scheduled Query Setup

For daily automated execution:

1. **Read the guide:**
   ```bash
   less automation/bq/scheduled_query_setup.md
   ```

2. **Setup via Console (Recommended):**
   - Open BigQuery Console
   - Create Scheduled Query
   - Query: `CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices\`();`
   - Schedule: `every day 01:00`
   - Timezone: `America/Chicago`
   - Email on failure: ✅

3. **Verify it works:**
   - Wait for next execution
   - Check email for confirmation
   - Run healthcheck next morning

---

## 📖 Documentation

- **Operations Manual:** [RUNBOOK_POLYGON.md](./RUNBOOK_POLYGON.md)
- **Scheduled Query Setup:** [bq/scheduled_query_setup.md](./bq/scheduled_query_setup.md)
- **Full Audit Report:** [../auditoria/AUDITORIA_POLYGON.md](../auditoria/AUDITORIA_POLYGON.md)

---

## ✅ Deployment Checklist

Before going to production:

- [ ] Copy `config/env.example` to `config/.env` and customize
- [ ] Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- [ ] Authenticate gcloud
- [ ] Make all scripts executable (`chmod +x`)
- [ ] Test healthcheck script
- [ ] Test loading a single date (in dev/staging environment)
- [ ] Setup Scheduled Query with email notifications
- [ ] Add healthcheck to monitoring/cron
- [ ] Share RUNBOOK with team
- [ ] Setup on-call rotation
- [ ] Document any custom changes

---

## 🔐 Security Notes

- **Never commit `.env` file** (contains credentials)
- **Rotate service account keys** quarterly
- **Use least privilege principle** for SA permissions
- **Audit IAM bindings** monthly
- **Store credentials securely** (Secret Manager preferred)

---

## 💰 Cost Estimation

Running these scripts:

| Operation | Frequency | Est. Cost/Month |
|-----------|-----------|-----------------|
| Daily healthcheck | 30x/month | ~$0.15 |
| GCS list operations | 30x/month | $0 (free tier) |
| BQ queries (validation) | 30x/month | ~$0.30 |
| Backfill (occasional) | 1x/month | ~$0.50 |
| **Total** | | **~$1/month** |

Pipeline costs (separate):
- Scheduled Query: $0 (included)
- SP execution: ~$1.50/month
- Storage: ~$135/month (see audit report)

---

## 🆘 Support

**Issues/Questions:**
1. Check [RUNBOOK_POLYGON.md](./RUNBOOK_POLYGON.md) troubleshooting section
2. Review script error messages and logs
3. Contact Data Engineering team: data-eng@example.com

**On-Call Escalation:**
- P1 (Critical): Pipeline down > 24h
- P2 (High): Missing 1-2 days of data
- P3 (Medium): Data quality issues
- P4 (Low): Documentation/enhancement requests

---

## 🚧 Development

### Testing Changes

```bash
# Always test in a dev environment first
export PROJECT_ID="your-dev-project"
export DRY_RUN=true

# Test with plan mode
./backfill_polygon.sh --from 2025-11-01 --to 2025-11-03 --plan
```

### Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Update documentation
5. Create PR with detailed description

---

## 📝 Changelog

**v1.0 - 2025-11-11**
- Initial release
- Core scripts: load, backfill, healthcheck
- Scheduled Query setup guide
- Comprehensive runbook

---

**Questions?** Read the [RUNBOOK](./RUNBOOK_POLYGON.md) or contact the team!

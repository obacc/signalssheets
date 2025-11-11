# POLYGON PIPELINE RUNBOOK

**Owner:** Data Engineering Team
**Last Updated:** 2025-11-11
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Daily Operations](#daily-operations)
3. [Monitoring](#monitoring)
4. [Troubleshooting](#troubleshooting)
5. [Backfill Procedures](#backfill-procedures)
6. [Rollback Procedures](#rollback-procedures)
7. [Maintenance](#maintenance)
8. [Contacts](#contacts)

---

## Overview

### Pipeline Architecture

```
GCS (Polygon Data)
  ↓ [Data Transfer Service - Daily 12:00 AM UTC]
Staging Table (stg_prices_polygon_raw)
  ↓ [Scheduled Query - Daily 1:00 AM America/Chicago]
Prices Table (source='polygon')
```

### Key Components

| Component | Location | Schedule |
|-----------|----------|----------|
| **GCS Bucket** | `gs://ss-bucket-polygon-incremental/polygon/daily/` | Continuous |
| **Staging Table** | `market_data.stg_prices_polygon_raw` | Loaded daily |
| **Prices Table** | `market_data.Prices` | Merged daily |
| **Stored Procedure** | `market_data.sp_merge_polygon_prices` | Called by SQ |
| **Scheduled Query** | `polygon_daily_merge` | 1:00 AM CT |

### Service Accounts

- **DTS SA:** `service-{NUMBER}@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com`
- **Automation SA:** `claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com`

---

## Daily Operations

### Morning Healthcheck (5 minutes)

**When:** Every morning at 9:00 AM CT (after pipeline completion)

**Steps:**

1. **Run healthcheck script:**
   ```bash
   cd automation/scripts
   ./daily_healthcheck.sh
   ```

2. **Expected Output:**
   ```
   ✓ OK - All checks passed
   ```

3. **If WARN or FAIL:**
   - See [Troubleshooting](#troubleshooting)
   - Escalate if unresolved after 30 minutes

### Manual Verification (Alternative)

If healthcheck script unavailable:

1. **Check latest date in GCS:**
   ```bash
   gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/ | \
     grep -oP 'date=\K[0-9]{4}-[0-9]{2}-[0-9]{2}' | sort -r | head -1
   ```

2. **Check latest date in Staging:**
   ```sql
   SELECT MAX(date) as latest_date, COUNT(*) as total_rows
   FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
   WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY);
   ```

3. **Check latest date in Prices:**
   ```sql
   SELECT MAX(date) as latest_date, COUNT(*) as total_rows
   FROM `sunny-advantage-471523-b3.market_data.Prices`
   WHERE source = 'polygon'
     AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY);
   ```

**Success Criteria:** Yesterday's date (D-1) present in all three locations.

---

## Monitoring

### Key Metrics to Monitor

1. **Data Freshness**
   - GCS: Files present for yesterday
   - Staging: Max date = yesterday
   - Prices: Max date (polygon) = yesterday

2. **Data Volume**
   - Staging: ~8,000-15,000 rows/day
   - Prices increase: Same as staging

3. **Job Success Rate**
   - Scheduled Query: 100% success (last 7 days)
   - No errors in logs

### Where to Check

#### BigQuery Scheduled Query Status

```bash
# List recent runs
bq ls --transfer_run \
  --transfer_config=projects/PROJECT_NUMBER/locations/us/transferConfigs/CONFIG_ID \
  --max_results=7 \
  --format=json | jq '.[] | {runTime, state}'
```

#### Cloud Logging

```bash
# Errors in last 24 hours
gcloud logging read "
  resource.type=\"bigquery_dts_config\"
  AND severity >= ERROR
  AND timestamp >= \"$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)\"
" --project=sunny-advantage-471523-b3 --limit=50
```

#### Email Alerts

- **Setup:** Scheduled Query configured to email on failure
- **Recipient:** your-team@example.com
- **Action:** Investigate immediately (P1 incident)

---

## Troubleshooting

### Issue 1: Missing Date in Staging

**Symptoms:**
- Healthcheck shows "MISSING_IN_STAGING"
- Data in GCS but not in staging table

**Diagnosis:**

1. Verify data exists in GCS:
   ```bash
   gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/date=YYYY-MM-DD/
   ```

2. Check Data Transfer logs:
   ```bash
   gcloud logging read "
     resource.type=\"bigquery_dts_config\"
     AND timestamp >= \"YYYY-MM-DDT00:00:00Z\"
     AND timestamp <= \"YYYY-MM-DDT23:59:59Z\"
   " --limit=50
   ```

**Resolution:**

```bash
# Load specific date manually
cd automation/pipelines
./gcs_to_staging_load.sh --date YYYY-MM-DD
```

**Root Causes:**
- DTS job failed (check permissions)
- No data in GCS for that date
- Schema mismatch

---

### Issue 2: Data in Staging but Not in Prices

**Symptoms:**
- Data present in staging
- NOT present in Prices (source='polygon')

**Diagnosis:**

1. Check if SP ran today:
   ```sql
   SELECT creation_time, state, error_result
   FROM `sunny-advantage-471523-b3.region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
   WHERE query LIKE '%sp_merge_polygon_prices%'
     AND DATE(creation_time) = CURRENT_DATE()
   ORDER BY creation_time DESC
   LIMIT 5;
   ```

2. Check Scheduled Query status (see Monitoring section)

**Resolution:**

```bash
# Execute SP manually
cd automation/pipelines
./staging_to_prices_call.sh --from YYYY-MM-DD --to YYYY-MM-DD
```

**Root Causes:**
- Scheduled Query didn't run
- SP failed (permissions, logic error)
- Data already exists (idempotent merge)

---

### Issue 3: Duplicate Data

**Symptoms:**
- Same ticker+date appears multiple times in Prices

**Diagnosis:**

```sql
SELECT date, ticker, source, COUNT(*) as cnt
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND source = 'polygon'
GROUP BY date, ticker, source
HAVING COUNT(*) > 1
ORDER BY cnt DESC;
```

**Resolution:**

```sql
-- Dedup by keeping latest by timestamp (or use ingestion_time)
CREATE OR REPLACE TABLE `sunny-advantage-471523-b3.market_data.Prices_deduped` AS
SELECT * EXCEPT(row_num)
FROM (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY ticker, date, source
      ORDER BY updated_at DESC  -- or ingestion_time/created_at
    ) AS row_num
  FROM `sunny-advantage-471523-b3.market_data.Prices`
)
WHERE row_num = 1;

-- Backup old table
CREATE TABLE `sunny-advantage-471523-b3.market_data.Prices_backup_YYYYMMDD`
AS SELECT * FROM `sunny-advantage-471523-b3.market_data.Prices`;

-- Replace
DROP TABLE `sunny-advantage-471523-b3.market_data.Prices`;
ALTER TABLE `sunny-advantage-471523-b3.market_data.Prices_deduped`
  RENAME TO Prices;
```

**Prevention:**
- Ensure SP uses proper MERGE logic with unique key
- Add unique constraint if possible

---

### Issue 4: Scheduled Query Not Running

**Symptoms:**
- No execution today
- No email received

**Diagnosis:**

1. Check if SQ is paused:
   ```bash
   bq show --transfer_config CONFIG_ID
   ```

2. Check service account permissions:
   ```bash
   # Get permissions
   bq show --format=json sunny-advantage-471523-b3:market_data | \
     jq '.access[] | select(.userByEmail | contains("bigquerydatatransfer"))'
   ```

**Resolution:**

1. If paused, resume via Console or:
   ```bash
   # Resume (requires API call - use Console)
   ```

2. If permission issue, add roles:
   ```bash
   # Add bigquery.dataEditor to dataset (via Console preferred)
   ```

3. Test manually:
   ```bash
   bq query --use_legacy_sql=false \
     "CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices\`();"
   ```

---

### Issue 5: Data Quality Problems

**Symptoms:**
- NULL close prices
- Negative volumes
- Anomalous values

**Diagnosis:**

```bash
cd automation/sql
bq query --use_legacy_sql=false < validate_data_quality.sql
```

**Resolution:**

1. **If in staging only:**
   - Check upstream data source (Polygon API)
   - May need to filter bad records in SP

2. **If in Prices:**
   - Run data fix query:
     ```sql
     DELETE FROM `sunny-advantage-471523-b3.market_data.Prices`
     WHERE date = 'YYYY-MM-DD'
       AND source = 'polygon'
       AND (close IS NULL OR close < 0 OR volume < 0);
     ```
   - Re-run SP for that date

---

## Backfill Procedures

### When to Backfill

- Missing dates detected in healthcheck
- After fixing pipeline issues
- Historical data correction

### Backfill Steps

1. **Identify missing dates:**
   ```bash
   cd automation/scripts
   ./daily_healthcheck.sh --days 30
   ```

2. **Plan backfill:**
   ```bash
   cd automation
   ./backfill_polygon.sh --from 2025-11-01 --to 2025-11-10 --plan
   ```

3. **Review plan output** - verify dates to be loaded

4. **Execute backfill:**
   ```bash
   ./backfill_polygon.sh --from 2025-11-01 --to 2025-11-10
   ```

5. **Monitor progress** - check logs in `/tmp/backfill_polygon_*.log`

6. **Validate:**
   ```bash
   ./scripts/daily_healthcheck.sh --days 10
   ```

### Backfill Best Practices

- ✅ Always run with `--plan` first
- ✅ Backfill in batches (max 10 days at a time)
- ✅ Run during off-hours (low query load)
- ✅ Monitor BigQuery slot usage
- ✅ Validate after completion

### Emergency Backfill (single date)

```bash
# GCS → Staging
cd automation/pipelines
./gcs_to_staging_load.sh --date YYYY-MM-DD

# Staging → Prices
./staging_to_prices_call.sh
```

---

## Rollback Procedures

### Scenario 1: Bad Data Loaded to Staging

**Impact:** Low (staging is temporary)

**Action:**
```sql
-- Delete bad data
DELETE FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
WHERE date = 'YYYY-MM-DD';

-- Reload from GCS
-- (run gcs_to_staging_load.sh)
```

### Scenario 2: Bad Data in Prices

**Impact:** High (production table)

**Action:**
```sql
-- 1. Backup first
CREATE TABLE `sunny-advantage-471523-b3.market_data.Prices_backup_YYYYMMDD` AS
SELECT * FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE date = 'YYYY-MM-DD' AND source = 'polygon';

-- 2. Delete bad data
DELETE FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE date = 'YYYY-MM-DD' AND source = 'polygon';

-- 3. Reload (ensure good data in staging first)
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();

-- 4. Validate
SELECT date, COUNT(*) FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE date = 'YYYY-MM-DD' AND source = 'polygon'
GROUP BY date;
```

### Scenario 3: Faulty SP Deployed

**Impact:** Critical

**Action:**
1. **Pause Scheduled Query immediately** (via Console)
2. **Identify last good version** of SP
3. **Restore SP code:**
   ```sql
   CREATE OR REPLACE PROCEDURE `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`()
   BEGIN
     -- [paste last known good SP code]
   END;
   ```
4. **Test SP manually** on small date range
5. **Resume Scheduled Query**

---

## Maintenance

### Weekly Tasks

- [ ] Review healthcheck trends (any patterns?)
- [ ] Check for duplicate data (run quality SQL)
- [ ] Review BigQuery job logs for warnings
- [ ] Verify email alerts are working

### Monthly Tasks

- [ ] Review and optimize SP performance
- [ ] Check BigQuery storage costs
- [ ] Audit IAM permissions (principle of least privilege)
- [ ] Update documentation if processes changed

### Quarterly Tasks

- [ ] Test backfill procedure end-to-end
- [ ] Test rollback procedure (in dev environment)
- [ ] Review and update runbook
- [ ] Disaster recovery drill

---

## Common Errors Reference

| Error Message | Cause | Resolution |
|---------------|-------|------------|
| `Access Denied: Dataset` | SA lacks permissions | Grant `bigquery.dataEditor` |
| `Not found: Table` | Table doesn't exist | Verify table name and dataset |
| `Resources exceeded` | Query too large | Add partition filter, increase quota |
| `Invalid schema` | Column mismatch | Check schema compatibility |
| `Duplicate key` | PK violation | Check for duplicates in source |

---

## Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| **Primary On-Call** | Data Eng Team | data-eng@example.com | 24/7 |
| **Backup** | Analytics Team | analytics@example.com | Business hours |
| **GCP Admin** | Platform Team | platform@example.com | Business hours |
| **Escalation** | Engineering Manager | eng-manager@example.com | 24/7 (urgent only) |

---

## Appendix: Quick Commands

```bash
# Healthcheck
cd /path/to/automation/scripts && ./daily_healthcheck.sh

# Load single date
cd /path/to/automation/pipelines && ./gcs_to_staging_load.sh --date YYYY-MM-DD

# Execute SP
cd /path/to/automation/pipelines && ./staging_to_prices_call.sh

# Backfill date range
cd /path/to/automation && ./backfill_polygon.sh --from YYYY-MM-DD --to YYYY-MM-DD --plan

# Check Scheduled Query status
bq ls --transfer_run --transfer_config=CONFIG_ID --max_results=5

# View recent errors
gcloud logging read "resource.type=\"bigquery_dts_config\" AND severity>=ERROR" --limit=20
```

---

**Document Version:** 1.0
**Last Reviewed:** 2025-11-11
**Next Review:** 2025-12-11

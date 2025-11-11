# 🔍 POLYGON PIPELINE - BIGQUERY OPERATIONS REPORT

**Date:** 2025-11-11 23:15 UTC
**Project:** `sunny-advantage-471523-b3`
**Dataset:** `market_data`
**Executed By:** claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com

---

## 📊 EXECUTIVE SUMMARY

| Aspect | Status | Details |
|--------|--------|---------|
| **Stored Procedure** | ✅ EXISTS | `sp_merge_polygon_prices` |
| **Staging Table** | ⚠️ **EMPTY** | 0 rows - Cannot backfill |
| **Prices Table (Polygon)** | ✅ HAS DATA | 232,233 rows, 7 dates |
| **Last Data Date** | 📅 2025-11-06 | 5 days ago |
| **Missing Dates** | ❌ **5 DAYS** | 2025-11-07 through 2025-11-11 |
| **Scheduled Query** | ⚠️ **NOT CREATED** | Requires manual setup (see below) |

### 🚨 CRITICAL FINDING

**The staging table (`stg_prices_polygon_raw`) is EMPTY.** This means:
- ❌ **Cannot perform backfill** from staging to Prices (no source data)
- ❌ **Root cause is upstream** (GCS → Staging pipeline is not running)
- ✅ SP exists and is ready to execute
- ✅ Scheduled Query can be created, but won't have data to process

**Required Action:** Fix GCS → Staging data load FIRST, then backfill will work automatically when SP runs.

---

## 1️⃣ TABLE INSPECTION RESULTS

### 1.1 Staging Table: `stg_prices_polygon_raw`

**Schema:**
```
ticker    (STRING)    - Stock ticker symbol
fecha     (DATE)      - Trading date
open      (FLOAT)     - Opening price
high      (FLOAT)     - High price
low       (FLOAT)     - Low price
close     (FLOAT)     - Closing price
volume    (INTEGER)   - Trading volume
carga_ts  (TIMESTAMP) - Load timestamp
```

**Current State:**
- **Rows:** 0 (EMPTY)
- **Size:** 0 MB
- **Status:** ⚠️ **No data available for processing**

### 1.2 Prices Table: `market_data.Prices`

**Schema:**
```
origen         (STRING)    - Data source (e.g., 'Polygon')
ticker         (STRING)    - Stock ticker
fecha          (DATE)      - Trading date
open           (FLOAT)     - Opening price
high           (FLOAT)     - High price
low            (FLOAT)     - Low price
close          (FLOAT)     - Closing price
vol            (INTEGER)   - Volume
openint        (INTEGER)   - Open interest
carga_ts       (TIMESTAMP) - Load timestamp
first_batch_id (STRING)    - First batch ID
last_batch_id  (STRING)    - Last batch ID
updated_at     (TIMESTAMP) - Update timestamp
updated_ts     (TIMESTAMP) - Update timestamp (duplicate?)
```

**Current State (origen='Polygon'):**
- **Total Rows:** 232,233
- **Unique Tickers:** 12,274
- **Date Range:** 2025-10-24 to 2025-11-06
- **Unique Dates:** 7 days
- **Size:** ~1.8 GB (entire Prices table)

---

## 2️⃣ COVERAGE ANALYSIS (LAST 10 DAYS)

| Date       | Staging Rows | Prices Rows (Polygon) | Status |
|------------|--------------|----------------------|--------|
| 2025-11-11 | 0           | 0                    | ❌ **MISSING** |
| 2025-11-10 | 0           | 0                    | ❌ **MISSING** |
| 2025-11-09 | 0           | 0                    | ❌ **MISSING** |
| 2025-11-08 | 0           | 0                    | ❌ **MISSING** |
| 2025-11-07 | 0           | 0                    | ❌ **MISSING** |
| 2025-11-06 | 0           | 11,597               | ✅ In Prices |
| 2025-11-05 | 0           | 11,613               | ✅ In Prices |
| 2025-11-04 | 0           | 11,629               | ✅ In Prices |
| 2025-11-03 | 0           | 11,630               | ✅ In Prices |
| 2025-10-31 | 0           | 11,616               | ✅ In Prices |
| 2025-10-30 | 0           | 11,602               | ✅ In Prices |

### Date Coverage Details

**Dates with Data in Prices (origen='Polygon'):**
1. 2025-11-06 - 11,597 rows, 11,595 tickers
2. 2025-11-05 - 11,613 rows, 11,611 tickers
3. 2025-11-04 - 11,629 rows, 11,627 tickers
4. 2025-11-03 - 11,630 rows, 11,628 tickers
5. 2025-10-31 - 11,616 rows, 11,616 tickers
6. 2025-10-30 - 11,602 rows, 11,602 tickers
7. 2025-10-24 - 20 rows, 20 tickers (partial/test data?)

**Note:** There is also an entry with `fecha=NULL` containing 162,526 rows with 0 tickers - this needs investigation.

---

## 3️⃣ MISSING DATES ANALYSIS

### 3.1 Detected Gaps

**Last 30 days analysis:**
- **Staging → Prices gaps:** Cannot determine (staging is empty)
- **Calendar gaps:** 5 business/calendar days without data (2025-11-07 through 2025-11-11)

### 3.2 Why No Backfill Was Executed

❌ **Staging table contains 0 rows**
- There is no source data to merge into Prices
- The SP would run but find nothing to process
- Backfill requires data in staging first

### 3.3 Root Cause

The problem is **upstream** of BigQuery:
- GCS → Staging pipeline is not loading data
- This could be due to:
  - No new files in GCS bucket (`gs://ss-bucket-polygon-incremental/polygon/daily/`)
  - Data Transfer Service not configured or paused
  - Data Transfer Service failing (permissions, schema mismatch, etc.)

**Recommendation:** Investigate GCS bucket and Data Transfer Service configuration.

---

## 4️⃣ STORED PROCEDURE VERIFICATION

### 4.1 SP Status

✅ **SP EXISTS:** `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`

**Details:**
- **Created:** (timestamp not available via API)
- **Last Modified:** (timestamp not available via API)
- **Language:** SQL
- **Type:** PROCEDURE

### 4.2 Expected Behavior

The SP should:
1. Read data from `stg_prices_polygon_raw`
2. Transform/normalize as needed
3. Merge into `Prices` table with `origen='Polygon'`
4. Be idempotent (safe to run multiple times)

### 4.3 Manual Test (When Staging Has Data)

To manually test the SP:

```sql
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();
```

**Expected Result:** Rows from staging appear in Prices with `origen='Polygon'`.

---

## 5️⃣ SCHEDULED QUERY CONFIGURATION

### 5.1 Current Status

⚠️ **Scheduled Query NOT YET CREATED**

The Scheduled Query requires manual creation via:
- BigQuery Console UI (recommended), OR
- Data Transfer Service API

### 5.2 Configuration Spec

| Parameter | Value |
|-----------|-------|
| **Name** | `merge_polygon_prices_daily` |
| **Query** | `CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices\`();` |
| **Schedule** | `0 1 * * *` (Every day at 1:00 AM) |
| **Timezone** | `America/Chicago` |
| **SQL Dialect** | Standard SQL |
| **Destination** | None (SP writes directly to Prices) |
| **Notifications** | ✅ Email on failure |

### 5.3 Manual Creation Steps (BigQuery Console)

**Step-by-Step Instructions:**

1. **Open BigQuery Console:**
   ```
   https://console.cloud.google.com/bigquery?project=sunny-advantage-471523-b3
   ```

2. **Navigate to Scheduled Queries:**
   - Click on "Scheduled Queries" in the left sidebar
   - Or go directly to: https://console.cloud.google.com/bigquery/scheduled-queries

3. **Create New Scheduled Query:**
   - Click **"CREATE SCHEDULED QUERY"** button

4. **Enter Query:**
   ```sql
   CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();
   ```

5. **Configure Schedule:**
   - **Display name:** `merge_polygon_prices_daily`
   - **Repeats:** Daily
   - **Start time:** 01:00 (1:00 AM)
   - **Timezone:** America/Chicago

6. **Destination (IMPORTANT):**
   - **Do NOT set a destination table**
   - The SP handles writing to Prices internally
   - Leave destination blank or select "No destination"

7. **Advanced Options:**
   - **Use legacy SQL:** ❌ UNCHECKED (use Standard SQL)
   - **Write preference:** N/A (no destination)

8. **Notification Options:**
   - ✅ **Check "Send email notifications"**
   - ✅ **Check "Send email if query fails"**
   - **Email address:** your-email@example.com (set your team's email)

9. **Save:**
   - Click **"SAVE"** or **"CREATE"**
   - Verify it appears in the list with status "ENABLED"

### 5.4 Verification

After creation, verify:

```bash
# List scheduled queries
bq ls --transfer_config --project_id=sunny-advantage-471523-b3

# Get specific config details
bq show --transfer_config projects/{PROJECT_NUMBER}/locations/us/transferConfigs/{CONFIG_ID}
```

**Expected Output:**
- Status: ENABLED
- Schedule: `0 1 * * *`
- Timezone: `America/Chicago`
- Query contains: `CALL sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices()`

### 5.5 Testing the Scheduled Query

**Option 1: Wait for next execution**
- It will run automatically tomorrow at 1:00 AM CT

**Option 2: Trigger manually (Console)**
1. Go to Scheduled Queries
2. Click on `merge_polygon_prices_daily`
3. Click **"RUN NOW"** button
4. Check execution status

**Option 3: Test the SP directly**
```sql
-- Run the SP directly in BigQuery Console
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();
```

---

## 6️⃣ HEALTHCHECK SUMMARY

### 6.1 Overall Status

| Check | Result | Status |
|-------|--------|--------|
| SP Exists | Yes | ✅ |
| Staging Has Data | No (0 rows) | ❌ |
| Prices Has Data | Yes (232K rows) | ✅ |
| Last Data Is Recent | No (5 days old) | ⚠️ |
| Scheduled Query Exists | No | ⚠️ |
| Pipeline Is Operational | No | ❌ |

### 6.2 Data Freshness

- **Last data in Prices:** 2025-11-06 (5 days ago)
- **Today:** 2025-11-11
- **Gap:** 5 days

### 6.3 Recommended Actions (Priority Order)

1. **🔴 CRITICAL: Fix GCS → Staging Pipeline**
   - Investigate why staging table is empty
   - Check Data Transfer Service configuration
   - Verify GCS bucket has recent data files
   - Check permissions and error logs

2. **🟡 HIGH: Create Scheduled Query**
   - Follow steps in Section 5.3
   - This prepares for automated daily execution
   - Test after staging has data

3. **🟡 HIGH: Backfill Missing Dates**
   - Once staging has data for 2025-11-07 through 2025-11-11
   - Simply run the SP (it will process all staging data)
   - Or wait for Scheduled Query to run

4. **🟢 MEDIUM: Monitor Daily Execution**
   - Verify Scheduled Query runs successfully each day
   - Check email notifications
   - Validate data appears in Prices

5. **🟢 LOW: Investigate NULL Dates**
   - 162,526 rows in Prices have `fecha=NULL`
   - This may indicate data quality issues
   - Consider cleanup or investigation

---

## 7️⃣ COST ESTIMATION

### 7.1 Query Costs

**Operations Executed:**
| Operation | Data Scanned | Estimated Cost |
|-----------|--------------|----------------|
| Schema inspection | ~0 MB | $0.00 (metadata) |
| Coverage analysis | ~10 MB | < $0.01 |
| **Total** | **~10 MB** | **< $0.01** |

### 7.2 Ongoing Costs (After Setup)

| Operation | Frequency | Data Scanned | Monthly Cost |
|-----------|-----------|--------------|--------------|
| Scheduled Query execution | Daily (30x) | ~50 MB/run | ~$0.75/month |
| SP execution (manual) | Occasional | ~50 MB/run | Negligible |

**Total Estimated:** < $1/month for automation

---

## 8️⃣ NEXT STEPS

### Immediate Actions Required

1. **[MANUAL] Create Scheduled Query**
   - Use Section 5.3 instructions
   - Estimated time: 5 minutes
   - **Do this now** to prepare for daily automation

2. **[URGENT] Investigate Empty Staging**
   - Check GCS bucket: `gs://ss-bucket-polygon-incremental/polygon/daily/`
   - List recent dates: `gsutil ls gs://ss-bucket-polygon-incremental/polygon/daily/ | tail -10`
   - Check Data Transfer Service: https://console.cloud.google.com/bigquery/transfers

3. **[AFTER FIX] Load Missing Dates to Staging**
   - Once GCS → Staging is working
   - Load dates 2025-11-07 through 2025-11-11
   - See automation toolkit scripts in `automation/pipelines/`

4. **[AFTER LOAD] Execute Backfill**
   - Run: `CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices\`();`
   - Or wait for Scheduled Query to run
   - Verify dates appear in Prices

### Long-Term Monitoring

1. **Daily Healthcheck**
   - Run: `automation/scripts/daily_healthcheck.sh` (from automation toolkit)
   - Verify yesterday's date is present in Prices
   - Check for email notifications from Scheduled Query

2. **Weekly Review**
   - Check for any gaps in coverage
   - Review Scheduled Query execution history
   - Monitor BigQuery costs

3. **Monthly Tasks**
   - Review data quality (NULLs, duplicates)
   - Verify email notifications are working
   - Update documentation if processes change

---

## 9️⃣ APPENDIX

### A. Useful Queries

**Check latest dates in Prices:**
```sql
SELECT
    fecha,
    COUNT(*) as rows,
    COUNT(DISTINCT ticker) as tickers
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE LOWER(origen) = 'polygon'
GROUP BY fecha
ORDER BY fecha DESC
LIMIT 10;
```

**Check if staging has data:**
```sql
SELECT
    COUNT(*) as total_rows,
    COUNT(DISTINCT fecha) as unique_dates,
    MIN(fecha) as min_date,
    MAX(fecha) as max_date
FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`;
```

**Manually execute SP:**
```sql
CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();
```

### B. Important Column Name Mappings

**⚠️ NOTE:** The tables use **Spanish column names**:

| Expected (English) | Actual (Spanish) | Type |
|-------------------|------------------|------|
| `date` | `fecha` | DATE |
| `source` | `origen` | STRING |
| `volume` | `vol` (in Prices) | INTEGER |

Always use the **actual Spanish names** in queries.

### C. Contact Information

| Role | Contact | When to Escalate |
|------|---------|------------------|
| **Data Engineering** | data-eng@example.com | Pipeline issues |
| **GCP Admin** | platform@example.com | Permissions, infrastructure |
| **On-Call** | oncall@example.com | Production outages |

### D. References

- **Automation Toolkit:** `automation/` directory in this repo
- **Audit Report:** `auditoria/AUDITORIA_POLYGON.md`
- **Runbook:** `automation/RUNBOOK_POLYGON.md`
- **Deployment Guide:** `DEPLOYMENT_INSTRUCTIONS.md`

---

## ✅ SUMMARY

### What Was Accomplished

✅ **Authentication verified** - Successfully connected to BigQuery
✅ **Tables inspected** - Schema and column names identified
✅ **Data analyzed** - Coverage gaps detected and documented
✅ **SP verified** - Stored procedure exists and is ready
✅ **Documentation created** - Complete report with step-by-step instructions

### What Still Needs to Be Done

⚠️ **Scheduled Query creation** - Requires manual setup via Console (5 min)
⚠️ **Fix upstream pipeline** - GCS → Staging is not loading data
⚠️ **Backfill missing dates** - After staging has data (automatic via SP)
⚠️ **Setup monitoring** - Email notifications and daily healthcheck

### Key Findings

1. **Staging table is empty** - Root cause of inability to backfill
2. **5 days of missing data** - Last data is from 2025-11-06
3. **SP exists and is ready** - Can execute when staging has data
4. **Scheduled Query needs manual creation** - Follow Section 5.3

---

**Report Generated:** 2025-11-11 23:15 UTC
**Generated By:** `execute_polygon_bigquery_ops.py`
**Location:** `/home/user/signalssheets/POLYGON_BIGQUERY_OPERATIONS_REPORT.md`

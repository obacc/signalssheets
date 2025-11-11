# 🚀 DEPLOYMENT INSTRUCTIONS - POLYGON PIPELINE AUTOMATION

**Branch:** `claude/polygon-automation-hardening-011CV2fv2wesuwo4iSY4X1dh`
**Status:** Ready for Review and Deployment
**Date:** 2025-11-11

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] Code review completed by at least 1 team member
- [ ] All scripts tested in dev/staging environment
- [ ] Service account permissions verified
- [ ] Email notification recipient configured
- [ ] On-call schedule updated
- [ ] Team trained on new runbook

---

## 🎯 What's Being Deployed

### New Components

1. **automation/** directory with:
   - 3 main scripts (load, backfill, healthcheck)
   - 2 SQL validation queries
   - Scheduled Query configuration
   - Complete runbook and documentation

2. **No changes to:**
   - Production tables (stg_prices_polygon_raw, Prices)
   - Stored procedure (sp_merge_polygon_prices)
   - Existing pipelines

### Impact

- ✅ **Zero downtime** - All new tooling, no changes to existing pipeline
- ✅ **Read-only by default** - Scripts use `--plan` mode for safety
- ✅ **Backward compatible** - Existing manual processes still work

---

## 📝 Deployment Steps

### Step 1: Merge PR

```bash
# Review PR at:
# https://github.com/obacc/signalssheets/pull/new/claude/polygon-automation-hardening-011CV2fv2wesuwo4iSY4X1dh

# After approval, merge to main
git checkout main
git pull origin main
```

### Step 2: Setup Configuration

```bash
# On production server/environment
cd /path/to/signalssheets/automation

# Copy and customize config
cp config/env.example config/.env

# Edit with production values
nano config/.env
```

**Critical config values:**

```bash
PROJECT_ID="sunny-advantage-471523-b3"
DATASET="market_data"
STAGING_TABLE="stg_prices_polygon_raw"
DESTINATION_TABLE="Prices"
BUCKET_URI="gs://ss-bucket-polygon-incremental/polygon/daily"
TIMEZONE="America/Chicago"
RUN_HOUR="1"
ALERT_EMAIL="data-eng-oncall@example.com"  # SET THIS!

# Get your project number first:
# gcloud projects describe sunny-advantage-471523-b3 --format="value(projectNumber)"
DTS_SERVICE_ACCOUNT="service-YOUR_PROJECT_NUMBER@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com"

SERVICE_ACCOUNT_KEY_PATH="/secure/path/to/service-account-key.json"
```

### Step 3: Authenticate

```bash
# Set credentials
export GOOGLE_APPLICATION_CREDENTIALS="/secure/path/to/service-account-key.json"

# Authenticate
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
gcloud config set project sunny-advantage-471523-b3

# Verify
gcloud auth list
bq ls sunny-advantage-471523-b3:market_data
```

### Step 4: Test Healthcheck

```bash
cd automation/scripts

# Run healthcheck
./daily_healthcheck.sh

# Expected output:
# ✓ OK - All checks passed
# OR
# ⚠ WARN - Minor issues detected (review and remediate)
```

**If healthcheck fails:**
- Review output carefully
- Check RUNBOOK_POLYGON.md troubleshooting section
- DO NOT proceed until healthcheck passes or issues are understood

### Step 5: Test Load Script (Dry-Run)

```bash
cd automation/pipelines

# Test with a known good date (plan mode only)
./gcs_to_staging_load.sh --date 2025-11-08 --plan

# Review output - should show:
# [PLAN] Would load from: gs://...
# [PLAN] Would append to: ...
```

**Do NOT execute without `--plan` until fully tested!**

### Step 6: Setup Scheduled Query

Follow one of the methods in `automation/bq/scheduled_query_setup.md`:

**Recommended: Use BigQuery Console**

1. Open: https://console.cloud.google.com/bigquery
2. Navigate to **Scheduled Queries**
3. Click **Create Scheduled Query**
4. Configure:
   ```sql
   CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices`();
   ```
5. Schedule: `every day 01:00`, Timezone: `America/Chicago`
6. Email notifications: ✅ Send email if query fails
7. Email: **data-eng-oncall@example.com** (your team email)
8. Save as: `polygon_daily_merge`

### Step 7: Verify Scheduled Query

```bash
# List scheduled queries
bq ls --transfer_config --project_id=sunny-advantage-471523-b3

# Get details of your query
bq show --transfer_config projects/PROJECT_NUMBER/locations/us/transferConfigs/CONFIG_ID

# Manually trigger a test run (optional)
# Via Console: Scheduled Queries → polygon_daily_merge → Run Now
```

### Step 8: Setup Monitoring (Optional but Recommended)

**Option A: Cron Job for Daily Healthcheck**

```bash
# Add to crontab (9 AM CT = 3 PM UTC)
0 15 * * * cd /path/to/signalssheets/automation/scripts && ./daily_healthcheck.sh >> /var/log/polygon_health.log 2>&1
```

**Option B: Cloud Scheduler**

```bash
gcloud scheduler jobs create app-engine polygon-daily-healthcheck \
    --schedule="0 15 * * *" \
    --time-zone="UTC" \
    --uri="https://YOUR_FUNCTION_URL/healthcheck" \
    --http-method=POST
```

### Step 9: Update Team Documentation

- [ ] Add automation/ scripts to team wiki
- [ ] Share RUNBOOK_POLYGON.md with on-call rotation
- [ ] Update incident response procedures
- [ ] Add to onboarding documentation

---

## 🧪 Post-Deployment Validation

### Day 1: Verify Scheduled Query Ran

**Next morning (after 9 AM CT):**

```bash
cd automation/scripts
./daily_healthcheck.sh
```

**Expected:**
- ✅ Yesterday's date present in all tables (GCS, Staging, Prices)
- ✅ Row counts match between staging and prices
- ✅ No data quality issues

### Day 2-7: Monitor

- [ ] Check email for any failure notifications
- [ ] Run healthcheck daily
- [ ] Review BigQuery job logs for any warnings
- [ ] Verify costs are within expected range

### Week 1: Backfill Test (Optional)

If there are any historical gaps:

```bash
cd automation

# Identify gaps first
./scripts/daily_healthcheck.sh --days 30

# Plan backfill (dry-run)
./backfill_polygon.sh --from 2025-10-15 --to 2025-10-20 --plan

# Review plan, then execute
./backfill_polygon.sh --from 2025-10-15 --to 2025-10-20
```

---

## 🔄 Rollback Plan

If issues occur after deployment:

### Scenario 1: Scripts Have Bugs

**Impact:** Low (scripts are separate from pipeline)

**Rollback:**
```bash
# Simply stop using the scripts
# Existing manual processes still work
# No code changes needed

# Or revert the PR:
git revert <commit-hash>
```

### Scenario 2: Scheduled Query Issues

**Impact:** Medium (could affect daily pipeline)

**Rollback:**
```bash
# Option 1: Pause Scheduled Query
# Via Console: Scheduled Queries → polygon_daily_merge → Pause

# Option 2: Delete Scheduled Query
bq rm --transfer_config projects/.../transferConfigs/CONFIG_ID

# Fallback: Run SP manually each day
bq query --use_legacy_sql=false \
  "CALL \`sunny-advantage-471523-b3.market_data.sp_merge_polygon_prices\`();"
```

### Scenario 3: Data Corruption

**Impact:** High (production data affected)

**Rollback:**
See `automation/RUNBOOK_POLYGON.md` → "Rollback Procedures" section

**Prevention:**
- All scripts are idempotent
- Scripts don't modify Prices table directly (only SP does)
- SP uses MERGE (idempotent by design)

---

## 📞 Support Contacts

| Role | Contact | When to Escalate |
|------|---------|------------------|
| **Primary:** Data Engineering | data-eng@example.com | Any issues |
| **Escalation:** Engineering Manager | eng-manager@example.com | Critical failures |
| **GCP Admin:** Platform Team | platform@example.com | Permission issues |

---

## 🎓 Training Resources

Before going live, ensure team members review:

1. **automation/README.md** - Quick start and common use cases
2. **automation/RUNBOOK_POLYGON.md** - Complete operations manual
3. **automation/bq/scheduled_query_setup.md** - SQ configuration

**Recommended:**
- Run through a backfill scenario in staging
- Practice troubleshooting with runbook
- Test email notifications

---

## 📊 Success Metrics

After 1 week:

- [ ] Zero missed days (all dates D-1 present by 9 AM)
- [ ] Scheduled Query 100% success rate
- [ ] Team can independently run healthcheck
- [ ] Team can independently run backfill if needed
- [ ] On-call has used runbook at least once

After 1 month:

- [ ] Automation saved >= 5 hours of manual work
- [ ] Zero data quality incidents
- [ ] Documentation is up-to-date
- [ ] Costs are within 10% of estimate

---

## ⚠️ Important Notes

1. **DRY_RUN by default:** All scripts default to safe mode. Set `DRY_RUN=false` in `.env` ONLY after testing.

2. **Permissions:** Scripts require:
   - `bigquery.dataViewer` (to read tables)
   - `bigquery.jobUser` (to execute queries)
   - `storage.objectViewer` (to list GCS)
   - DO NOT grant `dataEditor` or `admin` roles

3. **Timezone:** Pipeline uses `America/Chicago` (Central Time). Adjust if needed.

4. **Cost Control:** Scripts filter by date to minimize BigQuery scans. Full table scans are avoided.

5. **Idempotency:** All operations are safe to retry. Running twice produces same result as running once.

---

## ✅ Final Checklist

Before marking deployment as complete:

- [ ] automation/ scripts deployed to production server
- [ ] config/.env configured with production values
- [ ] Service account authenticated
- [ ] Healthcheck tested successfully
- [ ] Scheduled Query created and tested
- [ ] Email notifications configured
- [ ] Team trained on runbook
- [ ] Monitoring setup (cron or Cloud Scheduler)
- [ ] Documentation shared with team
- [ ] On-call rotation updated

---

## 🎉 Deployment Complete!

Once all steps are done:

1. Mark this PR as deployed
2. Close any related issues
3. Celebrate! 🎊

**Questions?**
- Check: `automation/RUNBOOK_POLYGON.md`
- Contact: Data Engineering Team

---

**Deployment Owner:** [Your Name]
**Deployment Date:** [Date]
**Reviewed By:** [Reviewer Names]

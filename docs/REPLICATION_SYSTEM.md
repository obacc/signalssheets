# Trinity Signals Replication System

**Last Updated:** 2024-12-06
**Status:** Ready for Deployment

---

## Overview

This system replicates Trinity signals from BigQuery to Cloudflare KV and GitHub daily at 3:05 AM EST. It enables fast, globally-distributed access to signals for the Indicium Signals application.

## Architecture

```
                        +-------------------+
                        |    BigQuery       |
                        | trinity_signals   |
                        |     _daily        |
                        +--------+----------+
                                 |
                                 | Query @ 3:05 AM EST
                                 v
                        +-------------------+
                        |  Cloud Function   |
                        | trinity-replicator|
                        |   (Python 3.11)   |
                        +--------+----------+
                                 |
                +----------------+----------------+
                |                                 |
                v                                 v
    +-------------------+            +-------------------+
    |   Cloudflare KV   |            |   GitHub Repo     |
    | trinity-signals   |            | indicium-signals  |
    |   -production     |            |     -data         |
    +--------+----------+            +--------+----------+
             |                                |
             v                                v
    +-------------------+            +-------------------+
    |  Cloudflare Edge  |            |   GitHub Pages    |
    |   (Cache/CDN)     |            |    (Backup CDN)   |
    +-------------------+            +-------------------+
```

## Components

### 1. Cloud Function: `trinity-replicator`

| Property | Value |
|----------|-------|
| Runtime | Python 3.11 |
| Memory | 512 MB |
| Timeout | 300 seconds |
| Trigger | HTTP (Cloud Scheduler) |
| Region | us-central1 |
| Service Account | claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com |

**Source:** `/cloud_functions/trinity_replicator/`

### 2. Cloudflare KV Namespace

| Property | Value |
|----------|-------|
| Binding | SIGNALS_KV |
| ID | TBD (created during setup) |

**Key Pattern:**
- `signals_YYYY-MM-DD_free` - TOP 10 signals
- `signals_YYYY-MM-DD_basic` - TOP 30 signals
- `signals_YYYY-MM-DD_pro` - TOP 50 signals
- `signals_YYYY-MM-DD_premium` - All signals
- `signals_latest_[plan]` - Latest signals (always current)

### 3. GitHub Repository

| Property | Value |
|----------|-------|
| Repo | obacc/indicium-signals-data |
| Branch | main |
| GitHub Pages | https://obacc.github.io/indicium-signals-data/ |

**File Structure:**
```
data/
  2024-12-06/
    free.json
    basic.json
    pro.json
    premium.json
  2024-12-07/
    ...
```

### 4. Cloud Scheduler

| Property | Value |
|----------|-------|
| Job Name | trinity-replicator-daily |
| Schedule | `5 8 * * *` (8:05 AM UTC) |
| Time Zone | UTC |
| Target | Cloud Function HTTP URL |

**Note:** 8:05 AM UTC = 3:05 AM EST = 4:05 AM EDT

---

## Plan Limits

| Plan | Signals | Use Case |
|------|---------|----------|
| Free | TOP 10 | Public demo |
| Basic | TOP 30 | Entry-level users |
| Pro | TOP 50 | Active traders |
| Premium | ALL (~1500) | Institutional |

---

## Deployment Guide

### Prerequisites

1. **GCP CLI:** Install gcloud CLI
   ```bash
   # Install: https://cloud.google.com/sdk/docs/install
   gcloud auth login
   gcloud config set project sunny-advantage-471523-b3
   ```

2. **Wrangler CLI:** Install Cloudflare wrangler
   ```bash
   npm install -g wrangler
   export CLOUDFLARE_API_TOKEN="your_token_here"
   wrangler whoami
   ```

3. **Configure Secrets:** Copy and edit environment file
   ```bash
   cd cloud_functions/trinity_replicator
   cp .env.yaml.template .env.yaml
   # Edit .env.yaml with actual values
   ```

### Step 1: Create Cloudflare KV Namespace

```bash
cd cloud_functions/trinity_replicator
./setup_cloudflare_kv.sh
```

This will:
- Create the `SIGNALS_KV` namespace
- Output the namespace ID
- Optionally update config files

**Manual alternative:**
```bash
wrangler kv:namespace create "SIGNALS_KV"
```

### Step 2: Update Configuration

After creating KV namespace, update:

1. **wrangler.toml** - Replace `PENDING_CREATION` with actual ID
2. **.env.yaml** - Set `CLOUDFLARE_KV_NAMESPACE_ID`

### Step 3: Deploy Cloud Function

```bash
cd cloud_functions/trinity_replicator
./deploy.sh
```

This will:
- Deploy function to GCP
- Output the function URL

**Manual alternative:**
```bash
gcloud functions deploy trinity-replicator \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=trinity_replicator \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=300s \
  --env-vars-file=.env.yaml \
  --service-account=claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com
```

### Step 4: Test Function

```bash
# Get function URL
FUNCTION_URL=$(gcloud functions describe trinity-replicator \
  --gen2 --region=us-central1 --format='value(serviceConfig.uri)')

# Execute test
curl -X POST $FUNCTION_URL

# View logs
gcloud functions logs read trinity-replicator --region=us-central1 --limit=50
```

### Step 5: Setup Cloud Scheduler

```bash
./setup_scheduler.sh
```

**Manual alternative:**
```bash
gcloud scheduler jobs create http trinity-replicator-daily \
  --location=us-central1 \
  --schedule="5 8 * * *" \
  --time-zone="UTC" \
  --uri="$FUNCTION_URL" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{}' \
  --description="Daily Trinity signals replication" \
  --attempt-deadline=360s
```

### Step 6: Enable GitHub Pages

1. Go to https://github.com/obacc/indicium-signals-data/settings/pages
2. Source: Deploy from branch
3. Branch: main, folder: / (root)
4. Save and wait ~1 minute

---

## Verification

### Verify Cloudflare KV
```bash
# List keys
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Get specific key
wrangler kv:key get "signals_latest_free" --namespace-id=YOUR_NAMESPACE_ID
```

### Verify GitHub
```bash
# Clone and check
git clone https://github.com/obacc/indicium-signals-data.git /tmp/test
ls -la /tmp/test/data/$(date +%Y-%m-%d)/
```

### Verify GitHub Pages
```bash
curl https://obacc.github.io/indicium-signals-data/data/$(date +%Y-%m-%d)/free.json
```

---

## Operations

### Manual Execution
```bash
# Run scheduler job now
gcloud scheduler jobs run trinity-replicator-daily --location=us-central1

# Or call function directly with custom date
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-12-05"}'
```

### View Logs
```bash
gcloud functions logs read trinity-replicator \
  --region=us-central1 \
  --limit=50 \
  --start-time="2024-12-06T00:00:00Z"
```

### Update Function
```bash
cd cloud_functions/trinity_replicator
./deploy.sh
```

---

## Troubleshooting

### No signals found
1. Check if `trinity_signals_daily` has data for today
2. Verify BigQuery permissions for service account
3. Check query date format (YYYY-MM-DD)

### Cloudflare KV fails
1. Verify `CLOUDFLARE_API_TOKEN` is valid
2. Check token has KV write permissions
3. Verify `CLOUDFLARE_KV_NAMESPACE_ID` is correct

### GitHub commit fails
1. Check `GITHUB_TOKEN` has repo write permissions
2. Verify repo exists: `obacc/indicium-signals-data`
3. Check branch exists (main)

### Scheduler not running
1. Check job status: `gcloud scheduler jobs describe trinity-replicator-daily`
2. Verify function URL is accessible
3. Check job schedule and timezone

---

## Security Notes

- **API Tokens:** Stored in `.env.yaml` (not committed to repo)
- **Service Account:** Uses dedicated `claudecode@` account
- **GitHub PAT:** Limited to repo scope only
- **Cloudflare Token:** Limited to KV and Workers

---

## Endpoints

### Cloud Function
```
POST https://[REGION]-[PROJECT].cloudfunctions.net/trinity-replicator
Content-Type: application/json

# Optional body to override date:
{"date": "2024-12-05"}
```

### Cloudflare KV Access (via Worker)
```javascript
// In Cloudflare Worker
const signals = await env.SIGNALS_KV.get("signals_latest_free", "json");
```

### GitHub Pages CDN
```
GET https://obacc.github.io/indicium-signals-data/data/2024-12-06/free.json
```

---

## Cost Estimation (Free Tier)

| Service | Free Limit | Expected Usage |
|---------|------------|----------------|
| Cloud Functions | 2M invocations/mo | ~30/mo |
| Cloud Scheduler | 3 jobs free | 1 job |
| Cloudflare KV reads | 100K/day | ~1K/day |
| Cloudflare KV writes | 1K/day | ~8/day |
| GitHub Pages | Unlimited | Minimal |

**Total Estimated Cost:** $0/month (within free tiers)

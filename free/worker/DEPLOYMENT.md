# Deployment Guide - Indicium Free API Worker

## Prerequisites

1. **Cloudflare Account** - Sign up at https://dash.cloudflare.com
2. **Wrangler CLI** - Install globally: `npm install -g wrangler`
3. **Node.js 18+** - Check with `node --version`
4. **BigQuery Credentials** - Service account JSON from `/free/scripts/bigquery-credentials.json`

---

## Step 1: Authenticate Wrangler

```bash
wrangler login
```

This will open a browser to authenticate with your Cloudflare account.

---

## Step 2: Create KV Namespaces

```bash
# Navigate to worker directory
cd /home/user/signalssheets/free/worker

# Create CACHE namespace
wrangler kv:namespace create "CACHE"
# Output: Add to wrangler.toml: { binding = "CACHE", id = "xxxxx" }

# Create API_TOKENS namespace
wrangler kv:namespace create "API_TOKENS"
# Output: Add to wrangler.toml: { binding = "API_TOKENS", id = "yyyyy" }

# Create RATE_LIMIT namespace
wrangler kv:namespace create "RATE_LIMIT"
# Output: Add to wrangler.toml: { binding = "RATE_LIMIT", id = "zzzzz" }
```

**Important:** Copy the IDs and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "xxxxx"  # Replace with actual ID

[[kv_namespaces]]
binding = "API_TOKENS"
id = "yyyyy"  # Replace with actual ID

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "zzzzz"  # Replace with actual ID
```

---

## Step 3: Populate API_TOKENS with Demo Token

```bash
# Replace <TOKENS_NAMESPACE_ID> with the actual ID from step 2
wrangler kv:key put --namespace-id=<TOKENS_NAMESPACE_ID> \
  "demo-free-2025" \
  '{"token":"demo-free-2025","plan":"free","email":"demo@indicium.com","created_at":"2025-11-03T00:00:00Z","rate_limit":{"requests_per_minute":30,"requests_per_day":1000},"is_active":true,"notes":"Demo token for public testing"}'

# Verify
wrangler kv:key get --namespace-id=<TOKENS_NAMESPACE_ID> "demo-free-2025"
```

---

## Step 4: Upload BigQuery Credentials as Secret

```bash
# This will prompt you to paste the credentials
wrangler secret put BIGQUERY_CREDENTIALS

# When prompted, paste the entire contents of:
# /home/user/signalssheets/free/scripts/bigquery-credentials.json
# (It should be one line of minified JSON)
```

**Verify secret exists:**
```bash
wrangler secret list
# Should show: BIGQUERY_CREDENTIALS
```

---

## Step 5: Initialize Cache with Mock Data

```bash
# Replace <CACHE_NAMESPACE_ID> with the actual ID from step 2
node ../scripts/init-cache.js <CACHE_NAMESPACE_ID>
```

**Or manually:**
```bash
wrangler kv:key put --namespace-id=<CACHE_NAMESPACE_ID> \
  "signals:latest" \
  @mock-cache.json
```

Where `mock-cache.json` contains the mock data from `src/lib/mockData.js` (exported as JSON file).

---

## Step 6: Deploy Worker

```bash
# Install dependencies
npm install

# Deploy to Cloudflare
wrangler deploy

# Output should show:
# ✨ Success! Deployed indicium-free-api
# 🌍 https://indicium-free-api.<subdomain>.workers.dev
```

**Test the deployed Worker:**
```bash
curl "https://indicium-free-api.<subdomain>.workers.dev/v1/signals?token=demo-free-2025&format=json"
```

---

## Step 7: Configure Custom Domain (Optional)

### Option A: Via Dashboard

1. Go to **Workers & Pages** > **indicium-free-api**
2. Click **Settings** > **Triggers** > **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `free.api.indicium.com` (or your domain)
5. Cloudflare will automatically create DNS record

### Option B: Via CLI

```bash
wrangler route add free.api.indicium.com/* indicium-free-api
```

**Test:**
```bash
curl "https://free.api.indicium.com/v1/signals?token=demo-free-2025"
```

---

## Step 8: Verify Cron Trigger

### Check Cron Schedule in Dashboard

1. Go to **Workers & Pages** > **indicium-free-api**
2. Click **Settings** > **Triggers** > **Cron Triggers**
3. Should show: `*/10 * * * *` (every 10 minutes)

### Test Cron Manually

**Trigger scheduled event:**
```bash
wrangler tail --format=pretty &
# In another terminal:
curl -X POST "https://indicium-free-api.<subdomain>.workers.dev/__scheduled" \
  -H "Content-Type: application/json" \
  -d '{"cron":"*/10 * * * *"}'
```

**Watch logs:**
```bash
wrangler tail --format=pretty
# You should see:
# [SCHEDULED] Cache refresh started: ...
# [SCHEDULED] Querying BigQuery...
# [SCHEDULED] Cache refresh completed: ...
```

---

## Step 9: Update wrangler.toml with Account ID

Get your account ID:
```bash
wrangler whoami
```

Update `wrangler.toml`:
```toml
account_id = "your_account_id_here"
```

Re-deploy:
```bash
wrangler deploy
```

---

## Troubleshooting

### Issue: "No route found for Worker"

**Solution:** Add route in wrangler.toml:
```toml
routes = [
  { pattern = "free.api.indicium.com/*", zone_name = "indicium.com" }
]
```

### Issue: "CACHE_EMPTY" error

**Solution:** Manually trigger cron or populate cache:
```bash
# Trigger cron
curl -X POST "https://indicium-free-api.<subdomain>.workers.dev/__scheduled"

# Or populate manually
wrangler kv:key put --namespace-id=<CACHE_ID> "signals:latest" @mock-cache.json
```

### Issue: BigQuery authentication fails

**Solution:** Verify secret is uploaded correctly:
```bash
wrangler secret list
# Should show BIGQUERY_CREDENTIALS

# If missing, re-upload:
wrangler secret put BIGQUERY_CREDENTIALS
```

### Issue: Cron not executing

**Solution:**
1. Verify `[triggers]` is in wrangler.toml
2. Re-deploy: `wrangler deploy`
3. Check Dashboard > Workers > Triggers > Cron Triggers

---

## Monitoring

### View Logs in Real-time

```bash
wrangler tail --format=pretty
```

### View Analytics

Dashboard > Workers & Pages > indicium-free-api > Analytics

Key metrics:
- Requests per second
- Success rate (200 status codes)
- Error rate (4xx, 5xx)
- CPU time
- KV operations

---

## Cost Monitoring

### Free Tier Limits

| Resource | Free Tier Limit | Current Usage |
|----------|-----------------|---------------|
| Requests | 100,000/day | Check Analytics |
| KV Reads | 100,000/day | Check Analytics |
| KV Writes | 1,000/day | ~144 (cron only) |
| CPU Time | 10ms/request | ~5ms average |

**Upgrade to Paid Plan if:**
- Requests > 90k/day
- CPU time > 8ms consistently
- Need more KV operations

**Cost:** $5/month + $0.50 per million requests

---

## Next Steps

- [ ] Test with Excel Power Query
- [ ] Test with Google Sheets
- [ ] Test with web app
- [ ] Add more API tokens for users
- [ ] Monitor BigQuery costs
- [ ] Set up alerting for Worker errors
- [ ] Implement JWT signing for BigQuery (currently using mock data)

---

**Deployment completed!** 🎉

Your API is now live at:
- **Worker URL:** `https://indicium-free-api.<subdomain>.workers.dev`
- **Custom Domain:** `https://free.api.indicium.com` (if configured)

**Test it:**
```bash
curl "https://free.api.indicium.com/v1/signals?token=demo-free-2025&format=json" | jq
```

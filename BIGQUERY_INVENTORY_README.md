# 📊 BigQuery Inventory - Complete Table Listing

## 🎯 Purpose

This directory contains scripts to generate a **complete inventory** of all BigQuery tables across all datasets in the GCP project `sunny-advantage-471523-b3`.

## 📁 Files

| File | Description |
|------|-------------|
| `bigquery_inventory.csv` | **Output CSV** with all tables metadata (currently placeholder) |
| `list_all_bigquery_tables.py` | **Main script** - Connects to BigQuery and extracts full inventory |
| `create_bigquery_inventory_csv.py` | **Placeholder generator** - Creates instructional CSV when credentials not available |
| `BIGQUERY_INVENTORY_README.md` | This file - Instructions and documentation |

## 📋 CSV Output Format

The generated CSV contains the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| `dataset_name` | BigQuery dataset name | `market_data` |
| `table_name` | Table or view name | `Prices` |
| `table_type` | Type of object | `TABLE`, `VIEW`, `MATERIALIZED_VIEW` |
| `num_rows` | Number of rows in table | `1250000` |
| `size_mb` | Table size in megabytes | `542.3` |
| `created_date` | When table was created | `2024-01-15 10:30:00` |
| `modified_date` | Last modification date | `2024-11-15 08:45:00` |
| `field_names` | Comma-separated list of all column names | `ticker, date, open, high, low, close, volume` |
| `field_count` | Total number of columns | `7` |

## 🚀 How to Use

### Option 1: Quick Placeholder (No Credentials)

```bash
# Generates instructional CSV
python3 create_bigquery_inventory_csv.py
```

This creates `bigquery_inventory.csv` with instructions on how to get real data.

### Option 2: Full Inventory (Requires GCP Credentials)

#### Step 1: Get Service Account Credentials

1. Go to [GCP Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Find: `claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com`
4. Click **Keys** → **Add Key** → **Create new key** → **JSON**
5. Download the JSON file to a secure location

#### Step 2: Set Environment Variable

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/downloaded-key.json"
```

#### Step 3: Run Full Inventory Script

```bash
python3 list_all_bigquery_tables.py
```

**Output:**
```
╔══════════════════════════════════════════════════════════════════════════════╗
║              BIGQUERY COMPLETE INVENTORY SCRIPT                               ║
║              Project: sunny-advantage-471523-b3                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

✅ Credentials found: /path/to/key.json
🔧 Initializing BigQuery client for project: sunny-advantage-471523-b3
✅ BigQuery client initialized

📋 Listing all datasets in project sunny-advantage-471523-b3...
✅ Found 2 datasets:
   - market_data
   - sec_fundamentals

================================================================================
📊 Processing dataset: market_data
================================================================================
   Found 5 tables/views
   ✅ Prices                                        |    1,250,000 rows |  15 fields
   ✅ stg_prices_polygon_raw                        |    2,500,000 rows |  20 fields
   ...

================================================================================
📊 Processing dataset: sec_fundamentals
================================================================================
   Found 4 tables/views
   ✅ submissions                                    |      50,000 rows |  36 fields
   ✅ numbers                                        |   5,000,000 rows |  12 fields
   ...

✅ CSV file created: bigquery_inventory.csv

================================================================================
✅ SUCCESS!
================================================================================
📊 Total datasets processed: 2
📊 Total tables/views found: 9
📄 Output file: bigquery_inventory.csv
📏 CSV rows: 9
```

## 📊 Expected Datasets in Project

Based on project documentation:

### 1. `market_data` (Polygon Pipeline)
**Status:** ✅ Confirmed exists

**Expected Tables:**
- `stg_prices_polygon_raw` - Staging table for raw Polygon data
- `Prices` - Final prices table (OHLCV data)
- Stored procedures for data merge

**Source:** Polygon.io API
**Pipeline:** Automated (Cloud Functions + Scheduled Queries)

### 2. `sec_fundamentals` (SEC Financial Data)
**Status:** ⚠️ Unknown (requires verification)

**Expected Tables:**
- `submissions` - Company submission metadata
- `numbers` - Financial statement numbers
- `tags` - XBRL tag definitions
- `ingest_quarter_registry` - Audit table for quarter loads
- Staging tables: `staging_submissions_raw`, `staging_numbers_raw`, `staging_tags_raw`

**Source:** SEC.gov Financial Statement Data Sets
**Pipeline:** ❌ Not configured (see SEC investigation report)

## 🔍 Troubleshooting

### Error: "Failed to initialize BigQuery client"

**Cause:** Missing or invalid credentials

**Solution:**
```bash
# Check if environment variable is set
echo $GOOGLE_APPLICATION_CREDENTIALS

# Verify file exists
ls -l $GOOGLE_APPLICATION_CREDENTIALS

# Check file permissions
chmod 600 $GOOGLE_APPLICATION_CREDENTIALS
```

### Error: "Permission denied"

**Cause:** Service account lacks necessary permissions

**Required Permissions:**
- `roles/bigquery.dataViewer` (read tables)
- `roles/bigquery.jobUser` (execute queries)
- `roles/bigquery.metadataViewer` (read metadata)

**Check Permissions:**
```bash
gcloud projects get-iam-policy sunny-advantage-471523-b3 \
  --flatten="bindings[].members" \
  --filter="bindings.members:claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com"
```

### CSV is Empty or Has Placeholder Data

**Cause:** Script ran without valid credentials

**Solution:** Follow steps in "Option 2: Full Inventory" above

## 💡 Use Cases

### Use Case 1: Verify All Tables Exist

```bash
# Generate inventory
python3 list_all_bigquery_tables.py

# Check for specific table
grep "submissions" bigquery_inventory.csv
```

### Use Case 2: Audit Row Counts

```bash
# Generate inventory
python3 list_all_bigquery_tables.py

# Sort by row count (largest first)
sort -t',' -k4 -rn bigquery_inventory.csv | head -10
```

### Use Case 3: Find Tables by Field Name

```bash
# Generate inventory
python3 list_all_bigquery_tables.py

# Find tables containing "ticker" field
grep -i "ticker" bigquery_inventory.csv
```

### Use Case 4: Calculate Total Storage

```bash
# Generate inventory
python3 list_all_bigquery_tables.py

# Sum all size_mb values (column 5)
awk -F',' 'NR>1 {sum+=$5} END {print "Total storage: " sum " MB"}' bigquery_inventory.csv
```

## 📈 Expected Output Example

```csv
dataset_name,table_name,table_type,num_rows,size_mb,created_date,modified_date,field_names,field_count
market_data,Prices,TABLE,1250000,542.3,2024-01-15 10:30:00,2024-11-15 08:45:00,"ticker, date, open, high, low, close, volume, adjusted_close, split_factor",9
market_data,stg_prices_polygon_raw,TABLE,2500000,1024.5,2024-01-15 10:25:00,2024-11-15 08:50:00,"_file, _load_ts, ticker, date, open, high, low, close, volume, vwap, transactions",11
sec_fundamentals,submissions,TABLE,50000,125.8,2024-02-01 14:20:00,2024-02-01 14:45:00,"adsh, cik, name, sic, countryba, stprba, cityba, zipba, bas1, bas2, period, fy, fp, form, filed, accepted, prevrpt, detail, au, afs, wksi, fye, ein, former, changed, instance, nciks, aciks",28
sec_fundamentals,numbers,TABLE,5000000,2048.7,2024-02-01 14:30:00,2024-02-01 15:00:00,"adsh, tag, version, ddate, qtrs, uom, value, footnote",8
```

## 🔗 Related Documentation

- **SEC Investigation Report:** `SEC_QUARTERS_INVESTIGATION_REPORT.md`
- **Polygon Pipeline Audit:** `auditoria/AUDITORIA_POLYGON.md`
- **SEC Diagnostic Script:** `investigate_sec_quarters.py`

## ⚙️ Technical Details

### Dependencies

```bash
pip3 install google-cloud-bigquery google-cloud-storage
```

### Python Version

- **Minimum:** Python 3.7+
- **Recommended:** Python 3.11+

### BigQuery API Quotas

- **List operations:** 100,000 requests/day (free)
- **Metadata reads:** Unlimited (free)
- **This script:** ~2-5 requests per dataset (well within limits)

### Performance

| Datasets | Tables | Estimated Time |
|----------|--------|----------------|
| 1-5 | 1-10 | < 10 seconds |
| 5-10 | 10-50 | < 30 seconds |
| 10+ | 50+ | < 1 minute |

## 🔒 Security Notes

### ⚠️ Important

- **NEVER commit** service account JSON keys to Git
- **NEVER share** credentials via email/Slack
- **ALWAYS store** keys in secure location (KMS, Vault, etc.)
- **ROTATE keys** every 90 days

### .gitignore Entries

Ensure these patterns are in `.gitignore`:

```
*.json
!package.json
!package-lock.json
!tsconfig.json
*credentials*
*key.json
*service-account*
```

## 📊 Current Status

| File | Status | Last Updated |
|------|--------|--------------|
| `bigquery_inventory.csv` | ⚠️ Placeholder | 2025-11-16 |
| `list_all_bigquery_tables.py` | ✅ Ready | 2025-11-16 |
| `create_bigquery_inventory_csv.py` | ✅ Ready | 2025-11-16 |

**To get real data:** Follow "Option 2: Full Inventory" instructions above.

---

**Created:** 2025-11-16
**Author:** Claude Code
**Project:** SignalsSheets (sunny-advantage-471523-b3)

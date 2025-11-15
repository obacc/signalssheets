# Polygon.io Daily Data Pipeline - Complete Automation Package

**End-to-end automation for Polygon.io market data ingestion to BigQuery**

---

## Overview

This package provides complete automation for downloading daily market data from Polygon.io API and loading it into BigQuery for the SignalSheets application.

### What's Included

```
polygon-pipeline/
├── cloud-function/          # Cloud Function source code
│   ├── main.py             # Function entry point
│   ├── procedimiento_carga_bucket.py  # Core download logic
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment template
│
├── bigquery-sql/           # Database objects
│   ├── 01_create_external_table.sql
│   ├── 02_create_staging_table.sql
│   ├── 03_create_control_table.sql
│   ├── 04_create_sp_load_raw.sql
│   ├── 05_create_sp_merge_prices.sql
│   ├── 06_create_missing_days_view.sql
│   └── validation_queries.sql
│
├── deployment-scripts/     # Automated deployment
│   ├── 01_setup_secrets.sh
│   ├── 02_deploy_cloud_function.sh
│   ├── 03_setup_scheduler.sh
│   ├── 04_deploy_bigquery.sh
│   ├── 05_test_pipeline.sh
│   └── backfill_dates.sh
│
├── docs/                   # Documentation
│   └── DOCUMENTO_COMPLETO_AUTOMATIZACION_RAW_PRICES.md
│
└── README_POLYGON_PIPELINE.md  # Operational guide
```

---

## Quick Start

### Prerequisites

- GCP Project: `sunny-advantage-471523-b3`
- Permissions: Editor or Owner role
- Tools installed: `gcloud`, `bq`, `gsutil`
- Polygon.io API key

### Deployment (30 minutes)

```bash
cd polygon-pipeline/deployment-scripts

# 1. Setup Secret Manager (1 min)
./01_setup_secrets.sh

# 2. Deploy Cloud Function (3 min)
./02_deploy_cloud_function.sh

# 3. Setup Cloud Scheduler (1 min)
./03_setup_scheduler.sh

# 4. Deploy BigQuery objects (2 min)
./04_deploy_bigquery.sh

# 5. Test end-to-end (5 min)
./05_test_pipeline.sh 2025-11-14
```

### Verify Deployment

```bash
# Check that all components are running
gcloud functions describe polygon-daily-loader --region=us-central1 --gen2
gcloud scheduler jobs describe polygon-daily-download --location=us-central1
bq ls sunny-advantage-471523-b3:market_data | grep polygon
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Polygon.io API                                              │
│  (Market data source - ~11K tickers daily)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloud Function: polygon-daily-loader                        │
│  Schedule: Mon-Fri 18:00 EST (after market close)           │
│  Runtime: Python 3.11, 512MB, 9min timeout                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GCS: ss-bucket-polygon-incremental/polygon/daily/          │
│  Format: Parquet (Snappy compressed)                        │
│  Naming: polygon_YYYY-MM-DD.parquet                         │
│  Size: ~10-15 MB/day                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  BigQuery: ext_polygon_daily_parquet                        │
│  Type: External table (no storage cost)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Stored Procedure: sp_load_polygon_raw()                    │
│  Schedule: Daily 19:00 EST (1hr after download)             │
│  Action: Load external → staging (idempotent)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  BigQuery: stg_prices_polygon_raw                           │
│  Partitioned by: trading_day                                │
│  Clustered by: ticker                                       │
│  Retention: 30 days                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Stored Procedure: sp_merge_polygon_to_prices()             │
│  Schedule: Same as load (19:00 EST)                         │
│  Action: MERGE staging → Prices (idempotent)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  BigQuery: Prices (final consolidated table)                │
│  Partitioned by: trading_day                                │
│  Clustered by: ticker, source                               │
│  Retention: Unlimited (historical data)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `POLYGON_API_KEY` | From Secret Manager | Polygon.io API key |
| `GCS_BUCKET_NAME` | `ss-bucket-polygon-incremental` | Target bucket |
| `GCS_PROJECT_ID` | `sunny-advantage-471523-b3` | GCP project |

### Schedule

- **Cloud Scheduler**: Mon-Fri 18:00 EST (after market close)
- **Scheduled Query**: Daily 19:00 EST (1 hour after download)

### Data Quality Thresholds

| Metric | Expected | Action if Failed |
|--------|----------|------------------|
| Tickers/day | 11,000 | Alert + Investigate |
| NULL prices | 0 | Critical error |
| Duplicates | 0 | Clean + Re-process |

---

## Daily Operations

See [README_POLYGON_PIPELINE.md](README_POLYGON_PIPELINE.md) for:
- Daily monitoring checklist (5 minutes)
- Common operations
- Troubleshooting guide
- Emergency procedures

### Quick Health Check

```bash
# Check last 3 days
bq query --use_legacy_sql=false "
SELECT
  trading_day,
  COUNT(*) as records,
  COUNT(DISTINCT ticker) as tickers
FROM \`sunny-advantage-471523-b3.market_data.Prices\`
WHERE source = 'polygon'
  AND trading_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY)
GROUP BY trading_day
ORDER BY trading_day DESC
"
```

---

## Cost Estimate

| Component | Monthly Cost |
|-----------|--------------|
| GCS Storage (900 GB) | $18 |
| BigQuery Storage | $106 |
| BigQuery Compute | $12 |
| Cloud Function | $0.10 |
| Cloud Scheduler | $0.30 |
| **Total** | **~$136/month** |

---

## Documentation

- **[Comprehensive Documentation](docs/DOCUMENTO_COMPLETO_AUTOMATIZACION_RAW_PRICES.md)**: Architecture, design decisions, recovery procedures
- **[Operational Guide](README_POLYGON_PIPELINE.md)**: Day-to-day operations, troubleshooting
- **Validation Queries**: [bigquery-sql/validation_queries.sql](bigquery-sql/validation_queries.sql)

---

## Support & Maintenance

### Regular Tasks

- **Daily**: Run health check (5 min)
- **Weekly**: Review validation queries
- **Monthly**: Check missing days report

### Escalation

1. Check operational guide
2. Review main documentation
3. Check GCP logs: `gcloud functions logs read polygon-daily-loader --region=us-central1`
4. Run validation queries

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-15 | Initial release |

---

## License

Proprietary - SignalSheets Project

---

**Ready to deploy? Start with `deployment-scripts/01_setup_secrets.sh`**

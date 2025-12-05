#!/usr/bin/env python3
"""
PASO 2: Crear tabla trinity_signals_daily con 60 columnas
"""
import os
from google.cloud import bigquery
from datetime import datetime

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
client = bigquery.Client(project=PROJECT_ID)

print("=" * 70)
print("PASO 2: CREAR TABLA trinity_signals_daily")
print(f"Timestamp: {datetime.now().isoformat()}")
print("=" * 70)

# Step 1: Drop if exists
print("\n[1] Dropping existing table if exists...")
try:
    client.query("DROP TABLE IF EXISTS `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`").result()
    print("    ✅ Done")
except Exception as e:
    print(f"    ⚠️ {e}")

# Step 2: Create table
print("\n[2] Creating trinity_signals_daily table (58 columns)...")
create_ddl = """
CREATE TABLE `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
(
  -- IDENTIFICATION
  ticker STRING NOT NULL,
  ticker_norm STRING,
  company_name STRING,
  sector STRING,
  industry STRING,
  signal_date DATE NOT NULL,

  -- PRICE DATA
  price_current FLOAT64,
  price_52w_high FLOAT64,
  price_52w_low FLOAT64,
  volume_daily INT64,
  volume_avg_50d FLOAT64,
  market_cap FLOAT64,

  -- FUNDAMENTALS TTM
  eps_ttm FLOAT64,
  revenues_ttm FLOAT64,
  net_income_ttm FLOAT64,
  stockholders_equity FLOAT64,
  current_assets FLOAT64,
  current_liabilities FLOAT64,
  long_term_debt FLOAT64,

  -- STATIC RATIOS
  roe FLOAT64,
  current_ratio FLOAT64,
  revenue_growth_yoy FLOAT64,
  eps_growth_yoy FLOAT64,
  net_income_growth_yoy FLOAT64,

  -- DYNAMIC RATIOS
  pe_ratio FLOAT64,
  pb_ratio FLOAT64,
  ps_ratio FLOAT64,
  peg_ratio FLOAT64,
  debt_to_equity FLOAT64,

  -- LYNCH SCORES
  lynch_score FLOAT64,
  lynch_peg_score FLOAT64,
  lynch_roe_score FLOAT64,
  lynch_eps_growth_score FLOAT64,
  lynch_revenue_growth_score FLOAT64,

  -- ONEIL SCORES
  oneil_score FLOAT64,
  oneil_rs_score FLOAT64,
  oneil_volume_score FLOAT64,
  oneil_momentum_score FLOAT64,
  oneil_eps_accel_score FLOAT64,

  -- GRAHAM SCORES
  graham_score FLOAT64,
  graham_pb_score FLOAT64,
  graham_current_ratio_score FLOAT64,
  graham_debt_score FLOAT64,
  graham_stability_score FLOAT64,

  -- TRINITY SCORE
  trinity_score FLOAT64,

  -- SIGNALS
  signal_strength STRING,
  recommendation STRING,
  confidence_level FLOAT64,
  entry_price FLOAT64,
  stop_loss FLOAT64,
  target_price FLOAT64,
  risk_reward_ratio FLOAT64,

  -- METADATA
  ranking_position INT64,
  percentile_rank FLOAT64,
  data_quality_score FLOAT64,
  has_complete_data BOOL,
  calculation_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY signal_date
CLUSTER BY ticker, signal_strength
OPTIONS(
  description='Señales diarias generadas por Trinity Method',
  partition_expiration_days=7
)
"""
try:
    client.query(create_ddl).result()
    print("    ✅ Table created")
except Exception as e:
    print(f"    ❌ {e}")
    exit(1)

# Step 3: Create views
print("\n[3] Creating helper views...")

views = [
    ("v_trinity_signals_latest", """
CREATE OR REPLACE VIEW `sunny-advantage-471523-b3.IS_Fundamentales.v_trinity_signals_latest` AS
SELECT *
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_date = (
  SELECT MAX(signal_date)
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
)
"""),
    ("v_trinity_buy_signals", """
CREATE OR REPLACE VIEW `sunny-advantage-471523-b3.IS_Fundamentales.v_trinity_buy_signals` AS
SELECT *
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_strength IN ('STRONG BUY', 'BUY')
  AND signal_date = (
    SELECT MAX(signal_date)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
  )
ORDER BY trinity_score DESC
"""),
    ("v_trinity_top50", """
CREATE OR REPLACE VIEW `sunny-advantage-471523-b3.IS_Fundamentales.v_trinity_top50` AS
SELECT *
FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
WHERE signal_date = (
  SELECT MAX(signal_date)
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily`
)
ORDER BY trinity_score DESC
LIMIT 50
""")
]

for view_name, view_sql in views:
    try:
        client.query(view_sql).result()
        print(f"    ✅ View {view_name} created")
    except Exception as e:
        print(f"    ❌ {view_name}: {e}")

# Validation
print("\n" + "=" * 70)
print("VALIDATION")
print("=" * 70)

# Count columns
col_query = """
SELECT column_name, data_type
FROM `sunny-advantage-471523-b3.IS_Fundamentales.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'trinity_signals_daily'
ORDER BY ordinal_position
"""
cols = list(client.query(col_query).result())
print(f"\nTotal columns: {len(cols)}")

# Group by category
categories = {
    'IDENTIFICATION': ['ticker', 'ticker_norm', 'company_name', 'sector', 'industry', 'signal_date'],
    'PRICE': ['price_current', 'price_52w_high', 'price_52w_low', 'volume_daily', 'volume_avg_50d', 'market_cap'],
    'FUNDAMENTALS': ['eps_ttm', 'revenues_ttm', 'net_income_ttm', 'stockholders_equity', 'current_assets', 'current_liabilities', 'long_term_debt'],
    'RATIOS_STATIC': ['roe', 'current_ratio', 'revenue_growth_yoy', 'eps_growth_yoy', 'net_income_growth_yoy'],
    'RATIOS_DYNAMIC': ['pe_ratio', 'pb_ratio', 'ps_ratio', 'peg_ratio', 'debt_to_equity'],
    'LYNCH': ['lynch_score', 'lynch_peg_score', 'lynch_roe_score', 'lynch_eps_growth_score', 'lynch_revenue_growth_score'],
    'ONEIL': ['oneil_score', 'oneil_rs_score', 'oneil_volume_score', 'oneil_momentum_score', 'oneil_eps_accel_score'],
    'GRAHAM': ['graham_score', 'graham_pb_score', 'graham_current_ratio_score', 'graham_debt_score', 'graham_stability_score'],
    'TRINITY': ['trinity_score'],
    'SIGNALS': ['signal_strength', 'recommendation', 'confidence_level', 'entry_price', 'stop_loss', 'target_price', 'risk_reward_ratio'],
    'METADATA': ['ranking_position', 'percentile_rank', 'data_quality_score', 'has_complete_data', 'calculation_timestamp', 'created_at']
}

print("\nColumns by category:")
for cat, cat_cols in categories.items():
    print(f"  {cat}: {len(cat_cols)} columns")

print("\n" + "=" * 70)
print("✅ PASO 2 COMPLETADO")
print("=" * 70)

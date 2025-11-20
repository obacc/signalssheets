#!/usr/bin/env python3
"""
SignalsSheets Complete Audit Script
Executes all audit queries and generates comprehensive report
"""

import os
from google.cloud import bigquery
from datetime import datetime
import json

# Configure credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/gcp-credentials.json'

# Initialize BigQuery client
client = bigquery.Client(project='sunny-advantage-471523-b3')

# Results storage
results = {}

def run_query(query_name, query):
    """Execute query and store results"""
    print(f"\n{'='*80}")
    print(f"EJECUTANDO: {query_name}")
    print(f"{'='*80}")

    try:
        query_job = client.query(query)
        results_data = query_job.result()

        # Convert to list of dicts
        rows = [dict(row) for row in results_data]

        print(f"✅ Completado: {len(rows)} filas")

        # Store results
        results[query_name] = {
            'success': True,
            'row_count': len(rows),
            'data': rows
        }

        # Print first few rows
        if rows:
            print(f"\nPrimeras filas:")
            for i, row in enumerate(rows[:5]):
                print(f"  {i+1}. {row}")

        return rows

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results[query_name] = {
            'success': False,
            'error': str(e)
        }
        return None


# ============================================================================
# FASE A: INVENTARIO DE TABLAS
# ============================================================================

print("\n" + "="*80)
print("FASE A: INVENTARIO DE TABLAS")
print("="*80)

run_query("A1_inventario_tablas", """
SELECT
  table_catalog,
  table_schema,
  table_name,
  table_type,
  TIMESTAMP_MILLIS(creation_time) AS created_at,
  row_count
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.TABLES`
WHERE table_schema IN ('analytics', 'sec_fundamentals', 'market_data')
ORDER BY table_schema, table_name
""")


# ============================================================================
# FASE B: CALIDAD DE FUNDAMENTALS SEC
# ============================================================================

print("\n" + "="*80)
print("FASE B: CALIDAD DE FUNDAMENTALS SEC")
print("="*80)

run_query("B2_cobertura_fundamentals_historicos", """
SELECT
  COUNT(DISTINCT ticker) AS total_tickers,
  COUNT(DISTINCT CONCAT(ticker, '-', fiscal_year, '-', fiscal_period)) AS filings_unicos,
  MIN(period_end_date) AS fecha_mas_antigua,
  MAX(period_end_date) AS fecha_mas_reciente
FROM `sunny-advantage-471523-b3.analytics.v_fundamentals_quarterly_historical`
""")

run_query("B3_tickers_con_3y_data", """
SELECT
  COUNT(*) AS tickers_con_3y_data
FROM (
  SELECT ticker, COUNT(*) AS quarters
  FROM `sunny-advantage-471523-b3.analytics.v_fundamentals_quarterly_historical`
  GROUP BY ticker
  HAVING COUNT(*) >= 12
)
""")

run_query("B4_distribucion_quarters", """
SELECT
  quarters_disponibles,
  COUNT(*) AS tickers
FROM (
  SELECT ticker, COUNT(*) AS quarters_disponibles
  FROM `sunny-advantage-471523-b3.analytics.v_fundamentals_quarterly_historical`
  GROUP BY ticker
)
GROUP BY quarters_disponibles
ORDER BY quarters_disponibles DESC
""")


# ============================================================================
# FASE C: VALIDAR CÁLCULO DE eps_growth_3y_avg
# ============================================================================

print("\n" + "="*80)
print("FASE C: VALIDAR CÁLCULO DE eps_growth_3y_avg")
print("="*80)

run_query("C5_columnas_trinity_scores_base", """
SELECT column_name, data_type
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'trinity_scores_base'
ORDER BY ordinal_position
""")

run_query("C6_distribucion_eps_growth", """
SELECT
  COUNT(*) AS total,
  COUNT(eps_growth_3y_avg) AS con_growth_3y,
  AVG(eps_growth_3y_avg) AS avg_growth,
  MIN(eps_growth_3y_avg) AS min_growth,
  MAX(eps_growth_3y_avg) AS max_growth
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_base`
""")

run_query("C7_peg_absurdos", """
SELECT
  ticker,
  eps_growth_3y_avg,
  SAFE_DIVIDE(
    SAFE_DIVIDE(price, eps_diluted),
    eps_growth_3y_avg * 100
  ) AS peg_calculado
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_base`
WHERE eps_growth_3y_avg IS NOT NULL
  AND eps_growth_3y_avg BETWEEN -0.01 AND 0.01
LIMIT 20
""")


# ============================================================================
# FASE D: AUDITAR SCORING LYNCH
# ============================================================================

print("\n" + "="*80)
print("FASE D: AUDITAR SCORING LYNCH")
print("="*80)

# Query para obtener DDL de la vista
run_query("D8_ddl_trinity_scores_lynch", """
SELECT ddl
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.VIEWS`
WHERE table_name = 'trinity_scores_lynch'
""")

run_query("D9_distribucion_lynch_scores", """
SELECT
  CASE
    WHEN lynch_score IS NULL THEN 'NULL'
    WHEN lynch_score = 0 THEN 'CERO'
    WHEN lynch_score BETWEEN 1 AND 25 THEN '1-25'
    WHEN lynch_score BETWEEN 26 AND 50 THEN '26-50'
    WHEN lynch_score BETWEEN 51 AND 75 THEN '51-75'
    WHEN lynch_score BETWEEN 76 AND 100 THEN '76-100'
  END AS rango,
  COUNT(*) AS cantidad
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
GROUP BY rango
ORDER BY rango
""")


# ============================================================================
# FASE E: COBERTURA DE NOMBRES DE COMPAÑÍA
# ============================================================================

print("\n" + "="*80)
print("FASE E: COBERTURA DE NOMBRES DE COMPAÑÍA")
print("="*80)

run_query("E10_cobertura_nombres", """
SELECT
  'ref_company_dictionary' AS fuente,
  COUNT(DISTINCT ticker) AS tickers_con_nombre
FROM `sunny-advantage-471523-b3.sec_fundamentals.ref_company_dictionary`

UNION ALL

SELECT
  'ref_cik_ticker' AS fuente,
  COUNT(DISTINCT ticker) AS tickers_con_nombre
FROM `sunny-advantage-471523-b3.sec_fundamentals.ref_cik_ticker`
""")

run_query("E11_match_senales_nombres", """
WITH signals AS (
  SELECT DISTINCT ticker
  FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
  WHERE trinity_score >= 45
)
SELECT
  COUNT(*) AS total_signals,
  COUNT(dict.ticker) AS con_nombre_dict,
  COUNT(cik.ticker) AS con_nombre_cik,
  COUNT(*) - COUNT(dict.ticker) AS sin_nombre
FROM signals s
LEFT JOIN `sunny-advantage-471523-b3.sec_fundamentals.ref_company_dictionary` dict
  ON s.ticker = dict.ticker
LEFT JOIN `sunny-advantage-471523-b3.sec_fundamentals.ref_cik_ticker` cik
  ON s.ticker = cik.ticker
""")


# ============================================================================
# FASE F: VALIDAR SEÑALES FINALES
# ============================================================================

print("\n" + "="*80)
print("FASE F: VALIDAR SEÑALES FINALES Y ENDPOINTS")
print("="*80)

run_query("F12_distribucion_senales", """
SELECT
  CASE
    WHEN trinity_score >= 75 THEN 'BUY'
    WHEN trinity_score >= 50 THEN 'HOLD'
    ELSE 'SELL'
  END AS signal,
  COUNT(*) AS cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
GROUP BY signal
""")

run_query("F13_top10_buy_endpoint", """
SELECT
  ts.ticker,
  dict.name AS company_name,
  ts.sector,
  ts.trinity_score,
  ts.lynch_score,
  ts.oneil_score,
  ts.graham_score,
  ts.price AS current_price,
  ts.eps_diluted,
  ts.peg_ratio,
  CASE
    WHEN dict.name IS NULL THEN '❌ SIN NOMBRE'
    WHEN ts.sector IS NULL THEN '❌ SIN SECTOR'
    WHEN ts.lynch_score IS NULL OR ts.lynch_score = 0 THEN '❌ LYNCH=0/NULL'
    ELSE '✅ OK'
  END AS status
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical` ts
LEFT JOIN `sunny-advantage-471523-b3.sec_fundamentals.ref_company_dictionary` dict
  ON ts.ticker = dict.ticker
WHERE ts.trinity_score >= 45
ORDER BY ts.trinity_score DESC
LIMIT 10
""")


# ============================================================================
# QUERIES ADICIONALES PARA ANÁLISIS PROFUNDO
# ============================================================================

print("\n" + "="*80)
print("QUERIES ADICIONALES PARA ANÁLISIS PROFUNDO")
print("="*80)

# Analizar campos NULL en trinity_scores_base
run_query("X1_null_analysis_trinity_base", """
SELECT
  COUNT(*) AS total_records,
  COUNT(ticker) AS has_ticker,
  COUNT(price) AS has_price,
  COUNT(eps_diluted) AS has_eps,
  COUNT(eps_growth_3y_avg) AS has_eps_growth,
  COUNT(peg_ratio) AS has_peg,
  COUNT(roe) AS has_roe,
  COUNT(debt_to_equity) AS has_debt_equity,
  COUNT(pe_ratio) AS has_pe,
  COUNT(pb_ratio) AS has_pb,
  COUNT(current_ratio) AS has_current_ratio
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_base`
""")

# Analizar scores por componente
run_query("X2_score_components_stats", """
SELECT
  COUNT(*) AS total,
  COUNT(lynch_score) AS has_lynch,
  COUNT(oneil_score) AS has_oneil,
  COUNT(graham_score) AS has_graham,
  COUNT(trinity_score) AS has_trinity,
  AVG(lynch_score) AS avg_lynch,
  AVG(oneil_score) AS avg_oneil,
  AVG(graham_score) AS avg_graham,
  AVG(trinity_score) AS avg_trinity
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
""")

# Tickers con Lynch Score = 0 o NULL
run_query("X3_lynch_score_zero_null", """
SELECT
  ticker,
  price,
  eps_diluted,
  eps_growth_3y_avg,
  peg_ratio,
  roe,
  debt_to_equity,
  lynch_score
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
WHERE lynch_score IS NULL OR lynch_score = 0
LIMIT 20
""")

# Sectores disponibles
run_query("X4_sector_coverage", """
SELECT
  sector,
  COUNT(*) AS tickers,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
WHERE sector IS NOT NULL
GROUP BY sector
ORDER BY tickers DESC
""")

# Verificar data en market_data.Prices
run_query("X5_market_data_prices_check", """
SELECT
  COUNT(DISTINCT ticker) AS total_tickers,
  MIN(date) AS fecha_mas_antigua,
  MAX(date) AS fecha_mas_reciente,
  COUNT(*) AS total_records
FROM `sunny-advantage-471523-b3.market_data.Prices`
""")


# ============================================================================
# SAVE RESULTS TO JSON
# ============================================================================

print("\n" + "="*80)
print("GUARDANDO RESULTADOS")
print("="*80)

output_file = f'/home/user/signalssheets/audit_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'

with open(output_file, 'w') as f:
    json.dump(results, f, indent=2, default=str)

print(f"\n✅ Resultados guardados en: {output_file}")

print("\n" + "="*80)
print("AUDITORÍA COMPLETADA")
print("="*80)
print(f"Total queries ejecutadas: {len(results)}")
print(f"Exitosas: {sum(1 for r in results.values() if r.get('success'))}")
print(f"Fallidas: {sum(1 for r in results.values() if not r.get('success'))}")

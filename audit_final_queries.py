#!/usr/bin/env python3
"""
SignalsSheets Final Queries
Complete missing data analysis
"""

import os
from google.cloud import bigquery
from datetime import datetime
import json

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/gcp-credentials.json'
client = bigquery.Client(project='sunny-advantage-471523-b3')

results = {}

def run_query(query_name, query):
    """Execute query and store results"""
    print(f"\n{'='*80}")
    print(f"EJECUTANDO: {query_name}")
    print(f"{'='*80}")

    try:
        query_job = client.query(query)
        results_data = query_job.result()
        rows = [dict(row) for row in results_data]
        print(f"✅ Completado: {len(rows)} filas")

        results[query_name] = {'success': True, 'row_count': len(rows), 'data': rows}

        if rows:
            print(f"\nPrimeras filas:")
            for i, row in enumerate(rows[:10]):
                print(f"  {i+1}. {row}")

        return rows
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results[query_name] = {'success': False, 'error': str(e)}
        return None


# ============================================================================
# QUERIES SOBRE trinity_scores_base (tiene todos los campos)
# ============================================================================

print("\n" + "="*80)
print("ANÁLISIS COMPLETO DE trinity_scores_base")
print("="*80)

# Análisis completo de Lynch components en BASE
run_query("F1_lynch_components_base", """
SELECT
  COUNT(*) AS total,
  COUNT(peg_ratio) AS has_peg,
  COUNT(roe) AS has_roe,
  COUNT(debt_to_equity) AS has_debt_equity,
  ROUND(AVG(peg_ratio), 4) AS avg_peg,
  ROUND(AVG(roe), 4) AS avg_roe,
  ROUND(AVG(debt_to_equity), 4) AS avg_debt_equity
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_base`
""")

# Debt to Equity distribution
run_query("F2_debt_equity_distribution", """
SELECT
  CASE
    WHEN debt_to_equity IS NULL THEN 'NULL'
    WHEN debt_to_equity = 0 THEN 'CERO'
    WHEN debt_to_equity < 0.5 THEN '0-0.5 (EXCELENTE)'
    WHEN debt_to_equity < 1.0 THEN '0.5-1.0 (BUENO)'
    WHEN debt_to_equity < 2.0 THEN '1.0-2.0 (ACEPTABLE)'
    WHEN debt_to_equity >= 2.0 THEN '>2.0 (ALTO)'
  END AS rango,
  COUNT(*) AS cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_base`
GROUP BY rango
ORDER BY rango
""")

# ROE distribution
run_query("F3_roe_distribution", """
SELECT
  CASE
    WHEN roe IS NULL THEN 'NULL'
    WHEN roe < 0 THEN 'NEGATIVO'
    WHEN roe = 0 THEN 'CERO'
    WHEN roe < 0.10 THEN '0-10%'
    WHEN roe < 0.15 THEN '10-15% (BUENO)'
    WHEN roe < 0.20 THEN '15-20% (EXCELENTE)'
    WHEN roe >= 0.20 THEN '>20% (EXCEPCIONAL)'
  END AS rango,
  COUNT(*) AS cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_base`
GROUP BY rango
ORDER BY rango
""")

# Top 50 con TODOS los datos desde BASE + scores desde historical
run_query("F4_top50_complete_data", """
SELECT
  h.ticker,
  h.trinity_score,
  h.lynch_score,
  h.oneil_score,
  h.graham_score,
  b.price,
  b.peg_ratio,
  b.roe,
  b.debt_to_equity,
  b.eps_diluted,
  b.eps_growth_3y_avg,
  b.pe_ratio,
  b.pb_ratio,
  b.sector
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical` h
JOIN `sunny-advantage-471523-b3.analytics.trinity_scores_base` b
  ON h.ticker = b.ticker
  AND h.fiscal_year = b.fiscal_year
  AND h.fiscal_period = b.fiscal_period
ORDER BY h.trinity_score DESC
LIMIT 50
""")

# Tickers con Lynch=0 y sus datos completos
run_query("F5_lynch_zero_complete", """
SELECT
  h.ticker,
  h.lynch_score,
  b.peg_ratio,
  b.roe,
  b.debt_to_equity,
  b.eps_growth_3y_avg,
  b.price,
  b.eps_diluted
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical` h
JOIN `sunny-advantage-471523-b3.analytics.trinity_scores_base` b
  ON h.ticker = b.ticker
  AND h.fiscal_year = b.fiscal_year
  AND h.fiscal_period = b.fiscal_period
WHERE h.lynch_score = 0
LIMIT 50
""")

# Tickers con Lynch NULL y sus datos
run_query("F6_lynch_null_complete", """
SELECT
  h.ticker,
  h.lynch_score,
  b.peg_ratio,
  b.roe,
  b.debt_to_equity,
  b.eps_growth_3y_avg,
  b.price,
  b.eps_diluted
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical` h
JOIN `sunny-advantage-471523-b3.analytics.trinity_scores_base` b
  ON h.ticker = b.ticker
  AND h.fiscal_year = b.fiscal_year
  AND h.fiscal_period = b.fiscal_period
WHERE h.lynch_score IS NULL
LIMIT 50
""")


# ============================================================================
# ANALIZAR VISTAS INTERMEDIAS
# ============================================================================

print("\n" + "="*80)
print("ANÁLISIS DE VISTAS trinity_scores_lynch")
print("="*80)

# Ver columnas de trinity_scores_lynch
run_query("F7_columnas_lynch_view", """
SELECT column_name, data_type
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'trinity_scores_lynch'
ORDER BY ordinal_position
""")

# Sample de trinity_scores_lynch
run_query("F8_sample_lynch_view", """
SELECT *
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_lynch`
LIMIT 20
""")

# Ver columnas de trinity_scores_oneil
run_query("F9_columnas_oneil_view", """
SELECT column_name, data_type
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'trinity_scores_oneil'
ORDER BY ordinal_position
""")

# Ver columnas de trinity_scores_graham
run_query("F10_columnas_graham_view", """
SELECT column_name, data_type
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'trinity_scores_graham'
ORDER BY ordinal_position
""")


# ============================================================================
# ANALIZAR MARKET DATA
# ============================================================================

print("\n" + "="*80)
print("ANÁLISIS MARKET DATA")
print("="*80)

# Ver columnas de market_data.Prices
run_query("F11_columnas_prices", """
SELECT column_name, data_type
FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'Prices'
ORDER BY ordinal_position
""")

# Stats básicos de Prices
run_query("F12_prices_basic_stats", """
SELECT
  COUNT(DISTINCT ticker) AS total_tickers,
  COUNT(*) AS total_records
FROM `sunny-advantage-471523-b3.market_data.Prices`
""")


# ============================================================================
# ANALIZAR FUNDAMENTALS QUARTERLY
# ============================================================================

print("\n" + "="*80)
print("ANÁLISIS FUNDAMENTALS QUARTERLY")
print("="*80)

# Ya tenemos las columnas, ahora vamos por stats
run_query("F13_fundamentals_coverage", """
SELECT
  COUNT(DISTINCT ticker_norm) AS total_tickers,
  COUNT(*) AS total_filings,
  MIN(period_end_date) AS fecha_mas_antigua,
  MAX(period_end_date) AS fecha_mas_reciente
FROM `sunny-advantage-471523-b3.analytics.v_fundamentals_quarterly_historical`
""")

# Distribution de quarters por ticker
run_query("F14_quarters_por_ticker_dist", """
SELECT
  quarters_disponibles,
  COUNT(*) AS tickers,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM (
  SELECT ticker_norm, COUNT(*) AS quarters_disponibles
  FROM `sunny-advantage-471523-b3.analytics.v_fundamentals_quarterly_historical`
  GROUP BY ticker_norm
)
GROUP BY quarters_disponibles
ORDER BY quarters_disponibles DESC
""")

# Tickers con 12+ quarters
run_query("F15_tickers_con_12plus_quarters", """
SELECT
  COUNT(*) AS tickers_con_12plus_quarters
FROM (
  SELECT ticker_norm, COUNT(*) AS quarters
  FROM `sunny-advantage-471523-b3.analytics.v_fundamentals_quarterly_historical`
  GROUP BY ticker_norm
  HAVING COUNT(*) >= 12
)
""")


# ============================================================================
# ANALIZAR COMPLETITUD DE DATOS CRÍTICOS
# ============================================================================

print("\n" + "="*80)
print("COMPLETITUD DE DATOS CRÍTICOS")
print("="*80)

# Completitud de fundamentals en v_fundamentals_quarterly
run_query("F16_completitud_fundamentals", """
SELECT
  COUNT(*) AS total_records,
  COUNT(revenue) AS has_revenue,
  COUNT(net_income) AS has_net_income,
  COUNT(eps_diluted) AS has_eps,
  COUNT(total_assets) AS has_assets,
  COUNT(shareholders_equity) AS has_equity,
  COUNT(long_term_debt) AS has_debt,
  ROUND(COUNT(revenue) * 100.0 / COUNT(*), 2) AS pct_revenue,
  ROUND(COUNT(long_term_debt) * 100.0 / COUNT(*), 2) AS pct_debt
FROM `sunny-advantage-471523-b3.analytics.v_fundamentals_quarterly_historical`
""")


# ============================================================================
# CROSS-CHECK: Tickers en cada capa
# ============================================================================

print("\n" + "="*80)
print("CROSS-CHECK: TICKERS EN CADA CAPA DEL PIPELINE")
print("="*80)

run_query("F17_tickers_por_capa", """
SELECT
  'v_fundamentals_quarterly_historical' AS capa,
  COUNT(DISTINCT ticker_norm) AS tickers
FROM `sunny-advantage-471523-b3.analytics.v_fundamentals_quarterly_historical`

UNION ALL

SELECT
  'trinity_scores_base' AS capa,
  COUNT(DISTINCT ticker) AS tickers
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_base`

UNION ALL

SELECT
  'trinity_scores_historical' AS capa,
  COUNT(DISTINCT ticker) AS tickers
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`

UNION ALL

SELECT
  'market_data.Prices' AS capa,
  COUNT(DISTINCT ticker) AS tickers
FROM `sunny-advantage-471523-b3.market_data.Prices`

UNION ALL

SELECT
  'sector_map_v6r2' AS capa,
  COUNT(DISTINCT ticker_canon) AS tickers
FROM `sunny-advantage-471523-b3.analytics.sector_map_v6r2`

ORDER BY capa
""")


# ============================================================================
# ANALIZAR PROBLEMA ESPECÍFICO: PEG ABSURDOS
# ============================================================================

print("\n" + "="*80)
print("PROBLEMA ESPECÍFICO: PEG ABSURDOS")
print("="*80)

# Tickers con PEG absurdo (>100) y sus eps_growth_3y_avg
run_query("F18_peg_absurdos_detalle", """
SELECT
  ticker,
  peg_ratio,
  eps_growth_3y_avg,
  pe_ratio,
  eps_diluted,
  price,
  SAFE_DIVIDE(price, eps_diluted) AS pe_calculado,
  SAFE_DIVIDE(
    SAFE_DIVIDE(price, eps_diluted),
    eps_growth_3y_avg * 100
  ) AS peg_recalculado
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_base`
WHERE peg_ratio > 100
ORDER BY peg_ratio DESC
LIMIT 30
""")


# ============================================================================
# SAVE RESULTS
# ============================================================================

print("\n" + "="*80)
print("GUARDANDO RESULTADOS")
print("="*80)

output_file = f'/home/user/signalssheets/audit_final_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'

with open(output_file, 'w') as f:
    json.dump(results, f, indent=2, default=str)

print(f"\n✅ Resultados guardados en: {output_file}")
print(f"Total queries ejecutadas: {len(results)}")
print(f"Exitosas: {sum(1 for r in results.values() if r.get('success'))}")
print(f"Fallidas: {sum(1 for r in results.values() if not r.get('success'))}")

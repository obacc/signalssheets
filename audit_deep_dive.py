#!/usr/bin/env python3
"""
SignalsSheets Deep Dive Analysis
Investigates specific issues found in initial audit
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
# INVESTIGAR ESTRUCTURA DE VISTAS
# ============================================================================

print("\n" + "="*80)
print("INVESTIGACIÓN 1: ESTRUCTURA DE VISTAS")
print("="*80)

# Ver columnas de v_fundamentals_quarterly_historical
run_query("INV1_columnas_v_fundamentals_quarterly", """
SELECT column_name, data_type
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'v_fundamentals_quarterly_historical'
ORDER BY ordinal_position
""")

# Ver columnas de trinity_scores_historical
run_query("INV2_columnas_trinity_scores_historical", """
SELECT column_name, data_type
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'trinity_scores_historical'
ORDER BY ordinal_position
""")

# Inventario corregido (sin TIMESTAMP_MILLIS)
run_query("INV3_inventario_tablas", """
SELECT
  table_catalog,
  table_schema,
  table_name,
  table_type,
  creation_time AS created_at,
  row_count
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.TABLES`
WHERE table_schema IN ('analytics', 'sec_fundamentals', 'market_data')
ORDER BY table_schema, table_name
""")


# ============================================================================
# ANÁLISIS PROFUNDO DE LYNCH SCORE
# ============================================================================

print("\n" + "="*80)
print("INVESTIGACIÓN 2: ANÁLISIS PROFUNDO LYNCH SCORE")
print("="*80)

# Ver 50 tickers con Lynch=0 y sus datos base
run_query("INV4_lynch_zero_sample", """
SELECT
  ticker,
  lynch_score,
  peg_ratio,
  roe,
  debt_to_equity,
  price,
  eps_diluted
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
WHERE lynch_score = 0
LIMIT 50
""")

# Ver tickers con Lynch NULL
run_query("INV5_lynch_null_sample", """
SELECT
  ticker,
  lynch_score,
  peg_ratio,
  roe,
  debt_to_equity,
  price,
  eps_diluted
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
WHERE lynch_score IS NULL
LIMIT 50
""")

# Estadísticas de componentes Lynch
run_query("INV6_lynch_components_stats", """
SELECT
  COUNT(*) AS total,
  COUNT(peg_ratio) AS has_peg,
  COUNT(roe) AS has_roe,
  COUNT(debt_to_equity) AS has_debt_equity,
  ROUND(AVG(peg_ratio), 4) AS avg_peg,
  ROUND(AVG(roe), 4) AS avg_roe,
  ROUND(AVG(debt_to_equity), 4) AS avg_debt_equity,
  MIN(peg_ratio) AS min_peg,
  MAX(peg_ratio) AS max_peg
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
""")

# Distribución de debt_to_equity (campo crítico faltante)
run_query("INV7_debt_equity_distribution", """
SELECT
  CASE
    WHEN debt_to_equity IS NULL THEN 'NULL'
    WHEN debt_to_equity = 0 THEN 'CERO'
    WHEN debt_to_equity < 0.5 THEN '0-0.5'
    WHEN debt_to_equity < 1.0 THEN '0.5-1.0'
    WHEN debt_to_equity < 2.0 THEN '1.0-2.0'
    WHEN debt_to_equity >= 2.0 THEN '>2.0'
  END AS rango,
  COUNT(*) AS cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
GROUP BY rango
ORDER BY rango
""")


# ============================================================================
# ANÁLISIS DE FUNDAMENTALS HISTÓRICOS
# ============================================================================

print("\n" + "="*80)
print("INVESTIGACIÓN 3: ANÁLISIS FUNDAMENTALS HISTÓRICOS")
print("="*80)

# Primero necesito ver qué columnas tiene realmente la vista
# Luego hacer queries basadas en lo que existe

# Sample de datos de trinity_scores_base
run_query("INV8_trinity_base_sample", """
SELECT *
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_base`
LIMIT 10
""")

# Ver definición de la vista trinity_scores_base (si es view)
run_query("INV9_trinity_base_ddl", """
SELECT table_name, table_type
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.TABLES`
WHERE table_name = 'trinity_scores_base'
""")


# ============================================================================
# ANÁLISIS DE SECTORES
# ============================================================================

print("\n" + "="*80)
print("INVESTIGACIÓN 4: ANÁLISIS DE SECTORES")
print("="*80)

# Ver tabla sector_map_v6r2
run_query("INV10_sector_map_structure", """
SELECT column_name, data_type
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'sector_map_v6r2'
ORDER BY ordinal_position
""")

# Sample de sector_map_v6r2
run_query("INV11_sector_map_sample", """
SELECT *
FROM `sunny-advantage-471523-b3.analytics.sector_map_v6r2`
LIMIT 20
""")

# Tickers sin sector
run_query("INV12_tickers_sin_sector", """
SELECT
  COUNT(*) AS total_tickers,
  COUNT(sector) AS con_sector,
  COUNT(*) - COUNT(sector) AS sin_sector,
  ROUND((COUNT(*) - COUNT(sector)) * 100.0 / COUNT(*), 2) AS porcentaje_sin_sector
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
""")


# ============================================================================
# ANÁLISIS DE PEG RATIOS ABSURDOS
# ============================================================================

print("\n" + "="*80)
print("INVESTIGACIÓN 5: PEG RATIOS PROBLEMÁTICOS")
print("="*80)

# Distribución de PEG ratios
run_query("INV13_peg_distribution", """
SELECT
  CASE
    WHEN peg_ratio IS NULL THEN 'NULL'
    WHEN peg_ratio < 0 THEN 'NEGATIVO'
    WHEN peg_ratio = 0 THEN 'CERO'
    WHEN peg_ratio BETWEEN 0 AND 1 THEN '0-1 (IDEAL)'
    WHEN peg_ratio BETWEEN 1 AND 2 THEN '1-2 (OK)'
    WHEN peg_ratio BETWEEN 2 AND 5 THEN '2-5 (ALTO)'
    WHEN peg_ratio BETWEEN 5 AND 10 THEN '5-10 (MUY ALTO)'
    WHEN peg_ratio > 10 THEN '>10 (ABSURDO)'
  END AS rango,
  COUNT(*) AS cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
GROUP BY rango
ORDER BY rango
""")

# Top 20 PEG ratios más altos
run_query("INV14_top_peg_absurdos", """
SELECT
  ticker,
  peg_ratio,
  price,
  eps_diluted,
  roe,
  debt_to_equity,
  lynch_score
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
WHERE peg_ratio IS NOT NULL
ORDER BY peg_ratio DESC
LIMIT 20
""")


# ============================================================================
# COMPARACIÓN CON PRODUCCIÓN (si existe)
# ============================================================================

print("\n" + "="*80)
print("INVESTIGACIÓN 6: COMPARACIÓN CON SISTEMA ANTERIOR")
print("="*80)

# Ver si existen tablas de producción antiguas
run_query("INV15_tablas_produccion_old", """
SELECT table_name, table_type, row_count
FROM `sunny-advantage-471523-b3.analytics.INFORMATION_SCHEMA.TABLES`
WHERE table_name LIKE '%signal%'
   OR table_name LIKE '%trinity%'
   OR table_name LIKE '%fundamental%'
ORDER BY table_name
""")


# ============================================================================
# VERIFICAR MARKET DATA PRICES
# ============================================================================

print("\n" + "="*80)
print("INVESTIGACIÓN 7: MARKET DATA PRICES")
print("="*80)

run_query("INV16_market_data_prices", """
SELECT
  COUNT(DISTINCT ticker) AS total_tickers,
  MIN(date) AS fecha_mas_antigua,
  MAX(date) AS fecha_mas_reciente,
  COUNT(*) AS total_records
FROM `sunny-advantage-471523-b3.market_data.Prices`
""")

# Ver sample de últimos precios
run_query("INV17_recent_prices_sample", """
SELECT *
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE date >= '2024-11-01'
LIMIT 20
""")


# ============================================================================
# ANÁLISIS DE SEÑALES ACTUALES vs OBJETIVO
# ============================================================================

print("\n" + "="*80)
print("INVESTIGACIÓN 8: GAP ENTRE SEÑALES ACTUALES Y OBJETIVO")
print("="*80)

run_query("INV18_senales_detalladas", """
SELECT
  CASE
    WHEN trinity_score >= 75 THEN 'BUY (>=75)'
    WHEN trinity_score >= 70 THEN 'STRONG_HOLD (70-74)'
    WHEN trinity_score >= 60 THEN 'HOLD (60-69)'
    WHEN trinity_score >= 50 THEN 'WEAK_HOLD (50-59)'
    WHEN trinity_score >= 40 THEN 'WEAK_SELL (40-49)'
    ELSE 'SELL (<40)'
  END AS signal_category,
  COUNT(*) AS cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje,
  MIN(trinity_score) AS min_score,
  MAX(trinity_score) AS max_score,
  ROUND(AVG(trinity_score), 2) AS avg_score
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
GROUP BY signal_category
ORDER BY min_score DESC
""")

# Ver top 50 señales (no solo top 10)
run_query("INV19_top50_signals", """
SELECT
  ticker,
  trinity_score,
  lynch_score,
  oneil_score,
  graham_score,
  sector,
  price,
  peg_ratio,
  roe,
  debt_to_equity
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
ORDER BY trinity_score DESC
LIMIT 50
""")


# ============================================================================
# ANÁLISIS DE O'NEIL Y GRAHAM SCORES
# ============================================================================

print("\n" + "="*80)
print("INVESTIGACIÓN 9: O'NEIL Y GRAHAM SCORES")
print("="*80)

# Stats de O'Neil
run_query("INV20_oneil_stats", """
SELECT
  COUNT(*) AS total,
  COUNT(oneil_score) AS has_oneil,
  ROUND(AVG(oneil_score), 2) AS avg_oneil,
  MIN(oneil_score) AS min_oneil,
  MAX(oneil_score) AS max_oneil,
  CASE
    WHEN oneil_score IS NULL THEN 'NULL'
    WHEN oneil_score = 0 THEN 'CERO'
    WHEN oneil_score BETWEEN 1 AND 25 THEN '1-25'
    WHEN oneil_score BETWEEN 26 AND 50 THEN '26-50'
    WHEN oneil_score BETWEEN 51 AND 75 THEN '51-75'
    WHEN oneil_score BETWEEN 76 AND 100 THEN '76-100'
  END AS rango,
  COUNT(*) AS cantidad
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
GROUP BY rango
ORDER BY rango
""")

# Stats de Graham
run_query("INV21_graham_stats", """
SELECT
  COUNT(*) AS total,
  COUNT(graham_score) AS has_graham,
  ROUND(AVG(graham_score), 2) AS avg_graham,
  MIN(graham_score) AS min_graham,
  MAX(graham_score) AS max_graham,
  CASE
    WHEN graham_score IS NULL THEN 'NULL'
    WHEN graham_score = 0 THEN 'CERO'
    WHEN graham_score BETWEEN 1 AND 25 THEN '1-25'
    WHEN graham_score BETWEEN 26 AND 50 THEN '26-50'
    WHEN graham_score BETWEEN 51 AND 75 THEN '51-75'
    WHEN graham_score BETWEEN 76 AND 100 THEN '76-100'
  END AS rango,
  COUNT(*) AS cantidad
FROM `sunny-advantage-471523-b3.analytics.trinity_scores_historical`
GROUP BY rango
ORDER BY rango
""")


# ============================================================================
# SAVE RESULTS
# ============================================================================

print("\n" + "="*80)
print("GUARDANDO RESULTADOS")
print("="*80)

output_file = f'/home/user/signalssheets/audit_deepdive_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'

with open(output_file, 'w') as f:
    json.dump(results, f, indent=2, default=str)

print(f"\n✅ Resultados guardados en: {output_file}")
print(f"Total queries ejecutadas: {len(results)}")
print(f"Exitosas: {sum(1 for r in results.values() if r.get('success'))}")
print(f"Fallidas: {sum(1 for r in results.values() if not r.get('success'))}")

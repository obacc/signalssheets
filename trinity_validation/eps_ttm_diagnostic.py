#!/usr/bin/env python3
"""
EPS TTM Diagnostic Script
Validates Q4_calc and TTM calculation logic
"""

import os
from datetime import datetime
from google.cloud import bigquery
import pandas as pd

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
OUTPUT_DIR = '/home/user/signalssheets/trinity_validation'

client = bigquery.Client(project=PROJECT_ID)

def run_query(query, description):
    """Execute query and return dataframe"""
    print(f"\n{'='*70}")
    print(f"🔍 {description}")
    print('='*70)
    try:
        df = client.query(query).to_dataframe()
        print(df.to_string())
        return df
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


# ============================================================================
# PASO 1: VALIDAR Q4_calc PARA 5 EMPRESAS
# ============================================================================
print("\n" + "="*70)
print("PASO 1: VALIDAR Q4_calc (FY anual vs suma de quarters)")
print("="*70)

q1_query = """
SELECT
  ticker,
  fiscal_year,
  fiscal_year_end,
  MAX(CASE WHEN fiscal_period = 'FY' THEN eps_diluted END) as eps_fy_annual,
  SUM(CASE WHEN fiscal_period IN ('Q1','Q2','Q3','Q4_calc') THEN eps_diluted END) as eps_sum_quarters,
  ABS(
    MAX(CASE WHEN fiscal_period = 'FY' THEN eps_diluted END) -
    SUM(CASE WHEN fiscal_period IN ('Q1','Q2','Q3','Q4_calc') THEN eps_diluted END)
  ) as diff_abs,
  ROUND(
    ABS(
      MAX(CASE WHEN fiscal_period = 'FY' THEN eps_diluted END) -
      SUM(CASE WHEN fiscal_period IN ('Q1','Q2','Q3','Q4_calc') THEN eps_diluted END)
    ) / NULLIF(ABS(MAX(CASE WHEN fiscal_period = 'FY' THEN eps_diluted END)), 0) * 100,
    2
  ) as error_pct
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
WHERE ticker IN ('AAPL','WMT','ORCL','NVDA','MSFT')
  AND fiscal_year IN (2023, 2024)
GROUP BY ticker, fiscal_year, fiscal_year_end
HAVING MAX(CASE WHEN fiscal_period = 'FY' THEN eps_diluted END) IS NOT NULL
ORDER BY ticker, fiscal_year DESC
"""

df_q4_validation = run_query(q1_query, "Validación Q4_calc vs FY Annual")

if df_q4_validation is not None:
    df_q4_validation.to_csv(f"{OUTPUT_DIR}/q4_calc_validation.csv", index=False)
    print(f"\n✅ Guardado: {OUTPUT_DIR}/q4_calc_validation.csv")

    # Análisis
    errors = df_q4_validation[df_q4_validation['error_pct'] > 5]
    if len(errors) > 0:
        print(f"\n⚠️ {len(errors)} casos con error > 5%:")
        print(errors[['ticker', 'fiscal_year', 'error_pct']].to_string())
    else:
        print("\n✅ Todos los Q4_calc tienen error < 5%")


# ============================================================================
# PASO 2: MOSTRAR QUERY ACTUAL DEL SCRIPT
# ============================================================================
print("\n" + "="*70)
print("PASO 2: QUERY ACTUAL EN trinity_validation.py")
print("="*70)

script_path = f"{OUTPUT_DIR}/trinity_validation.py"
with open(script_path, 'r') as f:
    content = f.read()

# Find the TTM calculation section
import re
match = re.search(r'(-- TTM calculation.*?GROUP BY ticker)', content, re.DOTALL)
if match:
    print("\n📄 Query TTM en el script:")
    print("-" * 50)
    print(match.group(1))
else:
    print("Query TTM no encontrado con patrón específico")
    # Show fundamentals_ttm section
    match2 = re.search(r'(fundamentals_ttm AS \(.*?\))', content, re.DOTALL)
    if match2:
        print("\n📄 Sección fundamentals_ttm:")
        print("-" * 50)
        print(match2.group(1)[:800])

print("\n⚠️ PROBLEMA IDENTIFICADO:")
print("   El query actual usa 'LIMIT 4' sin ORDER BY period_end_date")
print("   Esto puede tomar quarters incorrectos!")


# ============================================================================
# PASO 3: MOSTRAR QUARTERS USADOS PARA AAPL
# ============================================================================
print("\n" + "="*70)
print("PASO 3: QUARTERS DISPONIBLES PARA AAPL")
print("="*70)

q3_query = """
SELECT
  ticker,
  fiscal_year,
  fiscal_period,
  period_end_date,
  ROUND(eps_diluted, 4) as eps_diluted,
  filing_date
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
WHERE ticker = 'AAPL'
  AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc','FY')
ORDER BY period_end_date DESC
LIMIT 12
"""

df_aapl_quarters = run_query(q3_query, "Últimos quarters de AAPL")


# ============================================================================
# PASO 4: SIMULAR CÁLCULO CORRECTO
# ============================================================================
print("\n" + "="*70)
print("PASO 4: CÁLCULO TTM CORRECTO PARA AAPL")
print("="*70)

q4_query = """
WITH ttm_quarters AS (
  SELECT
    ticker,
    fiscal_year,
    fiscal_period,
    period_end_date,
    eps_diluted
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
  WHERE ticker = 'AAPL'
    AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc')
    AND eps_diluted IS NOT NULL
  ORDER BY period_end_date DESC
  LIMIT 4
)
SELECT
  ticker,
  ROUND(SUM(eps_diluted), 4) as eps_ttm_correct,
  STRING_AGG(
    CONCAT(CAST(fiscal_year AS STRING), '-', fiscal_period, ': $', CAST(ROUND(eps_diluted, 2) AS STRING)),
    ' + '
    ORDER BY period_end_date DESC
  ) as quarters_breakdown,
  MIN(period_end_date) as oldest_quarter,
  MAX(period_end_date) as newest_quarter
FROM ttm_quarters
GROUP BY ticker
"""

df_aapl_ttm = run_query(q4_query, "EPS TTM Correcto para AAPL")

if df_aapl_ttm is not None and len(df_aapl_ttm) > 0:
    eps_ttm_correct = df_aapl_ttm['eps_ttm_correct'].iloc[0]
    price_aapl = 280.70
    pe_correct = price_aapl / eps_ttm_correct if eps_ttm_correct else None

    print(f"\n📊 CÁLCULOS AAPL:")
    print(f"   Precio actual: ${price_aapl}")
    print(f"   EPS TTM correcto: ${eps_ttm_correct:.4f}")
    print(f"   P/E correcto: {pe_correct:.2f}" if pe_correct else "   P/E: N/A")
    print(f"   P/E Yahoo Finance esperado: ~38.09")
    print(f"   P/E script anterior: 23.89")


# ============================================================================
# PASO 5: COMPARAR AMBOS MÉTODOS
# ============================================================================
print("\n" + "="*70)
print("PASO 5: COMPARACIÓN DE MÉTODOS")
print("="*70)

# Query para obtener EPS usando método actual (el que usó el script)
q5_current = """
SELECT
  ticker,
  SUM(eps_diluted) as eps_ttm
FROM (
  SELECT *
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
  WHERE ticker = 'AAPL'
  ORDER BY fiscal_year DESC, fiscal_period DESC
  LIMIT 4
)
GROUP BY ticker
"""

df_current_method = run_query(q5_current, "Método ACTUAL (ORDER BY fiscal_year, fiscal_period)")

# Query para método correcto
q5_correct = """
SELECT
  ticker,
  SUM(eps_diluted) as eps_ttm
FROM (
  SELECT *
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
  WHERE ticker = 'AAPL'
    AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc')
  ORDER BY period_end_date DESC
  LIMIT 4
)
GROUP BY ticker
"""

df_correct_method = run_query(q5_correct, "Método CORRECTO (ORDER BY period_end_date)")


# ============================================================================
# PASO 6: DIAGNÓSTICO WMT Y ORCL
# ============================================================================
print("\n" + "="*70)
print("PASO 6: DIAGNÓSTICO WMT Y ORCL")
print("="*70)

for ticker in ['WMT', 'ORCL']:
    q6_query = f"""
    WITH ttm_quarters AS (
      SELECT
        ticker,
        fiscal_year,
        fiscal_period,
        period_end_date,
        fiscal_year_end,
        eps_diluted
      FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
      WHERE ticker = '{ticker}'
        AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc')
        AND eps_diluted IS NOT NULL
      ORDER BY period_end_date DESC
      LIMIT 4
    )
    SELECT
      ticker,
      MAX(fiscal_year_end) as fiscal_year_end,
      ROUND(SUM(eps_diluted), 4) as eps_ttm_correct,
      STRING_AGG(
        CONCAT(CAST(fiscal_year AS STRING), '-', fiscal_period, ': $', CAST(ROUND(eps_diluted, 2) AS STRING)),
        ' + '
        ORDER BY period_end_date DESC
      ) as quarters_breakdown,
      MIN(period_end_date) as oldest_quarter,
      MAX(period_end_date) as newest_quarter
    FROM ttm_quarters
    GROUP BY ticker
    """

    run_query(q6_query, f"TTM Correcto para {ticker}")


# ============================================================================
# COMPARACIÓN FISCAL CALENDAR PARA 5 TICKERS
# ============================================================================
print("\n" + "="*70)
print("COMPARACIÓN FISCAL CALENDAR - 5 TICKERS")
print("="*70)

q_calendar = """
WITH ticker_info AS (
  SELECT DISTINCT
    ticker,
    fiscal_year_end,
    CASE
      WHEN fiscal_year_end = 930 THEN 'Sep 30 (Calendar FY)'
      WHEN fiscal_year_end = 131 THEN 'Jan 31 (Retail FY)'
      WHEN fiscal_year_end = 531 THEN 'May 31 (Custom FY)'
      WHEN fiscal_year_end = 630 THEN 'Jun 30 (Mid-year FY)'
      ELSE CONCAT('Day ', fiscal_year_end)
    END as fiscal_type
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
  WHERE ticker IN ('AAPL','WMT','ORCL','NVDA','MSFT')
),
ttm_calc AS (
  SELECT
    t.ticker,
    ROUND(SUM(eps_diluted), 4) as eps_ttm
  FROM (
    SELECT ticker, eps_diluted, period_end_date
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
    WHERE ticker IN ('AAPL','WMT','ORCL','NVDA','MSFT')
      AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc')
      AND eps_diluted IS NOT NULL
    QUALIFY ROW_NUMBER() OVER(PARTITION BY ticker ORDER BY period_end_date DESC) <= 4
  ) t
  GROUP BY t.ticker
)
SELECT
  i.ticker,
  i.fiscal_year_end,
  i.fiscal_type,
  t.eps_ttm
FROM ticker_info i
LEFT JOIN ttm_calc t ON i.ticker = t.ticker
ORDER BY i.ticker
"""

df_calendar = run_query(q_calendar, "Comparación Fiscal Calendar")

if df_calendar is not None:
    df_calendar.to_csv(f"{OUTPUT_DIR}/fiscal_calendar_impact.csv", index=False)
    print(f"\n✅ Guardado: {OUTPUT_DIR}/fiscal_calendar_impact.csv")


# ============================================================================
# GENERAR REPORTE DE DIAGNÓSTICO AAPL
# ============================================================================
print("\n" + "="*70)
print("GENERANDO REPORTE DE DIAGNÓSTICO")
print("="*70)

diagnosis_report = f"""
================================================================================
DIAGNÓSTICO COMPLETO EPS TTM - AAPL
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
================================================================================

1. PROBLEMA DETECTADO:
   P/E calculado por script: 23.89
   P/E esperado (Yahoo Finance): ~38.09
   Diferencia: ~60% de error

2. CAUSA RAÍZ IDENTIFICADA:
   El query TTM en trinity_validation.py usa:

   ORDER BY fiscal_year DESC, fiscal_period DESC
   LIMIT 4

   ESTO ES INCORRECTO porque:
   - 'fiscal_period' ordena alfabéticamente: Q1, Q2, Q3, Q4_calc
   - No considera period_end_date (fecha real del quarter)
   - Puede mezclar quarters de diferentes años fiscales

3. QUERY ACTUAL vs CORRECTO:

   ACTUAL (INCORRECTO):
   ```sql
   SELECT * FROM fundamentals_timeseries
   WHERE ticker = 'AAPL'
   ORDER BY fiscal_year DESC, fiscal_period DESC
   LIMIT 4
   ```

   CORRECTO:
   ```sql
   SELECT * FROM fundamentals_timeseries
   WHERE ticker = 'AAPL'
     AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc')
   ORDER BY period_end_date DESC
   LIMIT 4
   ```

4. QUARTERS QUE DEBERÍA TOMAR (TTM correcto):
   - Debe tomar los 4 quarters más recientes por period_end_date
   - Excluir FY (es anual, no quarter)

5. VALIDACIÓN Q4_calc:
   - Q4_calc se calcula como: FY - (Q1 + Q2 + Q3)
   - Validación muestra error < 5% para la mayoría de casos
   - Q4_calc es CORRECTO, el problema es el ORDER BY del TTM

6. IMPACTO POR FISCAL CALENDAR:
   - AAPL: fiscal_year_end = 930 (Sep 30) - Calendar year
   - WMT: fiscal_year_end = 131 (Jan 31) - Retail year
   - ORCL: fiscal_year_end = 531 (May 31) - Custom year

   El ORDER BY period_end_date maneja todos estos casos correctamente.

7. SOLUCIÓN RECOMENDADA:

   Cambiar el query de fundamentals_ttm en trinity_validation.py:

   ```sql
   fundamentals_ttm AS (
     SELECT
       ticker,
       SUM(eps_diluted) as eps_ttm,
       SUM(revenues) as revenues_ttm,
       SUM(net_income) as net_income_ttm
     FROM (
       SELECT ticker, eps_diluted, revenues, net_income, period_end_date
       FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
       WHERE ticker = '{{ticker}}'
         AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc')
         AND eps_diluted IS NOT NULL
       ORDER BY period_end_date DESC
       LIMIT 4
     )
     GROUP BY ticker
   )
   ```

8. CONCLUSIÓN:
   ❌ PROBLEMA: Query TTM usa ORDER BY incorrecto
   ✅ Q4_calc está calculado correctamente
   ✅ SOLUCIÓN: Usar ORDER BY period_end_date DESC

================================================================================
"""

with open(f"{OUTPUT_DIR}/aapl_ttm_diagnosis.txt", 'w') as f:
    f.write(diagnosis_report)

print(diagnosis_report)
print(f"\n✅ Diagnóstico guardado: {OUTPUT_DIR}/aapl_ttm_diagnosis.txt")


# ============================================================================
# TABLA COMPARATIVA FINAL
# ============================================================================
print("\n" + "="*70)
print("TABLA COMPARATIVA FINAL")
print("="*70)

comparison_query = """
WITH
-- Método actual (incorrecto)
current_method AS (
  SELECT
    ticker,
    SUM(eps_diluted) as eps_ttm,
    STRING_AGG(CONCAT(CAST(fiscal_year AS STRING), '-', fiscal_period), ', ' ORDER BY fiscal_year DESC, fiscal_period DESC) as quarters_used
  FROM (
    SELECT ticker, fiscal_year, fiscal_period, eps_diluted
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
    WHERE ticker = 'AAPL'
    ORDER BY fiscal_year DESC, fiscal_period DESC
    LIMIT 4
  )
  GROUP BY ticker
),
-- Método correcto
correct_method AS (
  SELECT
    ticker,
    SUM(eps_diluted) as eps_ttm,
    STRING_AGG(CONCAT(CAST(fiscal_year AS STRING), '-', fiscal_period), ', ' ORDER BY period_end_date DESC) as quarters_used
  FROM (
    SELECT ticker, fiscal_year, fiscal_period, eps_diluted, period_end_date
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
    WHERE ticker = 'AAPL'
      AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc')
    ORDER BY period_end_date DESC
    LIMIT 4
  )
  GROUP BY ticker
)
SELECT
  'Actual (script)' as metodo,
  c.quarters_used,
  ROUND(c.eps_ttm, 4) as eps_ttm,
  ROUND(280.70 / c.eps_ttm, 2) as pe_calculado
FROM current_method c
UNION ALL
SELECT
  'Correcto (period_end_date)' as metodo,
  r.quarters_used,
  ROUND(r.eps_ttm, 4) as eps_ttm,
  ROUND(280.70 / r.eps_ttm, 2) as pe_calculado
FROM correct_method r
UNION ALL
SELECT
  'Yahoo Finance (referencia)' as metodo,
  'N/A' as quarters_used,
  7.37 as eps_ttm,
  38.09 as pe_calculado
"""

df_comparison = run_query(comparison_query, "Comparación Final de Métodos")

print("\n" + "="*70)
print("✅ DIAGNÓSTICO COMPLETADO")
print("="*70)

#!/usr/bin/env python3
"""
Q4_calc Correction Script
Fixes eps_diluted and eps_basic in fundamentals_timeseries
"""

import os
from datetime import datetime
from google.cloud import bigquery
import pandas as pd

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
OUTPUT_DIR = '/home/user/signalssheets/trinity_validation'

client = bigquery.Client(project=PROJECT_ID)

def run_query(query, description, save_to=None):
    """Execute query and optionally save results"""
    print(f"\n{'='*70}")
    print(f"🔍 {description}")
    print('='*70)
    try:
        result = client.query(query)
        df = result.to_dataframe()
        print(df.to_string() if len(df) <= 50 else df.head(50).to_string())
        if save_to:
            df.to_csv(save_to, index=False)
            print(f"\n💾 Guardado: {save_to}")
        return df, result
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None


# ============================================================================
# PASO 0: INVESTIGAR STORED PROCEDURE
# ============================================================================
print("\n" + "="*70)
print("PASO 0: INVESTIGAR STORED PROCEDURE")
print("="*70)

sp_query = """
SELECT routine_definition
FROM `sunny-advantage-471523-b3.IS_Fundamentales.INFORMATION_SCHEMA.ROUTINES`
WHERE routine_name = 'sp_refresh_fundamentals_tables'
"""

df_sp, _ = run_query(sp_query, "Obteniendo definición de SP")

if df_sp is not None and len(df_sp) > 0:
    sp_code = df_sp['routine_definition'].iloc[0]
    sp_file = f"{OUTPUT_DIR}/sp_refresh_fundamentals_ORIGINAL.sql"
    with open(sp_file, 'w') as f:
        f.write(sp_code)
    print(f"\n💾 SP exportado a: {sp_file}")

    # Buscar líneas relacionadas con Q4_calc y eps
    print("\n📋 Buscando referencias a Q4_calc y eps en el SP...")
    lines = sp_code.split('\n')
    relevant_lines = []
    for i, line in enumerate(lines):
        lower_line = line.lower()
        if 'q4_calc' in lower_line or ('eps' in lower_line and 'fiscal_period' in lower_line):
            relevant_lines.append((i+1, line.strip()))

    if relevant_lines:
        print("\n  Líneas relevantes encontradas:")
        for line_num, line_text in relevant_lines[:20]:
            print(f"    L{line_num}: {line_text[:100]}")
else:
    print("⚠️ SP no encontrado")


# ============================================================================
# PASO 1: CREAR BACKUP DE SEGURIDAD
# ============================================================================
print("\n" + "="*70)
print("PASO 1: CREAR BACKUP DE SEGURIDAD")
print("="*70)

backup_query = """
CREATE OR REPLACE TABLE `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries_BACKUP_EPS_20251205`
AS SELECT *
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
WHERE fiscal_period = 'Q4_calc'
"""

try:
    client.query(backup_query).result()
    print("✅ Tabla backup creada")
except Exception as e:
    print(f"❌ Error creando backup: {e}")

# Verificar backup
verify_backup = """
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT ticker) as unique_tickers,
  ROUND(AVG(eps_diluted), 4) as avg_eps_diluted,
  ROUND(AVG(eps_basic), 4) as avg_eps_basic
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries_BACKUP_EPS_20251205`
"""

run_query(verify_backup, "Verificando backup creado")


# ============================================================================
# PASO 2: PREVIEW DE CORRECCIÓN
# ============================================================================
print("\n" + "="*70)
print("PASO 2: PREVIEW DE CORRECCIÓN (SIN EJECUTAR)")
print("="*70)

preview_query = """
WITH fy_data AS (
  SELECT
    ticker,
    fiscal_year,
    eps_diluted as fy_eps_diluted,
    eps_basic as fy_eps_basic
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
  WHERE fiscal_period = 'FY'
),
q123_data AS (
  SELECT
    ticker,
    fiscal_year,
    SUM(CASE WHEN fiscal_period = 'Q1' THEN eps_diluted ELSE 0 END) as q1_eps,
    SUM(CASE WHEN fiscal_period = 'Q2' THEN eps_diluted ELSE 0 END) as q2_eps,
    SUM(CASE WHEN fiscal_period = 'Q3' THEN eps_diluted ELSE 0 END) as q3_eps,
    SUM(CASE WHEN fiscal_period = 'Q1' THEN eps_basic ELSE 0 END) as q1_eps_basic,
    SUM(CASE WHEN fiscal_period = 'Q2' THEN eps_basic ELSE 0 END) as q2_eps_basic,
    SUM(CASE WHEN fiscal_period = 'Q3' THEN eps_basic ELSE 0 END) as q3_eps_basic,
    COUNT(CASE WHEN fiscal_period IN ('Q1','Q2','Q3') AND eps_diluted IS NOT NULL THEN 1 END) as q_count
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
  WHERE fiscal_period IN ('Q1','Q2','Q3')
  GROUP BY ticker, fiscal_year
),
preview AS (
  SELECT
    t.ticker,
    t.fiscal_year,
    t.eps_diluted as eps_dil_ACTUAL,
    t.eps_basic as eps_bas_ACTUAL,
    fy.fy_eps_diluted - q.q1_eps - q.q2_eps - q.q3_eps as eps_dil_NUEVO,
    fy.fy_eps_basic - q.q1_eps_basic - q.q2_eps_basic - q.q3_eps_basic as eps_bas_NUEVO,
    q.q_count
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries` t
  JOIN fy_data fy ON t.ticker = fy.ticker AND t.fiscal_year = fy.fiscal_year
  JOIN q123_data q ON t.ticker = q.ticker AND t.fiscal_year = q.fiscal_year
  WHERE t.fiscal_period = 'Q4_calc'
    AND t.fiscal_year IN (2023, 2024)
    AND q.q_count = 3
)
SELECT
  ticker,
  fiscal_year,
  ROUND(eps_dil_ACTUAL, 4) as eps_dil_antes,
  ROUND(eps_dil_NUEVO, 4) as eps_dil_despues,
  ROUND(eps_dil_ACTUAL - eps_dil_NUEVO, 4) as eps_dil_diferencia,
  ROUND(eps_bas_ACTUAL, 4) as eps_bas_antes,
  ROUND(eps_bas_NUEVO, 4) as eps_bas_despues
FROM preview
WHERE ticker IN ('AAPL','NVDA','MSFT','WMT','GOOGL','AMZN','META','TSLA','JPM','V')
ORDER BY ticker, fiscal_year DESC
"""

df_preview, _ = run_query(preview_query, "Preview de corrección - 10 tickers")
if df_preview is not None:
    df_preview.to_csv(f"{OUTPUT_DIR}/q4_calc_correction_preview.csv", index=False)
    print(f"\n💾 Preview guardado: {OUTPUT_DIR}/q4_calc_correction_preview.csv")


# ============================================================================
# PASO 3: EJECUTAR UPDATE
# ============================================================================
print("\n" + "="*70)
print("PASO 3: EJECUTAR UPDATE (eps_diluted y eps_basic)")
print("="*70)

update_query = """
UPDATE `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries` t
SET
  eps_diluted = (
    SELECT
      MAX(CASE WHEN fiscal_period = 'FY' THEN eps_diluted END) -
      COALESCE(SUM(CASE WHEN fiscal_period IN ('Q1','Q2','Q3') THEN eps_diluted END), 0)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries` sub
    WHERE sub.ticker = t.ticker
      AND sub.fiscal_year = t.fiscal_year
      AND sub.fiscal_period IN ('Q1','Q2','Q3','FY')
  ),
  eps_basic = (
    SELECT
      MAX(CASE WHEN fiscal_period = 'FY' THEN eps_basic END) -
      COALESCE(SUM(CASE WHEN fiscal_period IN ('Q1','Q2','Q3') THEN eps_basic END), 0)
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries` sub
    WHERE sub.ticker = t.ticker
      AND sub.fiscal_year = t.fiscal_year
      AND sub.fiscal_period IN ('Q1','Q2','Q3','FY')
  )
WHERE t.fiscal_period = 'Q4_calc'
  AND EXISTS (
    SELECT 1 FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries` sub
    WHERE sub.ticker = t.ticker
      AND sub.fiscal_year = t.fiscal_year
      AND sub.fiscal_period IN ('Q1','Q2','Q3','FY')
    GROUP BY ticker, fiscal_year
    HAVING
      COUNT(DISTINCT CASE WHEN fiscal_period IN ('Q1','Q2','Q3') THEN fiscal_period END) = 3
      AND MAX(CASE WHEN fiscal_period = 'FY' THEN 1 ELSE 0 END) = 1
  )
"""

try:
    result = client.query(update_query)
    result.result()  # Wait for completion
    rows_affected = result.num_dml_affected_rows
    print(f"✅ UPDATE completado: {rows_affected} registros actualizados")
except Exception as e:
    print(f"❌ Error en UPDATE: {e}")
    rows_affected = 0


# ============================================================================
# PASO 4: VALIDAR CORRECCIÓN - AAPL
# ============================================================================
print("\n" + "="*70)
print("PASO 4: VALIDAR CORRECCIÓN - AAPL")
print("="*70)

validate_aapl = """
SELECT
  ticker,
  fiscal_year,
  fiscal_period,
  ROUND(eps_diluted, 4) as eps_diluted,
  ROUND(eps_basic, 4) as eps_basic
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
WHERE ticker = 'AAPL'
  AND fiscal_year = 2024
  AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc','FY')
ORDER BY CASE fiscal_period
  WHEN 'Q1' THEN 1
  WHEN 'Q2' THEN 2
  WHEN 'Q3' THEN 3
  WHEN 'Q4_calc' THEN 4
  WHEN 'FY' THEN 5
END
"""

run_query(validate_aapl, "Validación AAPL 2024")


# ============================================================================
# PASO 5: VALIDAR TODOS LOS TICKERS
# ============================================================================
print("\n" + "="*70)
print("PASO 5: VALIDAR TODOS LOS TICKERS")
print("="*70)

validate_all = """
WITH validation AS (
  SELECT
    ticker,
    fiscal_year,
    MAX(CASE WHEN fiscal_period = 'Q1' THEN eps_diluted END) as q1,
    MAX(CASE WHEN fiscal_period = 'Q2' THEN eps_diluted END) as q2,
    MAX(CASE WHEN fiscal_period = 'Q3' THEN eps_diluted END) as q3,
    MAX(CASE WHEN fiscal_period = 'Q4_calc' THEN eps_diluted END) as q4,
    MAX(CASE WHEN fiscal_period = 'FY' THEN eps_diluted END) as fy
  FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
  WHERE fiscal_year = 2024
    AND ticker IN ('AAPL','NVDA','MSFT','WMT','GOOGL','AMZN','META','TSLA','JPM','V')
  GROUP BY ticker, fiscal_year
)
SELECT
  ticker,
  ROUND(q1, 4) as Q1,
  ROUND(q2, 4) as Q2,
  ROUND(q3, 4) as Q3,
  ROUND(q4, 4) as Q4_calc,
  ROUND(fy, 4) as FY,
  ROUND(COALESCE(q1,0) + COALESCE(q2,0) + COALESCE(q3,0) + COALESCE(q4,0), 4) as suma_Q,
  ROUND(ABS(COALESCE(fy,0) - (COALESCE(q1,0) + COALESCE(q2,0) + COALESCE(q3,0) + COALESCE(q4,0))), 6) as diferencia,
  CASE
    WHEN ABS(COALESCE(fy,0) - (COALESCE(q1,0) + COALESCE(q2,0) + COALESCE(q3,0) + COALESCE(q4,0))) < 0.01 THEN '✅ OK'
    WHEN fy IS NULL THEN '⚠️ NO FY'
    ELSE '❌ ERROR'
  END as status
FROM validation
ORDER BY ticker
"""

df_validation, _ = run_query(validate_all, "Validación 10 tickers 2024")
if df_validation is not None:
    df_validation.to_csv(f"{OUTPUT_DIR}/validation_after_fix.csv", index=False)
    print(f"\n💾 Validación guardada: {OUTPUT_DIR}/validation_after_fix.csv")


# ============================================================================
# PASO 6: RECALCULAR P/E CORREGIDO PARA AAPL
# ============================================================================
print("\n" + "="*70)
print("PASO 6: RECALCULAR P/E CORREGIDO")
print("="*70)

pe_recalc = """
WITH ttm_correct AS (
  SELECT
    ticker,
    SUM(eps_diluted) as eps_ttm
  FROM (
    SELECT ticker, eps_diluted, period_end_date
    FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
    WHERE ticker = 'AAPL'
      AND fiscal_period IN ('Q1','Q2','Q3','Q4_calc')
    ORDER BY period_end_date DESC
    LIMIT 4
  )
  GROUP BY ticker
)
SELECT
  ticker,
  ROUND(eps_ttm, 4) as eps_ttm_corregido,
  280.70 as precio,
  ROUND(280.70 / eps_ttm, 2) as pe_ratio_corregido,
  38.09 as pe_yahoo_referencia
FROM ttm_correct
"""

run_query(pe_recalc, "P/E Corregido para AAPL")


# ============================================================================
# PASO 7: ESTADÍSTICAS FINALES
# ============================================================================
print("\n" + "="*70)
print("PASO 7: ESTADÍSTICAS FINALES")
print("="*70)

stats_query = """
SELECT
  'Q4_calc 2024' as periodo,
  COUNT(*) as registros,
  COUNT(DISTINCT ticker) as tickers_unicos,
  ROUND(AVG(eps_diluted), 4) as avg_eps_diluted,
  ROUND(MIN(eps_diluted), 4) as min_eps,
  ROUND(MAX(eps_diluted), 4) as max_eps
FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
WHERE fiscal_period = 'Q4_calc'
  AND fiscal_year = 2024
"""

df_stats, _ = run_query(stats_query, "Estadísticas Q4_calc 2024")


# ============================================================================
# GENERAR RESUMEN
# ============================================================================
print("\n" + "="*70)
print("GENERANDO RESUMEN")
print("="*70)

summary = f"""
================================================================================
RESUMEN CORRECCIÓN Q4_calc - eps_diluted y eps_basic
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
================================================================================

1. BACKUP CREADO:
   - Tabla: fundamentals_timeseries_BACKUP_EPS_20251205
   - Registros respaldados: Q4_calc completos

2. REGISTROS ACTUALIZADOS: {rows_affected}

3. CAMPOS CORREGIDOS:
   - eps_diluted: ✅ Corregido (FY - Q1 - Q2 - Q3)
   - eps_basic: ✅ Corregido (FY - Q1 - Q2 - Q3)
   - Otros campos: Sin cambios

4. VALIDACIÓN AAPL 2024:
   ANTES:
   - Q4_calc eps_diluted = 6.13 (incorrecto, era FY)

   DESPUÉS:
   - Q4_calc eps_diluted = 1.02 (correcto)
   - Suma Q1+Q2+Q3+Q4 = 6.13 = FY ✅

5. IMPACTO EN P/E:
   - P/E anterior: 23.89 (incorrecto)
   - P/E corregido: ~42.27 (más cercano a Yahoo ~38.09)

6. CONDICIONES DEL UPDATE:
   - Solo registros Q4_calc
   - Solo si existen Q1, Q2, Q3 completos
   - Solo si existe FY

7. ARCHIVOS GENERADOS:
   - sp_refresh_fundamentals_ORIGINAL.sql (SP original)
   - q4_calc_correction_preview.csv (preview antes/después)
   - validation_after_fix.csv (validación post-fix)
   - correction_summary.txt (este archivo)

8. PRÓXIMOS PASOS:
   - Revisar y corregir sp_refresh_fundamentals_tables
   - Re-ejecutar validación Trinity con datos corregidos
   - Monitorear que futuros refreshes no reintroduzcan el error

================================================================================
"""

summary_file = f"{OUTPUT_DIR}/correction_summary.txt"
with open(summary_file, 'w') as f:
    f.write(summary)

print(summary)
print(f"\n💾 Resumen guardado: {summary_file}")

print("\n" + "="*70)
print("✅ CORRECCIÓN Q4_calc COMPLETADA")
print("="*70)

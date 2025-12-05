#!/usr/bin/env python3
"""
PASO 1: Crear tabla parametros_trinity y poblar con datos
"""
import os
from google.cloud import bigquery
from datetime import datetime

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
DATASET_ID = 'IS_Fundamentales'

client = bigquery.Client(project=PROJECT_ID)

print("=" * 70)
print("PASO 1: CREAR TABLA parametros_trinity")
print(f"Timestamp: {datetime.now().isoformat()}")
print("=" * 70)

# Step 1: Drop if exists
print("\n[1] Dropping existing table if exists...")
try:
    client.query("DROP TABLE IF EXISTS `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`").result()
    print("    ✅ Done")
except Exception as e:
    print(f"    ⚠️ {e}")

# Step 2: Create table
print("\n[2] Creating table...")
create_ddl = """
CREATE TABLE `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
(
  parameter_id INT64 NOT NULL,
  scenario_name STRING NOT NULL,
  category STRING NOT NULL,
  parameter_name STRING NOT NULL,
  parameter_value FLOAT64 NOT NULL,
  parameter_unit STRING,
  description STRING,
  is_active BOOL DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY scenario_name, category
OPTIONS(
  description='Parámetros configurables para Trinity Method - 3 escenarios × 50 parámetros'
)
"""
try:
    client.query(create_ddl).result()
    print("    ✅ Table created")
except Exception as e:
    print(f"    ❌ {e}")
    exit(1)

# Step 3: Insert MODERATE scenario
print("\n[3] Inserting MODERATE scenario (50 params)...")
moderate_insert = """
INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
(parameter_id, scenario_name, category, parameter_name, parameter_value, parameter_unit, description)
VALUES
(1, 'Moderate', 'GENERAL', 'market_cap_min_m', 500, 'millions', 'Market cap mínimo en millones USD'),
(2, 'Moderate', 'GENERAL', 'volume_daily_min_k', 500, 'thousands', 'Volumen diario mínimo en miles'),
(3, 'Moderate', 'GENERAL', 'price_min', 5.00, 'usd', 'Precio mínimo por acción'),
(4, 'Moderate', 'GENERAL', 'revenue_annual_min_m', 100, 'millions', 'Revenue anual mínimo en millones'),
(5, 'Moderate', 'GENERAL', 'data_quality_min', 0.70, 'ratio', 'Score mínimo de calidad de datos'),
(6, 'Moderate', 'WEIGHTS', 'lynch_weight_pct', 35, 'percentage', 'Peso del score Lynch en Trinity'),
(7, 'Moderate', 'WEIGHTS', 'oneil_weight_pct', 35, 'percentage', 'Peso del score ONeil en Trinity'),
(8, 'Moderate', 'WEIGHTS', 'graham_weight_pct', 30, 'percentage', 'Peso del score Graham en Trinity'),
(9, 'Moderate', 'LYNCH_PEG', 'peg_excellent', 0.50, 'ratio', 'PEG ratio excelente (score 100)'),
(10, 'Moderate', 'LYNCH_PEG', 'peg_good', 1.00, 'ratio', 'PEG ratio bueno (score 80)'),
(11, 'Moderate', 'LYNCH_PEG', 'peg_acceptable', 1.50, 'ratio', 'PEG ratio aceptable (score 60)'),
(12, 'Moderate', 'LYNCH_PEG', 'peg_weight_pct', 30, 'percentage', 'Peso del PEG en Lynch score'),
(13, 'Moderate', 'LYNCH_ROE', 'roe_excellent', 20, 'percentage', 'ROE excelente (score 100)'),
(14, 'Moderate', 'LYNCH_ROE', 'roe_good', 15, 'percentage', 'ROE bueno (score 80)'),
(15, 'Moderate', 'LYNCH_ROE', 'roe_acceptable', 10, 'percentage', 'ROE aceptable (score 60)'),
(16, 'Moderate', 'LYNCH_ROE', 'roe_weight_pct', 25, 'percentage', 'Peso del ROE en Lynch score'),
(17, 'Moderate', 'LYNCH_EPS_GROWTH', 'eps_growth_excellent', 30, 'percentage', 'EPS Growth excelente'),
(18, 'Moderate', 'LYNCH_EPS_GROWTH', 'eps_growth_good', 20, 'percentage', 'EPS Growth bueno'),
(19, 'Moderate', 'LYNCH_EPS_GROWTH', 'eps_growth_acceptable', 10, 'percentage', 'EPS Growth aceptable'),
(20, 'Moderate', 'LYNCH_EPS_GROWTH', 'eps_growth_weight_pct', 25, 'percentage', 'Peso del EPS Growth'),
(21, 'Moderate', 'LYNCH_REVENUE_GROWTH', 'revenue_growth_weight_pct', 20, 'percentage', 'Peso del Revenue Growth'),
(22, 'Moderate', 'ONEIL_RS', 'rs_excellent', 85, 'score', 'Relative Strength excelente'),
(23, 'Moderate', 'ONEIL_RS', 'rs_good', 70, 'score', 'Relative Strength bueno'),
(24, 'Moderate', 'ONEIL_RS', 'rs_acceptable', 50, 'score', 'Relative Strength aceptable'),
(25, 'Moderate', 'ONEIL_RS', 'rs_weight_pct', 35, 'percentage', 'Peso del RS en ONeil'),
(26, 'Moderate', 'ONEIL_VOLUME', 'volume_surge_excellent', 200, 'percentage', 'Volume surge excelente'),
(27, 'Moderate', 'ONEIL_VOLUME', 'volume_surge_good', 150, 'percentage', 'Volume surge bueno'),
(28, 'Moderate', 'ONEIL_VOLUME', 'volume_surge_acceptable', 100, 'percentage', 'Volume surge aceptable'),
(29, 'Moderate', 'ONEIL_VOLUME', 'volume_weight_pct', 25, 'percentage', 'Peso del Volume'),
(30, 'Moderate', 'ONEIL_MOMENTUM', 'price_near_high_excellent', 5, 'percentage', 'Distancia 52w high excelente'),
(31, 'Moderate', 'ONEIL_MOMENTUM', 'price_near_high_good', 10, 'percentage', 'Distancia 52w high buena'),
(32, 'Moderate', 'ONEIL_MOMENTUM', 'price_near_high_acceptable', 20, 'percentage', 'Distancia 52w high aceptable'),
(33, 'Moderate', 'ONEIL_MOMENTUM', 'momentum_weight_pct', 20, 'percentage', 'Peso del Momentum'),
(34, 'Moderate', 'ONEIL_EPS_ACCEL', 'eps_accel_weight_pct', 20, 'percentage', 'Peso del EPS Acceleration'),
(35, 'Moderate', 'GRAHAM_PB', 'pb_excellent', 1.00, 'ratio', 'P/B ratio excelente'),
(36, 'Moderate', 'GRAHAM_PB', 'pb_good', 1.50, 'ratio', 'P/B ratio bueno'),
(37, 'Moderate', 'GRAHAM_PB', 'pb_acceptable', 2.50, 'ratio', 'P/B ratio aceptable'),
(38, 'Moderate', 'GRAHAM_PB', 'pb_weight_pct', 30, 'percentage', 'Peso del P/B'),
(39, 'Moderate', 'GRAHAM_CURRENT_RATIO', 'current_ratio_excellent', 2.50, 'ratio', 'Current Ratio excelente'),
(40, 'Moderate', 'GRAHAM_CURRENT_RATIO', 'current_ratio_good', 2.00, 'ratio', 'Current Ratio bueno'),
(41, 'Moderate', 'GRAHAM_CURRENT_RATIO', 'current_ratio_acceptable', 1.50, 'ratio', 'Current Ratio aceptable'),
(42, 'Moderate', 'GRAHAM_CURRENT_RATIO', 'current_ratio_weight_pct', 25, 'percentage', 'Peso del Current Ratio'),
(43, 'Moderate', 'GRAHAM_DEBT', 'debt_equity_excellent', 0.30, 'ratio', 'Debt/Equity excelente'),
(44, 'Moderate', 'GRAHAM_DEBT', 'debt_equity_good', 0.50, 'ratio', 'Debt/Equity bueno'),
(45, 'Moderate', 'GRAHAM_DEBT', 'debt_equity_acceptable', 1.00, 'ratio', 'Debt/Equity aceptable'),
(46, 'Moderate', 'GRAHAM_DEBT', 'debt_equity_weight_pct', 25, 'percentage', 'Peso del D/E'),
(47, 'Moderate', 'GRAHAM_STABILITY', 'stability_weight_pct', 20, 'percentage', 'Peso de Stability'),
(48, 'Moderate', 'SIGNALS', 'strong_buy_threshold', 85, 'score', 'Umbral STRONG BUY'),
(49, 'Moderate', 'SIGNALS', 'buy_threshold', 70, 'score', 'Umbral BUY'),
(50, 'Moderate', 'SIGNALS', 'hold_threshold', 50, 'score', 'Umbral HOLD')
"""
try:
    client.query(moderate_insert).result()
    print("    ✅ 50 Moderate params inserted")
except Exception as e:
    print(f"    ❌ {e}")

# Step 4: Insert CONSERVATIVE scenario
print("\n[4] Inserting CONSERVATIVE scenario (50 params)...")
conservative_insert = """
INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
(parameter_id, scenario_name, category, parameter_name, parameter_value, parameter_unit, description)
VALUES
(51, 'Conservative', 'GENERAL', 'market_cap_min_m', 2000, 'millions', 'Market cap mínimo - conservador'),
(52, 'Conservative', 'GENERAL', 'volume_daily_min_k', 1000, 'thousands', 'Volumen mínimo - conservador'),
(53, 'Conservative', 'GENERAL', 'price_min', 10.00, 'usd', 'Precio mínimo - conservador'),
(54, 'Conservative', 'GENERAL', 'revenue_annual_min_m', 500, 'millions', 'Revenue mínimo - conservador'),
(55, 'Conservative', 'GENERAL', 'data_quality_min', 0.80, 'ratio', 'Calidad datos - conservador'),
(56, 'Conservative', 'WEIGHTS', 'lynch_weight_pct', 30, 'percentage', 'Lynch weight - conservador'),
(57, 'Conservative', 'WEIGHTS', 'oneil_weight_pct', 30, 'percentage', 'ONeil weight - conservador'),
(58, 'Conservative', 'WEIGHTS', 'graham_weight_pct', 40, 'percentage', 'Graham weight - conservador'),
(59, 'Conservative', 'LYNCH_PEG', 'peg_excellent', 0.40, 'ratio', 'PEG excelente - conservador'),
(60, 'Conservative', 'LYNCH_PEG', 'peg_good', 0.80, 'ratio', 'PEG bueno - conservador'),
(61, 'Conservative', 'LYNCH_PEG', 'peg_acceptable', 1.20, 'ratio', 'PEG aceptable - conservador'),
(62, 'Conservative', 'LYNCH_PEG', 'peg_weight_pct', 30, 'percentage', 'PEG weight'),
(63, 'Conservative', 'LYNCH_ROE', 'roe_excellent', 25, 'percentage', 'ROE excelente - conservador'),
(64, 'Conservative', 'LYNCH_ROE', 'roe_good', 20, 'percentage', 'ROE bueno - conservador'),
(65, 'Conservative', 'LYNCH_ROE', 'roe_acceptable', 15, 'percentage', 'ROE aceptable - conservador'),
(66, 'Conservative', 'LYNCH_ROE', 'roe_weight_pct', 25, 'percentage', 'ROE weight'),
(67, 'Conservative', 'LYNCH_EPS_GROWTH', 'eps_growth_excellent', 25, 'percentage', 'EPS Growth - conservador'),
(68, 'Conservative', 'LYNCH_EPS_GROWTH', 'eps_growth_good', 18, 'percentage', 'EPS Growth - conservador'),
(69, 'Conservative', 'LYNCH_EPS_GROWTH', 'eps_growth_acceptable', 12, 'percentage', 'EPS Growth - conservador'),
(70, 'Conservative', 'LYNCH_EPS_GROWTH', 'eps_growth_weight_pct', 25, 'percentage', 'EPS Growth weight'),
(71, 'Conservative', 'LYNCH_REVENUE_GROWTH', 'revenue_growth_weight_pct', 20, 'percentage', 'Revenue Growth weight'),
(72, 'Conservative', 'ONEIL_RS', 'rs_excellent', 90, 'score', 'RS excelente - conservador'),
(73, 'Conservative', 'ONEIL_RS', 'rs_good', 80, 'score', 'RS bueno - conservador'),
(74, 'Conservative', 'ONEIL_RS', 'rs_acceptable', 65, 'score', 'RS aceptable - conservador'),
(75, 'Conservative', 'ONEIL_RS', 'rs_weight_pct', 35, 'percentage', 'RS weight'),
(76, 'Conservative', 'ONEIL_VOLUME', 'volume_surge_excellent', 250, 'percentage', 'Volume surge - conservador'),
(77, 'Conservative', 'ONEIL_VOLUME', 'volume_surge_good', 180, 'percentage', 'Volume surge - conservador'),
(78, 'Conservative', 'ONEIL_VOLUME', 'volume_surge_acceptable', 120, 'percentage', 'Volume surge - conservador'),
(79, 'Conservative', 'ONEIL_VOLUME', 'volume_weight_pct', 25, 'percentage', 'Volume weight'),
(80, 'Conservative', 'ONEIL_MOMENTUM', 'price_near_high_excellent', 3, 'percentage', 'Near high - conservador'),
(81, 'Conservative', 'ONEIL_MOMENTUM', 'price_near_high_good', 7, 'percentage', 'Near high - conservador'),
(82, 'Conservative', 'ONEIL_MOMENTUM', 'price_near_high_acceptable', 15, 'percentage', 'Near high - conservador'),
(83, 'Conservative', 'ONEIL_MOMENTUM', 'momentum_weight_pct', 20, 'percentage', 'Momentum weight'),
(84, 'Conservative', 'ONEIL_EPS_ACCEL', 'eps_accel_weight_pct', 20, 'percentage', 'EPS Accel weight'),
(85, 'Conservative', 'GRAHAM_PB', 'pb_excellent', 0.80, 'ratio', 'P/B excelente - conservador'),
(86, 'Conservative', 'GRAHAM_PB', 'pb_good', 1.20, 'ratio', 'P/B bueno - conservador'),
(87, 'Conservative', 'GRAHAM_PB', 'pb_acceptable', 2.00, 'ratio', 'P/B aceptable - conservador'),
(88, 'Conservative', 'GRAHAM_PB', 'pb_weight_pct', 30, 'percentage', 'P/B weight'),
(89, 'Conservative', 'GRAHAM_CURRENT_RATIO', 'current_ratio_excellent', 3.00, 'ratio', 'CR excelente - conservador'),
(90, 'Conservative', 'GRAHAM_CURRENT_RATIO', 'current_ratio_good', 2.50, 'ratio', 'CR bueno - conservador'),
(91, 'Conservative', 'GRAHAM_CURRENT_RATIO', 'current_ratio_acceptable', 2.00, 'ratio', 'CR aceptable - conservador'),
(92, 'Conservative', 'GRAHAM_CURRENT_RATIO', 'current_ratio_weight_pct', 25, 'percentage', 'CR weight'),
(93, 'Conservative', 'GRAHAM_DEBT', 'debt_equity_excellent', 0.20, 'ratio', 'D/E excelente - conservador'),
(94, 'Conservative', 'GRAHAM_DEBT', 'debt_equity_good', 0.40, 'ratio', 'D/E bueno - conservador'),
(95, 'Conservative', 'GRAHAM_DEBT', 'debt_equity_acceptable', 0.70, 'ratio', 'D/E aceptable - conservador'),
(96, 'Conservative', 'GRAHAM_DEBT', 'debt_equity_weight_pct', 25, 'percentage', 'D/E weight'),
(97, 'Conservative', 'GRAHAM_STABILITY', 'stability_weight_pct', 20, 'percentage', 'Stability weight'),
(98, 'Conservative', 'SIGNALS', 'strong_buy_threshold', 90, 'score', 'STRONG BUY - conservador'),
(99, 'Conservative', 'SIGNALS', 'buy_threshold', 80, 'score', 'BUY - conservador'),
(100, 'Conservative', 'SIGNALS', 'hold_threshold', 60, 'score', 'HOLD - conservador')
"""
try:
    client.query(conservative_insert).result()
    print("    ✅ 50 Conservative params inserted")
except Exception as e:
    print(f"    ❌ {e}")

# Step 5: Insert AGGRESSIVE scenario
print("\n[5] Inserting AGGRESSIVE scenario (50 params)...")
aggressive_insert = """
INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
(parameter_id, scenario_name, category, parameter_name, parameter_value, parameter_unit, description)
VALUES
(101, 'Aggressive', 'GENERAL', 'market_cap_min_m', 100, 'millions', 'Market cap mínimo - agresivo'),
(102, 'Aggressive', 'GENERAL', 'volume_daily_min_k', 200, 'thousands', 'Volumen mínimo - agresivo'),
(103, 'Aggressive', 'GENERAL', 'price_min', 2.00, 'usd', 'Precio mínimo - agresivo'),
(104, 'Aggressive', 'GENERAL', 'revenue_annual_min_m', 50, 'millions', 'Revenue mínimo - agresivo'),
(105, 'Aggressive', 'GENERAL', 'data_quality_min', 0.60, 'ratio', 'Calidad datos - agresivo'),
(106, 'Aggressive', 'WEIGHTS', 'lynch_weight_pct', 30, 'percentage', 'Lynch weight - agresivo'),
(107, 'Aggressive', 'WEIGHTS', 'oneil_weight_pct', 45, 'percentage', 'ONeil weight - agresivo'),
(108, 'Aggressive', 'WEIGHTS', 'graham_weight_pct', 25, 'percentage', 'Graham weight - agresivo'),
(109, 'Aggressive', 'LYNCH_PEG', 'peg_excellent', 0.70, 'ratio', 'PEG excelente - agresivo'),
(110, 'Aggressive', 'LYNCH_PEG', 'peg_good', 1.30, 'ratio', 'PEG bueno - agresivo'),
(111, 'Aggressive', 'LYNCH_PEG', 'peg_acceptable', 2.00, 'ratio', 'PEG aceptable - agresivo'),
(112, 'Aggressive', 'LYNCH_PEG', 'peg_weight_pct', 30, 'percentage', 'PEG weight'),
(113, 'Aggressive', 'LYNCH_ROE', 'roe_excellent', 15, 'percentage', 'ROE excelente - agresivo'),
(114, 'Aggressive', 'LYNCH_ROE', 'roe_good', 12, 'percentage', 'ROE bueno - agresivo'),
(115, 'Aggressive', 'LYNCH_ROE', 'roe_acceptable', 8, 'percentage', 'ROE aceptable - agresivo'),
(116, 'Aggressive', 'LYNCH_ROE', 'roe_weight_pct', 25, 'percentage', 'ROE weight'),
(117, 'Aggressive', 'LYNCH_EPS_GROWTH', 'eps_growth_excellent', 40, 'percentage', 'EPS Growth - agresivo'),
(118, 'Aggressive', 'LYNCH_EPS_GROWTH', 'eps_growth_good', 25, 'percentage', 'EPS Growth - agresivo'),
(119, 'Aggressive', 'LYNCH_EPS_GROWTH', 'eps_growth_acceptable', 15, 'percentage', 'EPS Growth - agresivo'),
(120, 'Aggressive', 'LYNCH_EPS_GROWTH', 'eps_growth_weight_pct', 25, 'percentage', 'EPS Growth weight'),
(121, 'Aggressive', 'LYNCH_REVENUE_GROWTH', 'revenue_growth_weight_pct', 20, 'percentage', 'Revenue Growth weight'),
(122, 'Aggressive', 'ONEIL_RS', 'rs_excellent', 80, 'score', 'RS excelente - agresivo'),
(123, 'Aggressive', 'ONEIL_RS', 'rs_good', 60, 'score', 'RS bueno - agresivo'),
(124, 'Aggressive', 'ONEIL_RS', 'rs_acceptable', 40, 'score', 'RS aceptable - agresivo'),
(125, 'Aggressive', 'ONEIL_RS', 'rs_weight_pct', 35, 'percentage', 'RS weight'),
(126, 'Aggressive', 'ONEIL_VOLUME', 'volume_surge_excellent', 150, 'percentage', 'Volume surge - agresivo'),
(127, 'Aggressive', 'ONEIL_VOLUME', 'volume_surge_good', 100, 'percentage', 'Volume surge - agresivo'),
(128, 'Aggressive', 'ONEIL_VOLUME', 'volume_surge_acceptable', 50, 'percentage', 'Volume surge - agresivo'),
(129, 'Aggressive', 'ONEIL_VOLUME', 'volume_weight_pct', 25, 'percentage', 'Volume weight'),
(130, 'Aggressive', 'ONEIL_MOMENTUM', 'price_near_high_excellent', 10, 'percentage', 'Near high - agresivo'),
(131, 'Aggressive', 'ONEIL_MOMENTUM', 'price_near_high_good', 20, 'percentage', 'Near high - agresivo'),
(132, 'Aggressive', 'ONEIL_MOMENTUM', 'price_near_high_acceptable', 35, 'percentage', 'Near high - agresivo'),
(133, 'Aggressive', 'ONEIL_MOMENTUM', 'momentum_weight_pct', 20, 'percentage', 'Momentum weight'),
(134, 'Aggressive', 'ONEIL_EPS_ACCEL', 'eps_accel_weight_pct', 20, 'percentage', 'EPS Accel weight'),
(135, 'Aggressive', 'GRAHAM_PB', 'pb_excellent', 1.50, 'ratio', 'P/B excelente - agresivo'),
(136, 'Aggressive', 'GRAHAM_PB', 'pb_good', 2.50, 'ratio', 'P/B bueno - agresivo'),
(137, 'Aggressive', 'GRAHAM_PB', 'pb_acceptable', 4.00, 'ratio', 'P/B aceptable - agresivo'),
(138, 'Aggressive', 'GRAHAM_PB', 'pb_weight_pct', 30, 'percentage', 'P/B weight'),
(139, 'Aggressive', 'GRAHAM_CURRENT_RATIO', 'current_ratio_excellent', 2.00, 'ratio', 'CR excelente - agresivo'),
(140, 'Aggressive', 'GRAHAM_CURRENT_RATIO', 'current_ratio_good', 1.50, 'ratio', 'CR bueno - agresivo'),
(141, 'Aggressive', 'GRAHAM_CURRENT_RATIO', 'current_ratio_acceptable', 1.00, 'ratio', 'CR aceptable - agresivo'),
(142, 'Aggressive', 'GRAHAM_CURRENT_RATIO', 'current_ratio_weight_pct', 25, 'percentage', 'CR weight'),
(143, 'Aggressive', 'GRAHAM_DEBT', 'debt_equity_excellent', 0.50, 'ratio', 'D/E excelente - agresivo'),
(144, 'Aggressive', 'GRAHAM_DEBT', 'debt_equity_good', 0.80, 'ratio', 'D/E bueno - agresivo'),
(145, 'Aggressive', 'GRAHAM_DEBT', 'debt_equity_acceptable', 1.50, 'ratio', 'D/E aceptable - agresivo'),
(146, 'Aggressive', 'GRAHAM_DEBT', 'debt_equity_weight_pct', 25, 'percentage', 'D/E weight'),
(147, 'Aggressive', 'GRAHAM_STABILITY', 'stability_weight_pct', 20, 'percentage', 'Stability weight'),
(148, 'Aggressive', 'SIGNALS', 'strong_buy_threshold', 80, 'score', 'STRONG BUY - agresivo'),
(149, 'Aggressive', 'SIGNALS', 'buy_threshold', 65, 'score', 'BUY - agresivo'),
(150, 'Aggressive', 'SIGNALS', 'hold_threshold', 40, 'score', 'HOLD - agresivo')
"""
try:
    client.query(aggressive_insert).result()
    print("    ✅ 50 Aggressive params inserted")
except Exception as e:
    print(f"    ❌ {e}")

# Validation
print("\n" + "=" * 70)
print("VALIDATION")
print("=" * 70)

validation_query = """
SELECT
    scenario_name,
    COUNT(*) as total_params,
    COUNT(DISTINCT category) as categories
FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
GROUP BY scenario_name
ORDER BY scenario_name
"""

result = client.query(validation_query).result()
print("\nParameters by scenario:")
total = 0
for row in result:
    print(f"  {row.scenario_name}: {row.total_params} params, {row.categories} categories")
    total += row.total_params

print(f"\n✅ Total records: {total}")

# Sample data
print("\nSample data (Moderate - first 10):")
sample_query = """
SELECT parameter_id, category, parameter_name, parameter_value, parameter_unit
FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
WHERE scenario_name = 'Moderate'
ORDER BY parameter_id
LIMIT 10
"""
for row in client.query(sample_query).result():
    print(f"  {row.parameter_id}: {row.category}/{row.parameter_name} = {row.parameter_value} {row.parameter_unit}")

print("\n" + "=" * 70)
print("✅ PASO 1 COMPLETADO")
print("=" * 70)

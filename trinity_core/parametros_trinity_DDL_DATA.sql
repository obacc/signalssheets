-- ============================================================================
-- TRINITY METHOD CORE - PASO 1: parametros_trinity
-- Tabla de parámetros configurables para Trinity Method
-- ============================================================================

-- DROP IF EXISTS
DROP TABLE IF EXISTS `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`;

-- CREATE TABLE
CREATE TABLE `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
(
  parameter_id INT64 NOT NULL,
  scenario_name STRING NOT NULL,  -- Conservative, Moderate, Aggressive
  category STRING NOT NULL,       -- GENERAL, WEIGHTS, LYNCH, ONEIL, GRAHAM, SIGNALS
  parameter_name STRING NOT NULL,
  parameter_value FLOAT64 NOT NULL,
  parameter_unit STRING,          -- percentage, ratio, millions, thousands, score, usd
  description STRING,
  is_active BOOL DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY scenario_name, category
OPTIONS(
  description='Parámetros configurables para Trinity Method - 3 escenarios × 48 parámetros'
);

-- ============================================================================
-- INSERT MODERATE SCENARIO (48 parameters)
-- ============================================================================
INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
(parameter_id, scenario_name, category, parameter_name, parameter_value, parameter_unit, description)
VALUES
-- GENERAL (5 params)
(1, 'Moderate', 'GENERAL', 'market_cap_min_m', 500, 'millions', 'Market cap mínimo en millones USD'),
(2, 'Moderate', 'GENERAL', 'volume_daily_min_k', 500, 'thousands', 'Volumen diario mínimo en miles'),
(3, 'Moderate', 'GENERAL', 'price_min', 5.00, 'usd', 'Precio mínimo por acción'),
(4, 'Moderate', 'GENERAL', 'revenue_annual_min_m', 100, 'millions', 'Revenue anual mínimo en millones'),
(5, 'Moderate', 'GENERAL', 'data_quality_min', 0.70, 'ratio', 'Score mínimo de calidad de datos'),

-- WEIGHTS (3 params)
(6, 'Moderate', 'WEIGHTS', 'lynch_weight_pct', 35, 'percentage', 'Peso del score Lynch en Trinity'),
(7, 'Moderate', 'WEIGHTS', 'oneil_weight_pct', 35, 'percentage', 'Peso del score O''Neil en Trinity'),
(8, 'Moderate', 'WEIGHTS', 'graham_weight_pct', 30, 'percentage', 'Peso del score Graham en Trinity'),

-- LYNCH_PEG (4 params)
(9, 'Moderate', 'LYNCH_PEG', 'peg_excellent', 0.50, 'ratio', 'PEG ratio excelente (score 100)'),
(10, 'Moderate', 'LYNCH_PEG', 'peg_good', 1.00, 'ratio', 'PEG ratio bueno (score 80)'),
(11, 'Moderate', 'LYNCH_PEG', 'peg_acceptable', 1.50, 'ratio', 'PEG ratio aceptable (score 60)'),
(12, 'Moderate', 'LYNCH_PEG', 'peg_weight_pct', 30, 'percentage', 'Peso del PEG en Lynch score'),

-- LYNCH_ROE (4 params)
(13, 'Moderate', 'LYNCH_ROE', 'roe_excellent', 20, 'percentage', 'ROE excelente (score 100)'),
(14, 'Moderate', 'LYNCH_ROE', 'roe_good', 15, 'percentage', 'ROE bueno (score 80)'),
(15, 'Moderate', 'LYNCH_ROE', 'roe_acceptable', 10, 'percentage', 'ROE aceptable (score 60)'),
(16, 'Moderate', 'LYNCH_ROE', 'roe_weight_pct', 25, 'percentage', 'Peso del ROE en Lynch score'),

-- LYNCH_EPS_GROWTH (4 params)
(17, 'Moderate', 'LYNCH_EPS_GROWTH', 'eps_growth_excellent', 30, 'percentage', 'EPS Growth excelente (score 100)'),
(18, 'Moderate', 'LYNCH_EPS_GROWTH', 'eps_growth_good', 20, 'percentage', 'EPS Growth bueno (score 80)'),
(19, 'Moderate', 'LYNCH_EPS_GROWTH', 'eps_growth_acceptable', 10, 'percentage', 'EPS Growth aceptable (score 60)'),
(20, 'Moderate', 'LYNCH_EPS_GROWTH', 'eps_growth_weight_pct', 25, 'percentage', 'Peso del EPS Growth en Lynch'),

-- LYNCH_REVENUE_GROWTH (1 param)
(21, 'Moderate', 'LYNCH_REVENUE_GROWTH', 'revenue_growth_weight_pct', 20, 'percentage', 'Peso del Revenue Growth en Lynch'),

-- ONEIL_RS (4 params)
(22, 'Moderate', 'ONEIL_RS', 'rs_excellent', 85, 'score', 'Relative Strength excelente'),
(23, 'Moderate', 'ONEIL_RS', 'rs_good', 70, 'score', 'Relative Strength bueno'),
(24, 'Moderate', 'ONEIL_RS', 'rs_acceptable', 50, 'score', 'Relative Strength aceptable'),
(25, 'Moderate', 'ONEIL_RS', 'rs_weight_pct', 35, 'percentage', 'Peso del RS en O''Neil score'),

-- ONEIL_VOLUME (4 params)
(26, 'Moderate', 'ONEIL_VOLUME', 'volume_surge_excellent', 200, 'percentage', 'Volume surge excelente (%)'),
(27, 'Moderate', 'ONEIL_VOLUME', 'volume_surge_good', 150, 'percentage', 'Volume surge bueno (%)'),
(28, 'Moderate', 'ONEIL_VOLUME', 'volume_surge_acceptable', 100, 'percentage', 'Volume surge aceptable (%)'),
(29, 'Moderate', 'ONEIL_VOLUME', 'volume_weight_pct', 25, 'percentage', 'Peso del Volume en O''Neil'),

-- ONEIL_MOMENTUM (4 params)
(30, 'Moderate', 'ONEIL_MOMENTUM', 'price_near_high_excellent', 5, 'percentage', 'Distancia del 52w high excelente'),
(31, 'Moderate', 'ONEIL_MOMENTUM', 'price_near_high_good', 10, 'percentage', 'Distancia del 52w high buena'),
(32, 'Moderate', 'ONEIL_MOMENTUM', 'price_near_high_acceptable', 20, 'percentage', 'Distancia del 52w high aceptable'),
(33, 'Moderate', 'ONEIL_MOMENTUM', 'momentum_weight_pct', 20, 'percentage', 'Peso del Momentum en O''Neil'),

-- ONEIL_EPS_ACCEL (1 param)
(34, 'Moderate', 'ONEIL_EPS_ACCEL', 'eps_accel_weight_pct', 20, 'percentage', 'Peso del EPS Acceleration en O''Neil'),

-- GRAHAM_PB (4 params)
(35, 'Moderate', 'GRAHAM_PB', 'pb_excellent', 1.00, 'ratio', 'P/B ratio excelente'),
(36, 'Moderate', 'GRAHAM_PB', 'pb_good', 1.50, 'ratio', 'P/B ratio bueno'),
(37, 'Moderate', 'GRAHAM_PB', 'pb_acceptable', 2.50, 'ratio', 'P/B ratio aceptable'),
(38, 'Moderate', 'GRAHAM_PB', 'pb_weight_pct', 30, 'percentage', 'Peso del P/B en Graham score'),

-- GRAHAM_CURRENT_RATIO (4 params)
(39, 'Moderate', 'GRAHAM_CURRENT_RATIO', 'current_ratio_excellent', 2.50, 'ratio', 'Current Ratio excelente'),
(40, 'Moderate', 'GRAHAM_CURRENT_RATIO', 'current_ratio_good', 2.00, 'ratio', 'Current Ratio bueno'),
(41, 'Moderate', 'GRAHAM_CURRENT_RATIO', 'current_ratio_acceptable', 1.50, 'ratio', 'Current Ratio aceptable'),
(42, 'Moderate', 'GRAHAM_CURRENT_RATIO', 'current_ratio_weight_pct', 25, 'percentage', 'Peso del Current Ratio en Graham'),

-- GRAHAM_DEBT (4 params)
(43, 'Moderate', 'GRAHAM_DEBT', 'debt_equity_excellent', 0.30, 'ratio', 'Debt/Equity excelente'),
(44, 'Moderate', 'GRAHAM_DEBT', 'debt_equity_good', 0.50, 'ratio', 'Debt/Equity bueno'),
(45, 'Moderate', 'GRAHAM_DEBT', 'debt_equity_acceptable', 1.00, 'ratio', 'Debt/Equity aceptable'),
(46, 'Moderate', 'GRAHAM_DEBT', 'debt_equity_weight_pct', 25, 'percentage', 'Peso del D/E en Graham'),

-- GRAHAM_STABILITY (1 param)
(47, 'Moderate', 'GRAHAM_STABILITY', 'stability_weight_pct', 20, 'percentage', 'Peso de Stability en Graham'),

-- SIGNALS (3 params)
(48, 'Moderate', 'SIGNALS', 'strong_buy_threshold', 85, 'score', 'Umbral para STRONG BUY'),
(49, 'Moderate', 'SIGNALS', 'buy_threshold', 70, 'score', 'Umbral para BUY'),
(50, 'Moderate', 'SIGNALS', 'hold_threshold', 50, 'score', 'Umbral para HOLD (debajo = SELL)');

-- ============================================================================
-- INSERT CONSERVATIVE SCENARIO (48 parameters - más estrictos)
-- ============================================================================
INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
(parameter_id, scenario_name, category, parameter_name, parameter_value, parameter_unit, description)
VALUES
-- GENERAL (más estrictos)
(51, 'Conservative', 'GENERAL', 'market_cap_min_m', 2000, 'millions', 'Market cap mínimo - conservador'),
(52, 'Conservative', 'GENERAL', 'volume_daily_min_k', 1000, 'thousands', 'Volumen mínimo - conservador'),
(53, 'Conservative', 'GENERAL', 'price_min', 10.00, 'usd', 'Precio mínimo - conservador'),
(54, 'Conservative', 'GENERAL', 'revenue_annual_min_m', 500, 'millions', 'Revenue mínimo - conservador'),
(55, 'Conservative', 'GENERAL', 'data_quality_min', 0.80, 'ratio', 'Calidad datos mínima - conservador'),

-- WEIGHTS
(56, 'Conservative', 'WEIGHTS', 'lynch_weight_pct', 30, 'percentage', 'Lynch weight - conservador'),
(57, 'Conservative', 'WEIGHTS', 'oneil_weight_pct', 30, 'percentage', 'O''Neil weight - conservador'),
(58, 'Conservative', 'WEIGHTS', 'graham_weight_pct', 40, 'percentage', 'Graham weight - conservador (mayor)'),

-- LYNCH_PEG (más estrictos)
(59, 'Conservative', 'LYNCH_PEG', 'peg_excellent', 0.40, 'ratio', 'PEG excelente - conservador'),
(60, 'Conservative', 'LYNCH_PEG', 'peg_good', 0.80, 'ratio', 'PEG bueno - conservador'),
(61, 'Conservative', 'LYNCH_PEG', 'peg_acceptable', 1.20, 'ratio', 'PEG aceptable - conservador'),
(62, 'Conservative', 'LYNCH_PEG', 'peg_weight_pct', 30, 'percentage', 'PEG weight'),

-- LYNCH_ROE (más estrictos)
(63, 'Conservative', 'LYNCH_ROE', 'roe_excellent', 25, 'percentage', 'ROE excelente - conservador'),
(64, 'Conservative', 'LYNCH_ROE', 'roe_good', 20, 'percentage', 'ROE bueno - conservador'),
(65, 'Conservative', 'LYNCH_ROE', 'roe_acceptable', 15, 'percentage', 'ROE aceptable - conservador'),
(66, 'Conservative', 'LYNCH_ROE', 'roe_weight_pct', 25, 'percentage', 'ROE weight'),

-- LYNCH_EPS_GROWTH
(67, 'Conservative', 'LYNCH_EPS_GROWTH', 'eps_growth_excellent', 25, 'percentage', 'EPS Growth excelente - conservador'),
(68, 'Conservative', 'LYNCH_EPS_GROWTH', 'eps_growth_good', 18, 'percentage', 'EPS Growth bueno - conservador'),
(69, 'Conservative', 'LYNCH_EPS_GROWTH', 'eps_growth_acceptable', 12, 'percentage', 'EPS Growth aceptable - conservador'),
(70, 'Conservative', 'LYNCH_EPS_GROWTH', 'eps_growth_weight_pct', 25, 'percentage', 'EPS Growth weight'),

-- LYNCH_REVENUE_GROWTH
(71, 'Conservative', 'LYNCH_REVENUE_GROWTH', 'revenue_growth_weight_pct', 20, 'percentage', 'Revenue Growth weight'),

-- ONEIL_RS
(72, 'Conservative', 'ONEIL_RS', 'rs_excellent', 90, 'score', 'RS excelente - conservador'),
(73, 'Conservative', 'ONEIL_RS', 'rs_good', 80, 'score', 'RS bueno - conservador'),
(74, 'Conservative', 'ONEIL_RS', 'rs_acceptable', 65, 'score', 'RS aceptable - conservador'),
(75, 'Conservative', 'ONEIL_RS', 'rs_weight_pct', 35, 'percentage', 'RS weight'),

-- ONEIL_VOLUME
(76, 'Conservative', 'ONEIL_VOLUME', 'volume_surge_excellent', 250, 'percentage', 'Volume surge excelente - conservador'),
(77, 'Conservative', 'ONEIL_VOLUME', 'volume_surge_good', 180, 'percentage', 'Volume surge bueno - conservador'),
(78, 'Conservative', 'ONEIL_VOLUME', 'volume_surge_acceptable', 120, 'percentage', 'Volume surge aceptable - conservador'),
(79, 'Conservative', 'ONEIL_VOLUME', 'volume_weight_pct', 25, 'percentage', 'Volume weight'),

-- ONEIL_MOMENTUM
(80, 'Conservative', 'ONEIL_MOMENTUM', 'price_near_high_excellent', 3, 'percentage', 'Near high excelente - conservador'),
(81, 'Conservative', 'ONEIL_MOMENTUM', 'price_near_high_good', 7, 'percentage', 'Near high bueno - conservador'),
(82, 'Conservative', 'ONEIL_MOMENTUM', 'price_near_high_acceptable', 15, 'percentage', 'Near high aceptable - conservador'),
(83, 'Conservative', 'ONEIL_MOMENTUM', 'momentum_weight_pct', 20, 'percentage', 'Momentum weight'),

-- ONEIL_EPS_ACCEL
(84, 'Conservative', 'ONEIL_EPS_ACCEL', 'eps_accel_weight_pct', 20, 'percentage', 'EPS Accel weight'),

-- GRAHAM_PB (más estrictos)
(85, 'Conservative', 'GRAHAM_PB', 'pb_excellent', 0.80, 'ratio', 'P/B excelente - conservador'),
(86, 'Conservative', 'GRAHAM_PB', 'pb_good', 1.20, 'ratio', 'P/B bueno - conservador'),
(87, 'Conservative', 'GRAHAM_PB', 'pb_acceptable', 2.00, 'ratio', 'P/B aceptable - conservador'),
(88, 'Conservative', 'GRAHAM_PB', 'pb_weight_pct', 30, 'percentage', 'P/B weight'),

-- GRAHAM_CURRENT_RATIO
(89, 'Conservative', 'GRAHAM_CURRENT_RATIO', 'current_ratio_excellent', 3.00, 'ratio', 'CR excelente - conservador'),
(90, 'Conservative', 'GRAHAM_CURRENT_RATIO', 'current_ratio_good', 2.50, 'ratio', 'CR bueno - conservador'),
(91, 'Conservative', 'GRAHAM_CURRENT_RATIO', 'current_ratio_acceptable', 2.00, 'ratio', 'CR aceptable - conservador'),
(92, 'Conservative', 'GRAHAM_CURRENT_RATIO', 'current_ratio_weight_pct', 25, 'percentage', 'CR weight'),

-- GRAHAM_DEBT
(93, 'Conservative', 'GRAHAM_DEBT', 'debt_equity_excellent', 0.20, 'ratio', 'D/E excelente - conservador'),
(94, 'Conservative', 'GRAHAM_DEBT', 'debt_equity_good', 0.40, 'ratio', 'D/E bueno - conservador'),
(95, 'Conservative', 'GRAHAM_DEBT', 'debt_equity_acceptable', 0.70, 'ratio', 'D/E aceptable - conservador'),
(96, 'Conservative', 'GRAHAM_DEBT', 'debt_equity_weight_pct', 25, 'percentage', 'D/E weight'),

-- GRAHAM_STABILITY
(97, 'Conservative', 'GRAHAM_STABILITY', 'stability_weight_pct', 20, 'percentage', 'Stability weight'),

-- SIGNALS (más estrictos)
(98, 'Conservative', 'SIGNALS', 'strong_buy_threshold', 90, 'score', 'STRONG BUY - conservador'),
(99, 'Conservative', 'SIGNALS', 'buy_threshold', 80, 'score', 'BUY - conservador'),
(100, 'Conservative', 'SIGNALS', 'hold_threshold', 60, 'score', 'HOLD - conservador');

-- ============================================================================
-- INSERT AGGRESSIVE SCENARIO (48 parameters - más permisivos)
-- ============================================================================
INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
(parameter_id, scenario_name, category, parameter_name, parameter_value, parameter_unit, description)
VALUES
-- GENERAL (más permisivos)
(101, 'Aggressive', 'GENERAL', 'market_cap_min_m', 100, 'millions', 'Market cap mínimo - agresivo'),
(102, 'Aggressive', 'GENERAL', 'volume_daily_min_k', 200, 'thousands', 'Volumen mínimo - agresivo'),
(103, 'Aggressive', 'GENERAL', 'price_min', 2.00, 'usd', 'Precio mínimo - agresivo'),
(104, 'Aggressive', 'GENERAL', 'revenue_annual_min_m', 50, 'millions', 'Revenue mínimo - agresivo'),
(105, 'Aggressive', 'GENERAL', 'data_quality_min', 0.60, 'ratio', 'Calidad datos mínima - agresivo'),

-- WEIGHTS (mayor peso a momentum)
(106, 'Aggressive', 'WEIGHTS', 'lynch_weight_pct', 30, 'percentage', 'Lynch weight - agresivo'),
(107, 'Aggressive', 'WEIGHTS', 'oneil_weight_pct', 45, 'percentage', 'O''Neil weight - agresivo (mayor)'),
(108, 'Aggressive', 'WEIGHTS', 'graham_weight_pct', 25, 'percentage', 'Graham weight - agresivo'),

-- LYNCH_PEG (más permisivos)
(109, 'Aggressive', 'LYNCH_PEG', 'peg_excellent', 0.70, 'ratio', 'PEG excelente - agresivo'),
(110, 'Aggressive', 'LYNCH_PEG', 'peg_good', 1.30, 'ratio', 'PEG bueno - agresivo'),
(111, 'Aggressive', 'LYNCH_PEG', 'peg_acceptable', 2.00, 'ratio', 'PEG aceptable - agresivo'),
(112, 'Aggressive', 'LYNCH_PEG', 'peg_weight_pct', 30, 'percentage', 'PEG weight'),

-- LYNCH_ROE
(113, 'Aggressive', 'LYNCH_ROE', 'roe_excellent', 15, 'percentage', 'ROE excelente - agresivo'),
(114, 'Aggressive', 'LYNCH_ROE', 'roe_good', 12, 'percentage', 'ROE bueno - agresivo'),
(115, 'Aggressive', 'LYNCH_ROE', 'roe_acceptable', 8, 'percentage', 'ROE aceptable - agresivo'),
(116, 'Aggressive', 'LYNCH_ROE', 'roe_weight_pct', 25, 'percentage', 'ROE weight'),

-- LYNCH_EPS_GROWTH
(117, 'Aggressive', 'LYNCH_EPS_GROWTH', 'eps_growth_excellent', 40, 'percentage', 'EPS Growth excelente - agresivo'),
(118, 'Aggressive', 'LYNCH_EPS_GROWTH', 'eps_growth_good', 25, 'percentage', 'EPS Growth bueno - agresivo'),
(119, 'Aggressive', 'LYNCH_EPS_GROWTH', 'eps_growth_acceptable', 15, 'percentage', 'EPS Growth aceptable - agresivo'),
(120, 'Aggressive', 'LYNCH_EPS_GROWTH', 'eps_growth_weight_pct', 25, 'percentage', 'EPS Growth weight'),

-- LYNCH_REVENUE_GROWTH
(121, 'Aggressive', 'LYNCH_REVENUE_GROWTH', 'revenue_growth_weight_pct', 20, 'percentage', 'Revenue Growth weight'),

-- ONEIL_RS (más permisivos)
(122, 'Aggressive', 'ONEIL_RS', 'rs_excellent', 80, 'score', 'RS excelente - agresivo'),
(123, 'Aggressive', 'ONEIL_RS', 'rs_good', 60, 'score', 'RS bueno - agresivo'),
(124, 'Aggressive', 'ONEIL_RS', 'rs_acceptable', 40, 'score', 'RS aceptable - agresivo'),
(125, 'Aggressive', 'ONEIL_RS', 'rs_weight_pct', 35, 'percentage', 'RS weight'),

-- ONEIL_VOLUME
(126, 'Aggressive', 'ONEIL_VOLUME', 'volume_surge_excellent', 150, 'percentage', 'Volume surge excelente - agresivo'),
(127, 'Aggressive', 'ONEIL_VOLUME', 'volume_surge_good', 100, 'percentage', 'Volume surge bueno - agresivo'),
(128, 'Aggressive', 'ONEIL_VOLUME', 'volume_surge_acceptable', 50, 'percentage', 'Volume surge aceptable - agresivo'),
(129, 'Aggressive', 'ONEIL_VOLUME', 'volume_weight_pct', 25, 'percentage', 'Volume weight'),

-- ONEIL_MOMENTUM
(130, 'Aggressive', 'ONEIL_MOMENTUM', 'price_near_high_excellent', 10, 'percentage', 'Near high excelente - agresivo'),
(131, 'Aggressive', 'ONEIL_MOMENTUM', 'price_near_high_good', 20, 'percentage', 'Near high bueno - agresivo'),
(132, 'Aggressive', 'ONEIL_MOMENTUM', 'price_near_high_acceptable', 35, 'percentage', 'Near high aceptable - agresivo'),
(133, 'Aggressive', 'ONEIL_MOMENTUM', 'momentum_weight_pct', 20, 'percentage', 'Momentum weight'),

-- ONEIL_EPS_ACCEL
(134, 'Aggressive', 'ONEIL_EPS_ACCEL', 'eps_accel_weight_pct', 20, 'percentage', 'EPS Accel weight'),

-- GRAHAM_PB (más permisivos)
(135, 'Aggressive', 'GRAHAM_PB', 'pb_excellent', 1.50, 'ratio', 'P/B excelente - agresivo'),
(136, 'Aggressive', 'GRAHAM_PB', 'pb_good', 2.50, 'ratio', 'P/B bueno - agresivo'),
(137, 'Aggressive', 'GRAHAM_PB', 'pb_acceptable', 4.00, 'ratio', 'P/B aceptable - agresivo'),
(138, 'Aggressive', 'GRAHAM_PB', 'pb_weight_pct', 30, 'percentage', 'P/B weight'),

-- GRAHAM_CURRENT_RATIO
(139, 'Aggressive', 'GRAHAM_CURRENT_RATIO', 'current_ratio_excellent', 2.00, 'ratio', 'CR excelente - agresivo'),
(140, 'Aggressive', 'GRAHAM_CURRENT_RATIO', 'current_ratio_good', 1.50, 'ratio', 'CR bueno - agresivo'),
(141, 'Aggressive', 'GRAHAM_CURRENT_RATIO', 'current_ratio_acceptable', 1.00, 'ratio', 'CR aceptable - agresivo'),
(142, 'Aggressive', 'GRAHAM_CURRENT_RATIO', 'current_ratio_weight_pct', 25, 'percentage', 'CR weight'),

-- GRAHAM_DEBT
(143, 'Aggressive', 'GRAHAM_DEBT', 'debt_equity_excellent', 0.50, 'ratio', 'D/E excelente - agresivo'),
(144, 'Aggressive', 'GRAHAM_DEBT', 'debt_equity_good', 0.80, 'ratio', 'D/E bueno - agresivo'),
(145, 'Aggressive', 'GRAHAM_DEBT', 'debt_equity_acceptable', 1.50, 'ratio', 'D/E aceptable - agresivo'),
(146, 'Aggressive', 'GRAHAM_DEBT', 'debt_equity_weight_pct', 25, 'percentage', 'D/E weight'),

-- GRAHAM_STABILITY
(147, 'Aggressive', 'GRAHAM_STABILITY', 'stability_weight_pct', 20, 'percentage', 'Stability weight'),

-- SIGNALS (más permisivos)
(148, 'Aggressive', 'SIGNALS', 'strong_buy_threshold', 80, 'score', 'STRONG BUY - agresivo'),
(149, 'Aggressive', 'SIGNALS', 'buy_threshold', 65, 'score', 'BUY - agresivo'),
(150, 'Aggressive', 'SIGNALS', 'hold_threshold', 40, 'score', 'HOLD - agresivo');

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================
-- Count by scenario
SELECT scenario_name, COUNT(*) as param_count
FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
GROUP BY scenario_name
ORDER BY scenario_name;

-- Count by category (Moderate only)
SELECT category, COUNT(*) as param_count
FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
WHERE scenario_name = 'Moderate'
GROUP BY category
ORDER BY category;

-- Sample data
SELECT *
FROM `sunny-advantage-471523-b3.IS_Fundamentales.parametros_trinity`
WHERE scenario_name = 'Moderate'
ORDER BY parameter_id
LIMIT 20;

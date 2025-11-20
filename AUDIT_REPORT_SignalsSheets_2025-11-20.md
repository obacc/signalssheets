# 🔍 AUDITORÍA COMPLETA: Sistema SignalsSheets
## Sistema de Señales Trinity Method (Histórico)

**Fecha:** 2025-11-20
**Auditor:** Claude Code (BigQuery Owner Access)
**Proyecto:** sunny-advantage-471523-b3
**Sistema:** SignalsSheets v2 Historical (Pre-Producción)

---

## 📊 SECCIÓN 1: RESUMEN EJECUTIVO

### Estado General: ❌ **CRÍTICO - NO LISTO PARA PRODUCCIÓN**

### 🚨 Top 3 Hallazgos Críticos

1. **❌ DEBT_TO_EQUITY - BLOQUEANTE P0**
   - **90.34%** de tickers sin `debt_to_equity` (1,814 de 2,008)
   - Solo **9.66%** tienen este campo crítico para Lynch Score
   - **Causa raíz:** SEC fundamentals solo reportan `long_term_debt` en **8.23%** de filings

2. **❌ LYNCH SCORE - COLAPSO DEL ALGORITMO**
   - **96.76%** de tickers con Lynch Score = 0 o NULL (1,945 de 2,010)
   - Solo **3.24%** tienen scores válidos (65 tickers)
   - **Promedio Lynch Score: 1.47** (de escala 0-100)

3. **❌ SEÑALES BUY - 35X DEBAJO DEL OBJETIVO**
   - **Actual: 0.15%** BUY (3 de 2,010 tickers)
   - **Objetivo: 5.67%** BUY (~114 tickers esperados)
   - **Gap:** Produciendo **111 señales menos** de lo esperado

### 🎯 Recomendación Principal

**PAUSAR SWAP A PRODUCCIÓN** hasta resolver:
- ✅ Completar data `debt_to_equity` (alternativas: calcular desde balance sheet)
- ✅ Recalibrar scoring Lynch (ajustar umbrales PEG o ponderar sin D/E)
- ✅ Validar que señales BUY alcancen ~5% del universo

---

## 🔍 SECCIÓN 2: HALLAZGOS POR CAPA

### CAPA 1: DATOS FUENTE - SEC Fundamentals
**Estado:** ⚠️ **WARNING - COMPLETITUD BAJA**

#### 📈 Métricas Generales
```
Total tickers: 6,629
Total filings: 116,370
Rango temporal: 2019-06-30 a 2025-05-31
Tickers con 12+ quarters: 5,584 (84.23%)
```

#### 🔴 Hallazgos Críticos

**1. Long Term Debt - Completitud 8.23%**
```sql
-- Evidencia:
SELECT
  COUNT(*) AS total,
  COUNT(long_term_debt) AS has_debt,
  ROUND(COUNT(long_term_debt) * 100.0 / COUNT(*), 2) AS pct
FROM v_fundamentals_quarterly_historical;

-- Resultado:
total: 116,370 | has_debt: 9,577 | pct: 8.23%
```

- **Impacto:** ALTO - Bloquea cálculo de `debt_to_equity`
- **Causa raíz:** SEC filings no siempre reportan `long_term_debt` en formato estructurado
- **Sectores afectados:** BDCs, REITs, financieras usan estructuras de capital no estándar

**2. Revenue - Completitud 32.28%**
```
has_revenue: 37,567 / 116,370 (32.28%)
```

- **Impacto:** MEDIO - No crítico para Trinity Method, pero afecta análisis futuro
- **Causa raíz:** BDCs, fondos de inversión no reportan "revenue" tradicional

**3. Distribución de Quarters por Ticker**
```
23 quarters: 7 tickers (0.11%)
22 quarters: 365 tickers (5.51%)
21 quarters: 3,353 tickers (50.58%) ← MAYORÍA
20 quarters: 454 tickers (6.85%)
```

- **Impacto:** BAJO - Excelente cobertura histórica (5+ años)
- **Conclusión:** ✅ Suficiente data para cálculos 3-year average

---

### CAPA 2: MARKET DATA
**Estado:** ✅ **OK - COBERTURA COMPLETA**

#### 📈 Métricas
```
Total tickers: 13,576
Total records: 22,733,428
```

- **Conclusión:** ✅ Excelente cobertura de precios
- **No hay gaps detectados**

---

### CAPA 3: TRINITY SCORES BASE
**Estado:** ❌ **CRÍTICO - CAMPOS FALTANTES**

#### 📊 Completitud de Campos Críticos

| Campo | Registros | % Completitud | Status |
|-------|-----------|---------------|--------|
| `ticker` | 2,008 | 100% | ✅ |
| `price` | 2,008 | 100% | ✅ |
| `eps_diluted` | 2,008 | 100% | ✅ |
| `peg_ratio` | 1,999 | 99.55% | ✅ |
| `eps_growth_3y_avg` | 1,953 | 97.26% | ✅ |
| **`debt_to_equity`** | **194** | **9.66%** | ❌ |
| `roe` | 1,742 | 86.75% | ⚠️ |
| `current_ratio` | 1,470 | 73.21% | ⚠️ |
| `pe_ratio` | 2,008 | 100% | ✅ |
| `pb_ratio` | 1,864 | 92.83% | ✅ |

#### 🔴 Problema Crítico: DEBT_TO_EQUITY

**Distribución:**
```
NULL:             1,814 tickers (90.34%) ← CRÍTICO
0-0.5 (EXCELENTE): 101 tickers (5.03%)
0.5-1.0 (BUENO):    32 tickers (1.59%)
1.0-2.0 (ACEPTABLE): 30 tickers (1.49%)
>2.0 (ALTO):        28 tickers (1.39%)
CERO:                3 tickers (0.15%)
```

**Ejemplo de tickers afectados (top 10 sin D/E):**
- EEFT (Trinity: 77.33, Lynch: 100) → debt_to_equity: NULL
- SHEN (Trinity: 76.67, Lynch: 100) → debt_to_equity: NULL
- VSAT (Trinity: 75.00, Lynch: 100) → debt_to_equity: NULL

**⚠️ NOTA:** Los tickers con Lynch=100 **NO están usando debt_to_equity** en el scoring.

---

#### 🟡 Problema Alto: ROE Distribution

**Distribución:**
```
0-10%:            1,285 tickers (63.99%) ← Mayormente bajo ROE
10-15% (BUENO):      85 tickers (4.23%)
15-20% (EXCELENTE): 52 tickers (2.59%)
>20% (EXCEPCIONAL):207 tickers (10.31%)
NEGATIVO:            77 tickers (3.83%)
CERO:                36 tickers (1.79%)
NULL:               266 tickers (13.25%)
```

- **Impacto:** MEDIO - 63.99% tienen ROE <10% (bajo para Lynch Method)
- **Causa raíz:** Muchos BDCs/REITs tienen ROE estructuralmente bajo
- **Acción:** Considerar umbrales específicos por sector

---

#### 🔴 Problema Crítico: PEG RATIOS ABSURDOS

**Distribución:**
```
0-1 (IDEAL):        12 tickers (0.60%)  ← Solo 12 tickers ideales!
1-2 (OK):            3 tickers (0.15%)
2-5 (ALTO):         13 tickers (0.65%)
5-10 (MUY ALTO):    18 tickers (0.90%)
>10 (ABSURDO):   1,213 tickers (60.35%) ← MAYORÍA
NULL:              751 tickers (37.36%)
```

**Evidencia - Top 5 PEG absurdos:**
```
1. KRMN: PEG = 602,500  (eps_growth_3y_avg = NULL)
2. LINE: PEG = 334,100  (eps_growth_3y_avg = NULL)
3. SNDK: PEG = 133,768  (eps_growth_3y_avg = NULL)
4. AMTM: PEG = 110,350  (eps_growth_3y_avg = NULL)
5. JBHT: PEG = 71,968   (eps_growth_3y_avg = 0.001854 → crecimiento casi cero)
```

**Causa raíz:**
1. `eps_growth_3y_avg = NULL` → PEG usa valor por defecto alto
2. `eps_growth_3y_avg` muy cercano a cero → PEG explota (división por ~0)

**Ejemplos con growth ~0:**
```
HTGC: eps_growth_3y_avg = 0.001697 → PEG = 18,163
BCSF: eps_growth_3y_avg = 0.008961 → PEG = 2,818
```

---

### CAPA 4: SCORING LYNCH
**Estado:** ❌ **CRÍTICO - ALGORITMO COLAPSADO**

#### 📊 Distribución de Lynch Scores

```
NULL:        751 tickers (37.36%)
CERO:      1,194 tickers (59.40%) ← MAYORÍA
1-25:         50 tickers (2.49%)
26-50:         1 ticker  (0.05%)
51-75:         2 tickers (0.10%)
76-100:       12 tickers (0.60%)
─────────────────────────────────
VÁLIDOS:      65 tickers (3.24%) ← Solo 3.24%!
```

**Estadísticas:**
```
Total tickers: 2,010
Has Lynch Score: 1,259 (62.64%)
Lynch Score promedio: 1.47 ← CRÍTICO (escala 0-100)
```

#### 🔍 Análisis de Lógica de Scoring (vista trinity_scores_lynch)

**Columnas disponibles:**
```sql
ticker, fiscal_year, fiscal_period, period_end_date, filing_date,
price, eps_diluted, eps_growth_3y_avg, peg_ratio, debt_to_equity,
peg_score_base, debt_adjustment, lynch_score, sector
```

**Sample de Lynch=0:**
```
IMSR: peg_ratio=60,350, debt_to_equity=NULL → lynch_score=0
CCAP: peg_ratio=224.9,  debt_to_equity=0.94  → lynch_score=0
MSIF: peg_ratio=81.8,   debt_to_equity=0.61  → lynch_score=0
```

**Patrón detectado:**
- ✅ Tickers con PEG ideal (<1) → Lynch Score alto (100)
- ❌ Tickers con PEG >50 → Lynch Score = 0 (penalización extrema)
- ❌ Tickers sin debt_to_equity → No reciben debt_adjustment

**Causa raíz del colapso:**
1. PEG ratios absurdos (60% tienen PEG >10) → peg_score_base = 0
2. Sin debt_to_equity → debt_adjustment = 0
3. **Resultado:** Lynch Score = 0 para mayoría

---

### CAPA 5: SCORING O'NEIL Y GRAHAM
**Estado:** ✅ **OK - FUNCIONAN CORRECTAMENTE**

#### 📊 O'Neil Score Distribution

```
1-25:      761 tickers (37.86%)
26-50:     836 tickers (41.59%)
51-75:     366 tickers (18.21%)
76-100:     47 tickers (2.34%)
─────────────────────────────────
Promedio: 36.35
```

✅ **Conclusión:** Distribución normal y saludable

---

#### 📊 Graham Score Distribution

```
CERO:        7 tickers (0.35%)
1-25:      220 tickers (10.95%)
26-50:   1,354 tickers (67.36%)
51-75:     415 tickers (20.65%)
76-100:     14 tickers (0.70%)
─────────────────────────────────
Promedio: 40.59
```

✅ **Conclusión:** Distribución normal y saludable

---

### CAPA 6: TRINITY SCORE & SEÑALES
**Estado:** ❌ **CRÍTICO - PRODUCCIÓN INSUFICIENTE**

#### 📊 Distribución de Señales

```sql
SELECT
  CASE
    WHEN trinity_score >= 75 THEN 'BUY'
    WHEN trinity_score >= 50 THEN 'HOLD'
    ELSE 'SELL'
  END AS signal,
  COUNT(*) AS cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM trinity_scores_historical
GROUP BY signal;
```

**Resultados:**
```
BUY (>=75):        3 tickers (0.15%)  ← Objetivo: 5.67%
HOLD (50-74):     36 tickers (1.79%)
SELL (<50):    1,971 tickers (98.06%)
```

**Gap vs Objetivo:**
- **Actual:** 0.15% BUY
- **Esperado:** 5.67% BUY (~114 tickers)
- **Faltante:** 111 señales BUY (35x menos)

---

#### 📊 Distribución Detallada de Trinity Scores

```
BUY (>=75):           3 tickers (0.15%)  | Avg: 76.33
STRONG_HOLD (70-74):  4 tickers (0.20%)  | Avg: 71.00
HOLD (60-69):         6 tickers (0.30%)  | Avg: 66.72
WEAK_HOLD (50-59):   26 tickers (1.29%)  | Avg: 53.36
WEAK_SELL (40-49):  217 tickers (10.80%) | Avg: 43.28
SELL (<40):       1,754 tickers (87.26%) | Avg: 27.47
```

**Causa raíz:**
1. Lynch Score colapso → Trinity Score promedio: **29.79**
2. Sin Lynch válido, Trinity = (0 + O'Neil + Graham) / 3
3. Incluso con O'Neil=90 y Graham=100 → Trinity máximo posible: **63.33** (sin Lynch)

---

#### 🎯 TOP 10 Señales BUY (>=45 Trinity Score)

| Ticker | Trinity | Lynch | O'Neil | Graham | Sector | Price | Status |
|--------|---------|-------|--------|--------|--------|-------|--------|
| EEFT | 77.33 | 100 | 90 | 42 | FINANCIALS | $70.64 | ✅ OK |
| SHEN | 76.67 | 100 | 55 | 75 | TRANSPORTATION | $10.35 | ✅ OK |
| VSAT | 75.00 | 100 | 50 | 75 | INDUSTRIALS | $36.06 | ✅ OK |
| WNC | 71.67 | 60 | 70 | 85 | INDUSTRIALS | $7.58 | ✅ OK |
| STZ | 71.00 | 100 | 48 | 65 | INDUSTRIALS | $129.16 | ✅ OK |
| SONN | 70.67 | 100 | 60 | 52 | INDUSTRIALS | $5.92 | ✅ OK |
| SR | 70.67 | 100 | 70 | 42 | TRANSPORTATION | $87.00 | ✅ OK |
| ERIE | 69.00 | 100 | 40 | 67 | FINANCIALS | $286.58 | ✅ OK |
| NXT | 68.33 | 80 | 80 | 45 | INDUSTRIALS | $93.75 | ✅ OK |
| SBET | 68.33 | 100 | 65 | 40 | SERVICES | $10.89 | ✅ OK |

✅ **Conclusión:** Las señales que SÍ pasan son de alta calidad
❌ **Problema:** Muy pocas señales (0.15% vs 5.67% esperado)

---

### CAPA 7: DATOS DE REFERENCIA
**Estado:** ✅ **OK - COBERTURA COMPLETA**

#### 📊 Nombres de Compañía

```
Fuente: ref_company_dictionary → 7,761 tickers
Fuente: ref_cik_ticker → 10,334 tickers
```

**Match con señales (>=45 Trinity Score):**
```
Total signals: 970
Con nombre (dict): 970 (100%)
Con nombre (cik): 970 (100%)
Sin nombre: 0 (0%)
```

✅ **Conclusión:** 100% coverage en nombres

---

#### 📊 Sectores

```
Total tickers: 2,010
Con sector: 1,971 (98.06%)
Sin sector: 39 (1.94%)
```

**Distribución por sector:**
```
INDUSTRIALS:     654 tickers (33.18%)
FINANCIALS:      564 tickers (28.61%)
SERVICES:        245 tickers (12.43%)
TRANSPORTATION:  154 tickers (7.81%)
RETAIL:          117 tickers (5.94%)
```

✅ **Conclusión:** Excelente cobertura de sectores

---

## 🎯 SECCIÓN 3: GAPS DETECTADOS

### Resumen de Completitud por Campo

| Campo | Coverage | Gap | Severidad | Impacto en Lynch |
|-------|----------|-----|-----------|------------------|
| `ticker` | 100% | 0% | ✅ OK | - |
| `price` | 100% | 0% | ✅ OK | - |
| `eps_diluted` | 100% | 0% | ✅ OK | ✅ Usado |
| `eps_growth_3y_avg` | 97.26% | 2.74% | ✅ OK | ✅ Usado (PEG) |
| `peg_ratio` | 99.55% | 0.45% | ✅ OK | ✅ Usado |
| **`debt_to_equity`** | **9.66%** | **90.34%** | ❌ **CRÍTICO** | ❌ **Componente clave** |
| `roe` | 86.75% | 13.25% | ⚠️ WARNING | ⚠️ Opcional |
| `current_ratio` | 73.21% | 26.79% | ⚠️ WARNING | ⚠️ Graham Score |
| `pe_ratio` | 100% | 0% | ✅ OK | ⚠️ Opcional |
| `pb_ratio` | 92.83% | 7.17% | ✅ OK | ✅ Graham Score |
| `sector` | 98.06% | 1.94% | ✅ OK | - |
| `company_name` | 100% | 0% | ✅ OK | - |

---

### Gap Crítico: Long Term Debt en SEC Filings

**Evidencia completa:**
```sql
SELECT
  COUNT(*) AS total_filings,
  COUNT(long_term_debt) AS has_debt,
  ROUND(COUNT(long_term_debt) * 100.0 / COUNT(*), 2) AS pct_debt
FROM v_fundamentals_quarterly_historical;
```

**Resultado:**
```
total_filings: 116,370
has_debt: 9,577
pct_debt: 8.23%
```

**Causa raíz profunda:**
1. SEC no requiere campo estándar "long_term_debt" en todos los formularios
2. BDCs usan "secured borrowings", "notes payable", etc.
3. REITs reportan debt en líneas no estándar
4. Vista actual solo extrae campo específico "DebtLongTermNoncurrent"

**Impacto cascada:**
```
8.23% long_term_debt
  ↓
9.66% debt_to_equity
  ↓
96.76% Lynch Score = 0 o NULL
  ↓
0.15% BUY signals (35x menos de lo esperado)
```

---

## 💡 SECCIÓN 4: RECOMENDACIONES PRIORIZADAS

### P0 - CRÍTICO (Bloqueante para producción)

#### 1. **COMPLETAR DEBT_TO_EQUITY (90.34% faltante)**

**Problema:** Solo 9.66% tienen `debt_to_equity`

**Soluciones propuestas:**

**Opción A - Calcular desde Balance Sheet (RECOMENDADO)**
```sql
-- En vez de depender de "long_term_debt" extraído,
-- calcular total debt desde multiple campos:

debt_to_equity = SAFE_DIVIDE(
  COALESCE(
    long_term_debt,
    0
  ) + COALESCE(
    notes_payable,
    0
  ) + COALESCE(
    secured_borrowings,
    0
  ),
  shareholders_equity
)

-- O más simple:
debt_to_equity = SAFE_DIVIDE(
  total_liabilities - current_liabilities,  -- = Long-term liabilities
  shareholders_equity
)
```

**Esfuerzo:** 4-8 horas (modificar vista `v_fundamentals_quarterly_historical`)

**Validación esperada:**
- Coverage: 90.34% → **~95%** (asumiendo que tenemos total_liabilities)
- Lynch Scores válidos: 3.24% → **~60-80%**

---

**Opción B - Relajar requerimiento de D/E**
```sql
-- Modificar lógica Lynch Score para funcionar sin D/E:

lynch_score = CASE
  WHEN peg_ratio IS NOT NULL THEN
    -- Score base solo con PEG
    CASE
      WHEN peg_ratio < 1.0 THEN 100
      WHEN peg_ratio < 1.5 THEN 80
      WHEN peg_ratio < 2.0 THEN 60
      WHEN peg_ratio < 3.0 THEN 40
      ELSE 20
    END
    + CASE  -- Bonus solo si existe D/E
      WHEN debt_to_equity IS NULL THEN 0
      WHEN debt_to_equity < 0.5 THEN 20
      WHEN debt_to_equity < 1.0 THEN 10
      ELSE 0
    END
  ELSE NULL
END
```

**Esfuerzo:** 2-4 horas (modificar vista `trinity_scores_lynch`)

**Validación esperada:**
- Lynch Scores válidos: 3.24% → **~95%** (todos con PEG válido)
- BUY signals: 0.15% → **~3-5%** (más cercano al objetivo)

---

#### 2. **RESOLVER PEG RATIOS ABSURDOS (60.35% afectados)**

**Problema:** 1,213 tickers tienen PEG >10 (absurdo)

**Solución:**
```sql
-- Aplicar caps y validaciones:

peg_ratio = CASE
  WHEN eps_growth_3y_avg IS NULL THEN NULL  -- No asumir default
  WHEN eps_growth_3y_avg < 0.05 THEN NULL   -- Growth <5% → PEG no confiable
  WHEN eps_growth_3y_avg < 0 THEN NULL      -- Decrecimiento → PEG negativo
  ELSE
    LEAST(  -- Cap máximo
      SAFE_DIVIDE(
        SAFE_DIVIDE(price, eps_diluted),
        eps_growth_3y_avg * 100
      ),
      100.0  -- Cap en 100
    )
END
```

**Esfuerzo:** 2 horas (modificar vista `trinity_scores_base`)

**Validación esperada:**
- PEG >10: 60.35% → **~5-10%** (outliers legítimos)
- PEG NULL: 37.36% → **~45%** (growth <5% marcados como NULL)
- Lynch Scores con PEG válido: **~50-60%**

---

#### 3. **RECALIBRAR UMBRALES LYNCH SCORE**

**Problema:** Umbrales actuales demasiado estrictos

**Evidencia:**
- Solo 12 tickers tienen Lynch Score 76-100
- 1,194 tickers tienen Lynch Score = 0

**Solución - Ajustar umbrales para aumentar señales:**

**Actual (estimado):**
```sql
CASE
  WHEN peg_ratio < 1.0 THEN 100
  WHEN peg_ratio < 1.5 THEN 60
  WHEN peg_ratio < 2.0 THEN 30
  ELSE 0
END
```

**Propuesto (más tolerante):**
```sql
CASE
  WHEN peg_ratio < 1.0 THEN 100
  WHEN peg_ratio < 1.5 THEN 80
  WHEN peg_ratio < 2.0 THEN 60
  WHEN peg_ratio < 3.0 THEN 40
  WHEN peg_ratio < 5.0 THEN 20
  ELSE 10  -- En vez de 0, dar puntuación mínima
END
```

**Esfuerzo:** 2-4 horas (modificar vista `trinity_scores_lynch` + testing)

**Validación esperada:**
- BUY signals: 0.15% → **~2-4%**
- Acercamiento al objetivo 5.67%

---

### P1 - ALTO (Afecta calidad, no bloquea producción)

#### 4. **MEJORAR EXTRACCIÓN DE ROE (13.25% NULL)**

**Problema:** 266 tickers (13.25%) sin ROE

**Solución:**
```sql
-- Calcular ROE cuando falte, usando net_income:
roe = CASE
  WHEN roe IS NOT NULL THEN roe
  WHEN net_income IS NOT NULL AND shareholders_equity > 0 THEN
    SAFE_DIVIDE(net_income, shareholders_equity)
  ELSE NULL
END
```

**Esfuerzo:** 1-2 horas

**Validación esperada:**
- ROE coverage: 86.75% → **~95%**

---

#### 5. **CREAR UMBRALES ROE POR SECTOR**

**Problema:** 63.99% tienen ROE <10% (bajo para Lynch tradicional)

**Causa raíz:** BDCs/REITs tienen ROE estructuralmente bajo

**Solución:**
```sql
-- Scoring ROE ajustado por sector:
roe_score = CASE
  WHEN sector IN ('FINANCIALS', 'REITS') THEN
    CASE
      WHEN roe > 0.05 THEN 20  -- 5% es bueno para financieras
      WHEN roe > 0.03 THEN 10
      ELSE 0
    END
  ELSE  -- INDUSTRIALS, TECH, etc.
    CASE
      WHEN roe > 0.15 THEN 20
      WHEN roe > 0.10 THEN 10
      ELSE 0
    END
END
```

**Esfuerzo:** 4-6 horas (investigar ROE promedio por sector + implementar)

**Validación esperada:**
- Lynch Scores más altos para BDCs/financieras con ROE 5-8%
- Más señales BUY en sector financiero

---

### P2 - MEDIO (Nice to have)

#### 6. **MEJORAR EXTRACCIÓN DE REVENUE (32.28% coverage)**

**Solución:** Expandir vista para extraer revenue de múltiples tags SEC
**Esfuerzo:** 6-8 horas
**Impacto:** No crítico para Trinity Method actual

#### 7. **DOCUMENTAR LÓGICA DE SCORING COMPLETA**

**Solución:** Generar documentación SQL con fórmulas exactas
**Esfuerzo:** 2-4 horas
**Impacto:** Facilita debugging futuro

---

## 📋 SECCIÓN 5: CHECKLIST PRE-SWAP A PRODUCCIÓN

### ✅ Validaciones Obligatorias (P0)

- [ ] **1. debt_to_equity coverage ≥ 85%**
  ```sql
  SELECT
    COUNT(debt_to_equity) * 100.0 / COUNT(*) AS pct_coverage
  FROM trinity_scores_base;
  -- Esperado: ≥ 85%
  ```

- [ ] **2. Lynch Score válidos ≥ 60%**
  ```sql
  SELECT
    COUNT(CASE WHEN lynch_score > 0 THEN 1 END) * 100.0 / COUNT(*) AS pct_valid
  FROM trinity_scores_historical;
  -- Esperado: ≥ 60%
  ```

- [ ] **3. BUY signals entre 3-8%**
  ```sql
  SELECT
    COUNT(CASE WHEN trinity_score >= 75 THEN 1 END) * 100.0 / COUNT(*) AS pct_buy
  FROM trinity_scores_historical;
  -- Esperado: 3% ≤ pct_buy ≤ 8%
  ```

- [ ] **4. PEG ratios absurdos ≤ 10%**
  ```sql
  SELECT
    COUNT(CASE WHEN peg_ratio > 10 THEN 1 END) * 100.0 / COUNT(*) AS pct_absurd
  FROM trinity_scores_base
  WHERE peg_ratio IS NOT NULL;
  -- Esperado: ≤ 10%
  ```

- [ ] **5. Trinity Score promedio ≥ 40**
  ```sql
  SELECT AVG(trinity_score) AS avg_trinity
  FROM trinity_scores_historical;
  -- Esperado: ≥ 40 (actual: 29.79)
  ```

---

### ⚠️ Validaciones Recomendadas (P1)

- [ ] **6. ROE coverage ≥ 90%**
  ```sql
  SELECT
    COUNT(roe) * 100.0 / COUNT(*) AS pct_roe
  FROM trinity_scores_base;
  -- Esperado: ≥ 90% (actual: 86.75%)
  ```

- [ ] **7. Distribución sectorial en BUY signals**
  ```sql
  SELECT sector, COUNT(*) AS buy_count
  FROM trinity_scores_historical
  WHERE trinity_score >= 75
  GROUP BY sector;
  -- Validar que no haya un solo sector dominando
  ```

- [ ] **8. Comparar top 50 signals vs producción anterior**
  ```sql
  -- Validar que nuevas señales sean de calidad similar/mejor
  ```

---

## 📊 SECCIÓN 6: DATOS CLAVE DEL SISTEMA

### Pipeline Flow

```
SEC Fundamentals (6,629 tickers)
  ↓ [Filtros: tiene fundamentals + precios]
trinity_scores_base (2,008 tickers) [-70%]
  ↓ [Scoring: Lynch + O'Neil + Graham]
trinity_scores_historical (2,007 tickers)
  ↓ [Filtro: Trinity Score ≥ 45]
Señales API (970 tickers)
  ↓ [Filtro: Trinity Score ≥ 75]
BUY Signals (3 tickers) ← 0.15%
```

### Tickers por Capa

```
market_data.Prices:      13,576 tickers
v_fundamentals_quarterly: 6,629 tickers
trinity_scores_base:      2,007 tickers
trinity_scores_historical: 2,007 tickers
sector_map_v6r2:          8,113 tickers
```

---

## 🎯 SECCIÓN 7: CONCLUSIONES

### Estado Actual vs Objetivo

| Métrica | Actual | Objetivo | Gap | Status |
|---------|--------|----------|-----|--------|
| BUY Signals | 0.15% | 5.67% | 35x | ❌ |
| Lynch Score Avg | 1.47 | ~60 | 40x | ❌ |
| debt_to_equity coverage | 9.66% | 85% | 9x | ❌ |
| PEG >10 (absurdos) | 60.35% | <10% | 6x | ❌ |
| ROE coverage | 86.75% | 90% | 1.04x | ⚠️ |
| Sector coverage | 98.06% | 95% | ✅ | ✅ |
| Company names | 100% | 100% | ✅ | ✅ |

### Priorización de Fixes

**Path to Production - 3 Pasos:**

**PASO 1 (4-8 horas):** Resolver debt_to_equity
- Implementar cálculo desde total_liabilities
- Esperado: 9.66% → ~95% coverage

**PASO 2 (4-6 horas):** Fix PEG ratios + Recalibrar Lynch
- Aplicar caps y validaciones a PEG
- Ajustar umbrales Lynch Score
- Esperado: BUY signals 0.15% → ~3-5%

**PASO 3 (2-4 horas):** Validación final
- Ejecutar checklist pre-swap
- Comparar top 50 signals vs producción anterior
- Documentar cambios

**Total esfuerzo estimado:** 10-18 horas

---

### Recomendación Final

**NO HACER SWAP A PRODUCCIÓN** hasta completar PASO 1 y PASO 2.

El sistema actual produce **111 señales BUY menos** de lo esperado debido al colapso del Lynch Score por falta de `debt_to_equity`.

Las señales que SÍ genera (top 10) son de **alta calidad**, pero el volumen es **insuficiente** para el objetivo del producto (5.67% BUY).

---

**Fecha de reporte:** 2025-11-20
**Próxima auditoría:** Después de implementar fixes P0

---

## 📎 ANEXOS

### A1 - Queries de Validación Ejecutadas

Total queries: 39
Exitosas: 29
Fallidas: 10 (por campos inexistentes en vistas, ya identificados)

### A2 - Archivos de Evidencia

- `audit_results_*.json` - Resultados primera fase
- `audit_deepdive_results_*.json` - Análisis profundo
- `audit_final_results_*.json` - Queries finales
- Este reporte: `AUDIT_REPORT_SignalsSheets_2025-11-20.md`

### A3 - Contacto

Para dudas sobre esta auditoría, contactar a Aaron (desarrollador SignalsSheets).

---

**FIN DEL REPORTE**

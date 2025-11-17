# 🚨 HALLAZGOS CRÍTICOS - PIPELINE EOD SIGNALSSHEETS

**Fecha del Análisis:** 2025-11-17 03:15 UTC
**Auditor:** Claude Code
**Proyecto:** sunny-advantage-471523-b3

---

## ⚠️ PROBLEMA CRÍTICO DETECTADO

### La tabla `analytics.top10_v2` NO se está actualizando

**Evidencia:**
- **Última modificación:** 2025-11-01 01:30:20 UTC (hace 16 días)
- **Hora CT:** 2025-10-31 20:30 CT
- **Registros:** 10 filas (sin cambios desde entonces)

```sql
-- Query ejecutada:
SELECT * FROM `sunny-advantage-471523-b3.analytics.top10_v2`;

-- Resultado:
Modificada: 2025-11-01 01:30:20.756000+00:00
Filas: 10
```

### Impacto

**La vista `analytics.v_api_free_signals` depende de `top10_v2`:**

```sql
-- De la definición de v_api_free_signals:
t10 AS (
  SELECT
    CURRENT_DATE() AS as_of_date,  -- ⚠️ Usa fecha actual
    t.rank,
    ...
  FROM `sunny-advantage-471523-b3.analytics.top10_v2` t  -- ⚠️ Datos de hace 16 días
)
```

**Resultado:**
- La API muestra `as_of_date: 2025-11-17` (hoy)
- Pero los scores y rankings son de 2025-11-01
- **Los usuarios están viendo datos desactualizados sin saberlo**

---

## 📊 FLUJO DE DATOS REAL ENCONTRADO

```
┌──────────────────────────────────────────────────────────────────┐
│                  PIPELINE EOD - FLUJO REAL                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FUENTES DE DATOS:                                              │
│  ┌────────────────┐                                             │
│  │ market_data    │                                             │
│  │ .Prices        │ ← Última fecha: 2025-11-14                 │
│  │                │ ← Updated_at: 2025-11-01 (!) NULL recientes│
│  └────────────────┘                                             │
│         ↓                                                        │
│  ┌────────────────┐                                             │
│  │ market_data    │                                             │
│  │ .v_Prices_canon│ ← Vista canonizada                         │
│  └────────────────┘                                             │
│         ↓                                                        │
│  ┌────────────────┐                                             │
│  │ [PROCESO ETL]  │ ← ❌ NO EJECUTÁNDOSE desde 2025-11-01      │
│  │ ??? Script ???  │                                             │
│  └────────────────┘                                             │
│         ↓                                                        │
│  ┌────────────────┐                                             │
│  │ analytics      │                                             │
│  │ .top10_v2      │ ← ❌ Última actualización: 2025-11-01      │
│  │                │    (hace 16 días)                           │
│  └────────────────┘                                             │
│         ↓                                                        │
│  ┌────────────────┐                                             │
│  │ analytics      │                                             │
│  │ .v_api_free_   │ ← Usa CURRENT_DATE()                       │
│  │  signals       │    pero datos obsoletos                    │
│  └────────────────┘                                             │
│         ↓                                                        │
│  ┌────────────────┐                                             │
│  │ Cloudflare     │                                             │
│  │ Worker         │ ← ✅ Funcionando bien (cada 10 min)        │
│  │ 'free-api'     │    pero sirviendo datos viejos             │
│  └────────────────┘                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔍 INVESTIGACIÓN NECESARIA

### 1. ¿Qué proceso actualiza `analytics.top10_v2`?

**Buscar:**
- Scheduled Query en BigQuery
- Cloud Function
- Dataform workflow
- Script manual

**Comando para investigar:**
```bash
# Listar scheduled queries
bq ls --transfer_config --project_id=sunny-advantage-471523-b3

# Buscar en Dataform
# (si existe repositorio dataform)

# Listar Cloud Functions
gcloud functions list --project=sunny-advantage-471523-b3

# Listar Cloud Scheduler jobs
gcloud scheduler jobs list --project=sunny-advantage-471523-b3
```

### 2. ¿Cuándo debería ejecutarse?

Basado en evidencia:
- Última ejecución exitosa: **2025-11-01 01:30 UTC** (20:30 CT del día anterior)
- Horario típico EOD: después del cierre de mercado USA (4:00 PM ET = 21:00 UTC)

**Horario esperado:**
- Descarga de datos: ~00:00-01:00 UTC
- Carga a Prices: ~01:00-02:00 UTC
- Cálculo de señales: ~02:00-03:00 UTC
- Actualización top10_v2: ~03:00 UTC ← **ESTO DEJÓ DE FUNCIONAR**

### 3. ¿Por qué falló desde el 2025-11-01?

**Posibles causas:**
- Scheduled Query pausada o eliminada
- Cambio en schema de tablas upstream
- Error en la lógica del cálculo
- Límites de quota/permisos
- Cloud Function deshabilitada

---

## 📋 DATOS ADICIONALES ENCONTRADOS

### Tabla `analytics.top10_v2` (actual)

| Rank | Ticker | Trinity Score | Combined Score |
|------|--------|---------------|----------------|
| 1 | A.US | 0.5 | 0.8 |
| 2 | AA.US | 0.5 | 0.8 |
| 3 | AAA.US | 0.5 | 0.8 |
| 4 | AAAU.US | 0.5 | 0.8 |
| 5 | AACB.US | 0.5 | 0.8 |
| 6 | AACBR.US | 0.5 | 0.8 |
| 7 | AACBU.US | 0.5 | 0.8 |
| 8 | AACIU.US | 0.5 | 0.8 |
| 9 | AACIW.US | 0.5 | 0.8 |
| 10 | AACT-WS.US | 0.5 | 0.8 |

**Observación:** Todos tienen los mismos scores (0.5, 0.8, 1.0), sugiere datos de prueba/placeholder.

### Vista `analytics.v_api_free_signals` (actual)

```sql
SELECT as_of_date, ticker, signal, trinity_score, price_current
FROM `sunny-advantage-471523-b3.analytics.v_api_free_signals`;
```

Resultado: **7 señales** (no 10) con `as_of_date = 2025-11-17`
- Probablemente filtradas porque no tienen precios recientes válidos

---

## ⚡ ACCIONES INMEDIATAS REQUERIDAS

### PRIORIDAD 1: Restaurar Pipeline ETL

1. **Identificar el proceso que actualiza `top10_v2`**
   ```bash
   bq ls --transfer_config --project_id=sunny-advantage-471523-b3 | grep -i "top10\|signal\|trinity"
   ```

2. **Revisar logs del 2025-11-01** (última ejecución exitosa)
   ```bash
   gcloud logging read "timestamp>=\"2025-11-01T00:00:00Z\" AND timestamp<=\"2025-11-01T04:00:00Z\"" \
     --project=sunny-advantage-471523-b3 \
     --format=json \
     | grep -i "top10\|signal"
   ```

3. **Verificar Cloud Scheduler jobs**
   ```bash
   gcloud scheduler jobs list --project=sunny-advantage-471523-b3
   gcloud scheduler jobs describe [JOB_NAME] --location=[LOCATION]
   ```

4. **Buscar Dataform workflows**
   - Revisar repositorio de Dataform (si existe)
   - Ver historial de ejecuciones

### PRIORIDAD 2: Validar Datos Upstream

**Verificar que `market_data.Prices` tiene datos recientes:**
```sql
SELECT
  MAX(fecha) as last_date,
  COUNT(*) as total_records,
  COUNT(DISTINCT ticker) as unique_tickers
FROM `sunny-advantage-471523-b3.market_data.Prices`
WHERE fecha >= '2025-11-10';
```

**Resultado actual:**
- Última fecha: 2025-11-14 ✅
- Registros: 58,060
- Tickers: 11,877

**NOTA:** Los datos de Prices están actualizados (hasta 2025-11-14), el problema es el ETL que los procesa.

### PRIORIDAD 3: Comunicación con Usuarios

**Mientras se restaura el pipeline:**
1. Añadir disclaimer en la API mostrando la fecha real de los datos
2. Considerar pausar el Worker si los datos tienen >7 días de antigüedad
3. Configurar alerta para detectar stale data automáticamente

---

## 🎯 RECOMENDACIONES

### Para el Worker (NO es el problema principal)

El Worker está funcionando correctamente:
- ✅ Cron cada 10 minutos está bien para el MVP
- ✅ Sirve los datos disponibles en `v_api_free_signals`
- ⚠️ Pero debería detectar datos obsoletos

**Cambio sugerido al Worker:**
```typescript
// Añadir validación de freshness
const signals = await fetchSignals();

const oldestSignalDate = new Date(signals[0].as_of_date);
const today = new Date();
const daysDiff = Math.floor((today - oldestSignalDate) / (1000 * 60 * 60 * 24));

if (daysDiff > 3) {
  console.warn(`⚠️ Signals are ${daysDiff} days old!`);
  // Opcional: retornar error o añadir warning en respuesta
}
```

### Para el Pipeline ETL (PROBLEMA PRINCIPAL)

**URGENTE:** Restaurar el proceso que actualiza `analytics.top10_v2`

**Una vez restaurado:**
1. Configurar monitoring/alerting
2. Documentar el proceso
3. Añadir health checks
4. Configurar retry logic

---

## 📊 TIMELINE RECONSTRUIDA

```
2025-11-01 01:30 UTC  ← Última actualización exitosa de top10_v2
     ↓
     ↓  (16 días sin actualizaciones)
     ↓
2025-11-14          ← Prices tiene datos hasta aquí
     ↓
2025-11-17 (HOY)   ← API muestra esta fecha pero datos son viejos
```

---

## ✅ CONCLUSIÓN

**El problema NO es el Worker, es el ETL upstream que dejó de ejecutarse.**

1. ✅ Worker funcionando bien (cada 10 min es adecuado)
2. ✅ Tabla Prices tiene datos recientes (hasta 2025-11-14)
3. ❌ **Proceso ETL que actualiza `top10_v2` dejó de funcionar hace 16 días**
4. ⚠️ La API está sirviendo datos obsoletos sin advertir al usuario

**Próximo paso:** Investigar qué scheduled query, Cloud Function, o Dataform workflow actualiza `analytics.top10_v2` y por qué dejó de ejecutarse el 2025-11-01.

---

**Generado por:** Claude Code - EOD Pipeline Auditor
**Fecha:** 2025-11-17 03:16 UTC

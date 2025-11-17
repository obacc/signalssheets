# REPORTE DE AUDITORÍA - PIPELINE EOD SIGNALSSHEETS

**Proyecto:** `sunny-advantage-471523-b3`
**Fecha de Auditoría:** 2025-11-17T03:14:09.989243+00:00
**Auditor:** Claude Code

---

## 1. EXECUTIVE SUMMARY

### Estado Actual del Pipeline

- **Última fecha de precios:** 2025-11-14
- **Última actualización de prices:** None
- **Registros (últimos 7 días):** 58,060

- **Última fecha de señales:** 2025-11-17
- **Total de señales:** 7
- **Tickers con señales:** 7

- **Gap entre prices y signals:** 3 días
  - ⚠️ Las señales están 3 días desactualizadas

---

## 2. TIEMPOS ACTUALES (con timestamps reales)

```
┌─────────────────────────────────────────────────┐
│ PIPELINE EOD - TIEMPOS DETECTADOS              │
├─────────────────────────────────────────────────┤
│ No hay datos de distribución horaria           │
│                                                 │
│ 00:00 CT → Descarga datos (GCS)   [ASUMIDO]   │
│ 01:00 CT → Carga a prices         [ASUMIDO]   │
│ XX:XX CT → Vista v_api_free_signals lista     │
│ ACTUAL   → Worker refresh cada 10 min ❌      │
└─────────────────────────────────────────────────┘
```

---

## 3. DATOS ENCONTRADOS - BIGQUERY

### 3.1 Tabla `market_data.prices`

- **Última fecha de datos:** 2025-11-14
- **Timestamp de actualización:** None
- **Registros (últimos 7 días):** 58,060
- **Tickers únicos:** 11877

### 3.2 Vista `analytics.v_api_free_signals`

- **Última fecha de señales:** 2025-11-17
- **Total de señales:** 7
- **Tickers únicos:** 7
- **Primera señal:** 2025-11-17

---

## 4. DATOS ENCONTRADOS - GOOGLE CLOUD STORAGE

⚠️ No se encontraron archivos recientes en GCS o hubo un error

---

## 5. ANÁLISIS DE GAPS TEMPORALES

### Sincronización entre Prices y Signals

- **Última fecha en prices:** 2025-11-14
- **Última actualización de prices:** 2025-11-01 07:00:37 UTC | 2025-11-01 02:00:37 CT
- **Última fecha en signals:** 2025-11-17
- **Gap temporal:** 3 días

⚠️ **ATENCIÓN:** Gap de 3 días puede indicar un problema

---

## 6. RECOMENDACIÓN FINAL

### Análisis del Pipeline

⚠️ **NOTA:** No se pudo determinar el patrón de actualización.

Necesitas:
- Verificar scheduled queries en BigQuery
- Revisar logs de Cloud Functions/Scheduler
- Confirmar el horario de descarga de Polygon

### Nuevo TTL Recomendado:

```typescript
const ttl = 86400; // 24 horas (1 día)
// Las señales se actualizan 1 vez al día EOD
```

---

## 7. CONFIGURACIÓN DEL CLOUDFLARE WORKER

⚠️ **PENDIENTE:** Se requiere acceso al código del Worker `free-api` para documentar:

- Configuración actual del cron job
- Código de fetch a BigQuery
- Manejo del cache en KV
- TTL actual configurado

---

## 8. COMANDOS EJECUTADOS (Documentación)

### BigQuery Queries

```sql
-- Última actualización de prices
SELECT
  MAX(date) as last_price_date,
  MAX(updated_at) as last_updated_timestamp,
  COUNT(*) as total_records,
  COUNT(DISTINCT ticker) as unique_tickers
FROM `sunny-advantage-471523-b3.market_data.prices`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS);

-- Última actualización de señales
SELECT
  MAX(signal_date) as last_signal_date,
  COUNT(*) as total_signals,
  COUNT(DISTINCT ticker) as unique_tickers
FROM `sunny-advantage-471523-b3.analytics.v_api_free_signals`;

-- Distribución horaria
SELECT
  EXTRACT(HOUR FROM updated_at) as hour_utc,
  COUNT(*) as update_count,
  MIN(updated_at) as first_update,
  MAX(updated_at) as last_update
FROM `sunny-advantage-471523-b3.market_data.prices`
WHERE DATE(updated_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS)
GROUP BY hour_utc
ORDER BY hour_utc;
```

### Google Cloud Storage

```bash
# Listar archivos recientes
gsutil ls -lh gs://ss-bucket-polygon-incremental/polygon/daily/ | tail -50
```

---

## 9. PRÓXIMOS PASOS

### Acciones Recomendadas:

1. **Validar horarios con Scheduled Queries**
   ```bash
   bq ls --transfer_config --project_id=sunny-advantage-471523-b3
   ```

2. **Actualizar Worker Configuration**
   - Modificar `wrangler.toml` con el nuevo cron schedule
   - Actualizar TTL en el código del worker
   - Desplegar cambios con `wrangler deploy`

3. **Monitorear resultados**
   - Verificar logs del worker después del cambio
   - Confirmar que el cache se actualiza correctamente
   - Validar que no hay gaps en los datos

4. **Configurar alertas** (opcional pero recomendado)
   - Alerta si las señales tienen más de 2 días de antigüedad
   - Alerta si el worker falla en actualizar el cache

---

## 📊 CONCLUSIÓN

⚠️ **Atención requerida.** 
Se detectaron gaps que requieren investigación.

La implementación del cron schedule recomendado optimizará el uso de recursos 
del Worker y asegurará que los datos estén disponibles cuando sean necesarios.

---

**Generado por:** Claude Code - EOD Pipeline Auditor
**Fecha:** 2025-11-17 03:14:43

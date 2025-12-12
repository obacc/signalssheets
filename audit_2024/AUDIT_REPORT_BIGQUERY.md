# AUDITORIA COMPLETA GCP - BigQuery
## Proyecto: sunny-advantage-471523-b3
## Fecha: 2025-12-12

---

# 1. RESUMEN EJECUTIVO

## 1.1 Alcance de la Auditoria
- **Datasets**: 2 (IS_Fundamentales, market_data)
- **Tablas**: 29 (22 en IS_Fundamentales, 7 en market_data)
- **Vistas**: 6 (3 en IS_Fundamentales, 3 en market_data)
- **Stored Procedures**: 5
- **Cloud Scheduler Jobs**: 8
- **Cloud Functions**: 0 (Gen1), usa Cloud Run
- **Service Accounts**: 45+ bindings IAM

## 1.2 Hallazgos Clave
| Categoria | Estado | Notas |
|-----------|--------|-------|
| Arquitectura | BUENA | Bien estructurada con ETL clara |
| Seguridad | RIESGO MEDIO | Multiples SAs con roles Owner |
| Automatizacion | BUENA | 8 jobs programados activos |
| Redundancia | MEDIA | Backups manuales, sin versionado |
| Documentacion | LIMITADA | Solo comentarios en codigo |

---

# 2. ARQUITECTURA DEL SISTEMA

## 2.1 Diagrama de Flujo de Datos

```
+-------------------+     +------------------+     +------------------+
|   FUENTES DATOS   |     |   STAGING/RAW    |     |   PRODUCCION     |
+-------------------+     +------------------+     +------------------+
                          |                  |     |                  |
  Polygon.io API    -->   | ext_polygon_daily| --> | Prices           |
  (Cloud Run)             | (EXTERNAL TABLE) |     | (Particionada)   |
                          |       |          |     |                  |
                          |       v          |     |                  |
                          | stg_prices_raw   | --> | sp_merge_polygon |
                          | (VIEW)           |     |                  |
                          +------------------+     +------------------+

  SEC EDGAR API     -->   | Num, Sub, Tag    | --> | fundamentals_    |
  (Cloud Run)             | Pre (raw tables) |     | timeseries       |
                          |       |          |     |       |          |
                          |       v          |     |       v          |
                          | sp_refresh_      | --> | fundamentals_    |
                          | fundamentals     |     | ratios           |
                          +------------------+     +------------------+
                                                         |
                                                         v
                                               +------------------+
                                               | SEÑALES TRINITY  |
                                               +------------------+
                                               | trinity_signals_ |
                                               | daily            |
                                               | (sp_generate_    |
                                               | trinity_signals) |
                                               +------------------+
```

## 2.2 Componentes Principales

### Dataset: IS_Fundamentales
Contiene datos fundamentales de empresas (SEC EDGAR) y sistema de señales Trinity.

### Dataset: market_data
Contiene precios de mercado (Polygon.io, Stooq) y tablas de staging.

---

# 3. INVENTARIO DE OBJETOS

## 3.1 Dataset: IS_Fundamentales (22 tablas)

| Tabla | Tipo | Descripcion |
|-------|------|-------------|
| Num | TABLE | Datos numericos SEC |
| Pre | TABLE | Datos de presentacion SEC |
| Sub | TABLE | Submissions SEC |
| Tag | TABLE | Tags/campos SEC |
| api_tokens | TABLE | Tokens de API usuarios |
| cik_ticker_mapping | TABLE | Mapeo CIK-Ticker |
| fundamentals_ratios | TABLE | Ratios calculados |
| fundamentals_ratios_BACKUP_* | TABLE | Backups manuales (3) |
| fundamentals_timeseries | TABLE | Series temporales normalizadas |
| fundamentals_timeseries_BACKUP_* | TABLE | Backups manuales (3) |
| market_regime_daily | TABLE | Regimen de mercado diario |
| parametros_trinity | TABLE | Parametros del modelo Trinity |
| plan_configs | TABLE | Configuracion de planes |
| trinity_signals_daily | TABLE | Señales Trinity diarias |
| trinity_signals_daily_test | TABLE | Tabla de pruebas |
| v_trinity_buy_signals | VIEW | Vista señales de compra |
| v_trinity_signals_latest | VIEW | Vista señales mas recientes |
| v_trinity_top50 | VIEW | Vista top 50 señales |

## 3.2 Dataset: market_data (7 objetos)

| Objeto | Tipo | Particionado | Clustered | Descripcion |
|--------|------|--------------|-----------|-------------|
| Prices | TABLE | fecha | ticker | Precios consolidados |
| audit_runs | TABLE | shard_date | job_name, stage | Logs de ejecucion |
| ext_polygon_daily | EXTERNAL | - | - | Tabla externa GCS (Parquet) |
| staging_polygon_daily_raw | TABLE | date | ticker | Staging Polygon |
| stg_prices_polygon_raw | VIEW | - | - | Vista sobre ext_polygon_daily |
| stooq_ext | EXTERNAL | - | - | Tabla externa Stooq (CSV) |
| v_ticker_norm | VIEW | - | - | Normalizacion de tickers |

---

# 4. STORED PROCEDURES - CODIGO COMPLETO

## 4.1 sp_merge_polygon_prices (market_data)

**Proposito**: Merge de datos de staging a tabla Prices con deduplicacion.

```sql
BEGIN

  MERGE `sunny-advantage-471523-b3.market_data.Prices` AS T

  USING (
    SELECT
      -- Normalizacion: agregar sufijo .US para unificar con Stooq
      CONCAT(ticker, '.US') AS ticker,

      -- Mapeo de schema: date (staging) → fecha (Prices)
      `date` AS fecha,

      -- Deduplicar filas: tomar el ultimo valor por load_ts
      -- Esto asegura que si hay duplicados, tomamos el mas reciente
      ARRAY_AGG(
        STRUCT(open, high, low, close, volume, load_ts)
        ORDER BY load_ts DESC
        LIMIT 1
      )[OFFSET(0)].open AS open,

      ARRAY_AGG(
        STRUCT(open, high, low, close, volume, load_ts)
        ORDER BY load_ts DESC
        LIMIT 1
      )[OFFSET(0)].high AS high,

      ARRAY_AGG(
        STRUCT(open, high, low, close, volume, load_ts)
        ORDER BY load_ts DESC
        LIMIT 1
      )[OFFSET(0)].low AS low,

      ARRAY_AGG(
        STRUCT(open, high, low, close, volume, load_ts)
        ORDER BY load_ts DESC
        LIMIT 1
      )[OFFSET(0)].close AS close,

      -- Mapeo de schema: volume (staging) → vol (Prices)
      ARRAY_AGG(
        STRUCT(open, high, low, close, volume, load_ts)
        ORDER BY load_ts DESC
        LIMIT 1
      )[OFFSET(0)].volume AS vol,

      -- Origen fijo
      'Polygon' AS origen,

      -- Timestamp de carga desde RAW (el mas reciente)
      MAX(load_ts) AS carga_ts

    FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
    WHERE ticker IS NOT NULL
      AND `date` IS NOT NULL
    GROUP BY ticker, `date`
  ) AS S

  -- Clave MERGE: (ticker, fecha, origen) para evitar duplicados
  ON  T.ticker = S.ticker
  AND T.fecha = S.fecha
  AND T.origen = S.origen

  WHEN MATCHED THEN UPDATE SET

    T.open    = S.open,
    T.high    = S.high,
    T.low     = S.low,
    T.close   = S.close,
    T.vol     = S.vol,
    T.updated_ts = CURRENT_TIMESTAMP()

  WHEN NOT MATCHED THEN

    INSERT (ticker, fecha, open, high, low, close, vol, origen, carga_ts)

    VALUES (S.ticker, S.fecha, S.open, S.high, S.low, S.close, S.vol, S.origen, S.carga_ts);

END
```

## 4.2 sp_generate_trinity_signals (IS_Fundamentales)

**Proposito**: Genera señales de inversion diarias basadas en metodologia Trinity (Lynch + O'Neil + Graham).

**Parametros**: `execution_date DATE`

**Caracteristicas**:
- Carga parametros desde `parametros_trinity`
- Ajusta thresholds segun regimen de mercado
- Calcula scores Lynch (PEG, ROE, EPS Growth, Revenue Growth)
- Calcula scores O'Neil (RS, Volume, Momentum, EPS Acceleration)
- Calcula scores Graham (P/B, Current Ratio, Debt, P/E)
- Genera señales: STRONG BUY, BUY, HOLD, SELL
- Limpia datos >7 dias (idempotente)

```sql
-- [Ver archivo completo: 03_routine_IS_Fundamentales_sp_generate_trinity_signals.json]
-- Longitud: ~800 lineas
-- Resumen de CTEs:
-- 1. latest_prices: Ultimos precios por ticker
-- 2. price_stats: 52-week high/low, volume promedio
-- 3. latest_fundamentals: TTM fundamentals desde fundamentals_timeseries
-- 4. latest_ratios: Ratios mas recientes
-- 5. base_universe: Calculo de market cap y ratios dinamicos
-- 6. scored_universe: Calculo de Lynch, O'Neil, Graham scores
-- 7. final_scores: Scores compuestos
-- 8. signals: Trinity Score final
-- 9. ranked_signals: Ranking y recomendaciones
```

## 4.3 sp_refresh_fundamentals_tables (IS_Fundamentales)

**Proposito**: Normaliza datos SEC → fundamentals_timeseries + fundamentals_ratios

**Caracteristicas**:
- Extrae datos de Num/Sub/Tag con mapeo CIK→Ticker
- Pivotea tags SEC a columnas normalizadas
- Calcula Q4 implicito donde falta (FY - Q1 - Q2 - Q3)
- Inserta a fundamentals_timeseries
- Calcula ratios financieros → fundamentals_ratios
- Idempotente (TRUNCATE + INSERT)
- Duracion: ~5-10 min para 43 quarters

```sql
-- [Ver archivo completo: 03_routine_IS_Fundamentales_sp_refresh_fundamentals_tables.json]
-- Longitud: ~650 lineas
-- Tablas temporales:
-- 1. base_data: Combina Sub + Num + Mapping
-- 2. income_statement_pivot: Pivot Income Statement
-- 3. balance_sheet_pivot: Pivot Balance Sheet
-- 4. cash_flow_pivot: Pivot Cash Flow
-- 5. shares_from_num: Shares consolidado
-- 6. combined_statements: Union + Q4 calculado
```

## 4.4 sp_mark_expired_trials (IS_Fundamentales)

**Proposito**: Marca tokens FREE expirados.

```sql
BEGIN
  -- Marcar tokens FREE expirados
  UPDATE `sunny-advantage-471523-b3.IS_Fundamentales.api_tokens`
  SET status = 'expired'
  WHERE status = 'active'
    AND expiry_date < CURRENT_DATE()
    AND expiry_date IS NOT NULL;
END
```

## 4.5 sp_reset_daily_counters (IS_Fundamentales)

**Proposito**: Resetea contadores diarios de requests.

```sql
BEGIN
  -- Resetear contadores diarios para usuarios activos
  UPDATE `sunny-advantage-471523-b3.IS_Fundamentales.api_tokens`
  SET request_count_today = 0
  WHERE status = 'active';
END
```

---

# 5. VISTAS - DEFINICIONES

## 5.1 v_ticker_norm (market_data)

```sql
CREATE VIEW `sunny-advantage-471523-b3.market_data.v_ticker_norm`
AS SELECT DISTINCT
      ticker,
      -- Normalizar: remover .US y convertir a mayusculas
      UPPER(TRIM(REPLACE(ticker, '.US', ''))) AS ticker_norm
    FROM `sunny-advantage-471523-b3.market_data.Prices`
    WHERE ticker IS NOT NULL
      AND ticker != '';
```

## 5.2 stg_prices_polygon_raw (market_data)

```sql
CREATE VIEW `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
AS SELECT
  ticker,
  date,
  open,
  high,
  low,
  close,
  volume,
  load_ts
FROM `sunny-advantage-471523-b3.market_data.ext_polygon_daily`;
```

## 5.3 ext_polygon_daily (market_data - EXTERNAL)

```sql
CREATE EXTERNAL TABLE `sunny-advantage-471523-b3.market_data.ext_polygon_daily`
OPTIONS(
  format="PARQUET",
  uris=["gs://ss-bucket-polygon-incremental/polygon/daily*.parquet"]
);
```

---

# 6. CLOUD SCHEDULER JOBS

| Job | Schedule | Timezone | Endpoint | Estado |
|-----|----------|----------|----------|--------|
| ingest-daily-twelve | 0 1 * * * | UTC | ingest-finnhub-dslul5uoua-uc.a.run.app | ENABLED (code 5) |
| market-regime-daily-2am | 0 2 * * * | America/New_York | us-central1-...cloudfunctions.net/market-regime-update | ENABLED |
| polygon-daily-job | 0 0 * * * | America/Chicago | polygon-daily-processor-dslul5uoua-uc.a.run.app | ENABLED |
| polygon-orchestrate | 30 21 * * * | UTC | orchestrator-dslul5uoua-uc.a.run.app | ENABLED (code 13) |
| refresh-daily-indicators | 0 3 * * * | America/Chicago | refresh-daily-indicators-dslul5uoua-uc.a.run.app | ENABLED (code 13) |
| sec-cik-ticker-sync-job | 0 2 * * * | UTC | sec-cik-ticker-sync-dslul5uoua-uc.a.run.app | ENABLED (code 13) |
| sec-quarter-daily-check | 0 8 * * * | UTC | sec-quarter-checker-dslul5uoua-uc.a.run.app | ENABLED (code 13) |
| trinity-replicator-daily | 5 8 * * * | UTC | us-central1-...cloudfunctions.net/trinity-replicator | ENABLED |

### Status Codes:
- **5**: NOT_FOUND (ultimo intento fallo)
- **13**: INTERNAL (error interno, requiere investigacion)
- **(vacio)**: OK

### Jobs con Errores (code 13):
- polygon-orchestrate
- refresh-daily-indicators
- sec-cik-ticker-sync-job
- sec-quarter-daily-check

---

# 7. IAM POLICY - SERVICE ACCOUNTS

## 7.1 Owners (Control Total)

| Service Account | Tipo |
|-----------------|------|
| claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com | SA |
| cursor-signalsheets@sunny-advantage-471523-b3.iam.gserviceaccount.com | SA |
| ob.acc23@gmail.com | Usuario |

## 7.2 BigQuery Admins

| Service Account |
|-----------------|
| claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com |
| claudecode-939@sunny-advantage-471523-b3.iam.gserviceaccount.com |
| cursor-signalsheets@sunny-advantage-471523-b3.iam.gserviceaccount.com |
| signalsheet-backend@sunny-advantage-471523-b3.iam.gserviceaccount.com |

## 7.3 Service Accounts Eliminadas (Riesgo de Limpieza)

Se detectaron **8 service accounts eliminadas** aun referenciadas en bindings:
- chatgpt-bigquery-read (deleted)
- dataform-ci (deleted)
- ingest-fn-sa (deleted)
- sa-ingest-finnhub (deleted)
- stooq-ingest-sa (deleted)
- sunny-advantage-471523-b3@appspot.gserviceaccount.com (deleted)

---

# 8. ANALISIS FODA

## 8.1 FORTALEZAS

| # | Fortaleza | Descripcion |
|---|-----------|-------------|
| F1 | **Arquitectura bien definida** | Clara separacion staging/produccion con ETL estructurado |
| F2 | **Particionamiento efectivo** | Tablas principales particionadas por fecha y clustered por ticker |
| F3 | **SPs idempotentes** | sp_refresh_fundamentals usa TRUNCATE+INSERT, sp_generate_trinity borra antes de insertar |
| F4 | **Modelo Trinity completo** | Implementacion sofisticada de Lynch+O'Neil+Graham con parametros configurables |
| F5 | **Tablas externas** | Uso eficiente de EXTERNAL TABLES para GCS (Parquet) reduce costos de almacenamiento |
| F6 | **Audit trail** | Tabla audit_runs para tracking de ejecuciones |
| F7 | **Automatizacion** | 8 Cloud Scheduler jobs para operaciones diarias |

## 8.2 OPORTUNIDADES

| # | Oportunidad | Beneficio Esperado |
|---|-------------|-------------------|
| O1 | **Implementar Scheduled Queries** | Actualmente 0 SQ, podria reemplazar algunos Cloud Run jobs |
| O2 | **Dataform/dbt** | Control de versiones y linaje de datos automatizado |
| O3 | **Alertas de monitoreo** | Cloud Monitoring para jobs fallidos (4 jobs con code 13) |
| O4 | **Backups automaticos** | Reemplazar backups manuales (*_BACKUP_*) por snapshots programados |
| O5 | **Data Quality Framework** | Implementar validaciones automaticas pre/post carga |
| O6 | **Optimizacion de costos** | Revisar queries de sp_generate_trinity (escanea multiples tablas) |
| O7 | **API Gateway** | Centralizar endpoints de Cloud Run |
| O8 | **CI/CD para SPs** | Versionado de stored procedures en git |

## 8.3 DEBILIDADES

| # | Debilidad | Impacto | Severidad |
|---|-----------|---------|-----------|
| D1 | **4 jobs con errores** | Jobs no ejecutan correctamente | ALTA |
| D2 | **Sin Scheduled Queries** | Dependencia de Cloud Run para ETL | MEDIA |
| D3 | **Backups manuales** | 6 tablas *_BACKUP sin automatizacion | MEDIA |
| D4 | **SAs con Owner** | 2 SAs + 1 usuario con control total | MEDIA |
| D5 | **SAs eliminadas en IAM** | 8 referencias a SAs borradas (ruido) | BAJA |
| D6 | **Sin versionado de SPs** | Cambios no rastreables | MEDIA |
| D7 | **Documentacion limitada** | Solo comentarios en codigo SQL | BAJA |
| D8 | **Trinity signals >7 dias se borran** | Perdida de historico para analisis | MEDIA |

## 8.4 AMENAZAS

| # | Amenaza | Probabilidad | Impacto | Mitigacion Sugerida |
|---|---------|--------------|---------|---------------------|
| A1 | **Fallo de Cloud Run** | MEDIA | ALTO | Implementar fallback/retry robusto |
| A2 | **API Polygon/SEC caida** | BAJA | ALTO | Cache de ultimos datos, alertas |
| A3 | **Costos inesperados** | MEDIA | MEDIO | Presupuestos y alertas BigQuery |
| A4 | **Compromiso de SA Owner** | BAJA | CRITICO | Reducir permisos, auditar accesos |
| A5 | **Datos corruptos en GCS** | BAJA | ALTO | Validacion en ingesta, checksums |
| A6 | **Schema changes en SEC** | MEDIA | MEDIO | Monitorear tags nuevos/removidos |
| A7 | **Perdida de Service Account keys** | MEDIA | ALTO | Rotacion automatica, Secret Manager |

---

# 9. RECOMENDACIONES PRIORITARIAS

## 9.1 Criticas (Implementar en <1 semana)

1. **Investigar jobs con code 13**: polygon-orchestrate, refresh-daily-indicators, sec-cik-ticker-sync, sec-quarter-daily-check
2. **Reducir permisos Owner**: Crear roles custom con minimo privilegio
3. **Limpiar IAM**: Remover referencias a SAs eliminadas

## 9.2 Importantes (Implementar en <1 mes)

4. **Implementar Cloud Monitoring** con alertas para jobs fallidos
5. **Automatizar backups** usando BigQuery scheduled exports o snapshots
6. **Implementar Scheduled Queries** para sp_merge_polygon_prices (diario)
7. **Versionar SPs en Git** con CI/CD para deploy

## 9.3 Mejoras (Implementar en <3 meses)

8. **Evaluar Dataform** para orquestacion y linaje
9. **Data Quality checks** automaticos
10. **Documentacion tecnica** completa del sistema

---

# 10. ARCHIVOS DE AUDITORIA GENERADOS

| Archivo | Descripcion | Tamaño |
|---------|-------------|--------|
| 01_datasets.json | Lista de datasets | 594 B |
| 02_tables_*.json | Tablas por dataset | ~13 KB total |
| 02_table_*.json | Detalle de cada tabla | ~90 KB total |
| 03_routines_*.json | Lista de rutinas | ~2 KB |
| 03_routine_*.json | Detalle de cada SP | ~68 KB total |
| 04_scheduled_queries.json | Scheduled Queries (0) | 233 B |
| 05_jobs.json | Jobs de BigQuery | 284 KB |
| 06_cloud_functions.json | Cloud Functions (0) | 2 B |
| 07_scheduler.json | Cloud Scheduler jobs | 8 KB |
| 08_info_*.json | INFORMATION_SCHEMA | ~1.9 MB total |
| 10_iam_policy.json | IAM Policy | 11 KB |
| _full_audit.json | Consolidado completo | 351 KB |

---

# 11. CONTACTO Y METADATA

- **Auditor**: Claude Code
- **Fecha de Auditoria**: 2025-12-12
- **Proyecto GCP**: sunny-advantage-471523-b3
- **Service Account usada**: claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com

---

*Fin del documento de auditoria*

BEGIN

  MERGE `sunny-advantage-471523-b3.market_data.Prices` AS T
  USING (
    -- Fuente saneada y deduplicada
    WITH fuente AS (
      SELECT
        -- Sufijo .US solo si no existe ya
        CASE
          WHEN REGEXP_CONTAINS(ticker, r'\.') THEN ticker
          ELSE CONCAT(ticker, '.US')
        END AS ticker,

        -- date -> fecha (admite DATE, STRING o TIMESTAMP)
        COALESCE(
          SAFE_CAST(`date` AS DATE),
          DATE(SAFE_CAST(`date` AS TIMESTAMP))
        ) AS fecha,

        -- Casts seguros a numérico
        SAFE_CAST(open  AS FLOAT64) AS open,
        SAFE_CAST(high  AS FLOAT64) AS high,
        SAFE_CAST(low   AS FLOAT64) AS low,
        SAFE_CAST(close AS FLOAT64) AS close,

        -- volume -> vol (no negativo)
        GREATEST(COALESCE(SAFE_CAST(volume AS INT64), 0), 0) AS vol,

        -- Origen fijo para esta tabla de staging
        'Polygon' AS origen,

        -- Timestamp de carga (si staging no lo trae)
        CURRENT_TIMESTAMP() AS carga_ts
      FROM `sunny-advantage-471523-b3.market_data.staging_polygon_daily_raw`
      -- 🟡 Opcional (performance): limitar ventana si solo hay cargas recientes
      -- WHERE COALESCE(SAFE_CAST(`date` AS DATE), DATE(SAFE_CAST(`date` AS TIMESTAMP)))
      --       >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    ),

    -- Deduplicación básica por (ticker, fecha, origen):
    -- si hay registros idénticos se elimina duplicado exacto;
    -- si hay conflictos con valores distintos, se elegirá uno arbitrario.
    dedup AS (
      SELECT DISTINCT
        ticker, fecha, open, high, low, close, vol, origen, carga_ts
      FROM fuente
      WHERE fecha IS NOT NULL  -- evita filas sin fecha
    )

    SELECT * FROM dedup
  ) AS S
  ON  T.ticker = S.ticker
  AND T.fecha  = S.fecha
  AND T.origen = S.origen

  WHEN MATCHED THEN UPDATE SET
    T.open       = S.open,
    T.high       = S.high,
    T.low        = S.low,
    T.close      = S.close,
    T.vol        = S.vol,
    T.updated_ts = CURRENT_TIMESTAMP()

  WHEN NOT MATCHED THEN
    INSERT (ticker, fecha, open, high, low, close, vol, origen, carga_ts)
    VALUES (S.ticker, S.fecha, S.open, S.high, S.low, S.close, S.vol, S.origen, S.carga_ts);

END
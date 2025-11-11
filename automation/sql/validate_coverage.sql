-- ============================================================================
-- VALIDATION: Date Coverage Across Pipeline
-- Compare GCS → Staging → Prices for last N days
-- ============================================================================

DECLARE lookback_days INT64 DEFAULT 30;

WITH date_range AS (
    SELECT date
    FROM UNNEST(GENERATE_DATE_ARRAY(
        DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY),
        CURRENT_DATE()
    )) AS date
),
staging_dates AS (
    SELECT
        date,
        COUNT(*) AS row_count,
        COUNT(DISTINCT ticker) AS unique_tickers
    FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY)
    GROUP BY date
),
prices_dates AS (
    SELECT
        date,
        COUNT(*) AS row_count,
        COUNT(DISTINCT ticker) AS unique_tickers
    FROM `sunny-advantage-471523-b3.market_data.Prices`
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY)
      AND source = 'polygon'
    GROUP BY date
)

SELECT
    dr.date,
    COALESCE(sd.row_count, 0) AS staging_rows,
    COALESCE(sd.unique_tickers, 0) AS staging_tickers,
    COALESCE(pd.row_count, 0) AS prices_rows,
    COALESCE(pd.unique_tickers, 0) AS prices_tickers,
    CASE
        WHEN sd.row_count IS NULL THEN 'MISSING_IN_STAGING'
        WHEN pd.row_count IS NULL THEN 'NOT_IN_PRICES'
        WHEN sd.row_count != pd.row_count THEN 'COUNT_MISMATCH'
        ELSE 'OK'
    END AS status,
    CASE
        WHEN sd.row_count > 0 THEN
            ROUND(COALESCE(pd.row_count, 0) * 100.0 / sd.row_count, 2)
        ELSE 0
    END AS transfer_percentage
FROM date_range dr
LEFT JOIN staging_dates sd ON dr.date = sd.date
LEFT JOIN prices_dates pd ON dr.date = pd.date
ORDER BY dr.date DESC;

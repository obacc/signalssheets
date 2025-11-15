-- ================================================================
-- Stored Procedure: Merge Polygon Staging Data to Prices Table
-- ================================================================
-- Idempotent MERGE operation to consolidate staging data into final Prices table
-- File: 05_create_sp_merge_prices.sql
-- Project: sunny-advantage-471523-b3
-- Dataset: market_data

CREATE OR REPLACE PROCEDURE `sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices`(
  target_date DATE
)
BEGIN
  DECLARE rows_merged INT64 DEFAULT 0;
  DECLARE rows_inserted INT64 DEFAULT 0;
  DECLARE rows_updated INT64 DEFAULT 0;
  DECLARE staging_count INT64 DEFAULT 0;

  -- Check if staging has data for target date
  SET staging_count = (
    SELECT COUNT(*)
    FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
    WHERE trading_day = target_date
      AND source = 'polygon'
  );

  IF staging_count = 0 THEN
    -- No data in staging for this date
    SELECT
      target_date as processed_date,
      0 as rows_affected,
      'NO_DATA_IN_STAGING' as status,
      'No records found in staging for this date' as message;
    RETURN;
  END IF;

  -- Create temporary table with deduplicated staging data
  -- In case there are any duplicates, take the most recent load
  CREATE TEMP TABLE staging_deduped AS
  SELECT * EXCEPT(row_num)
  FROM (
    SELECT
      ticker,
      trading_day,
      open,
      high,
      low,
      close,
      volume,
      'polygon' as source,
      CURRENT_TIMESTAMP() as last_updated,
      ROW_NUMBER() OVER (
        PARTITION BY ticker, trading_day
        ORDER BY load_ts DESC  -- Take most recent load if duplicates exist
      ) AS row_num
    FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
    WHERE trading_day = target_date
      AND source = 'polygon'
  )
  WHERE row_num = 1;

  -- Perform MERGE operation (idempotent)
  -- This will UPDATE existing records or INSERT new ones
  MERGE `sunny-advantage-471523-b3.market_data.Prices` AS target
  USING staging_deduped AS source
  ON target.ticker = source.ticker
     AND target.trading_day = source.trading_day
     AND target.source = source.source

  -- When match found: UPDATE with latest values
  WHEN MATCHED THEN
    UPDATE SET
      open = source.open,
      high = source.high,
      low = source.low,
      close = source.close,
      adj_close = source.close,  -- Polygon doesn't separate adj_close, use close
      volume = source.volume,
      last_updated = source.last_updated

  -- When no match: INSERT new record
  WHEN NOT MATCHED THEN
    INSERT (
      ticker,
      trading_day,
      source,
      open,
      high,
      low,
      close,
      adj_close,
      volume,
      last_updated
    )
    VALUES (
      source.ticker,
      source.trading_day,
      source.source,
      source.open,
      source.high,
      source.low,
      source.close,
      source.close,  -- adj_close = close for Polygon
      source.volume,
      source.last_updated
    );

  -- Get merge statistics
  SET rows_merged = @@row_count;

  -- Calculate inserts vs updates (approximate)
  -- Updates = records that existed before
  -- Inserts = records that didn't exist
  DECLARE prices_before INT64;
  SET prices_before = (
    SELECT COUNT(*)
    FROM `sunny-advantage-471523-b3.market_data.Prices`
    WHERE trading_day = target_date
      AND source = 'polygon'
  );

  SET rows_inserted = rows_merged - rows_updated;
  SET rows_updated = prices_before;

  -- Clean up temp table
  DROP TABLE staging_deduped;

  -- Return summary
  SELECT
    target_date as processed_date,
    staging_count as staging_records,
    rows_merged as rows_affected,
    rows_inserted as estimated_inserts,
    rows_updated as estimated_updates,
    'MERGE_COMPLETED' as status,
    CONCAT(
      'Merged ', CAST(rows_merged AS STRING), ' records from staging to Prices'
    ) as message;

EXCEPTION WHEN ERROR THEN
  -- Handle errors
  DECLARE error_message STRING;
  SET error_message = @@error.message;

  -- Return error details
  SELECT
    target_date as processed_date,
    0 as rows_affected,
    'MERGE_FAILED' as status,
    error_message as message;

  -- Re-raise error
  RAISE USING MESSAGE = error_message;
END;

-- ================================================================
-- Usage Examples
-- ================================================================

-- Merge specific date
-- CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices`(DATE('2025-11-14'));

-- Merge yesterday
-- CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices`(DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY));

-- Full pipeline for one date
-- CALL `sunny-advantage-471523-b3.market_data.sp_load_polygon_raw`(DATE('2025-11-14'));
-- CALL `sunny-advantage-471523-b3.market_data.sp_merge_polygon_to_prices`(DATE('2025-11-14'));

-- Verify procedure exists
-- SELECT
--   routine_name,
--   routine_type,
--   data_type
-- FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.ROUTINES`
-- WHERE routine_name = 'sp_merge_polygon_to_prices';

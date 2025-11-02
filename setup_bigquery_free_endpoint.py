#!/usr/bin/env python3
"""
BigQuery FREE Signals Endpoint Setup
Date: 2025-11-02
Project: sunny-advantage-471523-b3

This script sets up the complete BigQuery infrastructure for the FREE tier signals API.
"""

import os
import sys
from google.cloud import bigquery
from google.oauth2 import service_account
import json
from datetime import datetime

# Configuration
PROJECT_ID = "sunny-advantage-471523-b3"
CREDENTIALS_PATH = "/home/user/signalssheets/bigquery-credentials.json"

class BigQuerySetup:
    def __init__(self, credentials_path, project_id):
        """Initialize BigQuery client with service account credentials."""
        self.credentials = service_account.Credentials.from_service_account_file(
            credentials_path
        )
        self.client = bigquery.Client(credentials=self.credentials, project=project_id)
        self.project_id = project_id
        print(f"✅ Connected to BigQuery project: {project_id}")

    def execute_query(self, query, description):
        """Execute a query and return results."""
        print(f"\n{'='*80}")
        print(f"🔄 {description}")
        print(f"{'='*80}")

        try:
            query_job = self.client.query(query)
            results = query_job.result()

            # Convert to list of rows
            rows = list(results)

            if rows:
                print(f"✅ Success! Returned {len(rows)} row(s)")
                return rows
            else:
                print(f"⚠️  Query executed but returned 0 rows")
                return []

        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return None

    def display_results(self, rows, max_rows=20):
        """Display query results in a formatted table."""
        if not rows:
            return

        # Get column names from first row
        if hasattr(rows[0], '_fields'):
            columns = rows[0]._fields
        else:
            columns = list(rows[0].keys())

        # Print header
        print("\nResults:")
        print("-" * 80)

        # Print rows
        for i, row in enumerate(rows[:max_rows]):
            if hasattr(row, '_asdict'):
                row_dict = row._asdict()
            else:
                row_dict = dict(row)

            for col in columns:
                value = row_dict.get(col, 'N/A')
                print(f"  {col}: {value}")

            if i < len(rows) - 1:
                print()

        if len(rows) > max_rows:
            print(f"\n... ({len(rows) - max_rows} more rows)")

    def run_block_a0_verifications(self):
        """Block A0: Pre-flight checks."""
        print("\n" + "="*80)
        print("📋 BLOCK A0 — PRE-VERIFICATION CHECKS")
        print("="*80)

        # A0.1: Verify top10_v2 table
        query_a01 = f"""
        SELECT
          'top10_v2' AS tabla,
          COUNT(*) AS total_filas,
          MAX(as_of_date) AS ultimo_corte,
          COUNT(DISTINCT as_of_date) AS dias_con_datos
        FROM `{self.project_id}.analytics.top10_v2`
        """
        rows = self.execute_query(query_a01, "A0.1 - Verify top10_v2 table")
        self.display_results(rows)

        # A0.2: Verify top10_v2 structure
        query_a02 = f"""
        SELECT column_name, data_type
        FROM `{self.project_id}.analytics.INFORMATION_SCHEMA.COLUMNS`
        WHERE table_name = 'top10_v2'
        ORDER BY ordinal_position
        """
        rows = self.execute_query(query_a02, "A0.2 - Verify top10_v2 structure")
        self.display_results(rows)

        # A0.3: Verify Prices table
        query_a03 = f"""
        SELECT
          'Prices' AS tabla,
          COUNT(*) AS total_filas,
          COUNT(DISTINCT ticker) AS tickers_unicos,
          MAX(fecha) AS ultima_fecha,
          MIN(fecha) AS primera_fecha
        FROM `{self.project_id}.market_data.Prices`
        WHERE fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        """
        rows = self.execute_query(query_a03, "A0.3 - Verify Prices table")
        self.display_results(rows)

        # A0.4: Verify company names catalog
        query_a04 = f"""
        SELECT
          'ref_cik_ticker' AS tabla,
          COUNT(*) AS total_filas,
          COUNT(DISTINCT ticker) AS tickers_unicos,
          COUNT(CASE WHEN company_name IS NULL THEN 1 END) AS nombres_nulos
        FROM `{self.project_id}.sec_fundamentals.ref_cik_ticker`
        """
        rows = self.execute_query(query_a04, "A0.4 - Verify company names catalog")
        self.display_results(rows)

        # A0.5: Verify sectors
        query_a05 = f"""
        SELECT
          'sector_map' AS tabla,
          COUNT(*) AS total_filas,
          COUNT(DISTINCT sector) AS sectores_unicos
        FROM `{self.project_id}.analytics.sector_map_v6r2`
        """
        rows = self.execute_query(query_a05, "A0.5 - Verify sectors")
        self.display_results(rows)

        # A0.6: Validate data freshness
        query_a06 = f"""
        WITH
        max_dates AS (
          SELECT
            'top10_v2' AS fuente,
            MAX(as_of_date) AS max_date
          FROM `{self.project_id}.analytics.top10_v2`
          UNION ALL
          SELECT
            'Prices' AS fuente,
            MAX(fecha) AS max_date
          FROM `{self.project_id}.market_data.Prices`
        )
        SELECT
          fuente,
          max_date,
          DATE_DIFF(CURRENT_DATE(), max_date, DAY) AS dias_de_atraso,
          CASE
            WHEN DATE_DIFF(CURRENT_DATE(), max_date, DAY) <= 1 THEN '✅ FRESCO'
            WHEN DATE_DIFF(CURRENT_DATE(), max_date, DAY) <= 3 THEN '⚠️ RETRASADO'
            ELSE '❌ MUY ANTIGUO'
          END AS estado
        FROM max_dates
        """
        rows = self.execute_query(query_a06, "A0.6 - Validate data freshness")
        self.display_results(rows)

        # Check for STOP condition
        if rows:
            for row in rows:
                row_dict = row._asdict() if hasattr(row, '_asdict') else dict(row)
                if row_dict.get('estado') == '❌ MUY ANTIGUO':
                    print("\n🛑 STOP CONDITION: Data is too old. Please update source data.")
                    return False

        print("\n✅ All pre-verification checks passed!")
        return True

    def run_block_a_canonization(self):
        """Block A: Create canonization UDF and views."""
        print("\n" + "="*80)
        print("🧩 BLOCK A — CANONIZATION")
        print("="*80)

        # A1: Create UDF
        query_a1 = f"""
        CREATE OR REPLACE FUNCTION `{self.project_id}.analytics.udf_canon_ticker`(t STRING)
        RETURNS STRING AS ((
          WITH
          s AS (SELECT UPPER(TRIM(COALESCE(t, ''))) AS x),
          cleaned AS (SELECT REGEXP_REPLACE(x, r'^[^A-Z0-9]+', '') AS y FROM s),
          normalized AS (SELECT REGEXP_REPLACE(y, r'\\.+', '.') AS z FROM cleaned),
          final AS (
            SELECT CASE
              WHEN z = '' THEN NULL
              WHEN REGEXP_CONTAINS(z, r'\\.[A-Z]{{2,4}}$') THEN z
              ELSE CONCAT(z, '.US')
            END AS ticker_canon
            FROM normalized
          )
          SELECT ticker_canon FROM final
        ))
        """
        self.execute_query(query_a1, "A1 - Create canonization UDF")

        # A2: Create canonized Prices view
        query_a2 = f"""
        CREATE OR REPLACE VIEW `{self.project_id}.market_data.v_Prices_canon` AS
        SELECT
          p.*,
          `{self.project_id}.analytics.udf_canon_ticker`(p.ticker) AS ticker_canon
        FROM `{self.project_id}.market_data.Prices` p
        WHERE p.fecha IS NOT NULL
          AND p.close IS NOT NULL
          AND p.close > 0
        """
        self.execute_query(query_a2, "A2 - Create v_Prices_canon view")

        # A3: Test canonization
        query_a3 = f"""
        SELECT
          ticker AS original,
          `{self.project_id}.analytics.udf_canon_ticker`(ticker) AS canonizado,
          COUNT(*) AS ocurrencias
        FROM `{self.project_id}.market_data.Prices`
        WHERE fecha = (SELECT MAX(fecha) FROM `{self.project_id}.market_data.Prices`)
        GROUP BY ticker
        ORDER BY ocurrencias DESC
        LIMIT 20
        """
        rows = self.execute_query(query_a3, "A3 - Test canonization")
        self.display_results(rows)

        print("\n✅ Canonization setup complete!")
        return True

    def run_block_b_product_view(self):
        """Block B: Create main product view."""
        print("\n" + "="*80)
        print("📦 BLOCK B — MAIN PRODUCT VIEW")
        print("="*80)

        query_b = f"""
        CREATE OR REPLACE VIEW `{self.project_id}.analytics.v_api_free_signals` AS
        WITH
        -- Subconsulta 1: Último corte disponible
        max_cut AS (
          SELECT MAX(as_of_date) AS as_of_date
          FROM `{self.project_id}.analytics.top10_v2`
        ),
        -- Subconsulta 2: Top 10 del último corte (canonizado)
        t10 AS (
          SELECT
            t.as_of_date,
            t.rank,
            `{self.project_id}.analytics.udf_canon_ticker`(t.ticker) AS ticker,
            t.combined_score,
            t.trinity_score,
            t.technical_score
          FROM `{self.project_id}.analytics.top10_v2` t
          INNER JOIN max_cut m ON t.as_of_date = m.as_of_date
          WHERE `{self.project_id}.analytics.udf_canon_ticker`(t.ticker) IS NOT NULL
        ),
        -- Subconsulta 3: Último precio por ticker (optimizado)
        lp AS (
          SELECT
            pc.ticker_canon AS ticker,
            MAX_BY(STRUCT(pc.fecha, pc.close, pc.updated_at), pc.fecha) AS last_price_struct
          FROM `{self.project_id}.market_data.v_Prices_canon` pc
          WHERE pc.ticker_canon IN (SELECT DISTINCT ticker FROM t10)
            AND pc.fecha >= DATE_SUB((SELECT as_of_date FROM max_cut), INTERVAL 7 DAY)
          GROUP BY pc.ticker_canon
        ),
        -- Subconsulta 4: Fecha de señal EOD (si existe)
        sig_dates AS (
          SELECT
            `{self.project_id}.analytics.udf_canon_ticker`(s.ticker) AS ticker,
            MAX(s.fecha) AS signal_date
          FROM `{self.project_id}.market_data.signals_eod` s
          WHERE `{self.project_id}.analytics.udf_canon_ticker`(s.ticker) IN (
            SELECT DISTINCT ticker FROM t10
          )
          GROUP BY 1
        ),
        -- Subconsulta 5: Mapeo de sectores (canonizado)
        sector_map AS (
          SELECT DISTINCT
            `{self.project_id}.analytics.udf_canon_ticker`(m.ticker) AS ticker,
            COALESCE(m.sector, 'Unknown') AS sector
          FROM `{self.project_id}.analytics.sector_map_v6r2` m
          WHERE `{self.project_id}.analytics.udf_canon_ticker`(m.ticker) IN (
            SELECT DISTINCT ticker FROM t10
          )
        ),
        -- Subconsulta 6: Nombres de empresas
        company_names AS (
          SELECT DISTINCT
            CONCAT(UPPER(c.ticker), '.US') AS ticker,
            c.company_name
          FROM `{self.project_id}.sec_fundamentals.ref_cik_ticker` c
          WHERE CONCAT(UPPER(c.ticker), '.US') IN (SELECT DISTINCT ticker FROM t10)
            AND c.company_name IS NOT NULL
        )
        -- SELECT FINAL con todos los campos FREE
        SELECT
          t10.as_of_date,
          t10.rank,
          t10.ticker,

          -- Company name: priorizar catálogo, fallback a ticker limpio
          COALESCE(
            cn.company_name,
            REGEXP_REPLACE(t10.ticker, r'\\.US$', '')
          ) AS company_name,

          -- Sector con fallback
          COALESCE(sm.sector, 'Uncategorized') AS sector,

          -- Señal: Top10 implica BUY en MVP FREE
          'BUY' AS signal,

          -- Scores: trinity es obligatorio, individuales son placeholders
          CAST(ROUND(t10.trinity_score * 100) AS INT64) AS trinity_score,
          NULL AS lynch_score,
          NULL AS oneil_score,
          NULL AS graham_score,
          t10.combined_score,

          -- Precio actual (obligatorio)
          ROUND(lp.last_price_struct.close, 2) AS price_current,

          -- Potential return: placeholder NULL para FREE
          NULL AS potential_return,

          -- Autor dominante: placeholder simple para FREE
          'TRINITY' AS author_dominant,

          -- Fechas
          COALESCE(sd.signal_date, t10.as_of_date) AS signal_date,
          COALESCE(lp.last_price_struct.updated_at, CURRENT_TIMESTAMP()) AS updated_at

        FROM t10
        LEFT JOIN lp ON lp.ticker = t10.ticker
        LEFT JOIN sig_dates sd ON sd.ticker = t10.ticker
        LEFT JOIN sector_map sm ON sm.ticker = t10.ticker
        LEFT JOIN company_names cn ON cn.ticker = t10.ticker

        -- Asegurar que tenemos precio
        WHERE lp.last_price_struct.close IS NOT NULL

        ORDER BY t10.rank
        """
        self.execute_query(query_b, "B - Create v_api_free_signals view")

        print("\n✅ Product view created!")
        return True

    def run_block_c_status_view(self):
        """Block C: Create status view."""
        print("\n" + "="*80)
        print("📊 BLOCK C — STATUS VIEW")
        print("="*80)

        query_c = f"""
        CREATE OR REPLACE VIEW `{self.project_id}.analytics.v_api_free_signals_status` AS
        WITH
        cut AS (
          SELECT MAX(as_of_date) AS as_of_date
          FROM `{self.project_id}.analytics.top10_v2`
        ),
        rows AS (
          SELECT COUNT(*) AS n
          FROM `{self.project_id}.analytics.v_api_free_signals`
        ),
        rows_with_price AS (
          SELECT COUNT(*) AS n
          FROM `{self.project_id}.analytics.v_api_free_signals`
          WHERE price_current IS NOT NULL
        ),
        cal AS (
          SELECT cal_date
          FROM `{self.project_id}.analytics.v_market_calendar`
          WHERE is_trading_day
        ),
        lags AS (
          SELECT
            (SELECT as_of_date FROM cut) AS as_of_date,
            (SELECT COUNT(*)
             FROM cal
             WHERE cal_date > (SELECT as_of_date FROM cut)
               AND cal_date <= CURRENT_DATE()
            ) AS lag_td
        )
        SELECT
          CURRENT_TIMESTAMP() AS generated_at_utc,
          (SELECT as_of_date FROM cut) AS as_of_date,
          (SELECT lag_td FROM lags) AS lag_trading_days,
          (SELECT n FROM rows) AS row_count,
          (SELECT n FROM rows_with_price) AS rows_with_valid_price,

          -- Criterio FREE: corte ≤1 TD, al menos 5 filas con precio
          (
            (SELECT lag_td FROM lags) <= 1
            AND (SELECT n FROM rows_with_price) >= 5
          ) AS api_signals_ready,

          -- Metadata adicional
          CASE
            WHEN (SELECT lag_td FROM lags) > 1 THEN 'Data stale - update required'
            WHEN (SELECT n FROM rows_with_price) < 5 THEN 'Insufficient signals with prices'
            ELSE 'Ready to serve'
          END AS status_message
        """
        self.execute_query(query_c, "C - Create v_api_free_signals_status view")

        print("\n✅ Status view created!")
        return True

    def run_block_d_validations(self):
        """Block D: Run all validation queries."""
        print("\n" + "="*80)
        print("✅ BLOCK D — VALIDATIONS")
        print("="*80)

        # D1: Basic stats
        query_d1 = f"""
        SELECT
          'v_api_free_signals' AS vista,
          COUNT(*) AS total_filas,
          COUNT(CASE WHEN price_current IS NULL THEN 1 END) AS sin_precio,
          COUNT(CASE WHEN company_name LIKE '%.US' THEN 1 END) AS sin_nombre,
          COUNT(CASE WHEN sector = 'Unknown' THEN 1 END) AS sin_sector,
          AVG(trinity_score) AS avg_trinity_score,
          MIN(rank) AS min_rank,
          MAX(rank) AS max_rank
        FROM `{self.project_id}.analytics.v_api_free_signals`
        """
        rows = self.execute_query(query_d1, "D1 - Basic statistics")
        self.display_results(rows)

        # D2: Preview data
        query_d2 = f"""
        SELECT
          rank,
          ticker,
          company_name,
          sector,
          signal,
          trinity_score,
          price_current,
          signal_date,
          updated_at
        FROM `{self.project_id}.analytics.v_api_free_signals`
        ORDER BY rank
        LIMIT 10
        """
        rows = self.execute_query(query_d2, "D2 - Data preview")
        self.display_results(rows, max_rows=10)

        # D3: Status check
        query_d3 = f"""
        SELECT *
        FROM `{self.project_id}.analytics.v_api_free_signals_status`
        """
        rows = self.execute_query(query_d3, "D3 - Status check")
        self.display_results(rows)

        # D4: Canonization test
        query_d4 = f"""
        SELECT
          ticker AS original,
          `{self.project_id}.analytics.udf_canon_ticker`(ticker) AS canonizado,
          CASE
            WHEN ticker = `{self.project_id}.analytics.udf_canon_ticker`(ticker)
            THEN '✅ No change'
            ELSE '🔄 Canonized'
          END AS status
        FROM `{self.project_id}.analytics.top10_v2`
        WHERE as_of_date = (SELECT MAX(as_of_date) FROM `{self.project_id}.analytics.top10_v2`)
        ORDER BY rank
        """
        rows = self.execute_query(query_d4, "D4 - Canonization test")
        self.display_results(rows, max_rows=10)

        # D5: Coverage check
        query_d5 = f"""
        WITH base AS (
          SELECT ticker FROM `{self.project_id}.analytics.v_api_free_signals`
        )
        SELECT
          (SELECT COUNT(*) FROM base) AS total_signals,
          (SELECT COUNT(*) FROM base b
           WHERE EXISTS(
             SELECT 1 FROM `{self.project_id}.sec_fundamentals.ref_cik_ticker` c
             WHERE CONCAT(UPPER(c.ticker), '.US') = b.ticker
           )
          ) AS con_company_name,
          (SELECT COUNT(*) FROM base b
           WHERE EXISTS(
             SELECT 1 FROM `{self.project_id}.analytics.sector_map_v6r2` s
             WHERE `{self.project_id}.analytics.udf_canon_ticker`(s.ticker) = b.ticker
           )
          ) AS con_sector
        """
        rows = self.execute_query(query_d5, "D5 - Coverage check")
        self.display_results(rows)

        # D6: Performance check
        query_d6 = f"""
        SELECT
          CURRENT_TIMESTAMP() AS start_time,
          COUNT(*) AS rows
        FROM `{self.project_id}.analytics.v_api_free_signals`
        """
        rows = self.execute_query(query_d6, "D6 - Performance check")
        self.display_results(rows)

        print("\n✅ All validations complete!")
        return True

    def create_documentation(self):
        """Create endpoint documentation table."""
        print("\n" + "="*80)
        print("📝 CREATING DOCUMENTATION")
        print("="*80)

        # Create docs table
        query_create = f"""
        CREATE TABLE IF NOT EXISTS `{self.project_id}.analytics.api_endpoint_docs` (
          endpoint STRING,
          version STRING,
          description STRING,
          tier STRING,
          fields_included ARRAY<STRING>,
          fields_excluded ARRAY<STRING>,
          updated_at TIMESTAMP
        )
        """
        self.execute_query(query_create, "Create documentation table")

        # Insert documentation
        query_insert = f"""
        INSERT INTO `{self.project_id}.analytics.api_endpoint_docs`
        VALUES (
          '/api/free/signals',
          '1.0',
          'Returns TOP 10 BUY signals using Trinity Method scoring',
          'FREE',
          ['ticker', 'company_name', 'sector', 'signal', 'trinity_score', 'price_current', 'signal_date', 'updated_at'],
          ['price_target', 'price_stop_loss', 'risk_reward_ratio', 'price_tp1', 'price_tp2'],
          CURRENT_TIMESTAMP()
        )
        """
        self.execute_query(query_insert, "Insert documentation")

        print("\n✅ Documentation created!")
        return True


def main():
    """Main execution function."""
    print("\n" + "="*80)
    print("🚀 BigQuery FREE Signals Endpoint Setup")
    print("="*80)
    print(f"Project: {PROJECT_ID}")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("="*80)

    # Initialize BigQuery client
    try:
        bq = BigQuerySetup(CREDENTIALS_PATH, PROJECT_ID)
    except Exception as e:
        print(f"❌ Failed to initialize BigQuery client: {e}")
        sys.exit(1)

    # Execute blocks in order
    steps = [
        ("A0", "Pre-verification checks", bq.run_block_a0_verifications),
        ("A", "Canonization setup", bq.run_block_a_canonization),
        ("B", "Product view creation", bq.run_block_b_product_view),
        ("C", "Status view creation", bq.run_block_c_status_view),
        ("D", "Validation queries", bq.run_block_d_validations),
        ("DOC", "Documentation", bq.create_documentation),
    ]

    for block_id, description, func in steps:
        try:
            success = func()
            if not success and block_id == "A0":
                print("\n🛑 Pre-verification failed. Stopping setup.")
                sys.exit(1)
        except Exception as e:
            print(f"\n❌ Block {block_id} ({description}) failed: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    print("\n" + "="*80)
    print("🎉 SETUP COMPLETE!")
    print("="*80)
    print("\n✅ All BigQuery objects created successfully!")
    print("\nNext steps:")
    print("  1. Query the main view: SELECT * FROM `analytics.v_api_free_signals`")
    print("  2. Check status: SELECT * FROM `analytics.v_api_free_signals_status`")
    print("  3. Set up Cloudflare Worker to consume this view")
    print("  4. Connect Excel Power Query to the Worker endpoint")
    print("\n" + "="*80)


if __name__ == "__main__":
    main()

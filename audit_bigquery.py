#!/usr/bin/env python3
"""
Script para auditar BigQuery - Pipeline EOD SignalsSheets
"""
import os
import sys
from google.cloud import bigquery
from google.auth import exceptions as auth_exceptions
from datetime import datetime, timezone
import json

PROJECT_ID = "sunny-advantage-471523-b3"

def get_client():
    """Intenta crear un cliente de BigQuery"""
    try:
        # Intentar usar Application Default Credentials
        client = bigquery.Client(project=PROJECT_ID)
        return client
    except Exception as e:
        print(f"❌ Error al crear cliente BigQuery: {e}", file=sys.stderr)
        print("\nVerificando opciones de autenticación...", file=sys.stderr)

        # Verificar variables de entorno
        creds_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if creds_path:
            print(f"GOOGLE_APPLICATION_CREDENTIALS: {creds_path}", file=sys.stderr)
        else:
            print("No se encontró GOOGLE_APPLICATION_CREDENTIALS", file=sys.stderr)

        raise

def format_timestamp(ts):
    """Formatea un timestamp mostrando UTC y CT"""
    if ts is None:
        return "N/A"

    # Asegurar que sea timezone-aware
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    utc_str = ts.strftime("%Y-%m-%d %H:%M:%S UTC")
    # CT es UTC-6 (Central Standard Time) o UTC-5 (Central Daylight Time)
    # Usaremos UTC-6 para simplicidad
    from datetime import timedelta
    ct_ts = ts - timedelta(hours=6)
    ct_str = ct_ts.strftime("%Y-%m-%d %H:%M:%S CT")

    return f"{utc_str} ({ct_str})"

def query_1_prices_updates():
    """Query 1: Última actualización de tabla prices"""
    query = """
    SELECT
      MAX(date) as last_price_date,
      MAX(updated_at) as last_updated_timestamp,
      COUNT(*) as total_records,
      COUNT(DISTINCT ticker) as unique_tickers
    FROM `sunny-advantage-471523-b3.market_data.prices`
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS)
    """
    return query

def query_2_signals_updates():
    """Query 2: Última actualización de vista de señales"""
    query = """
    SELECT
      MAX(signal_date) as last_signal_date,
      COUNT(*) as total_signals,
      COUNT(DISTINCT ticker) as unique_tickers
    FROM `sunny-advantage-471523-b3.analytics.v_api_free_signals`
    """
    return query

def query_3_hourly_distribution():
    """Query 3: Distribución horaria de updates"""
    query = """
    SELECT
      EXTRACT(HOUR FROM updated_at) as hour_utc,
      COUNT(*) as update_count,
      MIN(updated_at) as first_update,
      MAX(updated_at) as last_update
    FROM `sunny-advantage-471523-b3.market_data.prices`
    WHERE DATE(updated_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS)
    GROUP BY hour_utc
    ORDER BY hour_utc
    """
    return query

def query_4_gap_analysis():
    """Query 4: Análisis de gaps entre prices y signals"""
    query = """
    WITH prices_latest AS (
      SELECT MAX(updated_at) as prices_updated
      FROM `sunny-advantage-471523-b3.market_data.prices`
    ),
    signals_latest AS (
      SELECT MAX(signal_date) as signals_updated
      FROM `sunny-advantage-471523-b3.analytics.v_api_free_signals`
    )
    SELECT
      p.prices_updated,
      s.signals_updated,
      TIMESTAMP_DIFF(
        TIMESTAMP(s.signals_updated),
        p.prices_updated,
        MINUTE
      ) as gap_minutes,
      TIMESTAMP_DIFF(
        TIMESTAMP(s.signals_updated),
        p.prices_updated,
        HOUR
      ) as gap_hours
    FROM prices_latest p, signals_latest s
    """
    return query

def run_query(client, query_name, query_sql):
    """Ejecuta una query y retorna los resultados"""
    print(f"\n{'='*80}")
    print(f"🔍 {query_name}")
    print(f"{'='*80}\n")

    try:
        query_job = client.query(query_sql)
        results = query_job.result()

        # Convertir a lista de dicts
        rows = []
        for row in results:
            row_dict = dict(row.items())
            rows.append(row_dict)

        if not rows:
            print("❌ No se encontraron resultados")
            return None

        # Mostrar resultados
        for row in rows:
            for key, value in row.items():
                if isinstance(value, datetime):
                    print(f"  {key}: {format_timestamp(value)}")
                else:
                    print(f"  {key}: {value}")
            print()

        return rows

    except Exception as e:
        print(f"❌ Error ejecutando query: {e}", file=sys.stderr)
        return None

def main():
    print("🚀 Iniciando auditoría de BigQuery - Pipeline EOD SignalsSheets")
    print(f"📅 Timestamp de ejecución: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"🔧 Proyecto: {PROJECT_ID}\n")

    try:
        client = get_client()
        print("✅ Cliente de BigQuery creado exitosamente\n")

        # Ejecutar queries
        results = {}

        results['prices_updates'] = run_query(
            client,
            "QUERY 1: Última actualización de tabla prices",
            query_1_prices_updates()
        )

        results['signals_updates'] = run_query(
            client,
            "QUERY 2: Última actualización de vista de señales",
            query_2_signals_updates()
        )

        results['hourly_distribution'] = run_query(
            client,
            "QUERY 3: Distribución horaria de updates (últimos 7 días)",
            query_3_hourly_distribution()
        )

        results['gap_analysis'] = run_query(
            client,
            "QUERY 4: Análisis de gaps temporales",
            query_4_gap_analysis()
        )

        # Guardar resultados en JSON
        output_file = "/home/user/signalssheets/bigquery_audit_results.json"

        # Convertir datetimes a strings para JSON
        def convert_datetime(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            return obj

        results_json = {}
        for key, value in results.items():
            if value:
                results_json[key] = [
                    {k: convert_datetime(v) for k, v in row.items()}
                    for row in value
                ]

        with open(output_file, 'w') as f:
            json.dump(results_json, f, indent=2, default=str)

        print(f"\n✅ Resultados guardados en: {output_file}")

    except Exception as e:
        print(f"\n❌ Error general: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

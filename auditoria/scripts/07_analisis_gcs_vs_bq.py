#!/usr/bin/env python3
"""
Script 7: Análisis de diferencias GCS vs BigQuery
Proyecto: sunny-advantage-471523-b3
Propósito: Comparar fechas disponibles en GCS con las cargadas en staging
"""

import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
from google.cloud import storage, bigquery

# Configuración
PROJECT_ID = "sunny-advantage-471523-b3"
BUCKET_NAME = "ss-bucket-polygon-incremental"
BUCKET_PREFIX = "polygon/daily/"
DATASET = "market_data"
STAGING_TABLE = "stg_prices_polygon_raw"
ARTIFACTS_DIR = "../artifacts"

# Asegurar que existe el directorio de artifacts
os.makedirs(ARTIFACTS_DIR, exist_ok=True)


def get_gcs_dates():
    """Obtiene todas las fechas disponibles en GCS."""
    print("📦 Analizando fechas en GCS...")
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(BUCKET_NAME.replace("gs://", ""))

    dates_info = defaultdict(lambda: {"file_count": 0, "total_bytes": 0})

    # Listar todos los blobs con el prefijo
    blobs = bucket.list_blobs(prefix=BUCKET_PREFIX)

    for blob in blobs:
        # Extraer fecha del path: polygon/daily/date=2024-01-15/file.parquet
        if "date=" in blob.name:
            date_str = blob.name.split("date=")[1].split("/")[0]
            try:
                # Validar formato de fecha
                datetime.strptime(date_str, "%Y-%m-%d")
                dates_info[date_str]["file_count"] += 1
                dates_info[date_str]["total_bytes"] += blob.size
            except ValueError:
                continue

    print(f"   ✓ Encontradas {len(dates_info)} fechas en GCS")
    return dates_info


def get_bigquery_staging_dates():
    """Obtiene fechas disponibles en la tabla staging de BigQuery."""
    print("🔍 Consultando fechas en BigQuery staging...")
    client = bigquery.Client(project=PROJECT_ID)

    query = f"""
    SELECT
        date AS fecha,
        COUNT(*) AS row_count,
        COUNT(DISTINCT ticker) AS unique_tickers
    FROM
        `{PROJECT_ID}.{DATASET}.{STAGING_TABLE}`
    GROUP BY
        fecha
    ORDER BY
        fecha DESC
    """

    results = client.query(query).result()

    staging_dates = {}
    for row in results:
        date_str = row.fecha.strftime("%Y-%m-%d")
        staging_dates[date_str] = {
            "row_count": row.row_count,
            "unique_tickers": row.unique_tickers
        }

    print(f"   ✓ Encontradas {len(staging_dates)} fechas en staging")
    return staging_dates


def get_bigquery_prices_dates():
    """Obtiene fechas disponibles en la tabla Prices de BigQuery."""
    print("🔍 Consultando fechas en BigQuery Prices...")
    client = bigquery.Client(project=PROJECT_ID)

    query = f"""
    SELECT
        date AS fecha,
        COUNT(*) AS row_count,
        COUNT(DISTINCT ticker) AS unique_tickers
    FROM
        `{PROJECT_ID}.{DATASET}.Prices`
    WHERE
        source = 'polygon'
    GROUP BY
        fecha
    ORDER BY
        fecha DESC
    """

    results = client.query(query).result()

    prices_dates = {}
    for row in results:
        date_str = row.fecha.strftime("%Y-%m-%d")
        prices_dates[date_str] = {
            "row_count": row.row_count,
            "unique_tickers": row.unique_tickers
        }

    print(f"   ✓ Encontradas {len(prices_dates)} fechas en Prices")
    return prices_dates


def generate_comparison_report(gcs_dates, staging_dates, prices_dates):
    """Genera reporte comparativo."""
    print("📊 Generando reporte comparativo...")

    # Obtener todas las fechas únicas
    all_dates = sorted(set(gcs_dates.keys()) | set(staging_dates.keys()) | set(prices_dates.keys()), reverse=True)

    # Limitar a últimos 30 días
    today = datetime.now().date()
    cutoff_date = today - timedelta(days=30)

    report = []
    gaps = {
        "gcs_to_staging": [],
        "staging_to_prices": [],
        "gcs_to_prices": []
    }

    for date_str in all_dates:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        if date_obj < cutoff_date:
            continue

        in_gcs = date_str in gcs_dates
        in_staging = date_str in staging_dates
        in_prices = date_str in prices_dates

        status = "OK"
        if in_gcs and not in_staging:
            status = "MISSING_IN_STAGING"
            gaps["gcs_to_staging"].append(date_str)
        elif in_staging and not in_prices:
            status = "NOT_IN_PRICES"
            gaps["staging_to_prices"].append(date_str)
        elif in_gcs and not in_prices:
            status = "MISSING_IN_PRICES"
            gaps["gcs_to_prices"].append(date_str)
        elif not in_gcs and in_staging:
            status = "UNEXPECTED_IN_STAGING"

        row = {
            "date": date_str,
            "in_gcs": "✓" if in_gcs else "✗",
            "gcs_files": gcs_dates.get(date_str, {}).get("file_count", 0),
            "gcs_mb": round(gcs_dates.get(date_str, {}).get("total_bytes", 0) / 1024 / 1024, 2),
            "in_staging": "✓" if in_staging else "✗",
            "staging_rows": staging_dates.get(date_str, {}).get("row_count", 0),
            "staging_tickers": staging_dates.get(date_str, {}).get("unique_tickers", 0),
            "in_prices": "✓" if in_prices else "✗",
            "prices_rows": prices_dates.get(date_str, {}).get("row_count", 0),
            "prices_tickers": prices_dates.get(date_str, {}).get("unique_tickers", 0),
            "status": status
        }
        report.append(row)

    return report, gaps


def save_csv(report, filename):
    """Guarda reporte en CSV."""
    import csv

    filepath = os.path.join(ARTIFACTS_DIR, filename)
    with open(filepath, 'w', newline='') as f:
        if report:
            writer = csv.DictWriter(f, fieldnames=report[0].keys())
            writer.writeheader()
            writer.writerows(report)

    print(f"   ✓ Guardado: {filepath}")


def save_json(data, filename):
    """Guarda datos en JSON."""
    filepath = os.path.join(ARTIFACTS_DIR, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"   ✓ Guardado: {filepath}")


def print_summary(report, gaps):
    """Imprime resumen en consola."""
    print("\n" + "="*70)
    print("📋 RESUMEN DE AUDITORÍA")
    print("="*70)

    print(f"\n📅 Fechas analizadas (últimos 30 días): {len(report)}")

    status_counts = defaultdict(int)
    for row in report:
        status_counts[row["status"]] += 1

    print("\n📊 Estado de las fechas:")
    for status, count in sorted(status_counts.items()):
        print(f"   {status}: {count}")

    print("\n🚨 GAPS DETECTADOS:")
    print(f"   GCS → Staging: {len(gaps['gcs_to_staging'])} fechas")
    if gaps['gcs_to_staging']:
        print(f"      Ejemplo: {', '.join(gaps['gcs_to_staging'][:5])}")

    print(f"   Staging → Prices: {len(gaps['staging_to_prices'])} fechas")
    if gaps['staging_to_prices']:
        print(f"      Ejemplo: {', '.join(gaps['staging_to_prices'][:5])}")

    print(f"   GCS → Prices: {len(gaps['gcs_to_prices'])} fechas")
    if gaps['gcs_to_prices']:
        print(f"      Ejemplo: {', '.join(gaps['gcs_to_prices'][:5])}")


def main():
    """Función principal."""
    print("="*70)
    print("🔍 AUDITORÍA: COMPARACIÓN GCS vs BigQuery")
    print("="*70 + "\n")

    try:
        # 1. Obtener datos de GCS
        gcs_dates = get_gcs_dates()

        # 2. Obtener datos de staging
        staging_dates = get_bigquery_staging_dates()

        # 3. Obtener datos de Prices
        prices_dates = get_bigquery_prices_dates()

        # 4. Generar reporte comparativo
        report, gaps = generate_comparison_report(gcs_dates, staging_dates, prices_dates)

        # 5. Guardar resultados
        print("\n💾 Guardando resultados...")
        save_csv(report, "diff_gcs_staging_prices.csv")
        save_json({
            "gcs_dates": {k: v for k, v in gcs_dates.items()},
            "staging_dates": staging_dates,
            "prices_dates": prices_dates,
            "gaps": gaps,
            "summary": {
                "total_dates_analyzed": len(report),
                "dates_in_gcs": len(gcs_dates),
                "dates_in_staging": len(staging_dates),
                "dates_in_prices": len(prices_dates),
                "gaps_gcs_to_staging": len(gaps['gcs_to_staging']),
                "gaps_staging_to_prices": len(gaps['staging_to_prices']),
                "gaps_gcs_to_prices": len(gaps['gcs_to_prices'])
            }
        }, "comparison_summary.json")

        # 6. Mostrar resumen
        print_summary(report, gaps)

        print("\n" + "="*70)
        print("✅ AUDITORÍA COMPLETADA")
        print("="*70)

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(main())

#!/usr/bin/env python3
"""
Auditoría Completa del Pipeline Polygon → BigQuery
Ejecuta todas las verificaciones que quedaron pendientes por falta de permisos
"""

import json
import os
from datetime import datetime, timedelta
from google.cloud import bigquery, storage
from google.oauth2 import service_account
import pandas as pd
from collections import defaultdict

# Configuración
CREDENTIALS_PATH = '/home/user/signalssheets/gcp-service-account.json'
PROJECT_ID = 'sunny-advantage-471523-b3'
DATASET_ID = 'market_data'
BUCKET_NAME = 'ss-bucket-polygon-incremental'
GCS_PREFIX = 'polygon/daily/'

# Autenticar
credentials = service_account.Credentials.from_service_account_file(
    CREDENTIALS_PATH,
    scopes=['https://www.googleapis.com/auth/cloud-platform']
)

bq_client = bigquery.Client(credentials=credentials, project=PROJECT_ID)
storage_client = storage.Client(credentials=credentials, project=PROJECT_ID)

print("=" * 80)
print("AUDITORÍA COMPLETA - PIPELINE POLYGON → BIGQUERY")
print("=" * 80)
print(f"\nProyecto: {PROJECT_ID}")
print(f"Dataset: {DATASET_ID}")
print(f"Bucket: gs://{BUCKET_NAME}/{GCS_PREFIX}")
print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 80)

# Crear directorio de artefactos
os.makedirs('auditoria/artifacts', exist_ok=True)

# ============================================================================
# 1. AUDITORÍA DE GCS
# ============================================================================
print("\n\n📦 1. AUDITORÍA DE GOOGLE CLOUD STORAGE")
print("-" * 80)

try:
    bucket = storage_client.bucket(BUCKET_NAME)
    blobs = list(bucket.list_blobs(prefix=GCS_PREFIX))

    # Extraer fechas de la estructura date=YYYY-MM-DD/
    gcs_dates = set()
    gcs_inventory = []

    for blob in blobs:
        # Extraer fecha del path: polygon/daily/date=2025-11-10/file.parquet
        parts = blob.name.split('/')
        for part in parts:
            if part.startswith('date='):
                date_str = part.replace('date=', '')
                gcs_dates.add(date_str)
                gcs_inventory.append({
                    'date': date_str,
                    'file': blob.name.split('/')[-1],
                    'size_bytes': blob.size,
                    'size_mb': round(blob.size / (1024 * 1024), 2),
                    'updated': blob.updated.strftime('%Y-%m-%d %H:%M:%S')
                })
                break

    gcs_dates_sorted = sorted(gcs_dates, reverse=True)

    print(f"\n✅ Fechas disponibles en GCS: {len(gcs_dates_sorted)}")
    print(f"   Fecha más reciente: {gcs_dates_sorted[0] if gcs_dates_sorted else 'N/A'}")
    print(f"   Fecha más antigua: {gcs_dates_sorted[-1] if gcs_dates_sorted else 'N/A'}")
    print(f"   Total archivos: {len(gcs_inventory)}")

    # Últimas 10 fechas
    print(f"\n   Últimas 10 fechas:")
    for date in gcs_dates_sorted[:10]:
        files_count = len([x for x in gcs_inventory if x['date'] == date])
        total_mb = sum([x['size_mb'] for x in gcs_inventory if x['date'] == date])
        print(f"   - {date}: {files_count} archivos, {total_mb:.2f} MB")

    # Detectar gaps
    print(f"\n🔍 Detectando gaps de fechas...")
    missing_dates = set()
    if len(gcs_dates_sorted) >= 2:
        from datetime import date as dt_date
        start_date = dt_date.fromisoformat(gcs_dates_sorted[-1])
        end_date = dt_date.fromisoformat(gcs_dates_sorted[0])

        expected_dates = []
        current = start_date
        while current <= end_date:
            # Skip weekends (Saturday=5, Sunday=6)
            if current.weekday() < 5:
                expected_dates.append(current.isoformat())
            current += timedelta(days=1)

        missing_dates = set(expected_dates) - gcs_dates

        if missing_dates:
            print(f"   ⚠️  GAPS ENCONTRADOS: {len(missing_dates)} días laborables faltantes")
            missing_sorted = sorted(missing_dates, reverse=True)[:20]
            for missing in missing_sorted:
                print(f"   - {missing}")
        else:
            print(f"   ✅ No se detectaron gaps de fechas (días laborables)")
    else:
        print(f"   ⚠️  No hay suficientes fechas para detectar gaps (encontradas: {len(gcs_dates_sorted)})")

    # Guardar artefactos
    with open('auditoria/artifacts/gcs_dates_available.txt', 'w') as f:
        f.write('\n'.join(gcs_dates_sorted))

    df_inventory = pd.DataFrame(gcs_inventory)
    if not df_inventory.empty:
        df_summary = df_inventory.groupby('date').agg({
            'file': 'count',
            'size_mb': 'sum'
        }).rename(columns={'file': 'file_count', 'size_mb': 'total_mb'})
        df_summary = df_summary.sort_index(ascending=False)
        df_summary.to_csv('auditoria/artifacts/gcs_inventory.csv')
        print(f"\n   📄 Artefacto: auditoria/artifacts/gcs_inventory.csv")

    if missing_dates:
        with open('auditoria/artifacts/gcs_date_gaps.txt', 'w') as f:
            f.write('\n'.join(sorted(missing_dates, reverse=True)))
        print(f"   📄 Artefacto: auditoria/artifacts/gcs_date_gaps.txt")

except Exception as e:
    print(f"\n❌ Error auditando GCS: {str(e)}")
    gcs_dates_sorted = []

# ============================================================================
# 2. AUDITORÍA DE BIGQUERY - STAGING
# ============================================================================
print("\n\n📊 2. AUDITORÍA DE BIGQUERY - STAGING TABLE")
print("-" * 80)

try:
    staging_table = f"{PROJECT_ID}.{DATASET_ID}.stg_prices_polygon_raw"

    # Get table info
    table = bq_client.get_table(staging_table)

    print(f"\n✅ Tabla: {staging_table}")
    print(f"   Total rows: {table.num_rows:,}")
    print(f"   Size: {table.num_bytes / (1024**3):.2f} GB")
    print(f"   Created: {table.created}")
    print(f"   Modified: {table.modified}")

    # Partitioning info
    if table.time_partitioning:
        print(f"\n   Particionamiento:")
        print(f"   - Tipo: {table.time_partitioning.type_}")
        print(f"   - Campo: {table.time_partitioning.field or 'Partición por ingesta'}")
        if table.time_partitioning.expiration_ms:
            days = table.time_partitioning.expiration_ms / (1000 * 60 * 60 * 24)
            print(f"   - Expiración: {days:.0f} días")

    # Clustering
    if table.clustering_fields:
        print(f"   Clustering: {', '.join(table.clustering_fields)}")

    # Schema
    print(f"\n   Schema ({len(table.schema)} campos):")
    for field in table.schema:
        print(f"   - {field.name}: {field.field_type}")

    # Guardar schema
    schema_json = [{'name': f.name, 'type': f.field_type, 'mode': f.mode} for f in table.schema]
    with open('auditoria/artifacts/schema_staging.json', 'w') as f:
        json.dump(schema_json, f, indent=2)
    print(f"\n   📄 Artefacto: auditoria/artifacts/schema_staging.json")

    # Row counts por fecha (últimos 30 días)
    print(f"\n🔍 Consultando row counts por fecha...")
    query = f"""
    SELECT
        date AS fecha,
        COUNT(*) AS row_count,
        COUNT(DISTINCT ticker) AS unique_tickers
    FROM `{staging_table}`
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY fecha
    ORDER BY fecha DESC
    """

    df_staging_counts = bq_client.query(query).to_dataframe()
    print(f"   ✅ Datos de últimos 30 días: {len(df_staging_counts)} fechas")

    if not df_staging_counts.empty:
        print(f"\n   Últimas 5 fechas:")
        for _, row in df_staging_counts.head().iterrows():
            print(f"   - {row['fecha']}: {row['row_count']:,} rows, {row['unique_tickers']} tickers")

        df_staging_counts.to_csv('auditoria/artifacts/staging_counts.csv', index=False)
        print(f"\n   📄 Artefacto: auditoria/artifacts/staging_counts.csv")

    staging_dates = set(df_staging_counts['fecha'].astype(str).tolist())

except Exception as e:
    print(f"\n❌ Error auditando staging: {str(e)}")
    staging_dates = set()
    df_staging_counts = pd.DataFrame()

# ============================================================================
# 3. AUDITORÍA DE BIGQUERY - PRICES TABLE
# ============================================================================
print("\n\n📊 3. AUDITORÍA DE BIGQUERY - PRICES TABLE")
print("-" * 80)

try:
    prices_table = f"{PROJECT_ID}.{DATASET_ID}.Prices"

    # Get table info
    table = bq_client.get_table(prices_table)

    print(f"\n✅ Tabla: {prices_table}")
    print(f"   Total rows: {table.num_rows:,}")
    print(f"   Size: {table.num_bytes / (1024**3):.2f} GB")

    # Partitioning/Clustering
    if table.time_partitioning:
        print(f"   Particionamiento: {table.time_partitioning.type_} on {table.time_partitioning.field}")
    if table.clustering_fields:
        print(f"   Clustering: {', '.join(table.clustering_fields)}")

    # Schema
    print(f"\n   Schema ({len(table.schema)} campos):")
    for field in table.schema:
        print(f"   - {field.name}: {field.field_type}")

    # Guardar schema
    schema_json = [{'name': f.name, 'type': f.field_type, 'mode': f.mode} for f in table.schema]
    with open('auditoria/artifacts/schema_prices.json', 'w') as f:
        json.dump(schema_json, f, indent=2)

    # Row counts por fecha (origen=polygon, últimos 30 días)
    print(f"\n🔍 Consultando row counts por fecha (origen=polygon)...")
    query = f"""
    SELECT
        fecha,
        COUNT(*) AS row_count,
        COUNT(DISTINCT ticker) AS unique_tickers
    FROM `{prices_table}`
    WHERE fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      AND origen = 'polygon'
    GROUP BY fecha
    ORDER BY fecha DESC
    """

    df_prices_counts = bq_client.query(query).to_dataframe()
    print(f"   ✅ Datos de últimos 30 días: {len(df_prices_counts)} fechas")

    if not df_prices_counts.empty:
        print(f"\n   Últimas 5 fechas:")
        for _, row in df_prices_counts.head().iterrows():
            print(f"   - {row['fecha']}: {row['row_count']:,} rows, {row['unique_tickers']} tickers")

        df_prices_counts.to_csv('auditoria/artifacts/prices_counts.csv', index=False)
        print(f"\n   📄 Artefacto: auditoria/artifacts/prices_counts.csv")

    prices_dates = set(df_prices_counts['fecha'].astype(str).tolist())

except Exception as e:
    print(f"\n❌ Error auditando prices: {str(e)}")
    prices_dates = set()
    df_prices_counts = pd.DataFrame()

# ============================================================================
# 4. ANÁLISIS DE GAPS: GCS vs STAGING vs PRICES
# ============================================================================
print("\n\n🔍 4. ANÁLISIS DE GAPS - GCS vs STAGING vs PRICES")
print("-" * 80)

try:
    # Últimos 30 días
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)

    comparison = []
    current = start_date

    while current <= end_date:
        if current.weekday() < 5:  # Solo días laborables
            date_str = current.isoformat()

            in_gcs = date_str in gcs_dates_sorted
            in_staging = date_str in staging_dates
            in_prices = date_str in prices_dates

            # Contar archivos/rows
            gcs_files = len([x for x in gcs_inventory if x['date'] == date_str]) if in_gcs else 0
            staging_rows = int(df_staging_counts[df_staging_counts['fecha'].astype(str) == date_str]['row_count'].iloc[0]) if in_staging and not df_staging_counts.empty and date_str in staging_dates else 0
            prices_rows = int(df_prices_counts[df_prices_counts['fecha'].astype(str) == date_str]['row_count'].iloc[0]) if in_prices and not df_prices_counts.empty and date_str in prices_dates else 0

            # Determinar status
            if not in_gcs:
                status = 'MISSING_IN_GCS'
            elif not in_staging:
                status = 'NOT_IN_STAGING'
            elif not in_prices:
                status = 'NOT_IN_PRICES'
            elif staging_rows != prices_rows:
                status = 'COUNT_MISMATCH'
            else:
                status = 'OK'

            comparison.append({
                'date': date_str,
                'in_gcs': '✓' if in_gcs else '✗',
                'gcs_files': gcs_files,
                'in_staging': '✓' if in_staging else '✗',
                'staging_rows': staging_rows,
                'in_prices': '✓' if in_prices else '✗',
                'prices_rows': prices_rows,
                'status': status
            })

        current += timedelta(days=1)

    df_comparison = pd.DataFrame(comparison)
    df_comparison = df_comparison.sort_values('date', ascending=False)

    # Resumen
    print(f"\n📊 Resumen (últimos 30 días laborables):")
    status_counts = df_comparison['status'].value_counts()
    for status, count in status_counts.items():
        icon = '✅' if status == 'OK' else '⚠️' if status == 'COUNT_MISMATCH' else '❌'
        print(f"   {icon} {status}: {count} días")

    # Mostrar últimos 10 días
    print(f"\n📅 Últimos 10 días:")
    print(df_comparison.head(10).to_string(index=False))

    # Guardar
    df_comparison.to_csv('auditoria/artifacts/diff_gcs_staging_prices.csv', index=False)
    print(f"\n   📄 Artefacto: auditoria/artifacts/diff_gcs_staging_prices.csv")

    # Summary JSON
    summary = {
        'fecha_auditoria': datetime.now().isoformat(),
        'total_dias_analizados': len(df_comparison),
        'status_counts': status_counts.to_dict(),
        'ultima_fecha_ok': df_comparison[df_comparison['status'] == 'OK']['date'].iloc[0] if not df_comparison[df_comparison['status'] == 'OK'].empty else None,
        'problemas_encontrados': df_comparison[df_comparison['status'] != 'OK'][['date', 'status']].to_dict('records')
    }

    with open('auditoria/artifacts/comparison_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"   📄 Artefacto: auditoria/artifacts/comparison_summary.json")

except Exception as e:
    print(f"\n❌ Error en análisis de gaps: {str(e)}")

# ============================================================================
# 5. AUDITORÍA DE STORED PROCEDURES
# ============================================================================
print("\n\n⚙️  5. AUDITORÍA DE STORED PROCEDURES")
print("-" * 80)

try:
    # Listar todas las rutinas del dataset
    query = f"""
    SELECT routine_name, routine_type, created, last_altered
    FROM `{PROJECT_ID}.{DATASET_ID}.INFORMATION_SCHEMA.ROUTINES`
    ORDER BY routine_name
    """

    routines = bq_client.query(query).to_dataframe()

    if not routines.empty:
        print(f"\n✅ Rutinas encontradas: {len(routines)}")
        for _, row in routines.iterrows():
            print(f"   - {row['routine_name']} ({row['routine_type']})")
            print(f"     Creado: {row['created']}, Modificado: {row['last_altered']}")

        routines.to_csv('auditoria/artifacts/routines.csv', index=False)

        # Extraer sp_merge_polygon_prices si existe
        if 'sp_merge_polygon_prices' in routines['routine_name'].values:
            print(f"\n🔍 Extrayendo sp_merge_polygon_prices...")

            query_sp = f"""
            SELECT routine_definition
            FROM `{PROJECT_ID}.{DATASET_ID}.INFORMATION_SCHEMA.ROUTINES`
            WHERE routine_name = 'sp_merge_polygon_prices'
            """

            result = bq_client.query(query_sp).to_dataframe()
            if not result.empty:
                sp_code = result['routine_definition'].iloc[0]

                with open('auditoria/artifacts/sp_merge_polygon_prices.sql', 'w') as f:
                    f.write(sp_code)

                print(f"   ✅ Código extraído ({len(sp_code)} caracteres)")
                print(f"   📄 Artefacto: auditoria/artifacts/sp_merge_polygon_prices.sql")

                # Análisis básico del código
                print(f"\n   🔍 Análisis del código:")
                uses_merge = 'MERGE' in sp_code.upper()
                uses_insert = 'INSERT' in sp_code.upper()
                uses_update = 'UPDATE' in sp_code.upper()
                uses_delete = 'DELETE' in sp_code.upper()
                has_dedup = 'ROW_NUMBER' in sp_code.upper() or 'DISTINCT' in sp_code.upper()

                print(f"   - Usa MERGE: {'✅' if uses_merge else '❌'}")
                print(f"   - Usa INSERT: {'✅' if uses_insert else '⚪'}")
                print(f"   - Usa UPDATE: {'✅' if uses_update else '⚪'}")
                print(f"   - Usa DELETE: {'⚠️' if uses_delete else '✅ (no borra datos)'}")
                print(f"   - Deduplicación: {'✅' if has_dedup else '⚠️  (no detectada)'}")
                print(f"\n   {'✅ SP aparenta ser idempotente' if uses_merge else '⚠️  Revisar idempotencia manualmente'}")
    else:
        print(f"\n⚠️  No se encontraron rutinas en el dataset")

except Exception as e:
    print(f"\n❌ Error auditando stored procedures: {str(e)}")

# ============================================================================
# 6. DIAGNÓSTICO DE FALLOS EN BIGQUERY JOBS
# ============================================================================
print("\n\n🔧 6. DIAGNÓSTICO DE FALLOS - BIGQUERY JOBS (Últimos 14 días)")
print("-" * 80)

try:
    query = f"""
    SELECT
        creation_time,
        job_id,
        user_email,
        state,
        error_result.reason AS error_reason,
        error_result.message AS error_message,
        REGEXP_EXTRACT(query, r'CALL `[^`]+\.([^`]+)`') AS routine_called
    FROM `{PROJECT_ID}.region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
    WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)
      AND (state != 'DONE' OR error_result IS NOT NULL)
    ORDER BY creation_time DESC
    LIMIT 100
    """

    df_errors = bq_client.query(query).to_dataframe()

    if not df_errors.empty:
        print(f"\n⚠️  Jobs con errores encontrados: {len(df_errors)}")

        # Agrupar por tipo de error
        error_summary = df_errors.groupby('error_reason').size().sort_values(ascending=False)
        print(f"\n   Errores por tipo:")
        for reason, count in error_summary.items():
            print(f"   - {reason}: {count} jobs")

        # Últimos 5 errores
        print(f"\n   Últimos 5 errores:")
        for _, row in df_errors.head().iterrows():
            print(f"\n   - {row['creation_time']}")
            print(f"     Job: {row['job_id']}")
            print(f"     Usuario: {row['user_email']}")
            print(f"     Razón: {row['error_reason']}")
            print(f"     Mensaje: {row['error_message'][:100]}..." if pd.notna(row['error_message']) and len(str(row['error_message'])) > 100 else f"     Mensaje: {row['error_message']}")

        df_errors.to_csv('auditoria/artifacts/bq_jobs_errors.csv', index=False)
        print(f"\n   📄 Artefacto: auditoria/artifacts/bq_jobs_errors.csv")
    else:
        print(f"\n✅ No se encontraron jobs con errores en los últimos 14 días")

except Exception as e:
    print(f"\n❌ Error diagnosticando jobs: {str(e)}")

# ============================================================================
# 7. ANÁLISIS DE CALIDAD DE DATOS
# ============================================================================
print("\n\n📈 7. ANÁLISIS DE CALIDAD DE DATOS")
print("-" * 80)

try:
    # Verificar NULLs, duplicados y anomalías en staging
    query_quality = f"""
    WITH quality_checks AS (
      SELECT
        -- NULLs
        COUNTIF(ticker IS NULL) AS ticker_nulls,
        COUNTIF(date IS NULL) AS date_nulls,
        COUNTIF(close IS NULL) AS close_nulls,
        COUNTIF(volume IS NULL) AS volume_nulls,

        -- Anomalías
        COUNTIF(high < low) AS high_less_than_low,
        COUNTIF(close < 0) AS negative_close,
        COUNTIF(volume < 0) AS negative_volume,

        -- Total rows
        COUNT(*) AS total_rows
      FROM `{PROJECT_ID}.{DATASET_ID}.stg_prices_polygon_raw`
      WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    ),
    duplicates AS (
      SELECT COUNT(*) AS duplicate_groups
      FROM (
        SELECT date, ticker, COUNT(*) AS cnt
        FROM `{PROJECT_ID}.{DATASET_ID}.stg_prices_polygon_raw`
        WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY date, ticker
        HAVING COUNT(*) > 1
      )
    )
    SELECT
      qc.*,
      d.duplicate_groups
    FROM quality_checks qc
    CROSS JOIN duplicates d
    """

    df_quality = bq_client.query(query_quality).to_dataframe()

    if not df_quality.empty:
        row = df_quality.iloc[0]

        print(f"\n✅ Análisis completado (últimos 30 días)")
        print(f"   Total rows analizados: {row['total_rows']:,}")

        print(f"\n   🔍 Valores NULL:")
        print(f"   - ticker: {row['ticker_nulls']:,}")
        print(f"   - date: {row['date_nulls']:,}")
        print(f"   - close: {row['close_nulls']:,}")
        print(f"   - volume: {row['volume_nulls']:,}")

        print(f"\n   🔍 Anomalías:")
        print(f"   - high < low: {row['high_less_than_low']:,}")
        print(f"   - Precios negativos: {row['negative_close']:,}")
        print(f"   - Volumen negativo: {row['negative_volume']:,}")

        print(f"\n   🔍 Duplicados:")
        print(f"   - Grupos (ticker, date) duplicados: {row['duplicate_groups']:,}")

        # Evaluar calidad
        has_issues = (
            row['ticker_nulls'] > 0 or
            row['close_nulls'] > 0 or
            row['high_less_than_low'] > 0 or
            row['negative_close'] > 0 or
            row['negative_volume'] > 0 or
            row['duplicate_groups'] > 0
        )

        if has_issues:
            print(f"\n   ⚠️  PROBLEMAS DE CALIDAD DETECTADOS")
        else:
            print(f"\n   ✅ Calidad de datos: EXCELENTE")

        df_quality.to_csv('auditoria/artifacts/data_quality.csv', index=False)
        print(f"\n   📄 Artefacto: auditoria/artifacts/data_quality.csv")

except Exception as e:
    print(f"\n❌ Error en análisis de calidad: {str(e)}")

# ============================================================================
# RESUMEN FINAL
# ============================================================================
print("\n\n" + "=" * 80)
print("📊 RESUMEN FINAL DE AUDITORÍA")
print("=" * 80)

print(f"\n✅ Artefactos generados en auditoria/artifacts/:")
print(f"   - gcs_dates_available.txt")
print(f"   - gcs_inventory.csv")
print(f"   - schema_staging.json")
print(f"   - schema_prices.json")
print(f"   - staging_counts.csv")
print(f"   - prices_counts.csv")
print(f"   - diff_gcs_staging_prices.csv")
print(f"   - comparison_summary.json")
print(f"   - routines.csv")
print(f"   - data_quality.csv")

print(f"\n✅ Auditoría completada exitosamente")
print(f"   Revisa los artefactos para análisis detallado")
print("=" * 80 + "\n")

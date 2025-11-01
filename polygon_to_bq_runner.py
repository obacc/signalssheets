#!/usr/bin/env python3
"""
Polygon → BigQuery Runner
Descarga datos EOD de Polygon.io y los carga a BigQuery

Basado en: RUNBOOK - Automatización Polygon → BigQuery (MVP)
Fecha: 2025-11-01
"""
import os
import sys
import json
import time
import datetime as dt
from typing import Optional, Dict, List
import pandas as pd
import requests
from google.cloud import bigquery
from google.oauth2 import service_account

# ========== CONFIGURACIÓN ==========
POLYGON_API_KEY = os.environ.get('POLYGON_API_KEY', '')
GCP_SA_KEY_JSON = os.environ.get('GCP_SA_KEY_JSON', '')
GCP_CREDENTIALS_FILE = os.environ.get('GCP_CREDENTIALS_FILE', '/home/user/signalssheets/gcp_credentials.json')
GCP_PROJECT = os.environ.get('GCP_PROJECT', 'sunny-advantage-471523-b3')
BQ_DATASET_ANALYTICS = os.environ.get('BQ_DATASET_ANALYTICS', 'analytics')
BQ_DATASET_MARKET = os.environ.get('BQ_DATASET_MARKET', 'market_data')
BQ_TABLE_PRICES = os.environ.get('BQ_TABLE_PRICES', 'market_data.Prices')
BQ_TABLE_STAGING = os.environ.get('BQ_TABLE_STAGING', 'market_data.stg_prices_polygon_raw')
TARGET_DATE_STR = os.environ.get('TARGET_DATE', '2025-10-31')

# ========== VALIDACIÓN DE CREDENCIALES ==========
print("=" * 80)
print("POLYGON → BIGQUERY RUNNER")
print("=" * 80)
print()

if not POLYGON_API_KEY:
    print("❌ ERROR: Falta POLYGON_API_KEY")
    print()
    print("Por favor exporta tu API key de Polygon:")
    print("  export POLYGON_API_KEY='tu_api_key_aqui'")
    print()
    print("O si no tienes API key:")
    print("  1. Regístrate en https://polygon.io")
    print("  2. Obtén tu API key gratuita (5 requests/min)")
    print("  3. Exporta la variable de entorno")
    print()
    sys.exit(1)

# Load GCP credentials
try:
    if GCP_SA_KEY_JSON:
        sa_info = json.loads(GCP_SA_KEY_JSON)
    elif os.path.exists(GCP_CREDENTIALS_FILE):
        with open(GCP_CREDENTIALS_FILE, 'r') as f:
            sa_info = json.load(f)
    else:
        raise FileNotFoundError("No GCP credentials found")

    creds = service_account.Credentials.from_service_account_info(
        sa_info,
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
except Exception as e:
    print(f"❌ ERROR cargando credenciales de GCP: {e}")
    sys.exit(1)

bq_client = bigquery.Client(project=GCP_PROJECT, credentials=creds)
TARGET_DATE = dt.date.fromisoformat(TARGET_DATE_STR)

print(f"Proyecto GCP: {GCP_PROJECT}")
print(f"Service Account: {sa_info['client_email']}")
print(f"Fecha objetivo: {TARGET_DATE_STR}")
print(f"Tabla destino: {BQ_TABLE_PRICES}")
print(f"Tabla staging: {BQ_TABLE_STAGING}")
print()

# ========== UTILIDADES ==========
def bq_query(sql: str, params: dict = None) -> pd.DataFrame:
    """Ejecutar query en BigQuery con parámetros"""
    job_config = bigquery.QueryJobConfig()
    if params:
        job_config.query_parameters = [
            bigquery.ScalarQueryParameter(k, v[0], v[1])
            for k, v in params.items()
        ]
    job = bq_client.query(sql, job_config=job_config)
    return job.result().to_dataframe()

def backoff_sleep(attempt: int, base=1.0, cap=20.0):
    """Exponential backoff con jitter"""
    t = min(cap, base * (2 ** attempt)) * (1.0 + 0.1 * (attempt % 3))
    time.sleep(t)

def canon_ticker(t: str) -> str:
    """Canonizar ticker (coincide con UDF en BigQuery)"""
    if not t:
        return t
    x = t.upper().lstrip(' .:/@#-')
    x = '.'.join([s for s in x.split('.') if s])
    if x and not (len(x.split('.')) > 1 and len(x.split('.')[-1]) <= 4):
        x = x + '.US'
    return x

# ========== 1) OBTENER UNIVERSO DE TICKERS ==========
print("=" * 80)
print("PASO 1: OBTENER UNIVERSO DE TICKERS")
print("=" * 80)
print()

SQL_TICKERS = f"""
WITH dref AS (
  SELECT DATE_SUB(@d, INTERVAL 1 DAY) AS d0, @d AS d1
)
SELECT DISTINCT ticker
FROM `{GCP_PROJECT}.{BQ_DATASET_MARKET}.Prices`, dref
WHERE fecha IN (dref.d0, dref.d1)
LIMIT 50000
"""

try:
    tickers_df = bq_query(SQL_TICKERS, params={'d': ('DATE', TARGET_DATE)})
    tickers = sorted(set(tickers_df['ticker'].astype(str).tolist()))

    if not tickers:
        print("⚠️  No se encontraron tickers en Prices para las fechas cercanas")
        print("   Usando lista de tickers por defecto...")

        # Fallback: obtener los tickers más recientes
        fallback_sql = f"""
        SELECT DISTINCT ticker
        FROM `{GCP_PROJECT}.{BQ_DATASET_MARKET}.Prices`
        WHERE fecha >= DATE_SUB(@d, INTERVAL 7 DAY)
        LIMIT 50000
        """
        tickers_df = bq_query(fallback_sql, params={'d': ('DATE', TARGET_DATE)})
        tickers = sorted(set(tickers_df['ticker'].astype(str).tolist()))

    if not tickers:
        print("❌ No se pudo obtener lista de tickers")
        sys.exit(1)

    print(f"✓ Se obtuvieron {len(tickers)} tickers para descargar")
    print(f"  Primeros 10: {', '.join(tickers[:10])}")
    print()

except Exception as e:
    print(f"❌ Error obteniendo tickers: {e}")
    sys.exit(1)

# ========== 2) DESCARGAR DATOS DE POLYGON ==========
print("=" * 80)
print("PASO 2: DESCARGAR DATOS DE POLYGON.IO")
print("=" * 80)
print()

def fetch_daily_bar(ticker: str, ymd: dt.date) -> Optional[Dict]:
    """
    Descargar barra diaria de Polygon para un ticker
    Endpoint: /v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}
    """
    # Remover sufijo .US para Polygon
    base_ticker = ticker.replace('.US', '')

    url = f'https://api.polygon.io/v2/aggs/ticker/{base_ticker}/range/1/day/{ymd}/{ymd}'
    params = {
        'adjusted': 'true',
        'apiKey': POLYGON_API_KEY
    }

    attempts = 0
    max_attempts = 5

    while attempts < max_attempts:
        try:
            response = requests.get(url, params=params, timeout=15)

            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])

                if not results:
                    return None  # Sin datos para esta fecha

                bar = results[0]
                return {
                    'ticker': canon_ticker(ticker),
                    'fecha': ymd.isoformat(),
                    'open': float(bar.get('o', 0)),
                    'high': float(bar.get('h', 0)),
                    'low': float(bar.get('l', 0)),
                    'close': float(bar.get('c', 0)),
                    'volume': int(bar.get('v', 0)),
                }

            elif response.status_code == 429:  # Rate limit
                print(f"  ⚠️  Rate limit alcanzado, esperando...")
                attempts += 1
                backoff_sleep(attempts, base=2.0, cap=30.0)

            elif response.status_code in (502, 503, 504):  # Server errors
                attempts += 1
                backoff_sleep(attempts, base=1.2, cap=20.0)

            else:
                return None  # Otros errores

        except requests.RequestException:
            attempts += 1
            backoff_sleep(attempts, base=1.2, cap=20.0)

    return None

# Descargar datos
rows = []
total = len(tickers)
errors = 0
no_data = 0

print(f"Descargando datos para {total} tickers...")
print()

for i, ticker in enumerate(tickers, 1):
    bar = fetch_daily_bar(ticker, TARGET_DATE)

    if bar:
        rows.append(bar)
    else:
        no_data += 1

    # Progress update
    if i % 100 == 0:
        print(f"  Progreso: {i}/{total} ({i/total*100:.1f}%) | OK: {len(rows)} | Sin datos: {no_data}")

    # Rate limiting: 5 requests/min para plan gratuito
    # Esperamos 12 segundos entre cada request para estar seguros
    if i < total:
        time.sleep(12.5)  # 60/5 = 12 segundos + margen

print()
print(f"✓ Descarga completada:")
print(f"  - Tickers procesados: {total}")
print(f"  - Barras obtenidas: {len(rows)}")
print(f"  - Sin datos: {no_data}")
print()

if not rows:
    print("❌ Polygon no devolvió datos para la fecha objetivo")
    print(f"   Verifica que {TARGET_DATE_STR} es un día de trading válido")
    sys.exit(1)

# ========== 3) CREAR DATAFRAME Y CARGAR A STAGING ==========
print("=" * 80)
print("PASO 3: CARGAR A TABLA STAGING")
print("=" * 80)
print()

df = pd.DataFrame(rows)
df['fecha'] = pd.to_datetime(df['fecha']).dt.date
df['carga_ts'] = pd.Timestamp.utcnow()

print(f"DataFrame creado: {len(df)} filas")
print()
print("Vista previa (primeras 5 filas):")
print(df.head().to_string())
print()

# Verificar si la tabla staging existe, si no crearla
try:
    table_ref = bq_client.dataset(BQ_DATASET_MARKET).table('stg_prices_polygon_raw')

    try:
        existing_table = bq_client.get_table(table_ref)
        print(f"✓ Tabla staging existe: {existing_table.num_rows} filas existentes")
    except:
        # Crear tabla staging
        schema = [
            bigquery.SchemaField('ticker', 'STRING'),
            bigquery.SchemaField('fecha', 'DATE'),
            bigquery.SchemaField('open', 'FLOAT'),
            bigquery.SchemaField('high', 'FLOAT'),
            bigquery.SchemaField('low', 'FLOAT'),
            bigquery.SchemaField('close', 'FLOAT'),
            bigquery.SchemaField('volume', 'INTEGER'),
            bigquery.SchemaField('carga_ts', 'TIMESTAMP'),
        ]

        table = bigquery.Table(table_ref, schema=schema)
        table = bq_client.create_table(table)
        print(f"✓ Tabla staging creada: {BQ_TABLE_STAGING}")

    # Cargar datos
    job_config = bigquery.LoadJobConfig(
        schema=[
            bigquery.SchemaField('ticker', 'STRING'),
            bigquery.SchemaField('fecha', 'DATE'),
            bigquery.SchemaField('open', 'FLOAT'),
            bigquery.SchemaField('high', 'FLOAT'),
            bigquery.SchemaField('low', 'FLOAT'),
            bigquery.SchemaField('close', 'FLOAT'),
            bigquery.SchemaField('volume', 'INTEGER'),
            bigquery.SchemaField('carga_ts', 'TIMESTAMP'),
        ],
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND
    )

    load_job = bq_client.load_table_from_dataframe(df, table_ref, job_config=job_config)
    load_job.result()  # Wait for completion

    print(f"✓ Datos cargados a staging: {len(df)} filas")
    print()

except Exception as e:
    print(f"❌ Error cargando a staging: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ========== 4) MERGE A TABLA PRICES ==========
print("=" * 80)
print("PASO 4: MERGE A TABLA PRICES")
print("=" * 80)
print()

SQL_MERGE = f"""
MERGE `{GCP_PROJECT}.{BQ_TABLE_PRICES}` T
USING (
  SELECT
    ticker,
    DATE(fecha) AS fecha,
    open,
    high,
    low,
    close,
    volume,
    TIMESTAMP(carga_ts) AS carga_ts
  FROM `{GCP_PROJECT}.{BQ_TABLE_STAGING}`
  WHERE fecha = @d
) S
ON T.ticker = S.ticker AND T.fecha = S.fecha
WHEN MATCHED THEN UPDATE SET
  open = S.open,
  high = S.high,
  low = S.low,
  close = S.close,
  vol = S.volume,
  carga_ts = S.carga_ts,
  updated_ts = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT (
  ticker,
  fecha,
  open,
  high,
  low,
  close,
  vol,
  carga_ts,
  updated_ts,
  origen
)
VALUES (
  S.ticker,
  S.fecha,
  S.open,
  S.high,
  S.low,
  S.close,
  S.volume,
  S.carga_ts,
  CURRENT_TIMESTAMP(),
  'polygon'
)
"""

try:
    merge_result = bq_query(SQL_MERGE, params={'d': ('DATE', TARGET_DATE)})
    print("✓ MERGE completado exitosamente")
    print()
except Exception as e:
    print(f"❌ Error en MERGE: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ========== 5) VERIFICACIÓN ==========
print("=" * 80)
print("PASO 5: VERIFICACIÓN FINAL")
print("=" * 80)
print()

try:
    check_sql = f"""
    SELECT COUNT(*) AS rows_loaded
    FROM `{GCP_PROJECT}.{BQ_TABLE_PRICES}`
    WHERE fecha = @d
    """

    check_df = bq_query(check_sql, params={'d': ('DATE', TARGET_DATE)})

    print("Datos en tabla Prices para", TARGET_DATE_STR, ":")
    print(check_df.to_string(index=False))
    print()

    if check_df.iloc[0]['rows_loaded'] > 0:
        print(f"✅ ÉXITO: {check_df.iloc[0]['rows_loaded']} filas cargadas para {TARGET_DATE_STR}")
    else:
        print("⚠️  No se encontraron datos en Prices para la fecha objetivo")

except Exception as e:
    print(f"❌ Error en verificación: {e}")

print()
print("=" * 80)
print("PROCESO COMPLETADO")
print("=" * 80)
print()
print("Resumen:")
print(f"  - Fecha procesada: {TARGET_DATE_STR}")
print(f"  - Tickers descargados: {len(rows)}")
print(f"  - Cargados a staging: {len(df)}")
print(f"  - Tabla destino: {BQ_TABLE_PRICES}")
print()

"""
Descargar shares outstanding desde Polygon.io
Genera CSV listo para BigQuery
"""

import requests
import csv
from datetime import datetime
import time

API_KEY = "hb4SJORyGfIXhczEGpiIvq3Smt21_OgO"
BASE_URL = "https://api.polygon.io/v3/reference/tickers"

# Tickers prioritarios con shares NULL (top 50)
TICKERS_MISSING_SHARES = [
    'GOOGL', 'GOOG', 'BRK.B', 'TSLA', 'TSM', 'V', 'WMT', 'JPM', 'MA', 'LLY',
    'UNH', 'XOM', 'JNJ', 'NVDA', 'PG', 'HD', 'CVX', 'ABBV', 'MRK', 'COST',
    'BAC', 'KO', 'PEP', 'AVGO', 'TMO', 'MCD', 'CSCO', 'ABT', 'ACN', 'DHR',
    'TXN', 'NKE', 'VZ', 'ADBE', 'WFC', 'CRM', 'NEE', 'LIN', 'PM', 'UPS',
    'RTX', 'HON', 'QCOM', 'MS', 'AMGN', 'LOW', 'UNP', 'BA', 'IBM', 'SPGI'
]

print("=" * 80)
print("DESCARGA SHARES OUTSTANDING - POLYGON.IO")
print("=" * 80)
print(f"Tickers a procesar: {len(TICKERS_MISSING_SHARES)}")
print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

results = []
errors = []

for i, ticker in enumerate(TICKERS_MISSING_SHARES):
    print(f"\n[{i+1}/{len(TICKERS_MISSING_SHARES)}] Procesando {ticker}...", end=' ')

    url = f"{BASE_URL}/{ticker}"
    params = {'apiKey': API_KEY}

    try:
        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()

            if data.get('status') == 'OK' and 'results' in data:
                r = data['results']

                # Preferir weighted_shares_outstanding
                shares = r.get('weighted_shares_outstanding')
                source = 'weighted'

                # Fallback a share_class
                if not shares:
                    shares = r.get('share_class_shares_outstanding')
                    source = 'share_class'

                if shares:
                    results.append({
                        'ticker': ticker,
                        'shares_outstanding': shares,
                        'shares_source': source,
                        'polygon_response_date': datetime.now().date().isoformat(),
                        'last_updated': datetime.now().isoformat(),
                        'notes': f'Downloaded from Polygon.io on {datetime.now().strftime("%Y-%m-%d")}'
                    })
                    print(f"✅ {shares:,} ({source})")
                else:
                    errors.append({
                        'ticker': ticker,
                        'error': 'No shares fields in response'
                    })
                    print(f"❌ No shares fields")
            else:
                errors.append({
                    'ticker': ticker,
                    'error': f"Status: {data.get('status')}"
                })
                print(f"❌ {data.get('status')}")

        elif response.status_code == 429:
            print(f"⚠️  Rate limit - esperando 60s...")
            time.sleep(60)
            # Reintentar
            continue

        else:
            errors.append({
                'ticker': ticker,
                'error': f"HTTP {response.status_code}"
            })
            print(f"❌ HTTP {response.status_code}")

    except Exception as e:
        errors.append({
            'ticker': ticker,
            'error': str(e)
        })
        print(f"❌ {str(e)[:50]}")

    # Rate limiting: 5 calls/minuto
    if (i + 1) % 5 == 0 and (i + 1) < len(TICKERS_MISSING_SHARES):
        print(f"\n... pausa 12s (rate limiting)")
        time.sleep(12)

# Guardar resultados
print("\n" + "=" * 80)
print("GUARDANDO RESULTADOS")
print("=" * 80)

# CSV para BigQuery
csv_filename = f'shares_outstanding_polygon_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'

with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
    if results:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

print(f"\n✅ CSV generado: {csv_filename}")
print(f"   Registros exitosos: {len(results)}")
print(f"   Registros fallidos: {len(errors)}")

# Errores
if errors:
    errors_filename = f'shares_errors_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    with open(errors_filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['ticker', 'error'])
        writer.writeheader()
        writer.writerows(errors)
    print(f"⚠️  Errores guardados: {errors_filename}")

# SQL INSERT para referencia
sql_filename = f'shares_insert_{datetime.now().strftime("%Y%m%d_%H%M%S")}.sql'

with open(sql_filename, 'w', encoding='utf-8') as f:
    f.write("-- INSERT shares_outstanding_manual\n")
    f.write("-- Generado: {}\n\n".format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
    f.write("INSERT INTO `sunny-advantage-471523-b3.IS_Fundamentales.shares_outstanding_manual`\n")
    f.write("(ticker, shares_outstanding, shares_source, polygon_response_date, last_updated, notes)\n")
    f.write("VALUES\n")

    for i, row in enumerate(results):
        comma = "," if i < len(results) - 1 else ";"
        f.write(f"('{row['ticker']}', {row['shares_outstanding']}, '{row['shares_source']}', ")
        f.write(f"'{row['polygon_response_date']}', CURRENT_TIMESTAMP(), '{row['notes']}'){comma}\n")

print(f"✅ SQL generado: {sql_filename}")

print("\n" + "=" * 80)
print("RESUMEN")
print("=" * 80)
print(f"Total procesados:  {len(TICKERS_MISSING_SHARES)}")
print(f"Exitosos:          {len(results)} ({len(results)/len(TICKERS_MISSING_SHARES)*100:.1f}%)")
print(f"Fallidos:          {len(errors)} ({len(errors)/len(TICKERS_MISSING_SHARES)*100:.1f}%)")
print(f"\nArchivos generados:")
print(f"  - {csv_filename} (para BigQuery)")
print(f"  - {sql_filename} (SQL directo)")
if errors:
    print(f"  - {errors_filename} (errores)")

print("\n" + "=" * 80)

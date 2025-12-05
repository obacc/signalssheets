#!/usr/bin/env python3
"""
Validar acceso a Google Sheet - versión con más detalle de errores
"""
from google.oauth2 import service_account
import gspread

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
SERVICE_ACCOUNT_FILE = '/home/user/signalssheets/credentials/gcp-service-account.json'
SHEET_ID = '1JHiYet7RZMbslQaZ4wofHACHvRKo-v3cZVFrSydt7sg'

print("=" * 70)
print("VALIDACIÓN ACCESO GOOGLE SHEET")
print("=" * 70)

# Paso 1: Autenticar
print("\n[1] Autenticando...")
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
print(f"    Service Account: {credentials.service_account_email}")

# Paso 2: Crear cliente gspread
print("\n[2] Creando cliente gspread...")
client = gspread.authorize(credentials)
print("    ✅ Cliente autorizado")

# Paso 3: Intentar abrir el sheet
print(f"\n[3] Abriendo Sheet ID: {SHEET_ID}")
try:
    sheet = client.open_by_key(SHEET_ID)
    print(f"    ✅ Sheet abierto: {sheet.title}")

    # Listar worksheets
    print("\n[4] Listando pestañas...")
    for ws in sheet.worksheets():
        print(f"    - {ws.title} ({ws.row_count} filas x {ws.col_count} columnas)")

    # Intentar leer Moderate
    print("\n[5] Leyendo pestaña 'Moderate'...")
    worksheet = sheet.worksheet('Moderate')
    data = worksheet.get_all_records()
    print(f"    ✅ Registros leídos: {len(data)}")

    if data:
        print(f"    Columnas: {list(data[0].keys())}")
        print("\n    Primeros 5 registros:")
        for i, row in enumerate(data[:5]):
            print(f"    {i+1}. {row}")

except gspread.exceptions.APIError as e:
    print(f"    ❌ API Error: {e}")
    print(f"    Response: {e.response.text if hasattr(e, 'response') else 'N/A'}")
except Exception as e:
    print(f"    ❌ Error: {e}")
    print(f"    Tipo: {type(e).__name__}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)

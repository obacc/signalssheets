#!/usr/bin/env python3
"""
Validar acceso a Google Sheet de parámetros Trinity Method
Sheet ID: 1JHiYet7RZMbslQaZ4wofHACHvRKo-v3cZVFrSydt7sg
Pestaña: Moderate
"""
from google.oauth2 import service_account
import pandas as pd

# Credenciales
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
SERVICE_ACCOUNT_FILE = '/home/user/signalssheets/credentials/gcp-service-account.json'
SHEET_ID = '1JHiYet7RZMbslQaZ4wofHACHvRKo-v3cZVFrSydt7sg'
WORKSHEET_NAME = 'Moderate'

print("=" * 70)
print("VALIDACIÓN ACCESO GOOGLE SHEET - PARÁMETROS TRINITY")
print("=" * 70)

# PASO 1: Autenticar y leer Sheet
print("\n[PASO 1] Conectando a Google Sheets...")

try:
    import gspread

    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)

    client = gspread.authorize(credentials)
    print("  ✅ Autenticación exitosa")

    # Abrir Sheet
    sheet = client.open_by_key(SHEET_ID)
    print(f"  ✅ Sheet abierto: {sheet.title}")

    # Listar worksheets disponibles
    worksheets = [ws.title for ws in sheet.worksheets()]
    print(f"  ✅ Pestañas disponibles: {worksheets}")

    # Abrir pestaña Moderate
    worksheet = sheet.worksheet(WORKSHEET_NAME)
    print(f"  ✅ Pestaña '{WORKSHEET_NAME}' abierta")

    # Leer datos
    data = worksheet.get_all_records()
    df = pd.DataFrame(data)

    print(f"\n  ✅ Total parámetros leídos: {len(df)}")
    print(f"  ✅ Columnas: {list(df.columns)}")

except gspread.exceptions.SpreadsheetNotFound:
    print(f"  ❌ ERROR: Sheet no encontrado (ID: {SHEET_ID})")
    print("     Verificar que el Sheet existe y tiene el ID correcto")
    exit(1)
except gspread.exceptions.WorksheetNotFound:
    print(f"  ❌ ERROR: Pestaña '{WORKSHEET_NAME}' no encontrada")
    print(f"     Pestañas disponibles: {worksheets}")
    exit(1)
except gspread.exceptions.APIError as e:
    print(f"  ❌ ERROR API: {e}")
    print("     Verificar permisos de la service account")
    exit(1)
except Exception as e:
    print(f"  ❌ ERROR: {e}")
    print(f"     Tipo: {type(e).__name__}")
    exit(1)

# PASO 2: Validar estructura
print("\n" + "=" * 70)
print("[PASO 2] Validando estructura del Sheet")
print("=" * 70)

# Verificación 1: Número de filas
expected_rows = 48
actual_rows = len(df)
if actual_rows == expected_rows:
    print(f"  ✅ Número de filas: {actual_rows} (esperado: {expected_rows})")
else:
    print(f"  ⚠️ Número de filas: {actual_rows} (esperado: {expected_rows})")

# Verificación 2: Columnas esperadas
expected_columns = ['category', 'parameter_name', 'parameter_value', 'parameter_unit', 'description']
actual_columns = list(df.columns)
missing_cols = [c for c in expected_columns if c not in actual_columns]
extra_cols = [c for c in actual_columns if c not in expected_columns]

if not missing_cols:
    print(f"  ✅ Todas las columnas esperadas presentes: {expected_columns}")
else:
    print(f"  ❌ Columnas faltantes: {missing_cols}")

if extra_cols:
    print(f"  ⚠️ Columnas adicionales: {extra_cols}")

# Verificación 3: Valores numéricos en parameter_value
if 'parameter_value' in df.columns:
    # Intentar convertir a numérico
    numeric_count = 0
    non_numeric = []
    for idx, val in df['parameter_value'].items():
        try:
            float(val)
            numeric_count += 1
        except (ValueError, TypeError):
            non_numeric.append((idx, val))

    if non_numeric:
        print(f"  ⚠️ Valores no numéricos en parameter_value: {len(non_numeric)}")
        for idx, val in non_numeric[:5]:
            print(f"      Fila {idx}: '{val}'")
    else:
        print(f"  ✅ Todos los valores en parameter_value son numéricos ({numeric_count})")

# PASO 3: Mostrar muestra de datos
print("\n" + "=" * 70)
print("[PASO 3] Muestra de datos")
print("=" * 70)
print("\nPrimeros 10 parámetros:")
print(df.head(10).to_string(index=False))

# Mostrar categorías únicas
if 'category' in df.columns:
    categories = df['category'].unique()
    print(f"\nCategorías encontradas ({len(categories)}):")
    for cat in categories:
        count = len(df[df['category'] == cat])
        print(f"  - {cat}: {count} parámetros")

# PASO 4: Exportar para validación
output_file = '/home/user/signalssheets/trinity_validation/trinity_params_validation.csv'
df.to_csv(output_file, index=False)
print(f"\n✅ Exportado: {output_file}")

# Resumen final
print("\n" + "=" * 70)
print("RESUMEN VALIDACIÓN")
print("=" * 70)
print(f"""
Sheet ID: {SHEET_ID}
Pestaña: {WORKSHEET_NAME}
Service Account: claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com

Resultados:
  - Acceso al Sheet: ✅ OK
  - Filas: {actual_rows} (esperado {expected_rows})
  - Columnas: {len(actual_columns)}
  - Datos exportados: {output_file}
""")
print("=" * 70)

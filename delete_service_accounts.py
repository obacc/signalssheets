#!/usr/bin/env python3
"""
Script para eliminar service accounts especificadas
"""

import json
import requests
import time
import jwt
from datetime import datetime

# Configuración
CREDENTIALS_PATH = '/home/user/signalssheets/gcp-service-account.json'

with open(CREDENTIALS_PATH, 'r') as f:
    creds = json.load(f)

PROJECT_ID = creds['project_id']

print("=" * 100)
print("ELIMINACIÓN DE SERVICE ACCOUNTS")
print("=" * 100)
print(f"\nProyecto: {PROJECT_ID}")
print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 100)

# Service accounts a eliminar
ACCOUNTS_TO_DELETE = [
    {
        'number': 3,
        'email': 'sunny-advantage-471523-b3@appspot.gserviceaccount.com',
        'reason': 'App Engine Default - SIN USO (>90 días)'
    },
    {
        'number': 4,
        'email': 'sa-ingest-finnhub@sunny-advantage-471523-b3.iam.gserviceaccount.com',
        'reason': 'Ingesta Finnhub - DESHABILITADA con permisos activos'
    },
    {
        'number': 8,
        'email': 'chatgpt-bigquery-read@sunny-advantage-471523-b3.iam.gserviceaccount.com',
        'reason': 'ChatGPT Integration - SIN USO (>90 días) con BigQuery Admin'
    },
    {
        'number': 9,
        'email': 'stooq-ingest-sa@sunny-advantage-471523-b3.iam.gserviceaccount.com',
        'reason': 'Ingesta Stooq - USO BAJO (hace 40 días)'
    },
    {
        'number': 11,
        'email': 'ingest-fn-sa@sunny-advantage-471523-b3.iam.gserviceaccount.com',
        'reason': 'Función Ingesta - SIN USO (>90 días)'
    },
    {
        'number': 12,
        'email': 'dataform-ci@sunny-advantage-471523-b3.iam.gserviceaccount.com',
        'reason': 'Dataform CI/CD - SIN USO (>90 días)'
    },
    {
        'number': 13,
        'email': 'bigquery-ingesta@sunny-advantage-471523-b3.iam.gserviceaccount.com',
        'reason': 'BigQuery Service - SIN USO (>90 días) sin permisos'
    },
    {
        'number': 14,
        'email': 'scheduler-invoker@sunny-advantage-471523-b3.iam.gserviceaccount.com',
        'reason': 'Scheduler Invoker - SIN USO (>90 días) sin permisos'
    }
]

# Autenticación
def create_jwt_token():
    now = int(time.time())
    payload = {
        'iss': creds['client_email'],
        'sub': creds['client_email'],
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': now,
        'exp': now + 3600,
        'scope': 'https://www.googleapis.com/auth/cloud-platform'
    }
    private_key = creds['private_key']
    encoded_jwt = jwt.encode(payload, private_key, algorithm='RS256')
    return encoded_jwt

def get_access_token():
    jwt_token = create_jwt_token()
    token_url = 'https://oauth2.googleapis.com/token'
    data = {
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt_token
    }
    response = requests.post(token_url, data=data)
    response.raise_for_status()
    return response.json()['access_token']

print("\n🔐 Autenticando...")
access_token = get_access_token()
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}
print("✅ Autenticación exitosa")

# Paso 1: Backup de IAM Policy
print("\n\n📦 PASO 1: BACKUP DE POLÍTICA IAM")
print("-" * 100)

iam_policy_url = f'https://cloudresourcemanager.googleapis.com/v1/projects/{PROJECT_ID}:getIamPolicy'
response = requests.post(iam_policy_url, headers=headers, json={})

if response.status_code == 200:
    policy = response.json()

    # Guardar backup
    backup_filename = f"auditoria/backups/iam_policy_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(backup_filename, 'w') as f:
        json.dump(policy, f, indent=2)

    print(f"✅ Backup guardado: {backup_filename}")
else:
    print(f"❌ Error obteniendo política IAM: {response.status_code}")
    print(response.text)
    exit(1)

# Paso 2: Mostrar resumen de service accounts a eliminar
print("\n\n📋 PASO 2: SERVICE ACCOUNTS A ELIMINAR")
print("-" * 100)
print(f"\nTotal a eliminar: {len(ACCOUNTS_TO_DELETE)}")
print()

for account in ACCOUNTS_TO_DELETE:
    print(f"#{account['number']}. {account['email']}")
    print(f"    Razón: {account['reason']}")
    print()

# Paso 3: Eliminar service accounts
print("\n📛 PASO 3: ELIMINANDO SERVICE ACCOUNTS")
print("-" * 100)

results = []

for idx, account in enumerate(ACCOUNTS_TO_DELETE, 1):
    email = account['email']
    number = account['number']

    print(f"\n[{idx}/{len(ACCOUNTS_TO_DELETE)}] Eliminando #{number}: {email[:60]}...")

    # URL para eliminar service account
    delete_url = f"https://iam.googleapis.com/v1/projects/{PROJECT_ID}/serviceAccounts/{email}"

    try:
        response = requests.delete(delete_url, headers=headers)

        if response.status_code == 200 or response.status_code == 204:
            print(f"    ✅ ELIMINADA exitosamente")
            results.append({
                'number': number,
                'email': email,
                'status': 'SUCCESS',
                'message': 'Eliminada exitosamente'
            })
        elif response.status_code == 404:
            print(f"    ⚠️  No existe (ya eliminada o nunca existió)")
            results.append({
                'number': number,
                'email': email,
                'status': 'NOT_FOUND',
                'message': 'No encontrada'
            })
        else:
            error_msg = response.text[:200]
            print(f"    ❌ ERROR: {response.status_code}")
            print(f"       {error_msg}")
            results.append({
                'number': number,
                'email': email,
                'status': 'ERROR',
                'message': f"HTTP {response.status_code}: {error_msg}"
            })

    except Exception as e:
        print(f"    ❌ EXCEPCIÓN: {str(e)[:200]}")
        results.append({
            'number': number,
            'email': email,
            'status': 'EXCEPTION',
            'message': str(e)[:200]
        })

    time.sleep(1)  # Rate limiting

# Paso 4: Resumen
print("\n\n" + "=" * 100)
print("📊 RESUMEN DE ELIMINACIÓN")
print("=" * 100)

success = len([r for r in results if r['status'] == 'SUCCESS'])
not_found = len([r for r in results if r['status'] == 'NOT_FOUND'])
errors = len([r for r in results if r['status'] in ['ERROR', 'EXCEPTION']])

print(f"\nTotal procesadas: {len(results)}")
print(f"   ✅ Eliminadas exitosamente: {success}")
print(f"   ⚠️  No encontradas:         {not_found}")
print(f"   ❌ Errores:                {errors}")

if errors > 0:
    print(f"\n❌ CUENTAS CON ERRORES:")
    for r in results:
        if r['status'] in ['ERROR', 'EXCEPTION']:
            print(f"   • #{r['number']}: {r['email'][:60]}")
            print(f"     {r['message']}")

# Guardar resultados
results_filename = f"auditoria/backups/deletion_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(results_filename, 'w') as f:
    json.dump({
        'timestamp': datetime.now().isoformat(),
        'project_id': PROJECT_ID,
        'total_processed': len(results),
        'success': success,
        'not_found': not_found,
        'errors': errors,
        'results': results
    }, f, indent=2)

print(f"\n💾 Resultados guardados: {results_filename}")

# Verificación final
print("\n\n🔍 PASO 4: VERIFICACIÓN POST-ELIMINACIÓN")
print("-" * 100)

print("\nListando service accounts restantes...")
iam_url = f'https://iam.googleapis.com/v1/projects/{PROJECT_ID}/serviceAccounts'
response = requests.get(iam_url, headers=headers)

if response.status_code == 200:
    data = response.json()
    accounts_remaining = data.get('accounts', [])

    print(f"\n✅ Service Accounts restantes: {len(accounts_remaining)}")
    print()

    for idx, account in enumerate(accounts_remaining, 1):
        email = account['email']
        display_name = account.get('displayName', 'N/A')
        disabled = account.get('disabled', False)
        status_icon = '🔴' if disabled else '🟢'

        print(f"{idx}. {status_icon} {email}")
        print(f"   {display_name}")
        print()

    # Guardar lista de cuentas restantes
    remaining_filename = f"auditoria/backups/remaining_accounts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(remaining_filename, 'w') as f:
        json.dump(accounts_remaining, f, indent=2)

    print(f"💾 Lista guardada: {remaining_filename}")

print("\n" + "=" * 100)
print("✅ PROCESO DE ELIMINACIÓN COMPLETADO")
print("=" * 100)

if success > 0:
    print(f"\n🎉 Se eliminaron {success} service accounts exitosamente")
    print(f"\n⚠️  IMPORTANTE:")
    print(f"   • Backup de IAM policy: {backup_filename}")
    print(f"   • Para restaurar (si es necesario):")
    print(f"     gcloud projects set-iam-policy {PROJECT_ID} {backup_filename}")

print()

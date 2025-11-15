#!/usr/bin/env python3
"""
Auditoría de Service Accounts - Análisis de Uso y Último Acceso
"""

import json
import requests
import time
import jwt
from datetime import datetime, timedelta
from collections import defaultdict

# Configuración
CREDENTIALS_PATH = '/home/user/signalssheets/gcp-service-account.json'

with open(CREDENTIALS_PATH, 'r') as f:
    creds = json.load(f)

PROJECT_ID = creds['project_id']

print("=" * 100)
print("AUDITORÍA DE USO - SERVICE ACCOUNTS")
print("=" * 100)
print(f"\nProyecto: {PROJECT_ID}")
print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 100)

# Crear JWT token y obtener access token
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

# Listar Service Accounts
print("\n📋 Obteniendo service accounts...")
iam_url = f'https://iam.googleapis.com/v1/projects/{PROJECT_ID}/serviceAccounts'
response = requests.get(iam_url, headers=headers)

service_accounts = []
if response.status_code == 200:
    data = response.json()
    accounts = data.get('accounts', [])
    print(f"✅ {len(accounts)} service accounts encontradas")

    for account in accounts:
        email = account['email']
        display_name = account.get('displayName', 'N/A')
        disabled = account.get('disabled', False)

        service_accounts.append({
            'email': email,
            'display_name': display_name,
            'disabled': disabled
        })

# Obtener IAM policy
print("\n🔒 Obteniendo permisos IAM...")
iam_policy_url = f'https://cloudresourcemanager.googleapis.com/v1/projects/{PROJECT_ID}:getIamPolicy'
response = requests.post(iam_policy_url, headers=headers, json={})

sa_permissions = defaultdict(list)
if response.status_code == 200:
    policy = response.json()
    bindings = policy.get('bindings', [])

    for binding in bindings:
        role = binding['role']
        members = binding.get('members', [])

        for member in members:
            if member.startswith('serviceAccount:'):
                sa_email = member.replace('serviceAccount:', '')
                sa_permissions[sa_email].append(role)

# Obtener actividad de logs (últimos 90 días)
print("\n📊 Analizando actividad en logs (últimos 90 días)...")
print("   Esto puede tomar unos minutos...")

sa_activity = {}
days_to_check = 90

# Calcular fecha de inicio
start_time = (datetime.now() - timedelta(days=days_to_check)).isoformat() + 'Z'

for sa in service_accounts:
    email = sa['email']
    print(f"   Consultando: {email[:50]}...")

    # Query de logs para esta SA
    log_filter = f'''
    protoPayload.authenticationInfo.principalEmail="{email}"
    timestamp>="{start_time}"
    '''

    # Endpoint de logging
    logging_url = 'https://logging.googleapis.com/v2/entries:list'

    payload = {
        'resourceNames': [f'projects/{PROJECT_ID}'],
        'filter': log_filter,
        'orderBy': 'timestamp desc',
        'pageSize': 1  # Solo necesitamos el más reciente
    }

    try:
        response = requests.post(logging_url, headers=headers, json=payload)

        if response.status_code == 200:
            log_data = response.json()
            entries = log_data.get('entries', [])

            if entries:
                # Obtener timestamp del log más reciente
                last_entry = entries[0]
                timestamp_str = last_entry.get('timestamp', '')

                if timestamp_str:
                    # Parsear timestamp
                    last_used = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    days_ago = (datetime.now(last_used.tzinfo) - last_used).days

                    sa_activity[email] = {
                        'last_used': last_used.strftime('%Y-%m-%d %H:%M:%S'),
                        'days_ago': days_ago,
                        'has_activity': True
                    }
                else:
                    sa_activity[email] = {
                        'last_used': 'Sin datos',
                        'days_ago': 9999,
                        'has_activity': False
                    }
            else:
                sa_activity[email] = {
                    'last_used': f'Sin actividad (>{days_to_check} días)',
                    'days_ago': 9999,
                    'has_activity': False
                }
        else:
            sa_activity[email] = {
                'last_used': 'Error al consultar',
                'days_ago': 9999,
                'has_activity': False
            }
    except Exception as e:
        print(f"      ⚠️ Error: {str(e)[:50]}")
        sa_activity[email] = {
            'last_used': 'Error al consultar',
            'days_ago': 9999,
            'has_activity': False
        }

    time.sleep(0.5)  # Rate limiting

print("\n✅ Análisis de actividad completado")

# Definir niveles de riesgo
HIGH_RISK_ROLES = [
    'roles/owner', 'roles/editor', 'roles/iam.securityAdmin',
    'roles/iam.serviceAccountAdmin', 'roles/iam.serviceAccountKeyAdmin',
    'roles/resourcemanager.projectIamAdmin'
]

MEDIUM_RISK_ROLES = [
    'roles/bigquery.admin', 'roles/storage.admin', 'roles/compute.admin',
    'roles/cloudfunctions.admin', 'roles/run.admin'
]

# Analizar resultados
print("\n\n📊 GENERANDO TABLA DE USO")
print("=" * 100)

analysis_results = []

for sa in service_accounts:
    email = sa['email']
    roles = sa_permissions.get(email, [])
    activity = sa_activity.get(email, {'last_used': 'Desconocido', 'days_ago': 9999, 'has_activity': False})

    # Evaluar nivel de riesgo
    high_risk_count = sum(1 for r in roles if r in HIGH_RISK_ROLES)
    medium_risk_count = sum(1 for r in roles if r in MEDIUM_RISK_ROLES)

    if high_risk_count > 0:
        risk_level = 'CRÍTICO'
        risk_icon = '🔴'
    elif medium_risk_count > 0:
        risk_level = 'ALTO'
        risk_icon = '🟠'
    elif len(roles) > 0:
        risk_level = 'MEDIO'
        risk_icon = '🟡'
    else:
        risk_level = 'BAJO'
        risk_icon = '🟢'

    # Determinar nivel de uso
    days_ago = activity['days_ago']
    if sa['disabled']:
        uso_nivel = 'DESHABILITADA'
        uso_icon = '🔴'
    elif days_ago <= 7:
        uso_nivel = 'MUY ACTIVA'
        uso_icon = '🟢'
    elif days_ago <= 30:
        uso_nivel = 'ACTIVA'
        uso_icon = '🟢'
    elif days_ago <= 90:
        uso_nivel = 'USO BAJO'
        uso_icon = '🟡'
    else:
        uso_nivel = 'SIN USO'
        uso_icon = '🔴'

    # Identificar propósito
    if 'claudecode' in email:
        purpose = 'Claude Code - Desarrollo/CI/CD'
    elif 'cursor-signalsheets' in email:
        purpose = 'Cursor Editor - Desarrollo'
    elif '@appspot' in email:
        purpose = 'App Engine Default'
    elif '@developer' in email or '@compute' in email:
        purpose = 'Compute Engine Default'
    elif '@cloudbuild' in email:
        purpose = 'Cloud Build'
    elif 'bigquerydatatransfer' in email:
        purpose = 'Data Transfer Service'
    elif '@cloudservices' in email:
        purpose = 'Google APIs Service Agent'
    elif 'firebase' in email:
        purpose = 'Firebase'
    elif 'finnhub' in email:
        purpose = 'Ingesta Finnhub'
    elif 'stooq' in email:
        purpose = 'Ingesta Stooq'
    elif 'chatgpt' in email:
        purpose = 'ChatGPT Integration'
    elif 'backend' in email:
        purpose = 'Backend Aplicación'
    elif 'dataform' in email:
        purpose = 'Dataform CI/CD'
    elif 'cloudflare' in email or 'cf-' in email:
        purpose = 'Cloudflare API'
    elif 'ingest' in email:
        purpose = 'Función Ingesta'
    elif 'scheduler' in email:
        purpose = 'Scheduler Invoker'
    elif 'bigquery' in email:
        purpose = 'BigQuery Service'
    else:
        purpose = 'Propósito Desconocido'

    # Recomendación
    if uso_nivel == 'SIN USO' and not sa['disabled']:
        recommendation = 'ELIMINAR - Sin actividad en 90+ días'
    elif uso_nivel == 'DESHABILITADA' and len(roles) > 0:
        recommendation = 'ELIMINAR - Deshabilitada pero con permisos activos'
    elif risk_level == 'CRÍTICO':
        recommendation = 'REDUCIR permisos - Riesgo crítico'
    elif risk_level == 'ALTO':
        recommendation = 'REVISAR permisos - Reducir si es posible'
    elif uso_nivel == 'USO BAJO':
        recommendation = 'MONITOREAR - Poco uso reciente'
    else:
        recommendation = 'MANTENER - Uso y permisos apropiados'

    analysis_results.append({
        'email': email,
        'display_name': sa['display_name'],
        'purpose': purpose,
        'risk_level': risk_level,
        'risk_icon': risk_icon,
        'uso_nivel': uso_nivel,
        'uso_icon': uso_icon,
        'last_used': activity['last_used'],
        'days_ago': days_ago,
        'disabled': sa['disabled'],
        'roles_count': len(roles),
        'recommendation': recommendation
    })

# Ordenar por riesgo y luego por uso
risk_order = {'CRÍTICO': 0, 'ALTO': 1, 'MEDIO': 2, 'BAJO': 3}
analysis_results.sort(key=lambda x: (risk_order[x['risk_level']], x['days_ago']))

# Imprimir tabla
print("\n")
print(f"{'#':<3} {'Riesgo':<9} {'Uso':<15} {'Service Account':<45} {'Último Uso':<25} {'Propósito':<30}")
print("-" * 130)

for idx, result in enumerate(analysis_results, 1):
    email = result['email']
    if len(email) > 42:
        email = email[:39] + '...'

    print(f"{idx:<3} {result['risk_icon']} {result['risk_level']:<7} {result['uso_icon']} {result['uso_nivel']:<13} {email:<45} {result['last_used']:<25} {result['purpose']:<30}")

# Resumen
print("\n\n" + "=" * 100)
print("📊 RESUMEN")
print("=" * 100)

total = len(analysis_results)
muy_activas = len([r for r in analysis_results if r['uso_nivel'] == 'MUY ACTIVA'])
activas = len([r for r in analysis_results if r['uso_nivel'] == 'ACTIVA'])
uso_bajo = len([r for r in analysis_results if r['uso_nivel'] == 'USO BAJO'])
sin_uso = len([r for r in analysis_results if r['uso_nivel'] == 'SIN USO'])
deshabilitadas = len([r for r in analysis_results if r['uso_nivel'] == 'DESHABILITADA'])

print(f"\nNivel de Uso:")
print(f"   🟢 MUY ACTIVA (< 7 días):     {muy_activas}")
print(f"   🟢 ACTIVA (7-30 días):        {activas}")
print(f"   🟡 USO BAJO (30-90 días):     {uso_bajo}")
print(f"   🔴 SIN USO (> 90 días):       {sin_uso}")
print(f"   🔴 DESHABILITADA:             {deshabilitadas}")

critico = len([r for r in analysis_results if r['risk_level'] == 'CRÍTICO'])
alto = len([r for r in analysis_results if r['risk_level'] == 'ALTO'])

print(f"\nAcciones Recomendadas:")
eliminar = len([r for r in analysis_results if 'ELIMINAR' in r['recommendation']])
reducir = len([r for r in analysis_results if 'REDUCIR' in r['recommendation']])
revisar = len([r for r in analysis_results if 'REVISAR' in r['recommendation']])

print(f"   🔴 ELIMINAR:                  {eliminar} cuentas")
print(f"   🟠 REDUCIR permisos:          {reducir} cuentas")
print(f"   🟡 REVISAR:                   {revisar} cuentas")

# Guardar resultados
print("\n\n💾 GUARDANDO RESULTADOS...")

import os
os.makedirs('auditoria/artifacts', exist_ok=True)

output = {
    'fecha_auditoria': datetime.now().isoformat(),
    'project_id': PROJECT_ID,
    'periodo_analisis_dias': days_to_check,
    'total_service_accounts': total,
    'resumen_uso': {
        'muy_activas': muy_activas,
        'activas': activas,
        'uso_bajo': uso_bajo,
        'sin_uso': sin_uso,
        'deshabilitadas': deshabilitadas
    },
    'resumen_riesgo': {
        'critico': critico,
        'alto': alto
    },
    'service_accounts': analysis_results
}

with open('auditoria/artifacts/service_accounts_usage_analysis.json', 'w') as f:
    json.dump(output, f, indent=2)

print("✅ auditoria/artifacts/service_accounts_usage_analysis.json")

# CSV
import csv
with open('auditoria/artifacts/service_accounts_usage.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'email', 'display_name', 'purpose', 'risk_level', 'uso_nivel',
        'last_used', 'days_ago', 'disabled', 'recommendation'
    ])
    writer.writeheader()
    for r in analysis_results:
        writer.writerow({
            'email': r['email'],
            'display_name': r['display_name'],
            'purpose': r['purpose'],
            'risk_level': r['risk_level'],
            'uso_nivel': r['uso_nivel'],
            'last_used': r['last_used'],
            'days_ago': r['days_ago'],
            'disabled': r['disabled'],
            'recommendation': r['recommendation']
        })

print("✅ auditoria/artifacts/service_accounts_usage.csv")

print("\n" + "=" * 100)
print("✅ AUDITORÍA DE USO COMPLETADA")
print("=" * 100 + "\n")

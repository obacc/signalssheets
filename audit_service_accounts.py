#!/usr/bin/env python3
"""
Auditoría de Service Accounts - Análisis de Seguridad
Identifica permisos excesivos, cuentas sin uso, y riesgos de seguridad
"""

import json
import requests
import time
import jwt
from datetime import datetime, timedelta
from collections import defaultdict

# Configuración
CREDENTIALS_PATH = '/home/user/signalssheets/gcp-service-account.json'

# Cargar credenciales
with open(CREDENTIALS_PATH, 'r') as f:
    creds = json.load(f)

PROJECT_ID = creds['project_id']
PROJECT_NUMBER = None

print("=" * 100)
print("AUDITORÍA DE SEGURIDAD - SERVICE ACCOUNTS")
print("=" * 100)
print(f"\nProyecto: {PROJECT_ID}")
print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 100)

# Crear JWT token
def create_jwt_token():
    """Create a JWT token for authentication."""
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

# Get access token
def get_access_token():
    """Exchange JWT for access token."""
    jwt_token = create_jwt_token()
    token_url = 'https://oauth2.googleapis.com/token'
    data = {
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt_token
    }
    response = requests.post(token_url, data=data)
    response.raise_for_status()
    return response.json()['access_token']

# Obtener access token
print("\n🔐 Autenticando con Google Cloud...")
access_token = get_access_token()
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}
print("✅ Autenticación exitosa")

# Obtener project number
print("\n📊 Obteniendo información del proyecto...")
project_url = f'https://cloudresourcemanager.googleapis.com/v1/projects/{PROJECT_ID}'
response = requests.get(project_url, headers=headers)
if response.status_code == 200:
    project_info = response.json()
    PROJECT_NUMBER = project_info.get('projectNumber')
    print(f"   Project Number: {PROJECT_NUMBER}")

# ============================================================================
# 1. LISTAR TODAS LAS SERVICE ACCOUNTS
# ============================================================================
print("\n\n📋 1. INVENTARIO DE SERVICE ACCOUNTS")
print("-" * 100)

iam_url = f'https://iam.googleapis.com/v1/projects/{PROJECT_ID}/serviceAccounts'
response = requests.get(iam_url, headers=headers)

service_accounts = []
if response.status_code == 200:
    data = response.json()
    accounts = data.get('accounts', [])

    print(f"\n✅ Service Accounts encontradas: {len(accounts)}\n")

    for idx, account in enumerate(accounts, 1):
        email = account['email']
        display_name = account.get('displayName', 'N/A')
        unique_id = account['uniqueId']
        disabled = account.get('disabled', False)

        # Identificar tipo de SA
        if '@appspot.gserviceaccount.com' in email:
            sa_type = 'App Engine Default'
        elif '@developer.gserviceaccount.com' in email:
            sa_type = 'Compute Engine Default'
        elif '@cloudbuild.gserviceaccount.com' in email:
            sa_type = 'Cloud Build'
        elif '@gcp-sa-' in email:
            sa_type = 'Google-managed'
        elif '@cloudservices.gserviceaccount.com' in email:
            sa_type = 'Google APIs Service Agent'
        else:
            sa_type = 'User-managed'

        service_accounts.append({
            'email': email,
            'display_name': display_name,
            'unique_id': unique_id,
            'type': sa_type,
            'disabled': disabled
        })

        status_icon = '🔴' if disabled else '🟢'
        print(f"{idx}. {status_icon} {email}")
        print(f"   Nombre: {display_name}")
        print(f"   Tipo: {sa_type}")
        print(f"   ID: {unique_id}")
        print(f"   Estado: {'DESHABILITADA' if disabled else 'ACTIVA'}")
        print()

else:
    print(f"❌ Error listando service accounts: {response.status_code}")
    print(response.text)

# ============================================================================
# 2. OBTENER PERMISOS IAM DEL PROYECTO
# ============================================================================
print("\n\n🔒 2. ANÁLISIS DE PERMISOS IAM")
print("-" * 100)

iam_policy_url = f'https://cloudresourcemanager.googleapis.com/v1/projects/{PROJECT_ID}:getIamPolicy'
response = requests.post(iam_policy_url, headers=headers, json={})

sa_permissions = defaultdict(list)
if response.status_code == 200:
    policy = response.json()
    bindings = policy.get('bindings', [])

    print(f"\n✅ Analizando {len(bindings)} bindings de IAM...")

    for binding in bindings:
        role = binding['role']
        members = binding.get('members', [])

        for member in members:
            if member.startswith('serviceAccount:'):
                sa_email = member.replace('serviceAccount:', '')
                sa_permissions[sa_email].append(role)

    print(f"   Service accounts con permisos: {len(sa_permissions)}")
    print()

# ============================================================================
# 3. ANÁLISIS DE RIESGOS Y RECOMENDACIONES
# ============================================================================
print("\n\n⚠️  3. ANÁLISIS DE RIESGOS Y RECOMENDACIONES")
print("-" * 100)

# Definir niveles de riesgo por rol
HIGH_RISK_ROLES = [
    'roles/owner',
    'roles/editor',
    'roles/iam.securityAdmin',
    'roles/iam.serviceAccountAdmin',
    'roles/iam.serviceAccountKeyAdmin',
    'roles/resourcemanager.projectIamAdmin'
]

MEDIUM_RISK_ROLES = [
    'roles/bigquery.admin',
    'roles/storage.admin',
    'roles/compute.admin',
    'roles/cloudfunctions.admin',
    'roles/run.admin'
]

# Análisis detallado
analysis_results = []

for sa in service_accounts:
    email = sa['email']
    roles = sa_permissions.get(email, [])

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

    # Identificar propósito
    if 'claudecode' in email:
        purpose = 'Claude Code - Desarrollo/CI/CD'
        recommendation = 'Revisar si necesita Owner. Considerar roles más específicos.'
    elif 'cursor-signalsheets' in email:
        purpose = 'Cursor Editor - Desarrollo'
        recommendation = 'Revisar permisos. Usar en desarrollo solo.'
    elif '@appspot' in email:
        purpose = 'App Engine - Runtime de aplicaciones'
        recommendation = 'Mantener solo si usa App Engine.'
    elif '@developer' in email or '@compute' in email:
        purpose = 'Compute Engine - VMs y servicios'
        recommendation = 'Mantener solo si usa Compute Engine.'
    elif '@cloudbuild' in email:
        purpose = 'Cloud Build - CI/CD de Google'
        recommendation = 'Mantener solo si usa Cloud Build.'
    elif 'bigquerydatatransfer' in email:
        purpose = 'Data Transfer Service - Carga de datos'
        recommendation = 'Verificar que solo tenga permisos de lectura/escritura necesarios.'
    elif '@cloudservices' in email:
        purpose = 'Google APIs Service Agent - Servicio interno'
        recommendation = 'NO modificar. Gestionado por Google.'
    elif 'firebase' in email:
        purpose = 'Firebase - Servicios de backend'
        recommendation = 'Mantener solo si usa Firebase.'
    else:
        purpose = 'Desconocido - Verificar uso'
        recommendation = 'Investigar propósito. Considerar eliminar si no se usa.'

    analysis_results.append({
        'email': email,
        'display_name': sa['display_name'],
        'type': sa['type'],
        'purpose': purpose,
        'roles_count': len(roles),
        'roles': roles,
        'high_risk_roles': [r for r in roles if r in HIGH_RISK_ROLES],
        'medium_risk_roles': [r for r in roles if r in MEDIUM_RISK_ROLES],
        'risk_level': risk_level,
        'risk_icon': risk_icon,
        'disabled': sa['disabled'],
        'recommendation': recommendation
    })

# Ordenar por nivel de riesgo (Crítico primero)
risk_order = {'CRÍTICO': 0, 'ALTO': 1, 'MEDIO': 2, 'BAJO': 3}
analysis_results.sort(key=lambda x: (risk_order[x['risk_level']], -x['roles_count']))

# ============================================================================
# 4. GENERAR TABLA DE RESULTADOS
# ============================================================================
print("\n\n📊 TABLA DE ANÁLISIS DE SEGURIDAD")
print("=" * 100)
print()

# Header
print(f"{'#':<3} {'Riesgo':<8} {'Service Account':<50} {'Roles':<6} {'Propósito':<30}")
print("-" * 100)

for idx, result in enumerate(analysis_results, 1):
    email = result['email']
    if len(email) > 45:
        email = email[:42] + '...'

    print(f"{idx:<3} {result['risk_icon']} {result['risk_level']:<6} {email:<50} {result['roles_count']:<6} {result['purpose']:<30}")

print()

# Detalles por SA
print("\n\n📋 DETALLES Y RECOMENDACIONES POR SERVICE ACCOUNT")
print("=" * 100)

for idx, result in enumerate(analysis_results, 1):
    print(f"\n{idx}. {result['risk_icon']} {result['email']}")
    print(f"   {'─' * 90}")
    print(f"   Nombre:      {result['display_name']}")
    print(f"   Tipo:        {result['type']}")
    print(f"   Propósito:   {result['purpose']}")
    print(f"   Riesgo:      {result['risk_level']}")
    print(f"   Estado:      {'🔴 DESHABILITADA' if result['disabled'] else '🟢 ACTIVA'}")
    print(f"   Total roles: {result['roles_count']}")

    if result['high_risk_roles']:
        print(f"\n   🔴 ROLES DE ALTO RIESGO:")
        for role in result['high_risk_roles']:
            print(f"      • {role}")

    if result['medium_risk_roles']:
        print(f"\n   🟠 ROLES DE RIESGO MEDIO:")
        for role in result['medium_risk_roles']:
            print(f"      • {role}")

    if result['roles']:
        other_roles = [r for r in result['roles'] if r not in HIGH_RISK_ROLES and r not in MEDIUM_RISK_ROLES]
        if other_roles:
            print(f"\n   🟡 OTROS ROLES:")
            for role in other_roles[:5]:  # Mostrar solo primeros 5
                print(f"      • {role}")
            if len(other_roles) > 5:
                print(f"      ... y {len(other_roles) - 5} más")

    print(f"\n   💡 RECOMENDACIÓN:")
    print(f"      {result['recommendation']}")

# ============================================================================
# 5. RESUMEN DE SEGURIDAD
# ============================================================================
print("\n\n" + "=" * 100)
print("🎯 RESUMEN DE SEGURIDAD")
print("=" * 100)

total_sas = len(service_accounts)
critical_risk = len([r for r in analysis_results if r['risk_level'] == 'CRÍTICO'])
high_risk = len([r for r in analysis_results if r['risk_level'] == 'ALTO'])
medium_risk = len([r for r in analysis_results if r['risk_level'] == 'MEDIO'])
low_risk = len([r for r in analysis_results if r['risk_level'] == 'BAJO'])
disabled = len([r for r in analysis_results if r['disabled']])

print(f"\n📊 Estadísticas:")
print(f"   Total Service Accounts:     {total_sas}")
print(f"   🔴 Riesgo CRÍTICO:          {critical_risk}")
print(f"   🟠 Riesgo ALTO:             {high_risk}")
print(f"   🟡 Riesgo MEDIO:            {medium_risk}")
print(f"   🟢 Riesgo BAJO:             {low_risk}")
print(f"   ⚫ Deshabilitadas:          {disabled}")

# Contar permisos peligrosos
owner_count = sum(1 for r in analysis_results if 'roles/owner' in r['roles'])
editor_count = sum(1 for r in analysis_results if 'roles/editor' in r['roles'])

print(f"\n⚠️  Permisos Peligrosos:")
print(f"   Service Accounts con roles/owner:  {owner_count}")
print(f"   Service Accounts con roles/editor: {editor_count}")

if owner_count > 0 or editor_count > 0:
    print(f"\n   🚨 ALERTA: {owner_count + editor_count} cuentas con permisos amplios")
    print(f"      Aplicar principio de mínimo privilegio")

# ============================================================================
# 6. PLAN DE ACCIÓN RECOMENDADO
# ============================================================================
print("\n\n🎯 PLAN DE ACCIÓN RECOMENDADO")
print("=" * 100)

print("\n📋 FASE 1: EMERGENCIA (HOY)")
print("-" * 100)
phase1_actions = []

for result in analysis_results:
    if result['risk_level'] == 'CRÍTICO':
        if 'roles/owner' in result['roles']:
            action = f"• Auditar {result['email'][:50]}"
            action += f"\n  └─ Tiene rol Owner. Evaluar si realmente lo necesita."
            action += f"\n  └─ Propósito: {result['purpose']}"
            phase1_actions.append(action)

if phase1_actions:
    for action in phase1_actions:
        print(action)
else:
    print("✅ No hay acciones críticas pendientes")

print("\n\n📋 FASE 2: OPTIMIZACIÓN (ESTA SEMANA)")
print("-" * 100)

phase2_actions = [
    "• Implementar principio de mínimo privilegio:",
    "  └─ Reemplazar roles/owner por roles específicos (bigquery.dataEditor, etc.)",
    "  └─ Reemplazar roles/editor por roles granulares",
    "",
    "• Rotar claves de service accounts críticas:",
    "  └─ claudecode@... (última rotación: desconocida)",
    "  └─ Establecer política de rotación cada 90 días",
    "",
    "• Deshabilitar service accounts no utilizadas:",
]

# Identificar SAs sin permisos (posiblemente sin uso)
unused_sas = [r for r in analysis_results if r['roles_count'] == 0 and not r['disabled']]
if unused_sas:
    phase2_actions.append(f"  └─ {len(unused_sas)} cuentas sin roles asignados")
    for sa in unused_sas[:3]:
        phase2_actions.append(f"     • {sa['email'][:60]}")

for action in phase2_actions:
    print(action)

print("\n\n📋 FASE 3: MONITOREO (CONTINUO)")
print("-" * 100)

phase3_actions = [
    "• Configurar Cloud Monitoring para:",
    "  └─ Detección de uso anómalo de service accounts",
    "  └─ Alertas de creación de nuevas claves",
    "  └─ Cambios en permisos IAM",
    "",
    "• Auditoría mensual de permisos:",
    "  └─ Re-ejecutar este script mensualmente",
    "  └─ Revisar logs de acceso de cada SA",
    "  └─ Validar que permisos sigan siendo necesarios",
    "",
    "• Implementar políticas de organización:",
    "  └─ Prohibir roles/owner en SAs de producción",
    "  └─ Requerir aprobación para service account keys",
    "  └─ Expiración automática de claves > 90 días"
]

for action in phase3_actions:
    print(action)

# ============================================================================
# 7. GUARDAR RESULTADOS
# ============================================================================
print("\n\n💾 GUARDANDO RESULTADOS...")
print("-" * 100)

import os
os.makedirs('auditoria/artifacts', exist_ok=True)

# Guardar JSON completo
output = {
    'fecha_auditoria': datetime.now().isoformat(),
    'project_id': PROJECT_ID,
    'project_number': PROJECT_NUMBER,
    'total_service_accounts': total_sas,
    'resumen': {
        'critico': critical_risk,
        'alto': high_risk,
        'medio': medium_risk,
        'bajo': low_risk,
        'deshabilitadas': disabled,
        'con_owner': owner_count,
        'con_editor': editor_count
    },
    'service_accounts': analysis_results
}

with open('auditoria/artifacts/service_accounts_security_audit.json', 'w') as f:
    json.dump(output, f, indent=2)

print("✅ auditoria/artifacts/service_accounts_security_audit.json")

# Guardar CSV simplificado
import csv

with open('auditoria/artifacts/service_accounts_summary.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'email', 'display_name', 'type', 'purpose', 'risk_level',
        'roles_count', 'disabled', 'recommendation'
    ])
    writer.writeheader()
    for r in analysis_results:
        writer.writerow({
            'email': r['email'],
            'display_name': r['display_name'],
            'type': r['type'],
            'purpose': r['purpose'],
            'risk_level': r['risk_level'],
            'roles_count': r['roles_count'],
            'disabled': r['disabled'],
            'recommendation': r['recommendation']
        })

print("✅ auditoria/artifacts/service_accounts_summary.csv")

print("\n" + "=" * 100)
print("✅ AUDITORÍA DE SEGURIDAD COMPLETADA")
print("=" * 100 + "\n")

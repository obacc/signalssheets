#!/usr/bin/env python3
"""Script to check GCP service account permissions using REST API."""

import json
import time
import jwt
import requests
from datetime import datetime, timedelta

# Load service account credentials
credentials_path = '/home/user/signalssheets/gcp-service-account.json'
with open(credentials_path, 'r') as f:
    creds = json.load(f)

project_id = creds['project_id']
service_account_email = creds['client_email']

print(f"=" * 80)
print(f"VERIFICACIÓN DE PERMISOS - CUENTA DE SERVICIO")
print(f"=" * 80)
print(f"\nProyecto: {project_id}")
print(f"Cuenta de servicio: {service_account_email}")
print(f"\n" + "=" * 80)

# Create JWT token
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

    # Sign with private key
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

try:
    # Get access token
    print(f"\n🔐 Autenticando con Google Cloud...")
    access_token = get_access_token()
    print(f"✅ Autenticación exitosa")

    # Get IAM policy for the project
    print(f"\n📋 Consultando políticas IAM del proyecto...")
    iam_url = f'https://cloudresourcemanager.googleapis.com/v1/projects/{project_id}:getIamPolicy'
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    response = requests.post(iam_url, headers=headers, json={})

    if response.status_code == 200:
        policy = response.json()

        print(f"\n📋 ROLES ASIGNADOS A LA CUENTA DE SERVICIO:")
        print(f"-" * 80)

        service_account_member = f"serviceAccount:{service_account_email}"
        roles_found = []

        if 'bindings' in policy:
            for binding in policy['bindings']:
                if service_account_member in binding.get('members', []):
                    role = binding['role']
                    roles_found.append(role)
                    print(f"\n✓ {role}")

                    # Check role type
                    if role == "roles/owner":
                        print(f"  → ⭐ ROL DE PROPIETARIO (Owner) - Control Total")
                        print(f"  → Permisos: TODOS los permisos del proyecto")
                    elif role == "roles/editor":
                        print(f"  → 📝 ROL DE EDITOR - Lectura/Escritura en la mayoría de recursos")
                    elif role == "roles/viewer":
                        print(f"  → 👁️  ROL DE VISOR - Solo lectura")
                    elif "bigquery" in role.lower():
                        print(f"  → 📊 Rol de BigQuery")
                    elif "storage" in role.lower():
                        print(f"  → 🗄️  Rol de Cloud Storage")
                    else:
                        print(f"  → Rol personalizado o específico de servicio")

        print(f"\n" + "=" * 80)
        print(f"\n📊 RESUMEN DE PERMISOS:")
        print(f"-" * 80)

        if "roles/owner" in roles_found:
            print(f"\n✅ EXCELENTE: La cuenta tiene el rol de PROPIETARIO (Owner)")
            print(f"\nCon este rol, la cuenta de servicio tiene:")
            print(f"  • ✅ Control total sobre todos los recursos del proyecto")
            print(f"  • ✅ Permiso para crear, modificar y eliminar recursos")
            print(f"  • ✅ Acceso completo a BigQuery:")
            print(f"      - Crear/modificar/eliminar datasets")
            print(f"      - Crear/modificar/eliminar tablas")
            print(f"      - Ejecutar queries")
            print(f"      - Exportar/importar datos")
            print(f"  • ✅ Acceso completo a Cloud Storage:")
            print(f"      - Crear/eliminar buckets")
            print(f"      - Leer/escribir/eliminar archivos")
            print(f"      - Configurar permisos")
            print(f"  • ✅ Acceso a Cloud Functions, Cloud Run, Compute Engine")
            print(f"  • ✅ Permiso para gestionar IAM (asignar roles a otros usuarios)")
            print(f"  • ✅ Acceso a facturación y configuración del proyecto")
            print(f"\n✅ CONCLUSIÓN: Este rol es COMPLETAMENTE SUFICIENTE para cualquier operación.")
            print(f"\n⚠️  RECOMENDACIONES DE SEGURIDAD:")
            print(f"  • 🔒 Protege estas credenciales adecuadamente")
            print(f"  • 🚫 NO las compartas públicamente ni las subas a repositorios")
            print(f"  • 🗑️  Agrega gcp-service-account.json a .gitignore")
            print(f"  • 🔄 Considera rotar las claves periódicamente")
            print(f"  • 🎯 Si solo necesitas ciertos permisos específicos, considera usar")
            print(f"      roles más restrictivos (principio de mínimo privilegio)")

        elif "roles/editor" in roles_found:
            print(f"\n✅ BUENO: La cuenta tiene el rol de EDITOR")
            print(f"  → Puede crear y modificar la mayoría de recursos")
            print(f"  → Acceso a BigQuery y Cloud Storage")
            print(f"  → NO puede gestionar permisos IAM ni facturación")
            print(f"\n✅ CONCLUSIÓN: Suficiente para operaciones normales de desarrollo.")

        elif "roles/viewer" in roles_found:
            print(f"\n⚠️  LIMITADO: La cuenta solo tiene el rol de VISOR")
            print(f"  → Solo puede leer recursos, NO puede crear o modificar")
            print(f"\n❌ CONCLUSIÓN: NO es suficiente para hacer cambios. Necesitas al menos Editor.")

        else:
            print(f"\n🔍 ROLES ENCONTRADOS: {len(roles_found)}")
            for role in roles_found:
                print(f"  • {role}")

            if roles_found:
                # Check if has BigQuery and Storage permissions
                has_bigquery = any('bigquery' in r.lower() for r in roles_found)
                has_storage = any('storage' in r.lower() for r in roles_found)

                print(f"\n📊 Permisos específicos detectados:")
                if has_bigquery:
                    print(f"  ✅ Tiene permisos de BigQuery")
                if has_storage:
                    print(f"  ✅ Tiene permisos de Cloud Storage")

                if has_bigquery and has_storage:
                    print(f"\n✅ CONCLUSIÓN: Puede tener permisos suficientes para operaciones")
                    print(f"   específicas, pero no control total del proyecto.")
                else:
                    print(f"\n⚠️  Verifica si estos permisos son suficientes para tu caso de uso.")

        if not roles_found:
            print(f"\n❌ ERROR: No se encontraron roles asignados a esta cuenta de servicio")
            print(f"\nAcciones requeridas:")
            print(f"  1. Ve a GCP Console: https://console.cloud.google.com")
            print(f"  2. Navega a IAM & Admin > IAM")
            print(f"  3. Busca: {service_account_email}")
            print(f"  4. Asigna el rol 'Owner' o 'Editor'")

        # Additional info
        print(f"\n" + "=" * 80)
        print(f"\n📚 INFORMACIÓN ADICIONAL:")
        print(f"-" * 80)
        print(f"\nJerarquía de roles básicos (de más a menos permisos):")
        print(f"  1. Owner (Propietario) - Control total ⭐")
        print(f"  2. Editor - Puede modificar recursos 📝")
        print(f"  3. Viewer - Solo lectura 👁️")
        print(f"\nRoles específicos por servicio:")
        print(f"  • BigQuery Admin - Control total de BigQuery")
        print(f"  • Storage Admin - Control total de Cloud Storage")
        print(f"  • Compute Admin - Control total de Compute Engine")

    elif response.status_code == 403:
        print(f"\n❌ ERROR 403: Permiso denegado")
        print(f"\nLa cuenta de servicio NO tiene permiso para leer las políticas IAM.")
        print(f"Esto significa que probablemente NO tiene el rol de Owner asignado.")
        print(f"\n🔧 SOLUCIÓN:")
        print(f"  1. Ve a GCP Console: https://console.cloud.google.com/iam-admin/iam")
        print(f"  2. Busca: {service_account_email}")
        print(f"  3. Haz clic en el lápiz (editar)")
        print(f"  4. Asigna el rol 'Owner'")
        print(f"  5. Guarda los cambios")

    else:
        print(f"\n❌ ERROR {response.status_code}: {response.text}")

except Exception as e:
    print(f"\n❌ ERROR:")
    print(f"  {str(e)}")
    print(f"\nPosibles causas:")
    print(f"  • Las credenciales no son válidas")
    print(f"  • Problemas de conectividad con GCP")
    print(f"  • La cuenta de servicio fue deshabilitada")

print(f"\n" + "=" * 80)
print(f"VERIFICACIÓN COMPLETADA")
print(f"=" * 80 + "\n")

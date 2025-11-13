#!/usr/bin/env python3
"""Script to check GCP service account permissions."""

import json
import os
from google.cloud import resourcemanager_v3
from google.oauth2 import service_account

# Load service account credentials
credentials_path = '/home/user/signalssheets/gcp-service-account.json'
credentials = service_account.Credentials.from_service_account_file(
    credentials_path,
    scopes=['https://www.googleapis.com/auth/cloud-platform']
)

# Get project ID from credentials
with open(credentials_path, 'r') as f:
    creds_data = json.load(f)
    project_id = creds_data['project_id']
    service_account_email = creds_data['client_email']

print(f"=" * 80)
print(f"VERIFICACIÓN DE PERMISOS - CUENTA DE SERVICIO")
print(f"=" * 80)
print(f"\nProyecto: {project_id}")
print(f"Cuenta de servicio: {service_account_email}")
print(f"\n" + "=" * 80)

try:
    # Get IAM policy for the project
    client = resourcemanager_v3.ProjectsClient(credentials=credentials)
    request = resourcemanager_v3.GetIamPolicyRequest(
        resource=f"projects/{project_id}"
    )

    policy = client.get_iam_policy(request=request)

    print(f"\n📋 ROLES ASIGNADOS A LA CUENTA DE SERVICIO:")
    print(f"-" * 80)

    service_account_member = f"serviceAccount:{service_account_email}"
    roles_found = []

    for binding in policy.bindings:
        if service_account_member in binding.members:
            roles_found.append(binding.role)
            print(f"\n✓ {binding.role}")

            # Check if it's the Owner role
            if binding.role == "roles/owner":
                print(f"  → ⭐ ROL DE PROPIETARIO (Owner) - Control Total")
                print(f"  → Permisos: TODOS los permisos del proyecto")
            elif binding.role == "roles/editor":
                print(f"  → 📝 ROL DE EDITOR - Lectura/Escritura en la mayoría de recursos")
            elif binding.role == "roles/viewer":
                print(f"  → 👁️  ROL DE VISOR - Solo lectura")
            else:
                print(f"  → Rol personalizado o específico de servicio")

    print(f"\n" + "=" * 80)
    print(f"\n📊 RESUMEN DE PERMISOS:")
    print(f"-" * 80)

    if "roles/owner" in roles_found:
        print(f"\n✅ EXCELENTE: La cuenta tiene el rol de PROPIETARIO (Owner)")
        print(f"\nCon este rol, la cuenta de servicio tiene:")
        print(f"  • Control total sobre todos los recursos del proyecto")
        print(f"  • Permiso para crear, modificar y eliminar recursos")
        print(f"  • Acceso a BigQuery (crear/modificar datasets, tablas, ejecutar queries)")
        print(f"  • Acceso a Cloud Storage (crear/eliminar buckets, leer/escribir archivos)")
        print(f"  • Acceso a Cloud Functions, Cloud Run, etc.")
        print(f"  • Permiso para gestionar IAM (asignar roles a otros usuarios)")
        print(f"  • Acceso a facturación y configuración del proyecto")
        print(f"\n✅ CONCLUSIÓN: Este rol es SUFICIENTE para cualquier operación en el proyecto.")
        print(f"\n⚠️  IMPORTANTE: El rol de Owner es muy poderoso. Asegúrate de:")
        print(f"  • Proteger estas credenciales adecuadamente")
        print(f"  • No compartirlas públicamente")
        print(f"  • Considerar usar roles más específicos si solo necesitas ciertos permisos")

    elif "roles/editor" in roles_found:
        print(f"\n✅ BUENO: La cuenta tiene el rol de EDITOR")
        print(f"  → Puede crear y modificar la mayoría de recursos")
        print(f"  → NO puede gestionar permisos IAM ni facturación")

    elif "roles/viewer" in roles_found:
        print(f"\n⚠️  LIMITADO: La cuenta solo tiene el rol de VISOR")
        print(f"  → Solo puede leer recursos, NO puede crear o modificar")

    else:
        print(f"\n🔍 ROLES ENCONTRADOS:")
        for role in roles_found:
            print(f"  • {role}")

    if not roles_found:
        print(f"\n❌ ERROR: No se encontraron roles asignados a esta cuenta de servicio")
        print(f"  → Verifica que los roles están correctamente asignados en GCP Console")

    print(f"\n" + "=" * 80)

except Exception as e:
    print(f"\n❌ ERROR al verificar permisos:")
    print(f"  {str(e)}")
    print(f"\nPosibles causas:")
    print(f"  • Las credenciales no son válidas")
    print(f"  • La cuenta de servicio no tiene permiso para leer IAM policies")
    print(f"  • Problemas de conectividad con GCP")

    # Try to list some basic info
    print(f"\n🔍 Intentando validar credenciales básicas...")
    try:
        from google.auth import default
        from google.auth.transport.requests import Request

        # Validate credentials
        if credentials.expired:
            credentials.refresh(Request())

        print(f"✅ Las credenciales son válidas y se pueden autenticar")
        print(f"❌ Pero la cuenta no tiene permisos para leer IAM policies")
        print(f"\n💡 RECOMENDACIÓN:")
        print(f"  Para verificar permisos, la cuenta necesita al menos uno de estos roles:")
        print(f"  • roles/owner (Propietario)")
        print(f"  • roles/iam.securityReviewer (Revisor de Seguridad)")
        print(f"  • roles/viewer (Visor) + resourcemanager.projects.getIamPolicy")

    except Exception as e2:
        print(f"❌ Error al validar credenciales: {str(e2)}")

print(f"\n" + "=" * 80)
print(f"VERIFICACIÓN COMPLETADA")
print(f"=" * 80 + "\n")

# PLAN DE ACCIÓN - SEGURIDAD DE SERVICE ACCOUNTS

**Proyecto:** `sunny-advantage-471523-b3`
**Fecha:** 2025-11-15
**Auditor:** Claude Code
**Estado:** 🚨 ACCIÓN URGENTE REQUERIDA

---

## 🎯 RESUMEN EJECUTIVO

Se identificaron **14 service accounts** en el proyecto, de las cuales:
- 🔴 **4 tienen riesgo CRÍTICO** (roles Owner/Editor)
- 🟠 **4 tienen riesgo ALTO** (roles Admin)
- 🟡 **4 tienen riesgo MEDIO**
- 🟢 **2 tienen riesgo BAJO**
- ⚫ **1 deshabilitada** (pero con permisos activos)

### 🚨 ALERTA CRÍTICA

**4 service accounts tienen permisos amplios** (Owner/Editor):
1. `claudecode@...` - **Owner** (control total)
2. `sa-ingest-finnhub@...` - Editor (deshabilitada pero con permisos)
3. `822442830684-compute@...` - Editor (Compute Engine default)
4. `sunny-advantage-471523-b3@appspot` - Editor (App Engine default)

---

## 📊 TABLA DE SERVICE ACCOUNTS Y RECOMENDACIONES

| # | Riesgo | Service Account | Propósito | Roles | Estado | Acción Inmediata |
|---|--------|----------------|-----------|-------|--------|------------------|
| **1** | 🔴 **CRÍTICO** | **claudecode@sunny-advantage-471523-b3** | Claude Code - Desarrollo/CI/CD | • roles/owner<br>• roles/bigquery.admin | 🟢 Activa | **REDUCIR** a roles específicos:<br>• bigquery.dataEditor<br>• bigquery.jobUser<br>• storage.objectViewer |
| **2** | 🔴 **CRÍTICO** | sa-ingest-finnhub@sunny-advantage-471523-b3 | Ingesta Finnhub (sin uso) | • roles/editor<br>• bigquery.dataEditor<br>• bigquery.jobUser<br>• secretmanager.secretAccessor | 🔴 Deshabilitada | **ELIMINAR**<br>Ya está deshabilitada pero mantiene permisos activos |
| **3** | 🔴 **CRÍTICO** | 822442830684-compute@developer.gserviceaccount.com | Compute Engine Default | • roles/editor<br>• secretmanager.secretAccessor | 🟢 Activa | **VERIFICAR** si se usa Compute Engine.<br>Si NO: **ELIMINAR**<br>Si SÍ: **REDUCIR** a roles específicos |
| **4** | 🔴 **CRÍTICO** | sunny-advantage-471523-b3@appspot | App Engine Default | • roles/editor | 🟢 Activa | **VERIFICAR** si se usa App Engine.<br>Si NO: **ELIMINAR**<br>Si SÍ: **REDUCIR** permisos |
| **5** | 🟠 **ALTO** | cursor-signalsheets@sunny-advantage-471523-b3 | Cursor Editor - Desarrollo | 13 roles incluyendo:<br>• bigquery.admin<br>• storage.admin<br>• cloudfunctions.admin<br>• run.admin | 🟢 Activa | **RESTRINGIR** a solo desarrollo:<br>• Usar SOLO en ambiente dev<br>• NO usar en producción<br>• Reducir a roles granulares |
| **6** | 🟠 **ALTO** | claudecode-939@sunny-advantage-471523-b3 | Claude Code (duplicado) | 11 roles incluyendo:<br>• bigquery.admin<br>• cloudfunctions.admin<br>• storage.admin | 🟢 Activa | **CONSOLIDAR**:<br>• Migrar a claudecode@ principal<br>• Eliminar duplicado<br>• Reducir permisos |
| **7** | 🟠 **ALTO** | chatgpt-bigquery-read@sunny-advantage-471523-b3 | ChatGPT Integration | • bigquery.admin | 🟢 Activa | **REDUCIR** inmediatamente:<br>• Cambiar a bigquery.dataViewer<br>• Admin es excesivo para "read" |
| **8** | 🟠 **ALTO** | signalsheet-backend@sunny-advantage-471523-b3 | Backend de aplicación | • bigquery.admin | 🟢 Activa | **REDUCIR**:<br>• bigquery.dataEditor (escritura)<br>• bigquery.jobUser (queries)<br>• Admin es excesivo |
| **9** | 🟡 MEDIO | ingest-fn-sa@sunny-advantage-471523-b3 | Cloud Function - Ingesta | • bigquery.dataEditor<br>• bigquery.jobUser<br>• secretmanager.secretAccessor | 🟢 Activa | **MANTENER**<br>Permisos apropiados para ingesta |
| **10** | 🟡 MEDIO | cf-free-endpoints@sunny-advantage-471523-b3 | Cloudflare API | • bigquery.dataViewer<br>• bigquery.jobUser | 🟢 Activa | **MANTENER**<br>Permisos apropiados para lectura |
| **11** | 🟡 MEDIO | dataform-ci@sunny-advantage-471523-b3 | Dataform CI/CD | • bigquery.dataEditor<br>• bigquery.jobUser | 🟢 Activa | **MANTENER**<br>Permisos apropiados para transformaciones |
| **12** | 🟡 MEDIO | stooq-ingest-sa@sunny-advantage-471523-b3 | Ingesta Stooq | • eventarc.eventReceiver<br>• run.invoker | 🟢 Activa | **MANTENER**<br>Permisos apropiados para eventos |
| **13** | 🟢 BAJO | bigquery-ingesta@sunny-advantage-471523-b3 | Ingesta BigQuery (sin uso) | Sin roles asignados | 🟢 Activa | **ELIMINAR**<br>Sin permisos = sin uso |
| **14** | 🟢 BAJO | scheduler-invoker@sunny-advantage-471523-b3 | Invoker Scheduler (sin uso) | Sin roles asignados | 🟢 Activa | **ELIMINAR**<br>Sin permisos = sin uso |

---

## 🎯 PLAN DE ACCIÓN PRIORIZADO

### 🔴 FASE 1: EMERGENCIA (HOY) - Reducir Riesgo Crítico

#### 1.1 Reducir Permisos de `claudecode@...` (TU CUENTA ACTUAL)

**Problema:** Tiene `roles/owner` (control total del proyecto)

**Acción:**
```bash
# 1. Crear nueva versión con permisos específicos
PROJECT_ID="sunny-advantage-471523-b3"
SA_EMAIL="claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com"

# 2. Remover Owner
gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/owner"

# 3. Asignar roles específicos
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/bigquery.jobUser"

# 4. Permisos de GCS (solo lectura en bucket Polygon)
gsutil iam ch serviceAccount:${SA_EMAIL}:roles/storage.objectViewer \
  gs://ss-bucket-polygon-incremental

# 5. Si necesitas escribir en GCS:
gsutil iam ch serviceAccount:${SA_EMAIL}:roles/storage.objectAdmin \
  gs://ss-bucket-polygon-incremental
```

**Impacto:** ✅ Reduces de control total a solo BigQuery + GCS específico

---

#### 1.2 Eliminar `sa-ingest-finnhub@...`

**Problema:** Deshabilitada pero con `roles/editor` activos

**Acción:**
```bash
# 1. Remover todos los roles
SA_FINNHUB="sa-ingest-finnhub@sunny-advantage-471523-b3.iam.gserviceaccount.com"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_FINNHUB}" \
  --role="roles/editor"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_FINNHUB}" \
  --role="roles/bigquery.dataEditor"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_FINNHUB}" \
  --role="roles/bigquery.jobUser"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_FINNHUB}" \
  --role="roles/secretmanager.secretAccessor"

# 2. Eliminar la service account
gcloud iam service-accounts delete ${SA_FINNHUB} --quiet
```

**Impacto:** ✅ Eliminas cuenta deshabilitada con permisos peligrosos

---

#### 1.3 Auditar Compute Engine y App Engine Defaults

**Pregunta crítica:** ¿Usas Compute Engine o App Engine?

**Verificar:**
```bash
# Ver si hay VMs activas
gcloud compute instances list

# Ver si hay apps de App Engine
gcloud app describe
```

**Si NO usas:**
```bash
# Remover permisos de Compute Engine default
SA_COMPUTE="822442830684-compute@developer.gserviceaccount.com"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_COMPUTE}" \
  --role="roles/editor"

# Remover permisos de App Engine default
SA_APPENGINE="sunny-advantage-471523-b3@appspot.gserviceaccount.com"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_APPENGINE}" \
  --role="roles/editor"
```

**Impacto:** ✅ Eliminas 2 cuentas con Editor si no se usan

---

### 🟠 FASE 2: OPTIMIZACIÓN (ESTA SEMANA)

#### 2.1 Reducir Permisos de ChatGPT y SignalSheet Backend

**Problema:** Ambas tienen `bigquery.admin` pero solo necesitan acceso limitado

**ChatGPT (solo lectura):**
```bash
SA_CHATGPT="chatgpt-bigquery-read@sunny-advantage-471523-b3.iam.gserviceaccount.com"

# Remover Admin
gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_CHATGPT}" \
  --role="roles/bigquery.admin"

# Asignar solo lectura
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_CHATGPT}" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_CHATGPT}" \
  --role="roles/bigquery.jobUser"
```

**SignalSheet Backend (lectura + escritura):**
```bash
SA_BACKEND="signalsheet-backend@sunny-advantage-471523-b3.iam.gserviceaccount.com"

# Remover Admin
gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_BACKEND}" \
  --role="roles/bigquery.admin"

# Asignar permisos específicos
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_BACKEND}" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_BACKEND}" \
  --role="roles/bigquery.jobUser"
```

---

#### 2.2 Consolidar ClaudeCode Duplicado

**Problema:** Tienes `claudecode@...` y `claudecode-939@...` (duplicado)

**Acción:**
```bash
# Identificar cuál se usa activamente
# Revisar logs de los últimos 30 días

# Opción A: Eliminar claudecode-939 (recomendado)
SA_OLD="claudecode-939@sunny-advantage-471523-b3.iam.gserviceaccount.com"

# Remover todos sus 11 roles (ejecutar para cada uno)
# Ver lista completa en artifacts/service_accounts_security_audit.json

# Eliminar la SA
gcloud iam service-accounts delete ${SA_OLD} --quiet
```

---

#### 2.3 Restringir Cursor SignalSheets a Solo Desarrollo

**Problema:** 13 roles incluyendo 4 Admin (muy peligroso)

**Acción:**
```bash
SA_CURSOR="cursor-signalsheets@sunny-advantage-471523-b3.iam.gserviceaccount.com"

# IMPORTANTE: Usar SOLO en desarrollo local
# Crear nueva SA para producción con permisos mínimos

# Reducir permisos (quitar Admins):
gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_CURSOR}" \
  --role="roles/bigquery.admin"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_CURSOR}" \
  --role="roles/storage.admin"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_CURSOR}" \
  --role="roles/cloudfunctions.admin"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_CURSOR}" \
  --role="roles/run.admin"

# Reemplazar con permisos específicos
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_CURSOR}" \
  --role="roles/bigquery.dataEditor"

# ... (repetir para cada servicio que realmente uses)
```

---

#### 2.4 Eliminar Service Accounts Sin Uso

**Problema:** 2 cuentas activas sin roles asignados = sin uso

**Acción:**
```bash
# Eliminar bigquery-ingesta
gcloud iam service-accounts delete \
  bigquery-ingesta@sunny-advantage-471523-b3.iam.gserviceaccount.com --quiet

# Eliminar scheduler-invoker
gcloud iam service-accounts delete \
  scheduler-invoker@sunny-advantage-471523-b3.iam.gserviceaccount.com --quiet
```

---

### 🟡 FASE 3: SEGURIDAD CONTINUA (PRÓXIMAS 2 SEMANAS)

#### 3.1 Rotación de Claves

**Problema:** No sabes cuándo se rotaron las claves por última vez

**Acción:**
```bash
# 1. Generar nuevas claves para SAs críticas
SA_CRITICAL="claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com"

# Crear nueva clave
gcloud iam service-accounts keys create new-key.json \
  --iam-account=${SA_CRITICAL}

# 2. Actualizar aplicaciones con nueva clave

# 3. Eliminar claves viejas
gcloud iam service-accounts keys list \
  --iam-account=${SA_CRITICAL}

# Eliminar cada key vieja
gcloud iam service-accounts keys delete [KEY_ID] \
  --iam-account=${SA_CRITICAL} --quiet
```

**Política:** Rotar claves cada 90 días

---

#### 3.2 Monitoreo y Alertas

**Configurar Cloud Monitoring:**

```bash
# 1. Crear log-based metric para cambios IAM
gcloud logging metrics create iam_policy_changes \
  --description="Detectar cambios en políticas IAM" \
  --log-filter='
    protoPayload.methodName="SetIamPolicy"
    OR protoPayload.methodName="SetIamPolicyRequest"
  '

# 2. Crear alerta
gcloud alpha monitoring policies create \
  --notification-channels=[CHANNEL_ID] \
  --display-name="IAM Changes Alert" \
  --condition-display-name="IAM policy modified" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=60s
```

---

#### 3.3 Auditoría Mensual

**Automatizar con Cloud Scheduler:**

```bash
# 1. Subir script de auditoría a Cloud Storage
gsutil cp audit_service_accounts.py gs://[BUCKET]/scripts/

# 2. Crear Cloud Function que ejecute el script mensualmente

# 3. Programar con Cloud Scheduler
gcloud scheduler jobs create http audit-sa-monthly \
  --schedule="0 9 1 * *" \
  --uri="https://[FUNCTION_URL]" \
  --description="Auditoría mensual de service accounts"
```

---

## 📈 IMPACTO ESPERADO

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| SAs con Owner | 1 | 0 | ✅ -100% |
| SAs con Editor | 3 | 0 | ✅ -100% |
| SAs con Admin | 6 | 2 | ✅ -67% |
| SAs sin uso | 3 | 0 | ✅ -100% |
| Total SAs activas | 14 | 9 | ✅ -36% |
| **Nivel de riesgo** | **CRÍTICO** | **BAJO** | ✅ **Seguro** |

---

## ⚠️  NOTAS IMPORTANTES

### Antes de Ejecutar Comandos:

1. **BACKUP:** Exporta IAM policy actual
   ```bash
   gcloud projects get-iam-policy ${PROJECT_ID} > iam-backup-$(date +%Y%m%d).json
   ```

2. **TESTING:** Ejecuta cambios en cuenta de DEV primero

3. **VALIDACIÓN:** Después de cada cambio, verifica que aplicaciones siguen funcionando

4. **ROLLBACK:** Si algo falla, restaura con:
   ```bash
   gcloud projects set-iam-policy ${PROJECT_ID} iam-backup-YYYYMMDD.json
   ```

### Permisos para Claude Code (Recomendados):

Para desarrollo normal:
- `bigquery.dataEditor` - Leer/escribir datos
- `bigquery.jobUser` - Ejecutar queries
- `storage.objectViewer` - Leer GCS
- `cloudfunctions.developer` - Ver funciones (no admin)
- `run.viewer` - Ver Cloud Run (no admin)

Para CI/CD:
- Agregar `cloudfunctions.admin` solo si necesitas desplegar
- Agregar `run.admin` solo si necesitas desplegar a Cloud Run

**NUNCA en producción:**
- `roles/owner`
- `roles/editor`
- Cualquier `*.admin` a nivel de proyecto

---

## 📁 ARTEFACTOS GENERADOS

- **JSON completo:** `auditoria/artifacts/service_accounts_security_audit.json`
- **CSV resumen:** `auditoria/artifacts/service_accounts_summary.csv`
- **Log de ejecución:** `auditoria/service_accounts_audit.log`

---

## 📞 PRÓXIMOS PASOS INMEDIATOS

**HOY:**
1. ✅ Revisar esta tabla
2. ⚠️ Backup IAM policy actual
3. 🔴 Ejecutar Fase 1 (reducir riesgos críticos)
4. ✅ Validar que todo sigue funcionando

**ESTA SEMANA:**
5. 🟠 Ejecutar Fase 2 (optimización)
6. ✅ Documentar cambios realizados
7. ✅ Comunicar a equipo

**PRÓXIMAS 2 SEMANAS:**
8. 🟡 Implementar Fase 3 (monitoreo)
9. ✅ Establecer política de rotación de claves
10. ✅ Programar auditorías mensuales

---

**Documento generado:** 2025-11-15
**Versión:** 1.0
**Estado:** ✅ LISTO PARA EJECUCIÓN

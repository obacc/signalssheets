# TABLA DE SERVICE ACCOUNTS - ANÁLISIS DE USO Y SEGURIDAD

**Proyecto:** `sunny-advantage-471523-b3`
**Fecha:** 2025-11-15
**Período Analizado:** Últimos 90 días
**Total Service Accounts:** 14

---

## 📊 TABLA COMPLETA DE SERVICE ACCOUNTS

| # | Riesgo | Nivel de Uso | Service Account | Último Uso | Propósito | Acción Recomendada |
|---|--------|--------------|-----------------|------------|-----------|-------------------|
| **1** | 🔴 **CRÍTICO** | 🟢 **MUY ACTIVA** | **claudecode@sunny-advantage-471523-b3** | **2025-11-15 01:57** (hace 1 hora) | Claude Code - Desarrollo/CI/CD | **REDUCIR** permisos: Owner → Roles específicos |
| **2** | 🔴 **CRÍTICO** | 🟢 **MUY ACTIVA** | **822442830684-compute@developer** | **2025-11-14 02:00** (hace 1 día) | Compute Engine Default | **VERIFICAR** si se usa Compute. Si NO: **ELIMINAR** |
| **3** | 🔴 **CRÍTICO** | 🔴 **SIN USO** | sunny-advantage-471523-b3@appspot | Sin actividad (>90 días) | App Engine Default | **ELIMINAR** - Sin uso + Editor peligroso |
| **4** | 🔴 **CRÍTICO** | 🔴 **DESHABILITADA** | sa-ingest-finnhub@sunny-advantage-471523-b3 | Sin actividad (>90 días) | Ingesta Finnhub (obsoleto) | **ELIMINAR** - Deshabilitada con permisos activos |
| **5** | 🟠 **ALTO** | 🟢 **MUY ACTIVA** | signalsheet-backend@sunny-advantage-471523-b3 | 2025-11-14 06:20 (hace 19 horas) | Backend Aplicación | **REDUCIR**: BigQuery Admin → DataEditor |
| **6** | 🟠 **ALTO** | 🟢 **MUY ACTIVA** | cursor-signalsheets@sunny-advantage-471523-b3 | 2025-11-13 00:42 (hace 2 días) | Cursor Editor - Desarrollo | **RESTRINGIR**: Solo desarrollo, reducir 4 Admins |
| **7** | 🟠 **ALTO** | 🟢 **ACTIVA** | claudecode-939@sunny-advantage-471523-b3 | 2025-10-29 16:36 (hace 17 días) | Claude Code (duplicado) | **CONSOLIDAR**: Migrar a claudecode@ y eliminar |
| **8** | 🟠 **ALTO** | 🔴 **SIN USO** | chatgpt-bigquery-read@sunny-advantage-471523-b3 | Sin actividad (>90 días) | ChatGPT Integration | **ELIMINAR** - Sin uso + BigQuery Admin excesivo |
| **9** | 🟡 MEDIO | 🟡 **USO BAJO** | stooq-ingest-sa@sunny-advantage-471523-b3 | 2025-10-06 20:40 (hace 40 días) | Ingesta Stooq | **MONITOREAR** - Poco uso reciente |
| **10** | 🟡 MEDIO | 🔴 **SIN USO** | cf-free-endpoints@sunny-advantage-471523-b3 | Sin actividad (>90 días) | Cloudflare API | **ELIMINAR** - Sin uso aparente |
| **11** | 🟡 MEDIO | 🔴 **SIN USO** | ingest-fn-sa@sunny-advantage-471523-b3 | Sin actividad (>90 días) | Función Ingesta | **ELIMINAR** - Sin uso aparente |
| **12** | 🟡 MEDIO | 🔴 **SIN USO** | dataform-ci@sunny-advantage-471523-b3 | Sin actividad (>90 días) | Dataform CI/CD | **ELIMINAR** - Sin uso aparente |
| **13** | 🟢 BAJO | 🔴 **SIN USO** | bigquery-ingesta@sunny-advantage-471523-b3 | Sin actividad (>90 días) | BigQuery Service | **ELIMINAR** - Sin permisos ni uso |
| **14** | 🟢 BAJO | 🔴 **SIN USO** | scheduler-invoker@sunny-advantage-471523-b3 | Sin actividad (>90 días) | Scheduler Invoker | **ELIMINAR** - Sin permisos ni uso |

---

## 📈 RESUMEN EJECUTIVO

### Por Nivel de Uso (Últimos 90 días)

| Nivel | Cantidad | % | Estado |
|-------|----------|---|--------|
| 🟢 **MUY ACTIVA** (< 7 días) | 4 | 29% | En uso activo |
| 🟢 **ACTIVA** (7-30 días) | 1 | 7% | Uso regular |
| 🟡 **USO BAJO** (30-90 días) | 1 | 7% | Uso esporádico |
| 🔴 **SIN USO** (> 90 días) | 7 | 50% | **Eliminar** |
| 🔴 **DESHABILITADA** | 1 | 7% | **Eliminar** |

### Por Nivel de Riesgo

| Riesgo | Cantidad | % |
|--------|----------|---|
| 🔴 **CRÍTICO** | 4 | 29% |
| 🟠 **ALTO** | 4 | 29% |
| 🟡 **MEDIO** | 4 | 29% |
| 🟢 **BAJO** | 2 | 14% |

### Acciones Requeridas

| Acción | Cantidad | Prioridad |
|--------|----------|-----------|
| 🔴 **ELIMINAR** | 8 cuentas | **URGENTE** |
| 🟠 **REDUCIR** permisos | 2 cuentas | **ALTA** |
| 🟡 **REVISAR** | 3 cuentas | MEDIA |
| 🟢 **MONITOREAR** | 1 cuenta | BAJA |

---

## 🚨 HALLAZGOS CRÍTICOS

### 1. Service Accounts Sin Uso (8 cuentas - 57%)

**Problema:** Más de la mitad de las service accounts no han tenido actividad en 90+ días

**Cuentas a eliminar:**
1. ✅ `sunny-advantage-471523-b3@appspot` - App Engine (CRÍTICO: tiene Editor)
2. ✅ `sa-ingest-finnhub@...` - Finnhub (CRÍTICO: deshabilitada con Editor)
3. ✅ `chatgpt-bigquery-read@...` - ChatGPT (ALTO: tiene BigQuery Admin)
4. ✅ `cf-free-endpoints@...` - Cloudflare
5. ✅ `ingest-fn-sa@...` - Función ingesta
6. ✅ `dataform-ci@...` - Dataform
7. ✅ `bigquery-ingesta@...` - BigQuery
8. ✅ `scheduler-invoker@...` - Scheduler

**Impacto:** Reducir superficie de ataque, eliminar permisos innecesarios

---

### 2. Cuentas Activas con Permisos Excesivos (4 cuentas)

#### a) claudecode@ (TU CUENTA ACTUAL)
- **Uso:** 🟢 MUY ACTIVA (última actividad: hace 1 hora)
- **Problema:** Tiene `roles/owner` (control total)
- **Riesgo:** Si las credenciales se comprometen = pérdida total del proyecto
- **Acción:** REDUCIR a roles específicos (bigquery.dataEditor, storage.objectViewer)

#### b) 822442830684-compute@developer
- **Uso:** 🟢 MUY ACTIVA (última actividad: hace 1 día)
- **Problema:** Tiene `roles/editor`
- **Pregunta:** ¿Usas Compute Engine (VMs)?
- **Acción:** Si NO → ELIMINAR, Si SÍ → REDUCIR permisos

#### c) signalsheet-backend@
- **Uso:** 🟢 MUY ACTIVA (última actividad: hace 19 horas)
- **Problema:** Tiene `roles/bigquery.admin`
- **Acción:** REDUCIR a `bigquery.dataEditor` + `bigquery.jobUser`

#### d) cursor-signalsheets@
- **Uso:** 🟢 MUY ACTIVA (última actividad: hace 2 días)
- **Problema:** 13 roles incluyendo 4 Admins
- **Acción:** RESTRINGIR a solo desarrollo, reducir Admins

---

### 3. Cuenta Duplicada

**claudecode-939@** (ACTIVA hace 17 días)
- Duplicado de `claudecode@`
- Tiene 11 roles (incluyendo 3 Admins)
- **Acción:** CONSOLIDAR → Migrar uso a `claudecode@` principal y eliminar

---

## 🎯 PLAN DE ACCIÓN PRIORIZADO

### 🔴 FASE 1: EMERGENCIA (HOY) - Eliminar Cuentas Sin Uso

**Objetivo:** Reducir de 14 a 6 service accounts activas (-57%)

#### 1.1 Eliminar Cuenta Deshabilitada con Permisos Activos

```bash
# sa-ingest-finnhub@ - CRÍTICO: Deshabilitada pero con roles/editor
gcloud iam service-accounts delete \
  sa-ingest-finnhub@sunny-advantage-471523-b3.iam.gserviceaccount.com --quiet
```

**Impacto:** ✅ Eliminas cuenta con Editor que no se usa

---

#### 1.2 Eliminar App Engine Default (Sin Uso)

```bash
# Verificar primero si usas App Engine
gcloud app describe 2>/dev/null

# Si retorna error "does not exist" → No usas App Engine
# Entonces eliminar permisos:
PROJECT_ID="sunny-advantage-471523-b3"
SA_APPENGINE="sunny-advantage-471523-b3@appspot.gserviceaccount.com"

gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_APPENGINE}" \
  --role="roles/editor"
```

**Impacto:** ✅ Eliminas Editor de cuenta sin uso

---

#### 1.3 Eliminar ChatGPT Integration (Sin Uso + BigQuery Admin)

```bash
# Sin actividad en 90+ días pero con BigQuery Admin
gcloud iam service-accounts delete \
  chatgpt-bigquery-read@sunny-advantage-471523-b3.iam.gserviceaccount.com --quiet
```

**Impacto:** ✅ Eliminas cuenta con Admin que no se usa

---

#### 1.4 Eliminar 5 Cuentas Restantes Sin Uso

```bash
# cf-free-endpoints@
gcloud iam service-accounts delete \
  cf-free-endpoints@sunny-advantage-471523-b3.iam.gserviceaccount.com --quiet

# ingest-fn-sa@
gcloud iam service-accounts delete \
  ingest-fn-sa@sunny-advantage-471523-b3.iam.gserviceaccount.com --quiet

# dataform-ci@
gcloud iam service-accounts delete \
  dataform-ci@sunny-advantage-471523-b3.iam.gserviceaccount.com --quiet

# bigquery-ingesta@
gcloud iam service-accounts delete \
  bigquery-ingesta@sunny-advantage-471523-b3.iam.gserviceaccount.com --quiet

# scheduler-invoker@
gcloud iam service-accounts delete \
  scheduler-invoker@sunny-advantage-471523-b3.iam.gserviceaccount.com --quiet
```

**Impacto:** ✅ Eliminas 5 cuentas sin uso (reducción de superficie de ataque)

---

### 🟠 FASE 2: REDUCIR PERMISOS (HOY/MAÑANA)

#### 2.1 Reducir claudecode@ (TU CUENTA)

```bash
PROJECT_ID="sunny-advantage-471523-b3"
SA_EMAIL="claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com"

# BACKUP PRIMERO
gcloud projects get-iam-policy ${PROJECT_ID} > iam-backup-$(date +%Y%m%d).json

# Remover Owner
gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/owner"

# Agregar roles específicos
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/bigquery.jobUser"

# GCS (solo si necesitas)
gsutil iam ch serviceAccount:${SA_EMAIL}:roles/storage.objectAdmin \
  gs://ss-bucket-polygon-incremental
```

**Impacto:** ✅ Reduces de Owner a permisos específicos

---

#### 2.2 Reducir signalsheet-backend@

```bash
SA_BACKEND="signalsheet-backend@sunny-advantage-471523-b3.iam.gserviceaccount.com"

# Remover Admin
gcloud projects remove-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_BACKEND}" \
  --role="roles/bigquery.admin"

# Agregar permisos específicos
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_BACKEND}" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_BACKEND}" \
  --role="roles/bigquery.jobUser"
```

**Impacto:** ✅ Reduces de Admin a Editor

---

#### 2.3 Consolidar claudecode-939@ → claudecode@

```bash
# Eliminar duplicado (última actividad hace 17 días)
SA_OLD="claudecode-939@sunny-advantage-471523-b3.iam.gserviceaccount.com"

# Si hay aplicaciones usando esta cuenta, migrar primero a claudecode@
# Luego eliminar:
gcloud iam service-accounts delete ${SA_OLD} --quiet
```

**Impacto:** ✅ Eliminas duplicado con 11 roles

---

### 🟡 FASE 3: REVISAR Y MONITOREAR

#### 3.1 Restringir cursor-signalsheets@

- **Uso:** Solo en ambiente de desarrollo local
- **NO** usar en producción
- Reducir de 13 roles a solo los necesarios

#### 3.2 Monitorear stooq-ingest-sa@

- **Uso bajo** (última actividad hace 40 días)
- Verificar si el pipeline Stooq sigue activo
- Si no: eliminar en próxima revisión

#### 3.3 Verificar Compute Engine

```bash
gcloud compute instances list
```

Si no hay VMs: eliminar permisos de `822442830684-compute@developer`

---

## 📊 IMPACTO TOTAL ESPERADO

### Antes vs Después

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Total SAs | 14 | 6 | ✅ -57% |
| SAs con Owner | 1 | 0 | ✅ -100% |
| SAs con Editor | 3 | 0* | ✅ -100% |
| SAs con Admin | 6 | 2 | ✅ -67% |
| SAs sin uso | 8 | 0 | ✅ -100% |
| **Riesgo Global** | **CRÍTICO** | **MEDIO** | ✅ **Reducción 75%** |

*Asumiendo que Compute Engine no se usa

### Service Accounts que Permanecen (6)

1. ✅ **claudecode@** - Desarrollo (permisos reducidos)
2. ✅ **signalsheet-backend@** - Backend producción (permisos reducidos)
3. ✅ **cursor-signalsheets@** - Desarrollo (restringido)
4. ✅ **stooq-ingest-sa@** - Ingesta Stooq (monitorear)
5. ⚠️ **822442830684-compute@** - Solo si se usa Compute Engine
6. ⚠️ **Otra según necesidad**

---

## ⚠️ NOTAS IMPORTANTES

### Antes de Ejecutar

1. **BACKUP COMPLETO:**
   ```bash
   gcloud projects get-iam-policy sunny-advantage-471523-b3 > iam-backup-$(date +%Y%m%d).json
   ```

2. **TESTING:** Probar en ambiente de desarrollo primero

3. **VALIDACIÓN:** Después de cada cambio, verificar que apps funcionan

4. **ROLLBACK:** Si falla algo:
   ```bash
   gcloud projects set-iam-policy sunny-advantage-471523-b3 iam-backup-YYYYMMDD.json
   ```

### Verificaciones Post-Eliminación

Después de eliminar cada cuenta, verificar:
- [ ] Aplicaciones backend funcionan
- [ ] Pipelines de datos siguen ejecutándose
- [ ] No hay errores en logs

---

## 📁 ARTEFACTOS DISPONIBLES

- **JSON completo:** `auditoria/artifacts/service_accounts_usage_analysis.json`
- **CSV:** `auditoria/artifacts/service_accounts_usage.csv`
- **Log:** `auditoria/service_accounts_usage.log`

---

## 📞 PRÓXIMOS PASOS

**HOY:**
1. ✅ Revisar esta tabla
2. ⚠️ Hacer backup de IAM policy
3. 🔴 Eliminar 8 cuentas sin uso (FASE 1)
4. ✅ Validar que todo funciona

**MAÑANA:**
5. 🟠 Reducir permisos de cuentas activas (FASE 2)
6. ✅ Consolidar duplicados
7. ✅ Documentar cambios

**ESTA SEMANA:**
8. 🟡 Configurar monitoreo de uso
9. 🟡 Establecer política de revisión mensual
10. ✅ Auditoría de claves (rotación)

---

**Documento generado:** 2025-11-15 01:58:43
**Versión:** 2.0 (con análisis de uso)
**Estado:** ✅ LISTO PARA ACCIÓN

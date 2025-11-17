# 🚀 QUICK START - AUDITORÍA EOD PIPELINE

## ⚡ 3 PASOS PARA COMPLETAR LA AUDITORÍA

### PASO 1: Configura las credenciales de GCP

```bash
# Opción A: Crea el archivo de credenciales
cat > /tmp/gcp-sa-key.json <<'EOF'
{
  "type": "service_account",
  "project_id": "sunny-advantage-471523-b3",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com",
  ...
}
EOF

# Opción B: Si ya tienes el archivo
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/tu/credenciales.json"
```

### PASO 2: Ejecuta la auditoría completa

```bash
./run_full_audit.sh
```

**Eso es todo!** El script:
- ✅ Verifica credenciales
- ✅ Instala dependencias
- ✅ Ejecuta auditoría de BigQuery
- ✅ Analiza archivos de GCS
- ✅ Calcula gaps temporales
- ✅ Genera reporte completo

### PASO 3: Lee el reporte

```bash
cat DATA_PIPELINE_AUDIT_REPORT.md
```

---

## 📋 LO QUE OBTENDRÁS

### Reporte con:

1. ✅ **Executive Summary** - Estado actual del pipeline
2. ✅ **Tiempos Reales** - Cuándo se actualizan prices y signals
3. ✅ **Datos Encontrados** - Análisis completo de BigQuery y GCS
4. ✅ **Gap Analysis** - Sincronización entre datos
5. ✅ **Recomendación Final** - Nuevo horario de CRON óptimo
6. ✅ **Configuración Sugerida** - TTL y schedule exactos

### Ejemplo de recomendación:

```toml
[triggers]
crons = ["0 9 * * 1-5"]  # 09:00 UTC = 03:00 CT
```

```typescript
const ttl = 86400; // 24 horas
```

---

## 🔧 ALTERNATIVA: PASO A PASO MANUAL

Si prefieres ejecutar manualmente:

```bash
# 1. Setup
./setup_gcp_credentials.sh /ruta/a/credenciales.json

# 2. Auditoría
python3 audit_eod_pipeline.py

# 3. Generar reporte
python3 generate_eod_report.py

# 4. Ver reporte
cat DATA_PIPELINE_AUDIT_REPORT.md
```

---

## 🆘 ¿PROBLEMAS?

### No tengo las credenciales

Ver archivo: `CREDENTIALS_TEMPLATE.txt` para la plantilla completa.

### Error de permisos

El service account necesita:
- `roles/bigquery.dataViewer`
- `roles/bigquery.jobUser`
- `roles/storage.objectViewer`

### Más ayuda

Lee la documentación completa: `EOD_AUDIT_README.md`

---

## 📦 ARCHIVOS INCLUIDOS

```
├── run_full_audit.sh              ← Script maestro (ejecuta todo)
├── audit_eod_pipeline.py          ← Auditoría de datos
├── generate_eod_report.py         ← Generador de reporte
├── setup_gcp_credentials.sh       ← Helper de credenciales
├── EOD_AUDIT_README.md            ← Documentación completa
├── CREDENTIALS_TEMPLATE.txt       ← Plantilla de credenciales
└── QUICKSTART.md                  ← Este archivo
```

---

## ⏭️ DESPUÉS DE LA AUDITORÍA

1. Revisa `DATA_PIPELINE_AUDIT_REPORT.md`
2. Valida las recomendaciones
3. Actualiza el Worker con:
   - Nuevo cron schedule
   - Nuevo TTL
4. Despliega: `wrangler deploy --name free-api`
5. Monitorea los logs

---

**¿Listo para empezar?**

```bash
./run_full_audit.sh
```

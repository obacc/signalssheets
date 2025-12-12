# Credenciales GCP - SignalsSheets

## Configuracion Rapida

### 1. Copiar el archivo de ejemplo
```bash
cp credentials/gcp-service-account.example.json credentials/gcp-service-account.json
```

### 2. Reemplazar con tus credenciales reales
Edita `credentials/gcp-service-account.json` con los valores de tu service account.

### 3. Configurar variable de entorno
```bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/credentials/gcp-service-account.json"
```

---

## Datos del Proyecto GCP

| Campo | Valor |
|-------|-------|
| **Project ID** | `sunny-advantage-471523-b3` |
| **Dataset** | `market_data` |
| **Service Account** | `claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com` |
| **Bucket GCS** | `gs://ss-bucket-polygon-incremental` |

---

## Permisos de la Service Account

La cuenta tiene rol **Owner** con acceso total:

- `roles/owner` - Propietario (Control Total)
- `roles/bigquery.admin` - Administrador de BigQuery

---

## Para Claude Code

Al iniciar una nueva sesion, pega las credenciales asi:

```bash
cat > credentials/gcp-service-account.json << 'EOF'
{
  "type": "service_account",
  "project_id": "sunny-advantage-471523-b3",
  ... (tu JSON completo aqui)
}
EOF

export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/credentials/gcp-service-account.json"
```

---

## Seguridad

- El archivo `gcp-service-account.json` esta en `.gitignore`
- NUNCA commitear credenciales reales
- Solo el archivo `.example.json` se sube al repo

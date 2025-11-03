# Operations Runbook - Indicium Signals MVP Free

**Propósito:** Guía operacional para configurar, desplegar y mantener el MVP Free API
**Audiencia:** DevOps, Ingenieros de Plataforma
**Última actualización:** 2025-11-03

---

## 📋 Tabla de Contenidos

1. [Recursos de Cloudflare](#recursos-de-cloudflare)
2. [Configuración Inicial](#configuración-inicial)
3. [Deployment](#deployment)
4. [Monitoreo](#monitoreo)
5. [Troubleshooting](#troubleshooting)
6. [Mantenimiento](#mantenimiento)
7. [Disaster Recovery](#disaster-recovery)

---

## 🌐 Recursos de Cloudflare

### 1. Worker Principal: `indicium-free-api`

**Propósito:** Servir requests HTTP de `/v1/signals`

#### Creación (Panel Web)

1. Ir a **Workers & Pages** en Cloudflare Dashboard
2. Click **Create Application** > **Create Worker**
3. Nombre: `indicium-free-api`
4. Click **Deploy**

#### Creación (CLI)

```bash
cd /home/user/signalssheets/free/worker
wrangler init indicium-free-api
wrangler deploy
```

**URL resultante:** `https://indicium-free-api.<your-subdomain>.workers.dev`

---

### 2. KV Namespaces

#### A. Cache Namespace: `free-signals-cache`

**Propósito:** Almacenar datos de señales en cache

**Creación:**
```bash
wrangler kv:namespace create "CACHE"
```

**Output:**
```
🌀 Creating namespace with title "indicium-free-api-CACHE"
✨ Success!
Add the following to your configuration file:
kv_namespaces = [
  { binding = "CACHE", id = "xxxxxxxxxxxxxxxxxxxxxx" }
]
```

**Copiar el ID** y agregarlo a `wrangler.toml`

#### B. API Tokens Namespace: `free-api-tokens`

**Propósito:** Whitelist de tokens válidos

**Creación:**
```bash
wrangler kv:namespace create "API_TOKENS"
```

**Popular tokens iniciales:**
```bash
# Token de demo público
wrangler kv:key put --namespace-id=<API_TOKENS_ID> \
  "demo-free-2025" \
  '{"token":"demo-free-2025","plan":"free","email":"demo@indicium.com","created_at":"2025-11-03T00:00:00Z","rate_limit":{"requests_per_minute":30,"requests_per_day":1000},"is_active":true,"notes":"Demo token for public testing"}'

# Token de desarrollo interno
wrangler kv:key put --namespace-id=<API_TOKENS_ID> \
  "dev-internal-2025" \
  '{"token":"dev-internal-2025","plan":"internal","email":"dev@indicium.com","created_at":"2025-11-03T00:00:00Z","rate_limit":{"requests_per_minute":1000,"requests_per_day":100000},"is_active":true,"notes":"Internal development token"}'
```

#### C. Rate Limit Namespace: `free-ratelimit`

**Propósito:** Contadores de rate limiting con TTL

**Creación:**
```bash
wrangler kv:namespace create "RATE_LIMIT"
```

---

### 3. Cron Trigger

**Schedule:** Cada 10 minutos (`*/10 * * * *`)

**Configuración en `wrangler.toml`:**
```toml
[triggers]
crons = ["*/10 * * * *"]
```

**Verificación:**
```bash
wrangler tail --format=pretty
```

**Forzar ejecución manual (testing):**
```bash
curl -X POST https://indicium-free-api.<subdomain>.workers.dev/__scheduled \
  -H "Content-Type: application/json" \
  -d '{"cron":"*/10 * * * *"}'
```

---

### 4. Custom Domain

**Domain:** `free.api.indicium.com`

#### Configuración (Panel Web)

1. Ir a **Workers & Pages** > **indicium-free-api**
2. Tab **Settings** > **Triggers** > **Custom Domains**
3. Click **Add Custom Domain**
4. Ingresar: `free.api.indicium.com`
5. Cloudflare creará automáticamente el registro DNS

#### Configuración (CLI)

```bash
wrangler route add free.api.indicium.com/* indicium-free-api
```

**Verificación:**
```bash
curl https://free.api.indicium.com/v1/signals?token=demo-free-2025
```

---

## ⚙️ Configuración Inicial

### 1. Variables de Entorno

**En `wrangler.toml`:**
```toml
[vars]
API_VERSION = "1.0.0"
TTL_SECONDS = "600"
RATE_LIMIT_PER_MIN = "30"
RATE_LIMIT_PER_DAY = "1000"
BIGQUERY_PROJECT_ID = "sunny-advantage-471523-b3"
BIGQUERY_DATASET = "analytics"
BIGQUERY_VIEW = "v_api_free_signals"
```

### 2. Secrets (NO commitear)

**BigQuery Service Account JSON:**
```bash
# Subir como secret (contenido completo del JSON)
wrangler secret put BIGQUERY_CREDENTIALS
# Pegar el contenido del archivo bigquery-credentials.json cuando lo pida
```

**Verificar secrets:**
```bash
wrangler secret list
```

---

## 🚀 Deployment

### Deployment Automático (CI/CD)

**GitHub Actions Workflow** (`.github/workflows/deploy-free-api.yml`):

```yaml
name: Deploy Free API

on:
  push:
    branches:
      - main
    paths:
      - 'free/worker/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd free/worker
          npm ci
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: 'free/worker'
```

### Deployment Manual

```bash
cd /home/user/signalssheets/free/worker

# 1. Instalar dependencias
npm install

# 2. Build (si aplica)
npm run build

# 3. Deploy
wrangler deploy

# 4. Verificar
curl https://free.api.indicium.com/v1/signals?token=demo-free-2025
```

---

## 📊 Monitoreo

### 1. Cloudflare Analytics

**Dashboard:** Workers & Pages > indicium-free-api > Analytics

**Métricas clave:**
- Requests por segundo
- Success rate (200 status)
- Error rate (4xx, 5xx)
- CPU time (p50, p95, p99)
- Requests by country

### 2. Real-time Logs

**Tail logs en tiempo real:**
```bash
wrangler tail --format=pretty
```

**Filtrar solo errores:**
```bash
wrangler tail --format=json | jq 'select(.outcome != "ok")'
```

### 3. Logpush (Opcional - requiere Enterprise)

**Destino:** Google Cloud Logging, S3, Datadog, etc.

---

## 🔧 Troubleshooting

### Problema 1: 401 Unauthorized

**Síntoma:**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Authentication token is invalid or expired"
  }
}
```

**Diagnóstico:**
```bash
# Verificar que el token existe en KV
wrangler kv:key get --namespace-id=<API_TOKENS_ID> "demo-free-2025"
```

**Solución:**
```bash
# Recrear el token
wrangler kv:key put --namespace-id=<API_TOKENS_ID> \
  "demo-free-2025" \
  '{"token":"demo-free-2025","is_active":true,...}'
```

---

### Problema 2: 503 Service Unavailable

**Síntoma:**
```json
{
  "error": {
    "code": "CACHE_EMPTY",
    "message": "Cache not yet populated. Please retry in 30 seconds."
  }
}
```

**Diagnóstico:**
```bash
# Verificar contenido del cache
wrangler kv:key get --namespace-id=<CACHE_ID> "signals:latest"
```

**Solución:**
```bash
# Forzar refresh manual ejecutando el scheduled handler
curl -X POST https://indicium-free-api.<subdomain>.workers.dev/__scheduled
```

---

### Problema 3: 429 Too Many Requests

**Síntoma:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 45
  }
}
```

**Diagnóstico:**
```bash
# Ver contadores de rate limit
wrangler kv:key list --namespace-id=<RATE_LIMIT_ID> --prefix="ratelimit:"
```

**Solución:**
- Esperar el tiempo indicado en `retry_after`
- O aumentar el límite para ese token en particular

---

### Problema 4: Cron no ejecuta

**Síntoma:** Datos en cache nunca se actualizan

**Diagnóstico:**
```bash
# Ver logs de cron
wrangler tail --format=pretty | grep "scheduled"
```

**Solución:**
1. Verificar que `[triggers]` está en `wrangler.toml`
2. Re-deploy: `wrangler deploy`
3. Verificar en Cloudflare Dashboard > Workers > Triggers > Cron Triggers

---

### Problema 5: BigQuery "Permission Denied"

**Síntoma en logs:**
```
Error querying BigQuery: 403 Permission Denied
```

**Diagnóstico:**
```bash
# Verificar secret
wrangler secret list | grep BIGQUERY_CREDENTIALS
```

**Solución:**
1. Verificar que el service account tiene rol **BigQuery Data Viewer**
2. Verificar que el service account tiene rol **BigQuery Job User**
3. Re-subir el secret:
   ```bash
   wrangler secret put BIGQUERY_CREDENTIALS
   ```

---

## 🔄 Mantenimiento

### Actualizar Tokens

**Crear nuevo token:**
```bash
wrangler kv:key put --namespace-id=<API_TOKENS_ID> \
  "customer-abc-2025" \
  '{"token":"customer-abc-2025","plan":"free","email":"customer@example.com","is_active":true}'
```

**Revocar token:**
```bash
# Opción 1: Marcar como inactivo
wrangler kv:key put --namespace-id=<API_TOKENS_ID> \
  "customer-abc-2025" \
  '{"token":"customer-abc-2025","is_active":false}'

# Opción 2: Eliminar completamente
wrangler kv:key delete --namespace-id=<API_TOKENS_ID> "customer-abc-2025"
```

### Limpiar Rate Limit Cache

**Resetear contadores (p. ej., para debugging):**
```bash
# Listar todas las keys de rate limit
wrangler kv:key list --namespace-id=<RATE_LIMIT_ID> --prefix="ratelimit:"

# Eliminar una específica
wrangler kv:key delete --namespace-id=<RATE_LIMIT_ID> "ratelimit:demo-free-2025:123456"
```

### Actualizar Cache Manualmente

**Forzar refresh fuera del cron:**
```bash
# Método 1: Trigger scheduled event
curl -X POST https://indicium-free-api.<subdomain>.workers.dev/__scheduled

# Método 2: Actualizar KV directamente (para testing)
wrangler kv:key put --namespace-id=<CACHE_ID> \
  "signals:latest" \
  @mock-signals.json
```

---

## 🆘 Disaster Recovery

### Escenario 1: Worker eliminado accidentalmente

**Backup:**
- Código está en Git (`/free/worker/`)
- Re-deploy desde Git:
  ```bash
  git pull
  cd free/worker
  wrangler deploy
  ```

**Tiempo de recuperación:** < 5 minutos

---

### Escenario 2: KV Namespace eliminado

**Backup:**
- No hay backup automático de KV
- Prevención: NO eliminar namespaces manualmente

**Recuperación:**
1. Recrear namespace:
   ```bash
   wrangler kv:namespace create "CACHE"
   ```
2. Actualizar `wrangler.toml` con nuevo ID
3. Re-deploy Worker:
   ```bash
   wrangler deploy
   ```
4. Forzar refresh de cache:
   ```bash
   curl -X POST https://indicium-free-api.<subdomain>.workers.dev/__scheduled
   ```

**Tiempo de recuperación:** 10-15 minutos

---

### Escenario 3: BigQuery view corrupta o eliminada

**Backup:**
- Definición de la view debe estar en Git o documentada en `DATA_INVENTORY.md`

**Recuperación:**
1. Recrear view en BigQuery Console:
   ```sql
   CREATE OR REPLACE VIEW `sunny-advantage-471523-b3.analytics.v_api_free_signals` AS
   SELECT ...
   ```
2. Forzar refresh de Worker:
   ```bash
   curl -X POST https://indicium-free-api.<subdomain>.workers.dev/__scheduled
   ```

**Tiempo de recuperación:** 15-30 minutos

---

## 📈 Scaling

### Cuando migrar a Workers Paid Plan

**Indicadores:**
- Requests > 100k/día
- CPU time promedio > 8ms
- KV reads > 90k/día

**Costos Workers Paid:**
- $5/mes + $0.50 por millón de requests adicionales
- KV: $0.50 por millón de reads adicionales

### Cuando migrar de KV a R2

**Indicadores:**
- Payload > 1 MB
- Necesidad de versionar datos históricos
- Más de 1k writes/día (excede Free Tier)

**Costos R2:**
- Storage: $0.015/GB/mes
- Class A operations (writes): $4.50 por millón
- Class B operations (reads): $0.36 por millón

---

## ✅ Checklist de Deployment (Primera Vez)

- [ ] Crear cuenta de Cloudflare
- [ ] Instalar `wrangler` CLI y autenticar
- [ ] Crear Worker `indicium-free-api`
- [ ] Crear 3 KV namespaces (CACHE, API_TOKENS, RATE_LIMIT)
- [ ] Actualizar `wrangler.toml` con IDs de KV
- [ ] Subir secret `BIGQUERY_CREDENTIALS`
- [ ] Popular namespace API_TOKENS con token de demo
- [ ] Deploy Worker: `wrangler deploy`
- [ ] Configurar custom domain `free.api.indicium.com`
- [ ] Verificar cron trigger en Dashboard
- [ ] Forzar primer refresh: `curl -X POST .../__scheduled`
- [ ] Test endpoint: `curl https://free.api.indicium.com/v1/signals?token=demo-free-2025`
- [ ] Verificar CSV: `?format=csv`
- [ ] Configurar alertas en Cloudflare (opcional)
- [ ] Documentar URLs y IDs en 1Password/Vault

---

## 📝 Comandos Útiles

```bash
# Ver logs en tiempo real
wrangler tail

# Listar todos los workers
wrangler list

# Ver detalles de un worker
wrangler status

# Eliminar un worker (CUIDADO)
wrangler delete indicium-free-api

# Ver todas las KV keys
wrangler kv:key list --namespace-id=<ID>

# Exportar KV namespace (backup)
wrangler kv:bulk get --namespace-id=<ID> > backup.json

# Importar KV namespace
wrangler kv:bulk put --namespace-id=<ID> backup.json

# Ver métricas
wrangler metrics
```

---

**Última actualización:** 2025-11-03
**Responsable:** DevOps Team
**Contacto:** devops@indicium.com

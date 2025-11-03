# Solution Design - Indicium Signals MVP Free

**Proyecto:** Indicium Signals Trinity Method - MVP Free Tier
**Objetivo:** Exponer datos de BigQuery como endpoints REST consumibles por Excel (Power Query), Google Sheets y Web
**Arquitectura:** Cloudflare Worker + KV + Cron Trigger
**Fecha:** 2025-11-03
**Versión:** 1.0

---

## 🎯 Objetivos del MVP Free

### Funcionales
1. ✅ Endpoint público `GET /v1/signals?token=XXX&format=json|csv`
2. ✅ Servir datos desde **cache** (no golpear BigQuery en cada request)
3. ✅ Refresh automático vía **Cron Trigger** cada 10 minutos
4. ✅ Compatible con **Excel Power Query gratis** (sin plugins)
5. ✅ Compatible con **Google Sheets** `IMPORTDATA()` function
6. ✅ Soporte para Web (JSON con CORS)

### No Funcionales
1. ✅ Latencia < 300ms (servido desde KV edge)
2. ✅ 99.9% uptime (Cloudflare Workers SLA)
3. ✅ Rate limiting suave (30 req/min por token)
4. ✅ Sin costos de infraestructura (Cloudflare Free Tier)
5. ✅ Sin dependencia de Cloudflare Pages Functions

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USUARIOS / CLIENTES                            │
│  ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────────┐ │
│  │  Excel   │    │ Google       │    │   Web    │    │   cURL /     │ │
│  │  Power   │    │ Sheets       │    │ Browser  │    │   Python     │ │
│  │  Query   │    │ IMPORTDATA() │    │ fetch()  │    │  requests    │ │
│  └─────┬────┘    └──────┬───────┘    └────┬─────┘    └──────┬───────┘ │
│        │                │                  │                  │         │
└────────┼────────────────┼──────────────────┼──────────────────┼─────────┘
         │                │                  │                  │
         └────────────────┴──────────┬───────┴──────────────────┘
                                     │
                              HTTPS GET Request
                  /v1/signals?token=XXX&format=json|csv
                                     │
         ┌───────────────────────────▼───────────────────────────┐
         │        CLOUDFLARE EDGE (Global Network)               │
         │  ┌─────────────────────────────────────────────────┐  │
         │  │     CLOUDFLARE WORKER - free-api                │  │
         │  │                                                 │  │
         │  │  1. Validate token (check whitelist in KV)     │  │
         │  │  2. Rate limit check (per token)               │  │
         │  │  3. Read cached data from KV                   │  │
         │  │  4. Transform format (JSON or CSV)             │  │
         │  │  5. Return response with CORS headers          │  │
         │  │                                                 │  │
         │  │  Latency: ~50-150ms (edge KV read)             │  │
         │  └────────────┬────────────────────────────────────┘  │
         │               │                                        │
         │               │ Read cache                             │
         │               ▼                                        │
         │  ┌─────────────────────────────────────────────────┐  │
         │  │   CLOUDFLARE KV - free-signals-cache            │  │
         │  │                                                 │  │
         │  │   Key: "signals:latest"                        │  │
         │  │   Value: {                                     │  │
         │  │     "data": [...],     // Array of signals     │  │
         │  │     "meta": {...},     // Metadata             │  │
         │  │     "stats": {...}     // Aggregates           │  │
         │  │   }                                            │  │
         │  │                                                 │  │
         │  │   Size: ~50-200 KB (JSON)                      │  │
         │  │   TTL: None (manual update via Cron)           │  │
         │  └─────────────────────────────────────────────────┘  │
         └───────────────────────────────────────────────────────┘
                                     ▲
                                     │
                            Scheduled Update
                          (Every 10 minutes)
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         │   CLOUDFLARE WORKER - CRON TRIGGER                    │
         │   Schedule: "*/10 * * * *"  (every 10 minutes)        │
         │                                                        │
         │   1. Query BigQuery (via REST API or client)          │
         │   2. Transform data to contract format                │
         │   3. Calculate metadata and stats                     │
         │   4. Write to KV: "signals:latest"                    │
         │   5. Log refresh metrics                              │
         │                                                        │
         │   Duration: ~5-15 seconds                             │
         └───────────────────────────┬───────────────────────────┘
                                     │
                              BigQuery REST API
                       (JWT auth with service account)
                                     │
                                     ▼
         ┌────────────────────────────────────────────────────────┐
         │            GOOGLE CLOUD BIGQUERY                       │
         │                                                        │
         │   Project: sunny-advantage-471523-b3                  │
         │   Dataset: analytics                                  │
         │   View: v_api_free_signals                            │
         │                                                        │
         │   Query:                                              │
         │   SELECT * FROM `analytics.v_api_free_signals`        │
         │   LIMIT 100                                           │
         │                                                        │
         │   Cost per refresh: ~$0.0001 (100 rows)              │
         │   Cost per month: ~$0.05 (4,320 refreshes)           │
         └────────────────────────────────────────────────────────┘
```

---

## 💾 Decisión de Almacenamiento: **KV vs R2**

### Opción A: Cloudflare KV (✅ ELEGIDA)

**Ventajas:**
- ✅ Eventual consistency con baja latencia (~50-150ms) en edge
- ✅ Incluido en Workers Free Tier (100k reads/day, 1k writes/day)
- ✅ API simple: `await KV.get("key")` / `await KV.put("key", value)`
- ✅ Suficiente para payloads < 25 MB (nuestro payload: 50-200 KB)
- ✅ No requiere streaming ni procesamiento de archivos grandes

**Desventajas:**
- ⚠️ Eventual consistency (~60 segundos para propagación global)
- ⚠️ Límite de valor: 25 MB (no es problema para nosotros)

**Decisión:** ✅ **USAR KV**

**Justificación:**
- Payload estimado: 50-200 KB (muy por debajo del límite de 25 MB)
- Eventual consistency de 60s es aceptable (refresh cada 10 minutos)
- Simplicidad de implementación
- Sin costos adicionales en Free Tier

### Opción B: Cloudflare R2 (❌ NO NECESARIA)

**Cuándo usarla:**
- Payloads > 10 MB
- Necesidad de versionado de archivos
- Almacenamiento de archivos binarios (imágenes, PDFs)
- Necesidad de S3-compatible API

**Por qué NO la usamos:**
- Nuestro payload es < 200 KB
- No necesitamos versionado complejo
- KV es más simple y rápido para este caso

---

## 🔄 Política de Refresh y TTL

### Cron Trigger Schedule

**Intervalo:** Cada **10 minutos**
**Cron Expression:** `*/10 * * * *`
**Horario:** UTC (24/7)

**Ejecuciones por día:** 144
**Ejecuciones por mes:** ~4,320

### ¿Por qué 10 minutos?

| Intervalo | Pros | Contras | Decisión |
|-----------|------|---------|----------|
| **5 min** | Datos muy frescos | 288 queries/día → más costo BigQuery | ❌ Excesivo |
| **10 min** | Balance perfecto, datos suficientemente frescos | - | ✅ **ELEGIDO** |
| **15 min** | Menos queries | Datos menos actualizados | ⚠️ Aceptable |
| **30 min** | Mínimo costo | Datos pueden quedar stale para usuarios | ❌ Muy lento |

**Razón:** Señales de trading cambian cada hora o día, no cada minuto. **10 minutos** es suficiente para mantener datos frescos sin costo excesivo.

### TTL y Cache Control

**Cloudflare KV TTL:** `null` (sin expiración automática)
- El Worker Cron sobrescribe `signals:latest` cada 10 minutos
- No hay necesidad de expiración automática

**HTTP Cache-Control Header:**
```http
Cache-Control: public, max-age=600
```
- `public`: puede ser cacheado por CDNs y browsers
- `max-age=600`: válido por 10 minutos (600 segundos)

**Resultado:** Clientes pueden cachear localmente por 10 minutos → reduce requests al Worker

---

## 🔐 Sistema de Autenticación

### Diseño Simple: Token en Query String

**Formato:** `?token=XXX`

**Razón:**
- ✅ Compatible con Excel Power Query (no soporta headers custom)
- ✅ Compatible con Google Sheets `IMPORTDATA()` (solo acepta URL)
- ✅ Simple para usuarios no técnicos
- ⚠️ Token visible en URL (aceptable para tier Free con datos públicos)

### Almacenamiento de Tokens

**Método:** Whitelist en Cloudflare KV
**Namespace:** `free-api-tokens`

**Estructura KV:**
```javascript
// Key: token string
// Value: JSON metadata
{
  "token": "demo-free-2025",
  "plan": "free",
  "email": "user@example.com",
  "created_at": "2025-11-03T00:00:00Z",
  "rate_limit": {
    "requests_per_minute": 30,
    "requests_per_day": 1000
  },
  "is_active": true,
  "notes": "Demo token for public testing"
}
```

**Validación en Worker:**
```javascript
async function validateToken(token, env) {
  const tokenData = await env.API_TOKENS.get(token, { type: 'json' });

  if (!tokenData || !tokenData.is_active) {
    return { valid: false, error: 'INVALID_TOKEN' };
  }

  return { valid: true, data: tokenData };
}
```

### Tokens Iniciales

**Token de demo público:**
- `demo-free-2025` → para documentación y testing
- Rate limit: 30 req/min

**Token de desarrollo:**
- `dev-internal-2025` → para desarrollo y CI/CD
- Sin rate limit

---

## 🚦 Rate Limiting

### Estrategia: Soft Rate Limiting por Token

**Límites Free Tier:**
- **30 requests/minuto** por token
- **1,000 requests/día** por token
- **Burst:** 5 requests instantáneos

### Implementación

**Método:** Cloudflare KV con TTL corto para contadores

**Estructura:**
```javascript
// Key: "ratelimit:{token}:{window}"
// Value: request count
// TTL: 60 seconds (ventana de 1 minuto)

const key = `ratelimit:${token}:${Math.floor(Date.now() / 60000)}`;
const count = await env.RATE_LIMIT.get(key) || 0;

if (count >= 30) {
  return new Response(JSON.stringify({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit of 30 requests per minute exceeded',
      retry_after: 60 - (Date.now() % 60000),
    }
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(60 - (Date.now() % 60000)),
    }
  });
}

await env.RATE_LIMIT.put(key, count + 1, { expirationTtl: 60 });
```

**Alternativa:** Usar Cloudflare Rate Limiting Rules (requiere plan Pro)

---

## 🌐 Configuración de CORS

### Política CORS

**Para JSON (Web):** Habilitado
**Para CSV (Excel/Sheets):** No necesario (no aplica CORS)

### Headers CORS

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // O dominios específicos
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',  // 24 horas
};
```

**Nota:** Si se requiere restricción por dominio:
```javascript
const allowedOrigins = [
  'https://indicium.com',
  'https://app.indicium.com',
  'http://localhost:5173',  // Desarrollo
];

const origin = request.headers.get('Origin');
if (allowedOrigins.includes(origin)) {
  corsHeaders['Access-Control-Allow-Origin'] = origin;
}
```

### Preflight Requests (OPTIONS)

```javascript
if (request.method === 'OPTIONS') {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
```

---

## 📊 Formato de Respuesta

### JSON Response

**Content-Type:** `application/json; charset=utf-8`

**Estructura:**
```json
{
  "meta": {
    "generated_at": "2025-11-03T02:30:00.000Z",
    "total_count": 87,
    "ttl_seconds": 600,
    "api_version": "1.0.0"
  },
  "stats": {
    "buy_signals": 24,
    "sell_signals": 18,
    "hold_signals": 45
  },
  "data": [ /* array of signals */ ]
}
```

### CSV Response

**Content-Type:** `text/csv; charset=utf-8`
**Content-Disposition:** `attachment; filename="indicium-signals-2025-11-03.csv"`

**Estructura:**
```csv
id,ticker,company_name,sector,signal_type,...
sig-001,NVDA,NVIDIA Corporation,Technology,BUY,...
sig-002,AAPL,Apple Inc.,Technology,HOLD,...
```

**Transformación:**
```javascript
function toCSV(data) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row =>
    Object.values(row).map(val =>
      typeof val === 'string' && val.includes(',')
        ? `"${val}"`
        : val
    ).join(',')
  );
  return [headers, ...rows].join('\n');
}
```

---

## 🔧 Worker Code Structure

### Archivos Principales

```
/free/
├── worker/
│   ├── src/
│   │   ├── index.js           # Main Worker (request handler)
│   │   ├── scheduled.js       # Cron handler (BigQuery refresh)
│   │   ├── lib/
│   │   │   ├── auth.js        # Token validation
│   │   │   ├── ratelimit.js   # Rate limiting
│   │   │   ├── bigquery.js    # BigQuery client
│   │   │   ├── transform.js   # Data transformation
│   │   │   └── format.js      # JSON/CSV formatting
│   │   └── utils/
│   │       ├── response.js    # Response helpers
│   │       └── error.js       # Error handling
│   ├── wrangler.toml          # Cloudflare config
│   └── package.json
```

### wrangler.toml (Worker)

```toml
name = "indicium-free-api"
main = "src/index.js"
compatibility_date = "2025-01-01"
account_id = "YOUR_ACCOUNT_ID"

# KV Namespaces
[[kv_namespaces]]
binding = "CACHE"
id = "CACHE_NAMESPACE_ID"

[[kv_namespaces]]
binding = "API_TOKENS"
id = "TOKENS_NAMESPACE_ID"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "RATELIMIT_NAMESPACE_ID"

# Cron Trigger
[triggers]
crons = ["*/10 * * * *"]

# Environment Variables (secrets via wrangler secret)
[vars]
API_VERSION = "1.0.0"
TTL_SECONDS = "600"
RATE_LIMIT_PER_MIN = "30"

# Routes
routes = [
  { pattern = "free.api.indicium.com/*", zone_name = "indicium.com" }
]
```

---

## 🔍 Observabilidad

### Métricas Básicas (Cloudflare Analytics)

**Request metrics:**
- Total requests
- Requests by status code (200, 401, 429, 500)
- Latency percentiles (p50, p95, p99)
- Bandwidth usage

**Cron metrics:**
- Successful refreshes
- Failed refreshes
- Refresh duration
- BigQuery query duration

### Logging

**Worker console.log()** → Cloudflare Real-time Logs (Logpush)

**Estructura de log:**
```javascript
{
  "timestamp": "2025-11-03T02:30:00.000Z",
  "level": "info",
  "event": "request",
  "method": "GET",
  "path": "/v1/signals",
  "token": "demo-***",  // Ofuscado
  "format": "json",
  "cache_hit": true,
  "duration_ms": 45,
  "status": 200
}
```

---

## 💰 Estimación de Costos

### Cloudflare Workers Free Tier

| Recurso | Límite Free | Uso Estimado | Estado |
|---------|-------------|--------------|--------|
| **Requests** | 100k/día | ~5k/día | ✅ OK |
| **CPU Time** | 10ms/request | ~5ms/request | ✅ OK |
| **KV Reads** | 100k/día | ~5k reads/día | ✅ OK |
| **KV Writes** | 1k/día | ~144 writes/día | ✅ OK |
| **Cron Triggers** | Incluido | 144/día | ✅ OK |

**Total Cloudflare:** **$0/mes** (Free Tier)

### BigQuery Costs

| Operación | Costo | Uso Mensual | Total |
|-----------|-------|-------------|-------|
| **Query** | $5/TB | ~0.01 GB/mes | ~$0.05/mes |
| **Storage** | $0.02/GB | ~1 GB | ~$0.02/mes |

**Total BigQuery:** **~$0.07/mes**

**Total Mensual:** **< $0.10/mes** 🎉

---

## ✅ Criterios de Aceptación - FASE 1

- [x] Decisión de almacenamiento: **KV** (justificado)
- [x] Política de refresh: **cada 10 minutos** via Cron
- [x] TTL definido: **600 segundos** (10 minutos)
- [x] Sistema de autenticación: **Token en query string** con whitelist en KV
- [x] Rate limiting: **30 req/min por token** (soft limit con KV)
- [x] CORS configurado: **permitir todos los orígenes** para JSON, no aplicar para CSV
- [x] Formatos de respuesta: **JSON** y **CSV** implementables
- [x] Arquitectura documentada con diagrama
- [x] Estimación de costos: **< $0.10/mes**

---

## 🚀 Próximos Pasos (FASE 2)

1. Crear estructura de carpetas `/free/worker/`
2. Inicializar proyecto con `wrangler init`
3. Crear KV namespaces en Cloudflare
4. Implementar Worker básico con endpoint mock
5. Implementar Cron handler con datos mock
6. Validar con smoke tests

---

**Documento aprobado para implementación:** ✅
**Autor:** Claude Code Agent
**Versión:** 1.0
**Fecha:** 2025-11-03

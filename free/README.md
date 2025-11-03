# Indicium Signals - MVP Free API

**REST API** para exponer señales de trading desde BigQuery, servidas desde **Cloudflare KV cache** y refrescadas automáticamente con **Cron Triggers**.

Compatible con **Excel (Power Query)**, **Google Sheets** y **aplicaciones web**.

---

## 🚀 Quick Start

### Para Usuarios (Excel / Google Sheets)

#### Excel (Power Query)
1. Abre Excel
2. Ve a **Data** > **Get Data** > **From Other Sources** > **From Web**
3. Pega esta URL (reemplaza `YOUR_TOKEN`):
   ```
   https://free.api.indicium.com/v1/signals?token=YOUR_TOKEN&format=csv
   ```
4. Haz clic en **OK** y luego **Load**
5. Los datos se actualizarán automáticamente cada 10 minutos

#### Google Sheets
1. Abre una hoja nueva
2. En la celda A1, escribe:
   ```
   =IMPORTDATA("https://free.api.indicium.com/v1/signals?token=YOUR_TOKEN&format=csv")
   ```
3. Los datos se cargarán automáticamente

#### Web (JavaScript)
```javascript
fetch('https://free.api.indicium.com/v1/signals?token=YOUR_TOKEN&format=json')
  .then(response => response.json())
  .then(data => {
    console.log(`Loaded ${data.meta.total_count} signals`);
    console.log(data.data); // Array of signals
  });
```

---

## 📋 API Reference

### Endpoint

```
GET /v1/signals
```

### Parameters

| Parámetro | Tipo | Requerido | Valores | Default | Descripción |
|-----------|------|-----------|---------|---------|-------------|
| `token` | string | ✅ Sí | - | - | Token de autenticación |
| `format` | string | ❌ No | `json`, `csv` | `json` | Formato de respuesta |

### Response Headers

**JSON:**
```http
Content-Type: application/json; charset=utf-8
X-Data-Generated-At: 2025-11-03T02:30:00.000Z
X-Cache-Hit: true
X-API-Version: 1.0.0
Cache-Control: public, max-age=600
```

**CSV:**
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="indicium-signals-2025-11-03.csv"
X-Data-Generated-At: 2025-11-03T02:30:00.000Z
```

### Response Example (JSON)

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
    "hold_signals": 45,
    "avg_trinity_score": 68.4
  },
  "data": [
    {
      "id": "sig-001",
      "ticker": "NVDA",
      "companyName": "NVIDIA Corporation",
      "sector": "Technology",
      "signal": {
        "type": "BUY",
        "strength": 95,
        "dominantAuthor": "O'Neil",
        "confidence": 92
      },
      "price": {
        "current": 495.50,
        "changePercent": 3.2,
        "target": 575.00,
        "stopLoss": 445.00
      },
      "trinityScores": {
        "lynch": 88,
        "oneil": 95,
        "graham": 72,
        "average": 85.0
      },
      "riskProfile": "Aggressive",
      "fundamentals": {
        "marketCap": "$2.5T",
        "peRatio": 78.5,
        "eps": 6.32,
        "dividendYield": 0.05,
        "volume": 45230000
      },
      "dates": {
        "signalDate": "2025-11-03",
        "lastUpdated": "2025-11-03T02:30:00.000Z"
      },
      "reasoning": "Strong momentum breakout above 52-week high..."
    }
  ]
}
```

### HTTP Status Codes

| Código | Descripción |
|--------|-------------|
| `200` | ✅ Éxito - Datos retornados |
| `400` | ❌ Bad Request - Parámetros inválidos |
| `401` | ❌ Unauthorized - Token inválido o faltante |
| `429` | ⚠️ Too Many Requests - Límite de rate excedido |
| `500` | ❌ Internal Server Error |
| `503` | ⚠️ Service Unavailable - Refresh en progreso |

---

## 🏗️ Arquitectura

```
Excel/Sheets/Web
      │
      │ HTTPS GET /v1/signals?token=XXX
      ▼
┌──────────────────────────────────┐
│  Cloudflare Worker (Edge)        │
│  - Validate token                │
│  - Rate limit check              │
│  - Read from KV cache            │
│  - Transform format (JSON/CSV)   │
│  - Return response               │
│                                  │
│  Latency: ~50-150ms              │
└────────────┬─────────────────────┘
             │
             │ Read cache
             ▼
┌──────────────────────────────────┐
│  Cloudflare KV                   │
│  Key: "signals:latest"           │
│  Size: ~50-200 KB                │
│  Updated: every 10 minutes       │
└──────────────────────────────────┘
             ▲
             │
        Cron Trigger
      (*/10 * * * *)
             │
┌──────────────────────────────────┐
│  Worker Scheduled Event          │
│  - Query BigQuery                │
│  - Transform data                │
│  - Write to KV                   │
└────────────┬─────────────────────┘
             │
             │ BigQuery REST API
             ▼
┌──────────────────────────────────┐
│  Google Cloud BigQuery           │
│  View: v_api_free_signals        │
│  Rows: ~50-150                   │
└──────────────────────────────────┘
```

---

## 📊 Data Refresh

- **Frecuencia:** Cada 10 minutos
- **Método:** Cloudflare Cron Trigger
- **Fuente:** BigQuery view `analytics.v_api_free_signals`
- **Cache TTL:** 600 segundos (10 minutos)

---

## 🔐 Authentication

Usa un **token en query string** para autenticación:

```
?token=YOUR_TOKEN
```

**¿Por qué query string y no headers?**
- ✅ Compatible con Excel Power Query (no soporta headers custom)
- ✅ Compatible con Google Sheets `IMPORTDATA()` (solo acepta URL)
- ✅ Simple para usuarios no técnicos

**Seguridad:** Los tokens están en whitelist en Cloudflare KV.

---

## 🚦 Rate Limits

| Plan | Requests/min | Requests/día |
|------|--------------|--------------|
| Free | 30 | 1,000 |

**Nota:** Los límites son por token, no por IP.

Si excedes el límite, recibirás un `429 Too Many Requests`:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 30 requests per minute exceeded",
    "retry_after": 45
  }
}
```

---

## 📁 Estructura del Proyecto

```
/free/
├── README.md                    # Este archivo
├── docs/
│   ├── DATA_INVENTORY.md        # Inventario de datos de BigQuery
│   ├── SOLUTION_DESIGN.md       # Diseño de arquitectura
│   ├── CONTRACT_FREE.json       # Contrato de API con ejemplos
│   ├── OPERATIONS.md            # Runbook operacional
│   └── ACCEPTANCE.md            # Criterios de aceptación y tests
├── worker/
│   ├── src/
│   │   ├── index.js             # Main Worker (request handler)
│   │   ├── scheduled.js         # Cron handler (BigQuery refresh)
│   │   ├── lib/
│   │   │   ├── auth.js          # Token validation
│   │   │   ├── ratelimit.js     # Rate limiting
│   │   │   ├── bigquery.js      # BigQuery client
│   │   │   ├── transform.js     # Data transformation
│   │   │   └── format.js        # JSON/CSV formatting
│   │   └── utils/
│   │       ├── response.js      # Response helpers
│   │       └── error.js         # Error handling
│   ├── wrangler.toml            # Cloudflare Worker config
│   ├── package.json
│   └── .dev.vars                # Local dev environment variables
└── scripts/
    ├── bigquery-credentials.json # Service account (NO COMMITEAR)
    ├── inventory.js              # BigQuery inventory script
    └── package.json
```

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- `wrangler` CLI: `npm install -g wrangler`
- Cloudflare account
- Google Cloud service account con acceso a BigQuery

### Local Development

1. **Clonar repo:**
   ```bash
   cd free/worker
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .dev.vars.example .dev.vars
   # Editar .dev.vars con tus credenciales
   ```

3. **Crear KV namespaces:**
   ```bash
   wrangler kv:namespace create "CACHE"
   wrangler kv:namespace create "API_TOKENS"
   wrangler kv:namespace create "RATE_LIMIT"
   ```

4. **Desarrollo local:**
   ```bash
   wrangler dev
   ```

   Ahora puedes hacer requests a `http://localhost:8787/v1/signals?token=demo`

5. **Deploy:**
   ```bash
   wrangler deploy
   ```

---

## 📚 Documentation

- [**DATA_INVENTORY.md**](docs/DATA_INVENTORY.md) - Diccionario de datos y schema de BigQuery
- [**SOLUTION_DESIGN.md**](docs/SOLUTION_DESIGN.md) - Diseño de arquitectura completo
- [**CONTRACT_FREE.json**](docs/CONTRACT_FREE.json) - Especificación de API con ejemplos
- [**OPERATIONS.md**](docs/OPERATIONS.md) - Runbook para operaciones (próximamente)
- [**ACCEPTANCE.md**](docs/ACCEPTANCE.md) - Criterios de aceptación y evidencias (próximamente)

---

## 💰 Costs

| Servicio | Costo Mensual |
|----------|---------------|
| Cloudflare Workers | $0 (Free Tier) |
| Cloudflare KV | $0 (Free Tier) |
| BigQuery Queries | ~$0.05 |
| BigQuery Storage | ~$0.02 |
| **Total** | **< $0.10/mes** 🎉 |

---

## ✅ Status

| Fase | Estado | Descripción |
|------|--------|-------------|
| FASE 0 | ✅ Completado | Inventario BigQuery y contrato de datos |
| FASE 1 | ✅ Completado | Diseño de solución (KV, TTL, auth, CORS) |
| FASE 2 | 🚧 En progreso | Scaffold de proyecto y documentación |
| FASE 3 | ⏳ Pendiente | Configurar recursos Cloudflare |
| FASE 4 | ⏳ Pendiente | Implementar Worker con mock data |
| FASE 5 | ⏳ Pendiente | Integrar BigQuery real |
| FASE 6 | ⏳ Pendiente | Smoke tests (Excel/Sheets/Web) |
| FASE 7 | ⏳ Pendiente | Gobernanza y limpieza |

---

## 🤝 Support

**Issues:** [GitHub Issues](https://github.com/obacc/signalssheets/issues)
**Email:** support@indicium.com

---

## 📄 License

Proprietary - Indicium Signals © 2025

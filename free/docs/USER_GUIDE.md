# Indicium Signals - MVP Free API - Instrucciones de Uso

**URL del Worker:** `https://free-api.ob-acc23.workers.dev`
**Token Demo:** `demo-free-2025`
**Última Actualización:** 2025-01-28

---

## 📊 Endpoints Disponibles

### 1. GET /v1/signals - Señales de Trading

**URL Base:**
```
https://free-api.ob-acc23.workers.dev/v1/signals
```

**Parámetros:**
- `token` (requerido): Token de autenticación (`demo-free-2025`)
- `format` (opcional): `json` o `csv` (default: `json`)

**Ejemplos:**
```
https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=json
https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=csv
```

### 2. GET /v1/status - Estado del Cache

**URL:**
```
https://free-api.ob-acc23.workers.dev/v1/status
```

Retorna metadatos del cache, incluyendo:
- `generated_at`: Timestamp de última actualización
- `total_count`: Número de señales
- `source`: Fuente de datos (`"bq"` para BigQuery)
- `cron_health`: Estado del Cron job

---

## 💼 Excel (Power Query) - GRATIS

### Método 1: From Web (Recomendado)

1. **Abre Excel**
2. Ve a la pestaña **Data** (Datos)
3. Click en **Get Data** > **From Other Sources** > **From Web**
4. Pega esta URL:
   ```
   https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=csv
   ```
5. Click **OK**
6. En el preview, click **Load** (Cargar)

**✅ Resultado:** Tabla de señales cargada en Excel

### Actualizar Datos

- **Manual:** Click derecho en la tabla > **Refresh**
- **Automático:**
  1. Click derecho en la tabla > **Query**
  2. En Power Query Editor: **Home** > **Query** > **Properties**
  3. Habilitar **Refresh every X minutes**

### Método 2: Power Query Editor (Avanzado)

```m
let
    Source = Web.Contents("https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=csv"),
    ImportedCSV = Csv.Document(Source,[Delimiter=",", Columns=null, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    PromotedHeaders = Table.PromoteHeaders(ImportedCSV, [PromoteAllScalars=true]),
    ChangedTypes = Table.TransformColumnTypes(PromotedHeaders,{
        {"ticker", type text},
        {"company_name", type text},
        {"signal", type text},
        {"trinity_score", type number},
        {"price_current", type number}
    })
in
    ChangedTypes
```

### Columnas Esperadas en Excel

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | Texto | Identificador único (sig-XXX) |
| `ticker` | Texto | Símbolo bursátil (AAPL, NVDA, etc.) |
| `company_name` | Texto | Nombre de la empresa |
| `sector` | Texto | Sector industrial |
| `signal_type` | Texto | BUY, SELL, HOLD |
| `signal_strength` | Número | Fuerza de señal (0-100) |
| `dominant_author` | Texto | Lynch, O'Neil, Graham |
| `price` | Número | Precio actual (USD) |
| `change_percent` | Número | Cambio % del día |
| `target_price` | Número | Precio objetivo |
| `stop_loss` | Número | Stop loss sugerido |
| `trinity_score_lynch` | Número | Score Lynch (0-100) |
| `trinity_score_oneil` | Número | Score O'Neil (0-100) |
| `trinity_score_graham` | Número | Score Graham (0-100) |
| `trinity_score_avg` | Número | Promedio Trinity |
| `confidence` | Número | Confianza (0-100) |
| `signal_date` | Fecha | Fecha de señal |
| `last_updated` | Timestamp | Última actualización |

---

## 📊 Google Sheets - GRATIS

### Método 1: IMPORTDATA (Simple)

1. **Abre una nueva hoja en Google Sheets**
2. En la celda **A1**, escribe esta fórmula:
   ```
   =IMPORTDATA("https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=csv")
   ```
3. **Presiona Enter**

**✅ Resultado:** Datos se cargan automáticamente

**Actualización:**
- Google Sheets refresca automáticamente cada ~1 hora
- Para refrescar manualmente: **Data** > **Refresh all**

### Método 2: IMPORTDATA con Formato Mejorado

```
=ARRAYFORMULA(
  IMPORTDATA("https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=csv")
)
```

### Método 3: Apps Script (Avanzado)

Si necesitas más control (filtros, transformaciones, refresh programado):

1. **Extensions** > **Apps Script**
2. Pega este código:

```javascript
function refreshSignals() {
  const url = "https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=csv";
  const response = UrlFetchApp.fetch(url);
  const csv = response.getContentText();

  // Parse CSV
  const rows = Utilities.parseCsv(csv);

  // Write to sheet
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

// Programar para ejecutar cada hora
function createTimeTrigger() {
  ScriptApp.newTrigger('refreshSignals')
    .timeBased()
    .everyHours(1)
    .create();
}
```

3. Ejecuta `refreshSignals()` para probar
4. Ejecuta `createTimeTrigger()` para programar refresh automático

### Limitaciones de Google Sheets

- **IMPORTDATA**: Máximo ~50 llamadas por spreadsheet
- **Tamaño**: Máximo ~1 MB por import
- **Refresh**: Automático cada ~1 hora (no configurable con IMPORTDATA)

**Solución:** Si necesitas más control, usa Apps Script (método 3)

---

## 🌐 Web / JavaScript

### Fetch API (JSON)

```javascript
const url = 'https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=json';

fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log(`Loaded ${data.meta.total_count} signals`);
    console.log('Generated at:', data.meta.generated_at);
    console.log('Stats:', data.stats);

    // Process signals
    data.data.forEach(signal => {
      console.log(`${signal.ticker}: ${signal.signal.type} (${signal.trinityScores.average})`);
    });
  })
  .catch(error => {
    console.error('Error fetching signals:', error);
  });
```

### Axios (JavaScript)

```javascript
const axios = require('axios');

async function getSignals() {
  try {
    const response = await axios.get('https://free-api.ob-acc23.workers.dev/v1/signals', {
      params: {
        token: 'demo-free-2025',
        format: 'json'
      }
    });

    console.log('Signals:', response.data.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data);
    throw error;
  }
}

getSignals();
```

### React Component

```jsx
import React, { useState, useEffect } from 'react';

function SignalsTable() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch(
          'https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=json'
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setSignals(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();

    // Refresh every 10 minutes
    const interval = setInterval(fetchSignals, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Signal</th>
          <th>Trinity Score</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        {signals.map(signal => (
          <tr key={signal.id}>
            <td>{signal.ticker}</td>
            <td>{signal.signal.type}</td>
            <td>{signal.trinityScores.average}</td>
            <td>${signal.price.current}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 🐍 Python

### Requests Library

```python
import requests
import pandas as pd

# Get signals as JSON
url = 'https://free-api.ob-acc23.workers.dev/v1/signals'
params = {
    'token': 'demo-free-2025',
    'format': 'json'
}

response = requests.get(url, params=params)
response.raise_for_status()  # Raise exception for 4xx/5xx

data = response.json()

print(f"Loaded {data['meta']['total_count']} signals")
print(f"Generated at: {data['meta']['generated_at']}")
print(f"Source: {data['meta']['source']}")

# Convert to DataFrame
df = pd.DataFrame(data['data'])
print(df.head())

# Or get CSV directly
csv_url = 'https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=csv'
df_csv = pd.read_csv(csv_url)
print(df_csv.head())
```

### Save to CSV

```python
import requests

url = 'https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=csv'
response = requests.get(url)

with open('signals.csv', 'w', encoding='utf-8') as f:
    f.write(response.text)

print("Saved to signals.csv")
```

---

## 🔐 Seguridad del Token

### Token Actual: `demo-free-2025`

**Estado:** ✅ Activo
**Uso:** Demostración y testing público
**Rate Limit:** 30 requests/minuto, 1000 requests/día

### ⚠️ Importante

- Este token es **público** y compartido
- **NO** lo uses para aplicaciones de producción
- Para uso en producción, solicita un token privado

### Crear Token Privado

Si necesitas tu propio token:

1. Contacta al administrador
2. O usa `wrangler` CLI:

```bash
# Configurar Cloudflare token
export CLOUDFLARE_API_TOKEN="tu-token-de-cloudflare"

# Crear nuevo token en KV
npx wrangler kv:key put \
  --namespace-id="a2ea754ec0fa426d9561fd9bc54f7603" \
  "tu-token-personalizado" \
  '{"token":"tu-token-personalizado","status":"active","plan":"free","email":"tu@email.com","created_at":"2025-01-28T00:00:00Z","rate_limit":{"requests_per_minute":30,"requests_per_day":1000}}'
```

---

## 📈 Monitoreo y Debugging

### Verificar Estado del API

```bash
curl -s "https://free-api.ob-acc23.workers.dev/v1/status" | jq
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "cache": {
    "generated_at": "2025-01-28T02:30:00.000Z",
    "total_count": 87,
    "ttl_seconds": 600,
    "source": "bq",
    "source_view": "v_api_free_signals"
  },
  "stats": {
    "buy_signals": 24,
    "sell_signals": 18,
    "hold_signals": 45,
    "avg_trinity_score": 68.4
  },
  "cron_health": {
    "last_run": "2025-01-28T02:30:00.000Z",
    "status": "success",
    "rowcount": 87,
    "duration_ms": 2345
  }
}
```

### Verificar Headers HTTP

```bash
curl -I "https://free-api.ob-acc23.workers.dev/v1/signals?token=demo-free-2025&format=csv"
```

**Headers esperados:**
```
HTTP/2 200
content-type: text/csv; charset=utf-8
content-disposition: attachment; filename="indicium-signals-2025-01-28.csv"
x-data-generated-at: 2025-01-28T02:30:00.000Z
x-cache-hit: true
x-api-version: 1.0.0
cache-control: public, max-age=600
```

---

## 🆘 Troubleshooting

### Error 401: "Invalid or inactive token"

**Causa:** Token incorrecto o inactivo

**Solución:**
- Verifica que uses `token=demo-free-2025`
- Verifica que el parámetro esté en la URL
- Ejemplo correcto: `?token=demo-free-2025&format=csv`

### Error 429: "Rate limit exceeded"

**Causa:** Excediste el límite de 30 requests/minuto

**Solución:**
- Espera 1 minuto antes de hacer más requests
- Implementa caching en tu aplicación
- Usa el header `Retry-After` para saber cuándo reintentar

### Error 503: "Cache not yet populated"

**Causa:** El Cron job aún no ha ejecutado el primer refresh

**Solución:**
- Espera 10 minutos (tiempo del Cron Trigger)
- O contacta al administrador para trigger manual

### Excel: "Unable to connect"

**Causa:** Firewall corporativo bloqueando la conexión

**Solución:**
1. Verifica que puedas acceder a la URL en el navegador
2. Contacta a IT para permitir `*.workers.dev`
3. Usa formato CSV (más compatible que JSON)

### Google Sheets: Error "#N/A"

**Causa:** Límite de IMPORTDATA excedido o URL incorrecta

**Solución:**
1. Verifica la URL (debe incluir `?token=...`)
2. Si tienes muchos `IMPORTDATA()`, usa Apps Script
3. Verifica que la sheet no esté en modo offline

---

## 📊 Estructura de Datos

### Respuesta JSON

```json
{
  "meta": {
    "generated_at": "2025-01-28T02:30:00.000Z",
    "total_count": 87,
    "ttl_seconds": 600,
    "source": "bq",
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
        "signalDate": "2025-01-28",
        "lastUpdated": "2025-01-28T02:30:00.000Z"
      },
      "reasoning": "Strong momentum breakout..."
    }
  ]
}
```

---

## 📅 Actualización de Datos

- **Frecuencia:** Cada 10 minutos (Cron Trigger)
- **Fuente:** BigQuery (`analytics.v_api_free_signals`)
- **Cache TTL:** 10 minutos (600 segundos)
- **Horario:** 24/7 UTC

**Próxima actualización:** Consulta `/v1/status` para ver `generated_at`

---

## 📞 Soporte

**Issues:** GitHub Issues del proyecto
**Email:** support@indicium.com
**Dashboard:** https://dash.cloudflare.com/213d7189694d6fefdf23cd1ff91385d2/workers/services

---

**Última actualización:** 2025-01-28
**API Version:** 1.0.0
**Worker ID:** `ec78eb44-84b4-47fc-ad99-182659b0c1f0`

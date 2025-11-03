# Acceptance Criteria & Testing Evidence - MVP Free

**Proyecto:** Indicium Signals Trinity Method - MVP Free API
**Versión:** 1.0
**Fecha:** 2025-11-03

---

## 📋 Criterios de Aceptación

### FASE 0 - Inventario y Validación ✅

- [x] **DATA_INVENTORY.md** creado con diccionario completo de datos
  - [x] 25 campos documentados con tipos y modos
  - [x] Enums definidos: SignalType, AuthorType, RiskProfile
  - [x] 11 sectores principales listados
  - [x] Mapeo a BigQuery schema
  - [x] Consultas de validación documentadas

- [x] **CONTRACT_FREE.json** creado con ejemplos de salida
  - [x] Ejemplo JSON completo con metadata y stats
  - [x] Ejemplo CSV con headers
  - [x] Parámetros de request documentados
  - [x] HTTP status codes definidos (200, 400, 401, 429, 500, 503)
  - [x] Ejemplos de uso para Excel, Google Sheets, JavaScript, Python, cURL

- [x] **Cardinalidad validada:** 50-150 señales activas
- [x] **Tamaño de payload estimado:** 50-200 KB (< límite de KV)
- [x] **Paginación:** NO necesaria para MVP Free
- [x] **Bloqueo de red con BigQuery:** Documentado con solución alternativa

---

### FASE 1 - Diseño de la Solución ✅

- [x] **SOLUTION_DESIGN.md** creado con arquitectura completa
  - [x] Decisión de almacenamiento: **KV** (justificado vs R2)
  - [x] Política de refresh: **cada 10 minutos** via Cron (`*/10 * * * *`)
  - [x] TTL definido: **600 segundos** (10 minutos)
  - [x] Sistema de autenticación: Token en query string con whitelist en KV
  - [x] Rate limiting: 30 req/min, 1000 req/día por token
  - [x] CORS: Habilitado para JSON, no aplicar para CSV
  - [x] Diagrama de arquitectura completo
  - [x] Estimación de costos: **< $0.10/mes**

- [x] **Formatos de salida definidos:** JSON y CSV
- [x] **Headers HTTP documentados:** Content-Type, X-Data-Generated-At, Cache-Control, CORS

---

### FASE 2 - Estructura del Repo ✅

- [x] **Decisión de estructura:** Carpeta `/free/` en repo actual (justificado)
- [x] **README.md** creado con:
  - [x] Quick start para Excel, Google Sheets, Web
  - [x] API Reference completa
  - [x] Diagrama de arquitectura
  - [x] Instrucciones de desarrollo
  - [x] Links a documentación

- [x] **OPERATIONS.md** creado con:
  - [x] Pasos de configuración de Cloudflare (Worker, KV, Cron, Domain)
  - [x] Instrucciones de deployment
  - [x] Guía de monitoreo
  - [x] Troubleshooting común
  - [x] Disaster recovery procedures

- [x] **Estructura de carpetas creada:**
  ```
  /free/
  ├── README.md
  ├── docs/
  │   ├── DATA_INVENTORY.md
  │   ├── SOLUTION_DESIGN.md
  │   ├── CONTRACT_FREE.json
  │   ├── OPERATIONS.md
  │   └── ACCEPTANCE.md (este archivo)
  ├── worker/src/{lib,utils}/ (scaffolded)
  └── scripts/ (con inventory.js)
  ```

---

### FASE 3 - Configuración de Cloudflare ⏳ PENDIENTE

**Bloqueador:** Requiere acceso a cuenta de Cloudflare (credenciales de usuario)

#### Cuando se tenga acceso, ejecutar:

- [ ] **Worker `indicium-free-api` creado**
  - Comando: `wrangler init indicium-free-api`
  - URL: `https://indicium-free-api.<subdomain>.workers.dev`

- [ ] **KV Namespace `free-signals-cache` creado**
  - Comando: `wrangler kv:namespace create "CACHE"`
  - Binding: `CACHE`

- [ ] **KV Namespace `free-api-tokens` creado**
  - Comando: `wrangler kv:namespace create "API_TOKENS"`
  - Binding: `API_TOKENS`
  - Tokens iniciales populados: `demo-free-2025`, `dev-internal-2025`

- [ ] **KV Namespace `free-ratelimit` creado**
  - Comando: `wrangler kv:namespace create "RATE_LIMIT"`
  - Binding: `RATE_LIMIT`

- [ ] **Cron Trigger configurado**
  - Schedule: `*/10 * * * *`
  - Verificado en Dashboard

- [ ] **Custom Domain configurado**
  - Domain: `free.api.indicium.com` (o equivalente)
  - DNS configurado automáticamente por Cloudflare

- [ ] **Secret `BIGQUERY_CREDENTIALS` subido**
  - Comando: `wrangler secret put BIGQUERY_CREDENTIALS`

#### Evidencia esperada:

```bash
# Verificar Worker
$ wrangler list
indicium-free-api  https://indicium-free-api.<subdomain>.workers.dev

# Verificar KV namespaces
$ wrangler kv:namespace list
[
  { "id": "xxx", "title": "indicium-free-api-CACHE" },
  { "id": "yyy", "title": "indicium-free-api-API_TOKENS" },
  { "id": "zzz", "title": "indicium-free-api-RATE_LIMIT" }
]

# Verificar tokens
$ wrangler kv:key get --namespace-id=yyy "demo-free-2025"
{"token":"demo-free-2025","is_active":true,...}
```

---

### FASE 4 - Worker con Mock Data ⏳ PENDIENTE

**Dependencia:** FASE 3 completada

- [ ] **Worker implementado con código funcional:**
  - [ ] `src/index.js` - Request handler principal
  - [ ] `src/lib/auth.js` - Validación de tokens
  - [ ] `src/lib/ratelimit.js` - Rate limiting
  - [ ] `src/lib/format.js` - Transformación JSON/CSV
  - [ ] `src/utils/response.js` - Response helpers
  - [ ] `src/utils/error.js` - Error handling

- [ ] **Mock data en cache:**
  - [ ] JSON con 3-5 señales de ejemplo
  - [ ] Metadata: `generated_at`, `total_count`, `ttl_seconds`
  - [ ] Stats: `buy_signals`, `sell_signals`, `hold_signals`

- [ ] **Endpoint GET `/v1/signals` responde:**
  - [ ] `?token=demo-free-2025&format=json` → 200 + JSON
  - [ ] `?token=demo-free-2025&format=csv` → 200 + CSV
  - [ ] `?token=invalid` → 401 + error JSON
  - [ ] `?format=xml` → 400 + error JSON

- [ ] **Headers correctos:**
  - [ ] `Content-Type: application/json` para JSON
  - [ ] `Content-Type: text/csv` para CSV
  - [ ] `X-Data-Generated-At` presente
  - [ ] `Cache-Control: public, max-age=600`
  - [ ] `Access-Control-Allow-Origin: *` para JSON

#### Evidencia esperada:

```bash
# Test JSON
$ curl -i "https://free.api.indicium.com/v1/signals?token=demo-free-2025&format=json"
HTTP/2 200
content-type: application/json; charset=utf-8
x-data-generated-at: 2025-11-03T02:30:00.000Z
cache-control: public, max-age=600

{"meta":{"generated_at":"...","total_count":5},"data":[...]}

# Test CSV
$ curl -i "https://free.api.indicium.com/v1/signals?token=demo-free-2025&format=csv"
HTTP/2 200
content-type: text/csv; charset=utf-8
content-disposition: attachment; filename="indicium-signals-2025-11-03.csv"

id,ticker,company_name,...
sig-001,NVDA,NVIDIA Corporation,...

# Test 401
$ curl -i "https://free.api.indicium.com/v1/signals?token=invalid"
HTTP/2 401
content-type: application/json

{"error":{"code":"INVALID_TOKEN",...}}
```

---

### FASE 5 - Integración con BigQuery ⏳ PENDIENTE

**Dependencia:** FASE 4 completada + Acceso a BigQuery resuelto

**Bloqueador actual:** Conectividad de red a Google Cloud APIs desde entorno actual

- [ ] **Cron handler implementado:**
  - [ ] `src/scheduled.js` - Scheduled event handler
  - [ ] `src/lib/bigquery.js` - BigQuery client con JWT auth

- [ ] **Query a BigQuery funcional:**
  - [ ] Conecta con service account `claudecode@sunny-advantage-471523-b3.iam.gserviceaccount.com`
  - [ ] Ejecuta `SELECT * FROM analytics.v_api_free_signals LIMIT 100`
  - [ ] Maneja errores de conexión/permisos

- [ ] **Transformación de datos:**
  - [ ] BigQuery snake_case → JSON camelCase
  - [ ] Agrupación en estructura `{meta, stats, data}`
  - [ ] Cálculo de metadata (`generated_at`, `total_count`, `ttl_seconds`)
  - [ ] Cálculo de stats (`buy_signals`, `sell_signals`, `hold_signals`)

- [ ] **Escritura a KV:**
  - [ ] Key: `signals:latest`
  - [ ] Value: JSON completo (< 200 KB)
  - [ ] Sin TTL (manual override por cron)

- [ ] **Cron ejecuta cada 10 minutos:**
  - [ ] Verificado en logs: `wrangler tail`
  - [ ] Sin errores en ejecuciones consecutivas
  - [ ] Latencia de ejecución < 15 segundos

#### Evidencia esperada:

```bash
# Ver logs de cron en tiempo real
$ wrangler tail --format=pretty
[2025-11-03 02:30:00] ✓ Scheduled event triggered
[2025-11-03 02:30:02] → Querying BigQuery: analytics.v_api_free_signals
[2025-11-03 02:30:05] ✓ BigQuery returned 87 rows
[2025-11-03 02:30:06] → Transforming data to contract format
[2025-11-03 02:30:07] → Writing to KV: signals:latest (142 KB)
[2025-11-03 02:30:08] ✓ Cache updated successfully

# Verificar cache
$ wrangler kv:key get --namespace-id=<CACHE_ID> "signals:latest" | jq '.meta'
{
  "generated_at": "2025-11-03T02:30:08.000Z",
  "total_count": 87,
  "ttl_seconds": 600
}
```

---

### FASE 6 - Smoke Tests con Clientes ⏳ PENDIENTE

**Dependencia:** FASE 5 completada

#### Test 1: Excel (Power Query)

**Pasos:**
1. Abrir Excel
2. Data > From Web
3. URL: `https://free.api.indicium.com/v1/signals?token=demo-free-2025&format=csv`
4. Load

**Criterios de aceptación:**
- [ ] Tabla se carga correctamente con todas las columnas
- [ ] Datos coinciden con la respuesta del endpoint
- [ ] Refresh manual funciona (Data > Refresh All)
- [ ] No hay errores de parsing

**Evidencia:** Screenshot de Excel con datos cargados

---

#### Test 2: Google Sheets

**Pasos:**
1. Abrir Google Sheets
2. En celda A1: `=IMPORTDATA("https://free.api.indicium.com/v1/signals?token=demo-free-2025&format=csv")`
3. Enter

**Criterios de aceptación:**
- [ ] Datos se cargan automáticamente
- [ ] Columnas correctamente parseadas
- [ ] Actualización automática cada ~1 hora (Google Sheets limit)
- [ ] No hay error #N/A

**Evidencia:** Screenshot de Google Sheets con datos poblados

---

#### Test 3: Web (JavaScript fetch)

**Código de prueba:**
```html
<!DOCTYPE html>
<html>
<head><title>Indicium Signals Test</title></head>
<body>
  <h1>Signals</h1>
  <div id="signals"></div>

  <script>
    fetch('https://free.api.indicium.com/v1/signals?token=demo-free-2025&format=json')
      .then(r => r.json())
      .then(data => {
        document.getElementById('signals').innerHTML = `
          <p>Loaded ${data.meta.total_count} signals</p>
          <p>Generated at: ${data.meta.generated_at}</p>
          <ul>
            ${data.data.slice(0, 5).map(s => `
              <li>${s.ticker} - ${s.signal.type} (${s.signal.strength})</li>
            `).join('')}
          </ul>
        `;
      })
      .catch(err => {
        document.getElementById('signals').innerHTML = `Error: ${err}`;
      });
  </script>
</body>
</html>
```

**Criterios de aceptación:**
- [ ] Fetch se completa sin errores CORS
- [ ] JSON parsea correctamente
- [ ] Datos se renderizan en la página
- [ ] Network tab muestra headers CORS correctos

**Evidencia:** Screenshot del browser con datos + DevTools Network tab

---

#### Test 4: Python

**Script de prueba:**
```python
import requests
import pandas as pd

url = 'https://free.api.indicium.com/v1/signals'
params = {'token': 'demo-free-2025', 'format': 'json'}

response = requests.get(url, params=params)
print(f"Status: {response.status_code}")
print(f"Headers: {dict(response.headers)}")

data = response.json()
print(f"Loaded {data['meta']['total_count']} signals")

df = pd.DataFrame(data['data'])
print(df.head())
```

**Criterios de aceptación:**
- [ ] Status code 200
- [ ] JSON válido
- [ ] DataFrame se crea correctamente
- [ ] Todas las columnas presentes

**Evidencia:** Output del script

---

#### Test 5: Rate Limiting

**Script de prueba:**
```bash
# Hacer 35 requests en 30 segundos (exceder límite de 30/min)
for i in {1..35}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "https://free.api.indicium.com/v1/signals?token=demo-free-2025"
  sleep 0.8
done
```

**Criterios de aceptación:**
- [ ] Primeros ~30 requests: HTTP 200
- [ ] Siguientes requests: HTTP 429
- [ ] Response body de 429 incluye `retry_after`
- [ ] Después de 60 segundos, vuelven a funcionar

**Evidencia:** Output mostrando cambio de 200 a 429

---

### FASE 7 - Gobernanza y Limpieza ⏳ PENDIENTE

**Dependencia:** FASE 6 completada

- [ ] **Rate limiting verificado en producción:**
  - [ ] 30 req/min por token funciona
  - [ ] Headers `Retry-After` correctos en 429
  - [ ] Contadores se limpian después de 60 segundos

- [ ] **Observabilidad configurada:**
  - [ ] Logs básicos por hit/miss de cache
  - [ ] Contador de errores de BigQuery
  - [ ] Alertas en caso de fallo de Cron (opcional)

- [ ] **Confirmación: No hay Cloudflare Pages Functions activas en `/api/*`**
  - [ ] Verificado en Dashboard: Pages > indiciumsignals > Functions
  - [ ] Solo rutas de frontend activas (SPA rewrite)

- [ ] **Documentación actualizada:**
  - [ ] `README.md` con URL de producción real
  - [ ] `OPERATIONS.md` con IDs de KV reales
  - [ ] `ACCEPTANCE.md` con evidencias de testing (screenshots, logs)

#### Evidencia esperada:

```bash
# Verificar que Pages no tiene functions API
$ cat public/_redirects
/*    /index.html   200  # Solo SPA rewrite, sin /api/*

# Verificar observabilidad
$ wrangler tail --format=json | jq -r '[.timestamp, .outcome, .scriptName] | @tsv'
2025-11-03T02:30:00Z  ok  indicium-free-api
2025-11-03T02:30:01Z  ok  indicium-free-api
```

---

## 📊 Resumen de Estado

| Fase | Estado | Progreso | Bloqueadores |
|------|--------|----------|--------------|
| FASE 0 | ✅ Completado | 100% | Ninguno (workaround aplicado) |
| FASE 1 | ✅ Completado | 100% | Ninguno |
| FASE 2 | ✅ Completado | 100% | Ninguno |
| FASE 3 | ⏳ Pendiente | 0% | **Credenciales de Cloudflare** |
| FASE 4 | ⏳ Pendiente | 0% | Depende de FASE 3 |
| FASE 5 | ⏳ Pendiente | 0% | Depende de FASE 4 + **Conectividad BigQuery** |
| FASE 6 | ⏳ Pendiente | 0% | Depende de FASE 5 |
| FASE 7 | ⏳ Pendiente | 0% | Depende de FASE 6 |

---

## 🚧 Bloqueadores Activos

### 1. Conectividad a Google Cloud APIs

**Descripción:** No hay conectividad de red a `www.googleapis.com` desde el entorno actual
**Error:** `getaddrinfo EAI_AGAIN www.googleapis.com`
**Impacto:** No se puede ejecutar inventario automático de BigQuery ni testing de conexión
**Workaround aplicado:** Inventario manual basado en tipos TypeScript existentes
**Resolución requerida:** Ejecutar FASE 5 en entorno con acceso a Internet (local, CI/CD, Cloudflare Worker)

### 2. Credenciales de Cloudflare

**Descripción:** No se tienen credenciales para acceder a Cloudflare Dashboard o `wrangler` CLI
**Impacto:** No se pueden crear recursos de Cloudflare (Worker, KV, Cron, Domain)
**Resolución requerida:** Proporcionar API Token de Cloudflare con permisos:
- Workers Scripts:Edit
- Workers KV Storage:Edit
- Workers Routes:Edit
- DNS:Edit (para custom domain)

**Cómo obtener el token:**
1. Ir a Cloudflare Dashboard > My Profile > API Tokens
2. Create Token > Use template "Edit Cloudflare Workers"
3. Add permissions: Workers KV Storage:Edit
4. Create Token
5. Ejecutar: `wrangler login` o exportar `CLOUDFLARE_API_TOKEN=xxx`

---

## 📝 Próximos Pasos Inmediatos

1. **Obtener credenciales de Cloudflare** (bloqueador crítico)
2. **Implementar Worker con mock data** (FASE 4)
3. **Validar conectividad BigQuery** desde Cloudflare Worker (FASE 5)
4. **Realizar smoke tests** con Excel y Google Sheets (FASE 6)
5. **Documentar evidencias** en este archivo con screenshots

---

**Última actualización:** 2025-11-03
**Responsable:** Claude Code Agent
**Estado general:** **Fases 0-2 completadas (documentación y diseño). Bloqueado en FASE 3 por falta de credenciales.**

# BigQuery Scripts

Scripts para interactuar con BigQuery y generar inventarios de datos.

## Configuración

### 1. Credenciales de BigQuery

Copia el template de credenciales:

```bash
cp bigquery-credentials.json.example bigquery-credentials.json
```

Edita `bigquery-credentials.json` con tus credenciales reales de Google Cloud.

**⚠️ IMPORTANTE:** NUNCA commitees `bigquery-credentials.json` a Git. Ya está en `.gitignore`.

### 2. Instalar dependencias

```bash
npm install
```

## Scripts Disponibles

### inventory.js

Descubre todos los datasets, tablas y vistas en BigQuery.

```bash
npm run inventory
```

**Output:**
- Lista de datasets
- Tablas y vistas en cada dataset
- Schema de cada tabla/vista
- Sample data (primeras 5 filas)
- Estadísticas (row count, tamaño)

### init-cache.js

Genera archivo JSON con mock data para inicializar el cache de Cloudflare KV.

```bash
node init-cache.js <CACHE_NAMESPACE_ID>
```

**Output:**
- Archivo `../worker/mock-cache.json` con datos mock
- Comando para subirlo a Cloudflare KV

## Obtener Credenciales de BigQuery

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto (`sunny-advantage-471523-b3` o el que uses)
3. Ve a **IAM & Admin** > **Service Accounts**
4. Crea un nuevo service account o usa uno existente
5. Asigna roles:
   - **BigQuery Data Viewer** (para leer datos)
   - **BigQuery Job User** (para ejecutar queries)
6. Crea una key (JSON) y descárgala
7. Copia el contenido al archivo `bigquery-credentials.json`

## Troubleshooting

### Error: "getaddrinfo EAI_AGAIN www.googleapis.com"

**Causa:** No hay conectividad a Google Cloud APIs desde tu entorno actual.

**Solución:**
- Ejecuta los scripts desde tu máquina local (no desde contenedores sin red)
- O usa Cloudflare Worker para las queries (que tiene acceso a Internet)

### Error: "403 Permission Denied"

**Causa:** El service account no tiene permisos suficientes.

**Solución:**
- Verifica que tiene rol **BigQuery Data Viewer**
- Verifica que tiene rol **BigQuery Job User**
- Re-genera las credenciales si es necesario

# Cloudflare Inventory - Indicium Signals

**Fecha de Auditoria:** 2024-12-06
**Proyecto:** signalssheets / Indicium Signals
**Repositorio:** https://github.com/obacc/signalssheets

---

## Account Info

| Campo | Valor |
|-------|-------|
| Account ID | **NO CONFIGURADO** (no encontrado en wrangler.toml) |
| Email | **DESCONOCIDO** (wrangler CLI no instalado) |
| Authenticated | **NO** - wrangler: command not found |
| API Token | **NO CONFIGURADO** (no env vars CLOUDFLARE_*) |

### Notas de Autenticacion
- Wrangler CLI **NO** esta instalado en este entorno
- No se encontraron variables de entorno CLOUDFLARE_* o CF_*
- Para autenticar: `npm install -g wrangler && wrangler login`

---

## Workers Deployed

| Name | URL | Last Deploy | Status | Notas |
|------|-----|-------------|--------|-------|
| *Ninguno identificado* | - | - | - | No hay Workers activos detectados |

### Hallazgos Workers
- No se encontraron archivos `*.worker.js` o `*worker*.ts`
- No existen directorios `/workers/` o `/cloudflare/` en el proyecto
- El proyecto usa **Cloudflare Pages** (no Workers) para hosting

---

## KV Namespaces

| Name | ID | Binding | Storage Used |
|------|-----|---------|--------------|
| *Ninguno configurado* | - | - | - |

### Hallazgos KV
- No hay referencias a `kv_namespaces` en wrangler.toml
- No se encontraron bindings KV_NAMESPACE en codigo
- **RECOMENDACION:** Crear nuevo KV para Trinity Signals si se necesita cache

---

## Pages Projects

| Name | URL | Last Deploy | Status | Commit |
|------|-----|-------------|--------|--------|
| signalssheets | https://123b3e85.signalssheets.pages.dev | ~16:40:00 (ver TASK_LOG) | ACTIVO | 13bb500 |
| indiciumsignals (config) | https://indiciumsignals-xxx.pages.dev | Pendiente setup | Configurado | - |

### Detalles del Deploy Existente
- **Proyecto:** signalssheets
- **URL Confirmada:** https://123b3e85.signalssheets.pages.dev
- **Branch:** main
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Framework:** React + Vite + TypeScript
- **Estado:** Funcionando (deploy automatico activo)

### Funcionalidades Desplegadas
- Dashboard con signals
- Sistema de Watchlist (Zustand + localStorage)
- Daily TOP 10
- 60 senales mock data
- Market Regime page

---

## Existing Configurations

### wrangler.toml
**Ubicacion:** `/home/user/signalssheets/wrangler.toml`

```toml
name = "indiciumsignals"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

### Otros Archivos de Configuracion
| Archivo | Ubicacion | Proposito |
|---------|-----------|-----------|
| wrangler.toml | /home/user/signalssheets/ | Config Pages deploy |
| package.json | /home/user/signalssheets/ | npm scripts (build, dev) |
| vite.config.ts | /home/user/signalssheets/ | Build configuration |
| public/_redirects | /home/user/signalssheets/ | SPA routing |

### Variables de Entorno
- CLOUDFLARE_* : **NO ENCONTRADAS**
- CF_* : **NO ENCONTRADAS**
- .dev.vars : **NO EXISTE**

---

## Reutilizable para Indicium

### Recursos Existentes que SI Reutilizar
- **signalssheets Pages Project** - Ya desplegado y funcionando
- **wrangler.toml config** - Base lista para Pages
- **Build pipeline** - npm run build + dist/
- **SPA redirects** - _redirects configurado

### Recursos que NO Aplican
- No hay Workers para reutilizar
- No hay KV namespaces configurados
- No hay Cron triggers
- No hay Durable Objects

---

## Recursos Necesarios Crear

### Para API Backend (Nuevo)
- [ ] **Worker:** `indicium-signals-api` - API para servir signals
- [ ] **KV Namespace:** `trinity-signals-cache` - Cache de signals procesadas
- [ ] **Cron Trigger:** `replica-daily` - Sincronizacion diaria con GCP/BigQuery

### Para Produccion (Existente a mejorar)
- [ ] Configurar custom domain para Pages
- [ ] Agregar account_id a wrangler.toml
- [ ] Configurar API token para CI/CD

---

## Proyectos Relacionados (No-Cloudflare)

### GCP Polygon Pipeline (Auditoria)
**Ubicacion:** `/home/user/signalssheets/auditoria/`

| Tipo | Archivos | Proposito |
|------|----------|-----------|
| Scripts Shell | 00_COMANDOS_COMPLETOS.sh, 05_diagnostico_logs_cloud.sh | Diagnostico GCP |
| Scripts Python | 07_analisis_gcs_vs_bq.py | Analisis GCS vs BigQuery |
| SQL Queries | 01-06*.sql | Row counts, diffs, diagnostico BQ |

**Nota:** Estos son para auditoria de pipeline Polygon en GCP, no relacionados a Cloudflare.

---

## Arquitectura Actual

```
                    GitHub (obacc/signalssheets)
                              |
                              v
                    Cloudflare Pages
                              |
                              v
                    +-----------------+
                    | signalssheets   |
                    | (React SPA)     |
                    |                 |
                    | - Dashboard     |
                    | - Watchlist     |
                    | - Daily TOP 10  |
                    +-----------------+
                              |
                    (Mock Data - Local)
                              |
                         [FUTURO]
                              |
                              v
                    +------------------+
                    | indicium-signals |
                    | -api (Worker)    |
                    +------------------+
                              |
                              v
                    +------------------+
                    | trinity-signals  |
                    | -cache (KV)      |
                    +------------------+
                              |
                              v
                    +------------------+
                    | GCP BigQuery     |
                    | (Source Data)    |
                    +------------------+
```

---

## Limites y Quotas (Cloudflare Free Plan)

| Recurso | Limite Free | Uso Actual | Disponible |
|---------|-------------|------------|------------|
| Workers Requests | 100,000/dia | 0 | 100,000/dia |
| KV Reads | 100,000/dia | 0 | 100,000/dia |
| KV Writes | 1,000/dia | 0 | 1,000/dia |
| KV Storage | 1 GB | 0 | 1 GB |
| Pages Builds | 500/mes | ~5 | ~495 |
| Pages Bandwidth | Unlimited | - | Unlimited |

**Plan Detectado:** Free (asumido - no se pudo verificar sin wrangler auth)

---

## Recomendaciones

### Inmediatas (Antes de crear recursos)
1. **Instalar wrangler CLI:** `npm install -g wrangler`
2. **Autenticar:** `wrangler login`
3. **Verificar account:** `wrangler whoami`
4. **Agregar account_id a wrangler.toml**

### Para Desarrollo API
1. Crear nuevo archivo `wrangler.api.toml` para el Worker API
2. Definir KV namespace para cache de signals
3. Implementar Worker con endpoints REST
4. Configurar CORS para permitir requests desde Pages

### Para Produccion
1. Configurar custom domain (signals.indicium.com o similar)
2. Implementar API token para GitHub Actions
3. Considerar upgrade a Workers Paid si limites son insuficientes

---

## Resumen Ejecutivo

| Categoria | Estado |
|-----------|--------|
| Pages Project | **ACTIVO** - signalssheets desplegado |
| Workers | **NINGUNO** - Crear para API |
| KV Namespaces | **NINGUNO** - Crear para cache |
| Cron Triggers | **NINGUNO** - Crear para sync |
| Autenticacion | **NO CONFIGURADA** - Instalar wrangler |
| wrangler.toml | **EXISTE** - Config basica Pages |

### Accion Requerida
1. Instalar y autenticar wrangler CLI
2. Verificar limites reales de la cuenta
3. Decidir arquitectura (Workers vs Pages Functions)
4. Crear recursos nuevos para API backend

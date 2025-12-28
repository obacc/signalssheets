# Indicium Signals - Landing Page

🌐 **Sitio oficial:** https://indiciumsignals.com

## Estructura del Proyecto

### Ramas

- **`main`**: Código React/Vite (preservado, no desplegado)
- **`static-landing`**: HTML estático (DESPLEGADO a producción) ← **ESTA RAMA**

### Stack (static-landing)

- HTML/CSS vanilla
- JavaScript nativo (API fetch)
- Cloudflare Pages
- Deploy automático on push

### Archivos

- `index.html`: Landing page completa
- `build.sh`: Script condicional para Cloudflare
- `README.md`: Este archivo

## Deploy

**Cloudflare Pages está configurado para:**
- **Production branch:** `static-landing`
- **Build command:** `bash build.sh`
- **Build output directory:** `/`

Cualquier push a `static-landing` despliega automáticamente.

## Pendientes (Roadmap)

### Fase 2: API Integration
- [ ] Conectar endpoint: `https://indicium-signals-api.ob-acc23.workers.dev/api/v1/signals/top5`
- [ ] Reemplazar mock data con datos reales
- [ ] Actualización automática cada 3AM CT

### Fase Videos
- [ ] Subir videos a YouTube
- [ ] Actualizar placeholders con URLs reales

## Datos Mock Actuales

Tabla Top 5 tiene datos estáticos:
- SEB (Seaboard Corp)
- DVAX (Dynavax Technologies)
- INVX (Innovex International)
- KE (Kimball Electronics)
- ECPG (Encore Capital Group)

Estos serán reemplazados por API en Fase 2.

---

**Última actualización:** Diciembre 2024
**Código Trinity:** Graham · Lynch · O'Neil

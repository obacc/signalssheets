# 📈 SignalSheets

> **Investment signals dashboard powered by the Trinity Method**
> Combining the legendary investment strategies of Peter Lynch, William O'Neill, and Benjamin Graham

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff?logo=vite)](https://vitejs.dev/)
[![BigQuery](https://img.shields.io/badge/BigQuery-Connected-4285F4?logo=google-cloud)](https://cloud.google.com/bigquery)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## 🎯 ¿Qué es SignalSheets?

SignalSheets es un dashboard inteligente que proporciona **señales de inversión** basadas en el **Trinity Method**: una metodología propietaria que combina las estrategias de inversión más exitosas de la historia:

- 🦅 **Peter Lynch**: Growth investing y stock picking
- 🚀 **William O'Neill**: Momentum y CANSLIM method
- 💎 **Benjamin Graham**: Value investing y análisis fundamental

### ✨ Características Principales

- ✅ **Señales en Tiempo Real**: Datos actualizados de 4,000+ acciones
- ✅ **Trinity Scoring**: Sistema propietario de puntuación que combina 3 metodologías
- ✅ **Top 10 & Top 500**: Rankings diarios por perfil de riesgo
- ✅ **Market Regime Indicator**: Análisis del régimen de mercado
- ✅ **Watchlist Personalizada**: Seguimiento de acciones favoritas
- ✅ **Análisis Fundamental**: Métricas financieras y valoración
- ✅ **Responsive Design**: Funciona en desktop, tablet y móvil

---

## 🚀 Quick Start

### Prerequisitos

- Node.js 20+ (recomendado: Node 20 LTS)
- npm 10+
- Python 3.11+ (para BigQuery utilities)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/YOUR_USERNAME/signalsheets.git
cd signalsheets

# 2. Instalar dependencias
npm install

# 3. Instalar dependencias de Python (opcional, para BigQuery)
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 5. Iniciar servidor de desarrollo
npm run dev

# 6. Abrir en el navegador
# http://localhost:5173
```

### Configuración Rápida

```bash
# .env.local
VITE_API_URL=http://localhost:8000
VITE_ENABLE_MOCK_DATA=true  # false para datos reales de BigQuery
```

---

## 📦 Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **React** | 19.1.1 | UI Framework |
| **TypeScript** | 5.9.3 | Type safety |
| **Vite** | 7.1.7 | Build tool + HMR |
| **React Router** | 7.9.4 | Client-side routing |
| **TanStack Query** | 5.90.5 | Data fetching & caching |
| **Zustand** | 5.0.8 | Global state management |
| **Tailwind CSS** | 3.4.18 | Utility-first CSS |
| **Recharts** | 3.3.0 | Data visualization |
| **Lightweight Charts** | 5.0.9 | Financial charts |

### Backend / Data

| Tecnología | Propósito |
|-----------|-----------|
| **Google BigQuery** | Data warehouse (100M+ records) |
| **Python 3.11** | BigQuery utilities & data processing |
| **FastAPI** (planned) | Backend API |

### Infraestructura (Planeada)

- **Frontend Hosting**: Vercel / Netlify
- **Backend Hosting**: Google Cloud Run
- **Database**: BigQuery
- **Monitoring**: Sentry
- **Analytics**: PostHog

---

## 🏗️ Arquitectura del Proyecto

```
signalsheets/
├── src/
│   ├── pages/              # Páginas principales (9 rutas)
│   │   ├── Landing.tsx         # Landing page
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Top500.tsx          # Top 500 signals
│   │   ├── DailyTop10.tsx      # Daily top 10
│   │   ├── MarketRegime.tsx    # Market analysis
│   │   ├── Watchlist.tsx       # User watchlist
│   │   ├── Pricing.tsx         # Pricing plans
│   │   └── Auth.tsx            # Login/Register
│   │
│   ├── components/         # Componentes reutilizables
│   │   ├── ui/                 # UI components
│   │   ├── dashboard/          # Dashboard-specific
│   │   ├── charts/             # Data visualization
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   ├── brand/              # Branding components
│   │   ├── auth/               # Auth forms
│   │   └── landing/            # Landing sections
│   │
│   ├── hooks/              # Custom React hooks
│   │   └── useSignals.ts       # Signals data fetcher
│   │
│   ├── store/              # Zustand stores
│   │   ├── watchlistStore.ts   # Watchlist state
│   │   └── authStore.ts        # Auth state
│   │
│   ├── contexts/           # React Context
│   │   └── AuthContext.tsx     # Auth context provider
│   │
│   ├── types/              # TypeScript definitions
│   │   └── index.ts            # All type definitions (325 lines)
│   │
│   ├── utils/              # Utilities
│   │   ├── mockData.ts         # Mock signals data
│   │   └── mockMarketRegime.ts # Mock market data
│   │
│   └── lib/                # External libraries config
│
├── public/                 # Static assets
│
├── bigquery_utils.py       # BigQuery integration utilities
├── test_bigquery_connection.py
├── check_schemas.py
│
└── docs/                   # Documentation
    ├── PROJECT_AUDIT_REPORT.md
    ├── CODEBASE_ANALYSIS.md
    ├── BIGQUERY_README.md
    └── REPOSITORY_SETUP_GUIDE.md
```

---

## 📚 Documentación

### Para Desarrolladores

- **[📊 Project Audit Report](PROJECT_AUDIT_REPORT.md)** - Auditoría completa del proyecto
- **[🔍 Codebase Analysis](CODEBASE_ANALYSIS.md)** - Análisis detallado de la arquitectura
- **[🗄️ BigQuery Integration](BIGQUERY_README.md)** - Guía de integración con BigQuery
- **[🏗️ Repository Setup Guide](REPOSITORY_SETUP_GUIDE.md)** - Configuración de repositorio GitHub

### API Documentation (Planeada)

- **[API Reference](docs/API.md)** - Endpoints y schemas
- **[Data Models](docs/DATA_MODELS.md)** - Estructuras de datos

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo (puerto 5173)
npm run dev -- --port 3000  # Iniciar en puerto personalizado

# Build
npm run build            # Build de producción (TypeScript check + Vite build)
npm run preview          # Preview del build de producción

# Linting y formateo
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Auto-fix ESLint issues

# Testing (próximamente)
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Test coverage report

# BigQuery utilities (Python)
python3 test_bigquery_connection.py  # Test BigQuery connection
python3 check_schemas.py             # Check table schemas
python3 bigquery_utils.py            # Run BigQuery utilities
```

---

## 🗄️ Integración con BigQuery

### Estado Actual

- ✅ **Conexión establecida** a BigQuery
- ✅ **Service Account configurado** (`claudecode-939@sunny-advantage-471523-b3.iam.gserviceaccount.com`)
- ✅ **Acceso a 5 datasets** (173 tablas, 100M+ registros)
- ✅ **Python utilities** disponibles (`bigquery_utils.py`)
- ⚠️ **Frontend usando mock data** (listo para integración)

### Datasets Disponibles

| Dataset | Tablas | Registros | Uso |
|---------|--------|-----------|-----|
| `market_data` | 89 | 50M+ | **Principal**: Señales, precios, market regime |
| `analytics` | 58 | 20K+ | Trinity scores, sectores, configuración |
| `sec_fundamentals` | 22 | 40M+ | Datos fundamentales SEC |
| `cloudflare_logs` | 1 | - | Logs de aplicación |
| `staging_market_data` | 3 | - | Data staging |

### Ejemplo de Uso

```python
from bigquery_utils import BigQueryClient, get_latest_signals

# Inicializar cliente
bq = BigQueryClient()

# Obtener señales
signals = get_latest_signals(bq, limit=100)
print(f"Found {len(signals)} signals")

# Consulta SQL directa
results = bq.query("""
  SELECT ticker, signal, strength, close_price
  FROM `sunny-advantage-471523-b3.market_data.signals_eod_current_filtered`
  WHERE signal = 'BUY' AND strength > 0.7
  ORDER BY strength DESC
  LIMIT 20
""")
```

Ver **[BIGQUERY_README.md](BIGQUERY_README.md)** para documentación completa.

---

## 🧪 Testing

```bash
# Unit tests (próximamente)
npm run test

# E2E tests (próximamente)
npm run test:e2e

# Coverage report
npm run test:coverage
```

**Estado actual**: 0% coverage (en progreso)

---

## 🚀 Deployment

### Frontend (Vercel - Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# O vía GitHub integration
# Push a main → Auto-deploy
```

### Backend API (Google Cloud Run - Planeado)

```bash
# 1. Build container
docker build -t signalsheets-api .

# 2. Deploy to Cloud Run
gcloud run deploy signalsheets-api \
  --image signalsheets-api \
  --platform managed \
  --region us-central1
```

Ver **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** para guía completa.

---

## 🤝 Contributing

Actualmente este es un proyecto privado. Si eres colaborador:

1. **Fork** el repositorio
2. **Crea** una branch para tu feature (`git checkout -b feature/amazing-feature`)
3. **Commit** tus cambios (`git commit -m 'Add amazing feature'`)
4. **Push** a la branch (`git push origin feature/amazing-feature`)
5. **Abre** un Pull Request

Ver **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** para lineamientos detallados.

---

## 🔒 Seguridad

### Vulnerabilidades Conocidas

- ⚠️ **Vite 7.1.7**: Vulnerabilidad moderada (path traversal)
  - **Fix**: `npm update vite@latest`

### Reportar Vulnerabilidades

**NO** crear issues públicos para vulnerabilidades de seguridad.

En su lugar, enviar email a: **security@yourdomain.com**

Ver **[SECURITY.md](SECURITY.md)** para más información.

---

## 📄 Licencia

**Proprietary** - © 2025 SignalSheets

Este software es propietario. El uso, copia, modificación o distribución no autorizados están estrictamente prohibidos.

Ver **[LICENSE](LICENSE)** para más detalles.

---

## 👥 Team

- **Lead Developer**: [Your Name]
- **Data Engineer**: [Name]
- **Product Manager**: [Name]

---

## 📞 Contacto

- **Website**: https://signalsheets.com (próximamente)
- **Email**: contact@signalsheets.com
- **Twitter**: [@signalsheets](https://twitter.com/signalsheets)
- **LinkedIn**: [SignalSheets](https://linkedin.com/company/signalsheets)

---

## 🙏 Agradecimientos

- **Peter Lynch** - Por "One Up on Wall Street"
- **William O'Neill** - Por el método CANSLIM
- **Benjamin Graham** - Por "The Intelligent Investor"
- **Google Cloud** - Por BigQuery infrastructure
- **React Team** - Por un framework increíble

---

## 📊 Project Stats

![GitHub repo size](https://img.shields.io/github/repo-size/USER/signalsheets)
![GitHub language count](https://img.shields.io/github/languages/count/USER/signalsheets)
![GitHub top language](https://img.shields.io/github/languages/top/USER/signalsheets)
![GitHub last commit](https://img.shields.io/github/last-commit/USER/signalsheets)

---

<p align="center">
  Made with ❤️ and ☕ by the SignalSheets team
</p>

<p align="center">
  <strong>⭐ Star us on GitHub — it helps!</strong>
</p>

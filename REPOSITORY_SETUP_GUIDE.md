# GitHub Repository Setup Guide - SignalSheets

Este documento describe cómo crear y configurar el repositorio privado de GitHub para SignalSheets siguiendo las mejores prácticas de la industria.

---

## 📋 Tabla de Contenidos

1. [Creación del Repositorio](#1-creación-del-repositorio)
2. [Configuración de Seguridad](#2-configuración-de-seguridad)
3. [Estructura de Branches](#3-estructura-de-branches)
4. [Protección de Branches](#4-protección-de-branches)
5. [GitHub Actions / CI/CD](#5-github-actions--cicd)
6. [Secrets y Variables de Entorno](#6-secrets-y-variables-de-entorno)
7. [Issues y Project Management](#7-issues-y-project-management)
8. [Documentación Requerida](#8-documentación-requerida)
9. [Colaboradores y Permisos](#9-colaboradores-y-permisos)

---

## 1. Creación del Repositorio

### Opción A: Vía GitHub Web Interface

1. **Ir a GitHub**: https://github.com/new
2. **Configuración básica**:
   - **Repository name**: `signalsheets`
   - **Description**: `Investment signals dashboard powered by Trinity Method (Lynch, O'Neill, Graham) - Connected to BigQuery`
   - **Visibility**: ✅ **Private**
   - **Initialize repository**: NO (ya tenemos código)

3. **Click "Create repository"**

### Opción B: Vía GitHub CLI

```bash
# Instalar GitHub CLI si no está instalado
# https://cli.github.com/

# Crear repositorio privado
gh repo create signalsheets \
  --private \
  --description "Investment signals dashboard powered by Trinity Method" \
  --source=. \
  --remote=origin

# Push del código existente
git push -u origin main
```

### Migrar desde el repositorio actual

```bash
# Si ya tienes un repositorio existente
cd /home/user/signalssheets

# Verificar remote actual
git remote -v

# Cambiar a nuevo repositorio (reemplazar con tu nuevo repo)
git remote set-url origin https://github.com/YOUR_USERNAME/signalsheets.git

# O agregar nuevo remote
git remote add production https://github.com/YOUR_USERNAME/signalsheets.git

# Push a nuevo repositorio
git push -u production main
git push production --all  # Push all branches
git push production --tags  # Push all tags
```

---

## 2. Configuración de Seguridad

### 2.1 Security Policy

Crear archivo `.github/SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**DO NOT** create public issues for security vulnerabilities.

Instead, email: security@yourdomain.com

Expected response time: 48 hours
```

### 2.2 Dependabot Configuration

Crear archivo `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Frontend dependencies (npm)
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "YOUR_USERNAME"
    assignees:
      - "YOUR_USERNAME"
    labels:
      - "dependencies"
      - "frontend"

  # Python dependencies
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "YOUR_USERNAME"
    labels:
      - "dependencies"
      - "python"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 2.3 Code Scanning

1. Ir a: **Settings → Code security and analysis**
2. Activar:
   - ✅ **Dependency graph**
   - ✅ **Dependabot alerts**
   - ✅ **Dependabot security updates**
   - ✅ **Code scanning** (CodeQL)
   - ✅ **Secret scanning**

---

## 3. Estructura de Branches

### Branch Strategy: Git Flow

```
main (production)
  ├── develop (integration)
  │   ├── feature/bigquery-integration
  │   ├── feature/user-authentication
  │   ├── feature/real-time-alerts
  │   └── feature/mobile-responsive
  ├── release/v1.0.0
  ├── release/v1.1.0
  └── hotfix/critical-bug-fix
```

### Nomenclatura de Branches

| Tipo | Prefijo | Ejemplo | Uso |
|------|---------|---------|-----|
| Feature | `feature/` | `feature/bigquery-api` | Nuevas características |
| Bugfix | `bugfix/` | `bugfix/login-error` | Corrección de bugs |
| Hotfix | `hotfix/` | `hotfix/security-patch` | Correcciones urgentes |
| Release | `release/` | `release/v1.0.0` | Preparación de releases |
| Docs | `docs/` | `docs/api-documentation` | Solo documentación |
| Refactor | `refactor/` | `refactor/auth-module` | Refactorización de código |

### Configurar Branches

```bash
# Crear branch develop
git checkout -b develop
git push -u origin develop

# Establecer develop como default branch en GitHub
# Settings → Branches → Default branch → develop
```

---

## 4. Protección de Branches

### 4.1 Proteger Branch `main`

**Settings → Branches → Add branch protection rule**

```yaml
Branch name pattern: main

✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale pull request approvals when new commits are pushed
  ✅ Require review from Code Owners

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  Status checks:
    - build
    - test
    - lint

✅ Require conversation resolution before merging

✅ Require linear history

✅ Include administrators (opcional para proyectos pequeños)

❌ Allow force pushes

❌ Allow deletions
```

### 4.2 Proteger Branch `develop`

Configuración similar a `main` pero más permisiva:

```yaml
Branch name pattern: develop

✅ Require a pull request before merging
  ✅ Require approvals: 1

✅ Require status checks to pass before merging
  Status checks:
    - build
    - test

❌ Require linear history (allow merge commits)

❌ Include administrators
```

---

## 5. GitHub Actions / CI/CD

### 5.1 Frontend CI Pipeline

Crear archivo `.github/workflows/frontend-ci.yml`:

```yaml
name: Frontend CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
        env:
          CI: true

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --audit-level=moderate
```

### 5.2 Python Backend CI

Crear archivo `.github/workflows/backend-ci.yml`:

```yaml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths:
      - '**.py'
      - 'requirements.txt'
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Test Python
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov black flake8
      - name: Lint with flake8
        run: flake8 . --max-line-length=120
      - name: Format check with black
        run: black --check .
      - name: Run tests
        run: pytest --cov=. --cov-report=xml
```

### 5.3 Deployment Workflow

Crear archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy-frontend:
    name: Deploy Frontend to Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    name: Deploy Backend to Cloud Run
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy signalsheets-api \
            --source . \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated
```

---

## 6. Secrets y Variables de Entorno

### 6.1 Configurar Secrets

**Settings → Secrets and variables → Actions → New repository secret**

#### Secrets Requeridos

| Secret Name | Descripción | Dónde obtenerlo |
|-------------|-------------|-----------------|
| `GCP_SA_KEY` | Service account JSON | Google Cloud Console |
| `VERCEL_TOKEN` | Vercel deploy token | Vercel Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel org ID | Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel project settings |
| `SENDGRID_API_KEY` | Email API key | SendGrid Dashboard |
| `SENTRY_DSN` | Error tracking | Sentry project settings |

#### Agregar Secret vía CLI

```bash
# Usando GitHub CLI
gh secret set GCP_SA_KEY < .config/gcp/credentials.json

# O manualmente en la web
# Settings → Secrets → New repository secret
```

### 6.2 Variables de Entorno

**Settings → Secrets and variables → Actions → Variables**

| Variable Name | Value | Uso |
|--------------|-------|-----|
| `VITE_API_URL` | `https://api.signalsheets.com` | API endpoint |
| `NODE_VERSION` | `20` | Node.js version |
| `PYTHON_VERSION` | `3.11` | Python version |

---

## 7. Issues y Project Management

### 7.1 Issue Templates

Crear carpeta `.github/ISSUE_TEMPLATE/`

#### Bug Report (`bug_report.md`)

```markdown
---
name: Bug Report
about: Reporte de error o comportamiento inesperado
title: '[BUG] '
labels: bug
assignees: ''
---

## 🐛 Descripción del Bug
<!-- Descripción clara del problema -->

## 🔄 Pasos para Reproducir
1. Ir a '...'
2. Click en '...'
3. Ver error

## ✅ Comportamiento Esperado
<!-- Qué debería pasar -->

## ❌ Comportamiento Actual
<!-- Qué está pasando -->

## 📸 Screenshots
<!-- Si aplica -->

## 🖥️ Entorno
- Browser: [e.g. Chrome 120]
- OS: [e.g. macOS 14]
- Version: [e.g. 1.2.0]
```

#### Feature Request (`feature_request.md`)

```markdown
---
name: Feature Request
about: Sugerencia de nueva funcionalidad
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## 💡 Descripción de la Funcionalidad
<!-- ¿Qué quieres que se agregue? -->

## 🎯 Problema que Resuelve
<!-- ¿Qué problema resuelve esta funcionalidad? -->

## 📋 Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2

## 🎨 Mockups / Wireframes
<!-- Si aplica -->
```

### 7.2 Pull Request Template

Crear archivo `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## 📝 Descripción
<!-- ¿Qué cambios incluye este PR? -->

## 🔗 Issue Relacionado
Closes #[issue number]

## 🧪 Tipo de Cambio
- [ ] 🐛 Bug fix (non-breaking change)
- [ ] ✨ New feature (non-breaking change)
- [ ] 💥 Breaking change
- [ ] 📝 Documentation update
- [ ] ♻️ Code refactoring

## ✅ Checklist
- [ ] El código sigue el style guide del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Tests nuevos y existentes pasan localmente

## 📸 Screenshots / Videos
<!-- Si aplica -->

## 🧪 Testing
<!-- ¿Cómo se probó? -->
```

### 7.3 GitHub Projects

1. **Crear Project Board**: Projects → New project
2. **Template**: Team backlog
3. **Views**:
   - 📋 Backlog
   - 🚧 In Progress
   - 👀 In Review
   - ✅ Done

---

## 8. Documentación Requerida

### 8.1 README Principal

Ya existe `README.md`, pero actualizarlo con:

```markdown
# SignalSheets

> Investment signals dashboard powered by the Trinity Method

[![CI](https://github.com/USER/signalsheets/workflows/Frontend%20CI/badge.svg)](https://github.com/USER/signalsheets/actions)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Code Coverage](https://codecov.io/gh/USER/signalsheets/branch/main/graph/badge.svg)](https://codecov.io/gh/USER/signalsheets)

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development server
npm run dev
\`\`\`

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guide](CONTRIBUTING.md)

## 🔐 Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## 📄 License

Proprietary - © 2025 SignalSheets
```

### 8.2 Documentos Adicionales

Crear carpeta `docs/`:

```
docs/
├── API.md                  # API endpoints documentation
├── ARCHITECTURE.md         # System architecture
├── DEPLOYMENT.md          # Deployment procedures
├── CONTRIBUTING.md        # Contribution guidelines
├── CODE_OF_CONDUCT.md    # Code of conduct
└── CHANGELOG.md          # Version history
```

---

## 9. Colaboradores y Permisos

### 9.1 Niveles de Acceso

| Rol | Permiso | Puede | No puede |
|-----|---------|-------|----------|
| **Admin** | Write + Admin | Todo | - |
| **Maintainer** | Write | Push, merge PRs, manage issues | Delete repo, change settings |
| **Developer** | Write | Push branches, create PRs | Merge to main, manage settings |
| **Contributor** | Triage | Create issues, comment | Push code |
| **Viewer** | Read | Ver código | Nada más |

### 9.2 Agregar Colaboradores

```bash
# Via GitHub CLI
gh repo add-collaborator USERNAME --permission=write

# O en la web
# Settings → Collaborators → Add people
```

### 9.3 CODEOWNERS

Crear archivo `.github/CODEOWNERS`:

```
# Default owners for everything
* @YOUR_USERNAME

# Frontend code
/src/** @frontend-team
*.tsx @frontend-team
*.ts @frontend-team

# Backend code
*.py @backend-team
/api/** @backend-team

# BigQuery & data
bigquery_utils.py @data-team
/sql/** @data-team

# Documentation
*.md @docs-team
/docs/** @docs-team

# CI/CD
/.github/** @devops-team
```

---

## 🚀 Checklist de Setup Completo

### Inicial
- [ ] Repositorio creado (privado)
- [ ] Código migrado
- [ ] README.md actualizado
- [ ] .gitignore configurado
- [ ] LICENSE agregado

### Seguridad
- [ ] Dependabot configurado
- [ ] Code scanning activado
- [ ] Secret scanning activado
- [ ] SECURITY.md creado
- [ ] Secrets configurados

### Branches
- [ ] Branch `develop` creado
- [ ] Branch protection en `main`
- [ ] Branch protection en `develop`
- [ ] Default branch configurado

### CI/CD
- [ ] GitHub Actions configurado
- [ ] Frontend CI workflow
- [ ] Backend CI workflow
- [ ] Deployment workflow
- [ ] Secrets de deploy configurados

### Issues & PRs
- [ ] Issue templates creados
- [ ] PR template creado
- [ ] Labels configurados
- [ ] Projects board creado

### Documentación
- [ ] docs/ folder creado
- [ ] API.md
- [ ] ARCHITECTURE.md
- [ ] CONTRIBUTING.md
- [ ] CHANGELOG.md

### Team
- [ ] Colaboradores agregados
- [ ] CODEOWNERS configurado
- [ ] Roles asignados

---

## 📞 Próximos Pasos

1. **Revisar este documento**
2. **Crear el repositorio siguiendo los pasos**
3. **Configurar secrets y variables**
4. **Hacer push del código**
5. **Verificar que CI/CD funcione**
6. **Invitar colaboradores**
7. **Crear primer issue/proyecto**

---

**Documento creado:** 2025-10-28
**Mantenido por:** Claude Code
**Versión:** 1.0


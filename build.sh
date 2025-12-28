#!/bin/bash

# Build script para Cloudflare Pages
# static-landing: HTML estático (sin build)
# main: React/Vite (con build)

if [ "$CF_PAGES_BRANCH" == "static-landing" ]; then
  echo "✨ Rama static-landing detectada"
  echo "📄 Archivos HTML estáticos - sin compilación necesaria"
  
  # Crear directorio dist y copiar archivos HTML
  mkdir -p dist
  cp *.html dist/ 2>/dev/null || true
  
  echo "✅ Archivos HTML copiados a dist/"
  exit 0
else
  echo "🔨 Compilando React/Vite..."
  npm run build
fi


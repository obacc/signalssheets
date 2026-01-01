#!/bin/bash

# Build script para Cloudflare Pages
# static-landing: HTML estático (sin build)
# main: React/Vite (con build)

if [ "$CF_PAGES_BRANCH" == "static-landing" ]; then
  echo "✨ Rama static-landing detectada"
  echo "📄 Archivos HTML estáticos - sin compilación necesaria"
  
  # Crear directorio dist y copiar archivos estáticos
  mkdir -p dist
  
  # Copiar archivos HTML
  cp *.html dist/ 2>/dev/null || true
  
  # Copiar archivos de favicon y assets estáticos
  cp *.ico dist/ 2>/dev/null || true
  cp *.png dist/ 2>/dev/null || true
  cp *.webmanifest dist/ 2>/dev/null || true
  
  echo "✅ Archivos estáticos copiados a dist/"
  exit 0
else
  echo "🔨 Compilando React/Vite..."
  npm run build
fi


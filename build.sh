#!/bin/bash

# Script condicional para Cloudflare Pages
# Detecta rama y ejecuta build apropiado

echo "🔍 Detectando rama: $CF_PAGES_BRANCH"

if [ "$CF_PAGES_BRANCH" == "main" ]; then
  echo "📦 Rama main detectada - Ejecutando build React/Vite"
  npm run build

elif [ "$CF_PAGES_BRANCH" == "static-landing" ]; then
  echo "✨ Rama static-landing detectada - HTML estático (sin build)"
  echo "Usando index.html directamente"
  exit 0

else
  echo "⏭️ Rama preview - Skip build"
  exit 0
fi

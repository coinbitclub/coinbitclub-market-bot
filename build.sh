#!/bin/bash
set -e
echo "🔧 Iniciando build customizado..."
echo "📦 Removendo package-lock.json..."
rm -f package-lock.json
echo "⬇️ Instalando dependências..."
npm install --no-package-lock --production
echo "✅ Build concluído com sucesso!"
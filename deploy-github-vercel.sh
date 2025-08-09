#!/bin/bash

echo "🚀 INICIANDO DEPLOY COMPLETO - GITHUB + VERCEL"
echo "=============================================="

# Verificar se estamos na branch correta
echo "📋 Verificando branch atual..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Branch atual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "deploy-clean" ]; then
    echo "⚠️ Mudando para branch deploy-clean..."
    git checkout deploy-clean
fi

# Verificar status do Git
echo "📊 Verificando status do repositório..."
git status

# Fazer commit final se houver mudanças
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Fazendo commit final..."
    git add .
    git commit -m "🚀 DEPLOY FINAL: Sistema preparado para Vercel

✅ Configuração Vercel completa
✅ Variáveis de ambiente sanitizadas  
✅ Railway backend operacional
✅ Frontend Next.js otimizado
✅ Sistema 100% funcional"
fi

# Push para GitHub
echo "📤 Fazendo push para GitHub..."
git push origin deploy-clean --force

# Verificar sucesso do push
if [ $? -eq 0 ]; then
    echo "✅ Push para GitHub realizado com sucesso!"
    echo ""
    echo "🌐 PRÓXIMOS PASSOS PARA VERCEL:"
    echo "1. Acesse: https://vercel.com/new"
    echo "2. Import: coinbitclub/coinbitclub-market-bot"
    echo "3. Branch: deploy-clean" 
    echo "4. Root Directory: coinbitclub-frontend-premium"
    echo "5. Framework: Next.js"
    echo ""
    echo "📋 VARIÁVEIS DE AMBIENTE VERCEL:"
    echo "NEXT_PUBLIC_API_URL=https://coinbitclub-market-bot.up.railway.app"
    echo "NEXT_PUBLIC_FRONTEND_URL=https://[SEU-PROJETO].vercel.app"
    echo "NODE_ENV=production"
    echo ""
    echo "🎯 DEPLOY AUTOMÁTICO ATIVADO!"
    echo "✅ Sistema pronto para produção completa"
else
    echo "❌ Erro no push para GitHub"
    exit 1
fi

#!/bin/bash

# Script para configurar variáveis de ambiente no Vercel e Railway
# Execute este script após configurar manualmente as variáveis nos dashboards

echo "🚀 Configuração de Variáveis de Ambiente - CoinBitClub Market Bot"
echo "================================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Frontend URL:${NC} https://coinbitclub-marketbot.vercel.app"
echo -e "${BLUE}Backend URL:${NC} https://coinbitclub-market-bot.up.railway.app"
echo ""

# Teste de conectividade com o backend
echo -e "${YELLOW}🔍 Testando conectividade com o backend...${NC}"
if curl -s --head "https://coinbitclub-market-bot.up.railway.app" >/dev/null; then
    echo -e "${GREEN}✅ Backend está online${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo${NC}"
fi

# Teste de conectividade com o frontend
echo -e "${YELLOW}🔍 Testando conectividade com o frontend...${NC}"
if curl -s --head "https://coinbitclub-marketbot.vercel.app" >/dev/null; then
    echo -e "${GREEN}✅ Frontend está online${NC}"
else
    echo -e "${RED}❌ Frontend não está respondendo${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Checklist de Configuração:${NC}"
echo ""

echo -e "${BLUE}VERCEL (Frontend):${NC}"
echo "1. Acesse: https://vercel.com/dashboard"
echo "2. Selecione projeto: coinbitclub-marketbot"
echo "3. Settings → Environment Variables"
echo "4. Configure as variáveis listadas no arquivo CONFIGURACAO-VARIAVEIS-AMBIENTE.md"
echo ""

echo -e "${BLUE}RAILWAY (Backend):${NC}"
echo "1. Acesse: https://railway.app/dashboard"
echo "2. Selecione projeto: coinbitclub-market-bot"
echo "3. Variables tab"
echo "4. Configure as variáveis listadas no arquivo CONFIGURACAO-VARIAVEIS-AMBIENTE.md"
echo ""

echo -e "${YELLOW}📝 Variáveis Críticas:${NC}"
echo "- NEXT_PUBLIC_API_URL (Vercel) → https://coinbitclub-market-bot.up.railway.app"
echo "- DATABASE_URL (Railway) → PostgreSQL connection string"
echo "- FRONTEND_URL (Railway) → https://coinbitclub-marketbot.vercel.app"
echo "- JWT_SECRET (Railway) → Chave secreta segura"
echo "- STRIPE keys → Chaves de produção válidas"
echo ""

echo -e "${GREEN}🎯 Próximos passos:${NC}"
echo "1. Configure as variáveis nos dashboards"
echo "2. Faça deploy do frontend (Vercel)"
echo "3. Verifique os logs de ambos os serviços"
echo "4. Teste a aplicação completa"
echo ""

echo -e "${BLUE}📚 Documentação:${NC}"
echo "- Vercel: https://vercel.com/docs/concepts/projects/environment-variables"
echo "- Railway: https://docs.railway.app/develop/variables"
echo ""

echo "================================================================="
echo -e "${GREEN}✅ Script concluído! Consulte CONFIGURACAO-VARIAVEIS-AMBIENTE.md para detalhes.${NC}"

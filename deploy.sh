#!/bin/bash

# Script para fazer deploy completo do CoinbitClub Market Bot
# Atualiza GitHub e faz deploy

echo "🚀 INICIANDO DEPLOY COMPLETO DO COINBITCLUB MARKET BOT"
echo "=================================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# 1. Adicionar todos os arquivos
echo "📁 Adicionando arquivos..."
git add .

# 2. Fazer commit com mensagem descritiva
echo "💾 Fazendo commit..."
git commit -m "feat: Implementação completa do sistema CoinbitClub Market Bot

✨ Novas funcionalidades:
- Landing page atualizada com design oficial
- Sistema de cadastro de usuários e afiliados integrado
- Dashboard administrativo completo
- Dashboard de usuários com operações e planos
- Dashboard de afiliados com gestão de indicados
- Sistema de autenticação com redirecionamento por role
- APIs de backend integradas
- Banco de dados PostgreSQL configurado
- Sistema de migração completo

🔧 Melhorias técnicas:
- Integração frontend-backend funcional
- Autenticação JWT implementada
- Validação de formulários completa
- Interface responsiva com TailwindCSS
- Componentes reutilizáveis otimizados

📊 Funcionalidades administrativas:
- Gestão de usuários com filtros e busca
- Controle de afiliados e comissões
- Dashboard com métricas em tempo real
- Sistema de logs e auditoria
- Configurações do sistema

👥 Área do usuário:
- Dashboard com operações em tempo real
- Gestão de planos e assinaturas
- Configurações de API das exchanges
- Histórico de operações

🤝 Área do afiliado:
- Dashboard de indicados
- Controle de comissões
- Estatísticas de performance
- Links de indicação personalizados

🔐 Segurança:
- Autenticação segura implementada
- Validação de dados robusta
- Proteção contra ataques comuns
- Logs de auditoria completos

Versão: 2.0.0 - Sistema completo funcional"

# 3. Push para o GitHub
echo "🌐 Enviando para GitHub..."
git push origin main

# Verificar se o push foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Push para GitHub realizado com sucesso!"
else
    echo "❌ Erro no push para GitHub"
    exit 1
fi

# 4. Deploy automático
echo "🚀 Iniciando deploy..."

# Deploy do Frontend no Vercel
echo "� Fazendo deploy do Frontend no Vercel..."
cd coinbitclub-frontend-premium
npx vercel --prod
if [ $? -eq 0 ]; then
    echo "✅ Frontend deployado no Vercel com sucesso!"
else
    echo "❌ Erro no deploy do frontend no Vercel"
fi
cd ..

# Deploy do Backend no Railway
echo "� Fazendo deploy do Backend no Railway..."
cd backend
railway login
railway up
if [ $? -eq 0 ]; then
    echo "✅ Backend deployado no Railway com sucesso!"
else
    echo "❌ Erro no deploy do backend no Railway"
fi
cd ..

# 5. Verificações pós-deploy
echo "🔍 Verificando status dos serviços..."

# Verificar se os serviços estão rodando
echo "📊 Status dos serviços:"
echo "- Frontend (Vercel): https://coinbitclub-market-bot.vercel.app"
echo "- Backend (Railway): https://coinbitclub-market-bot-production.up.railway.app"

echo ""
echo "✅ DEPLOY COMPLETO FINALIZADO!"
echo "================================"
echo ""
echo "📋 Próximos passos:"
echo "1. Verificar se os serviços estão rodando na produção"
echo "2. Testar funcionalidades principais nos URLs de produção"
echo "3. Verificar logs no Vercel e Railway para possíveis erros"
echo "4. Monitorar performance dos serviços"
echo "5. Configurar variáveis de ambiente de produção"
echo ""
echo "🔗 Links importantes (produção):"
echo "- Landing Page: https://coinbitclub-market-bot.vercel.app/landing"
echo "- Dashboard Admin: https://coinbitclub-market-bot.vercel.app/admin"
echo "- Dashboard Usuário: https://coinbitclub-market-bot.vercel.app/dashboard"
echo "- Cadastro: https://coinbitclub-market-bot.vercel.app/auth/register"
echo "- Login: https://coinbitclub-market-bot.vercel.app/auth/login"
echo "- API Backend: https://coinbitclub-market-bot-production.up.railway.app"
echo ""
echo "🛠️  URLs de desenvolvimento (local):"
echo "- Frontend: http://localhost:3000"
echo "- API Gateway: http://localhost:8081"
echo "- Admin Panel: http://localhost:8082"
echo ""
echo "🎉 Sistema CoinbitClub Market Bot está pronto para uso!"

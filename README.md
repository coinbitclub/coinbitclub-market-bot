# CoinbitClub Market Bot

Automação avançada de operações de trade e geração de relatórios inteligentes via IA.  
Plataforma robusta para execução de ordens (Bybit/Binance), coleta de dados em tempo real, processamento de sinais (TradingView, CoinStats) e dashboard de controle com alertas automáticos (WhatsApp, e-mail).

---

## 🚀 **Visão Geral**

Este projeto oferece:
- Execução automatizada de trades em exchanges (Bybit, Binance)
- Sistema de assinatura e controle de permissões
- Coleta e análise de indicadores de mercado, macroeconomia, whale alerts, fear/greed e dominance
- Relatórios automatizados e leitura de mercado por IA (OpenAI)
- Painel administrativo restrito (dashboard) com gestão de usuários, operações, credenciais, e monitoramento de alertas
- Notificações automáticas por WhatsApp (via ZAPI)
- Arquitetura pronta para integração com qualquer front-end (SPA, mobile, etc.)

---

## 📦 **Instalação Rápida**

```bash
git clone https://github.com/seu-repo/coinbitclub-market-bot.git
cd coinbitclub-market-bot
npm install
cp .env.example .env
# Edite .env e preencha todas as variáveis obrigatórias!
npm run dev      # Ou npm start para modo produção

🛠 Principais Endpoints / Rotas
Endpoint	Método	Descrição	Proteção
/webhook/signal	POST	Recebe sinais (TradingView, CoinStats)	Token/JWT
/webhook/dominance	POST	Recebe dados de dominance (BTC.D)	Token/JWT
/api/market	GET	Últimos dados de mercado	Pública
/api/dominance	GET	Último dominance	Pública
/api/fear_greed	GET	Último índice Fear & Greed	Pública
/dashboard	GET	Painel administrativo restrito	Basic Auth
/trading/order	POST	Envia ordem manual de teste/real	JWT + assinatura
/ia/analyze	POST	Geração/análise IA (em desenvolvimento)	Admin/JWT

Veja as demais rotas em /routes/.

👩‍💻 Execução Local & Deploy
Certifique-se de ter Node.js 18+ e um banco PostgreSQL disponível (ex: Railway)

Preencha .env corretamente (veja .env.example)

Rode:
npm run dev (hot reload)
ou
npm start (modo produção)

Acesse http://localhost:8080/ ou endpoint definido

Para deploy, basta rodar o mesmo comando no Railway/Vercel/Render, garantindo as variáveis de ambiente corretas.


🤖 Automação de Jobs
Jobs automáticos (cron) já configurados:

Coleta e salvamento de sinais, dominance, fear/greed, etc.

Geração periódica de relatório IA (“Radar da Águia News”) para dashboard e alertas


📊 Observabilidade & Alertas
Todos os logs centralizados (stdout ou sistema de log desejado)

Alertas automáticos via WhatsApp para eventos críticos (degustação expirada, erro de IA, saldo baixo)

Auditoria de todas as entradas (raw webhooks) para diagnóstico

🧩 Dúvidas Frequentes (FAQ)
O bot não envia ordens. O que faço?

Cheque credenciais no banco, assinaturas e saldo em exchange.

Veja logs no Railway ou na sua VPS.

Não chegam alertas no WhatsApp.

Valide o token da ZAPI, admin phone e status do webhook.

Preciso alterar parâmetros de risco/gerenciamento.

Ajuste as funções nos services (positionService.js, orderManager.js).

Quero expandir para mais exchanges.

Implemente adaptadores em /services e plugue nas rotas de trade.

📑 Licença
Projeto privado/proprietário CoinbitClub — uso restrito à equipe autorizada.



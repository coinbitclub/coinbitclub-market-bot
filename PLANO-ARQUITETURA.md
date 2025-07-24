# Planejamento de Serviços - Arquitetura Preservada

## 🏗️ ARQUITETURA COMPLETA MANTIDA

### Serviços Principais (Todos Preservados)
1. **API Gateway** (porta 8080) - Serviço principal (deploy inicial)
2. **Signal Ingestor** (porta 9001) - Ingestão CoinStats
3. **Signal Processor** (porta 9012) - Processamento de sinais  
4. **Decision Engine** (porta 9011) - IA para decisões
5. **Order Executor** (porta 9013) - Execução de ordens
6. **Accounting** (porta 9010) - Contabilidade
7. **Notifications** (porta 9014) - WhatsApp/Email
8. **Admin Panel** (porta 9015) - Painel administrativo

### Frontend
9. **Next.js Frontend** (porta 3000) - Interface completa

## 🚀 ESTRATÉGIA DE DEPLOY

### FASE 1: API Gateway (ATUAL)
- Deploy do serviço principal no Railway
- Todas as rotas funcionais
- Integração com database
- Endpoints para todos os outros serviços

### FASE 2: Microserviços Individuais
- Cada serviço será deployado separadamente
- Comunicação via RabbitMQ/HTTP
- Load balancer automático

### FASE 3: Frontend
- Deploy do Next.js frontend
- Integração com APIs

## 📝 STATUS DOS SERVIÇOS

✅ **Prontos para Deploy:**
- API Gateway (completo)
- Admin Panel (completo)
- Signal Ingestor (implementado)
- Decision Engine (implementado)
- Order Executor (implementado)
- Notifications (implementado)

⚠️ **Necessitam Configuração:**
- Signal Processor (falta package.json com start script)
- Accounting (falta package.json com start script)

## 🎯 AÇÃO IMEDIATA

1. Deploy API Gateway primeiro (entrada principal)
2. Validar funcionamento completo
3. Deploy incremental dos outros serviços
4. Manter toda arquitetura intacta

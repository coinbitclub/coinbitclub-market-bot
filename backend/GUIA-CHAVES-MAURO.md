# 🔑 GUIA COMPLETO: CONFIGURAÇÃO DE CHAVES API REAIS

## 📋 PARA O USUÁRIO MAURO - BYBIT

### 🎯 PASSO 1: CRIAR CHAVES API NA BYBIT

1. **Acesse a Bybit:**
   - URL: https://www.bybit.com/app/user/api-management
   - Faça login na sua conta

2. **Criar Nova API Key:**
   - Clique em "Create New Key"
   - Nome sugerido: `CoinbitClub-MarketBot`
   - Tipo: `System-generated API Key`

3. **Configurar Permissões:**
   ```
   ✅ Read         - OBRIGATÓRIO (para consultar saldos)
   ✅ Spot Trading - OBRIGATÓRIO (para operações spot)
   ❓ Derivatives  - OPCIONAL (para futuros)
   ❌ Wallet       - NÃO RECOMENDADO (transferências)
   ❌ Options      - NÃO NECESSÁRIO
   ❌ Exchange     - NÃO NECESSÁRIO
   ```

4. **Configurar Segurança:**
   - **IP Restriction:** RECOMENDADO
     - Adicione o IP do seu servidor
     - Para teste local: adicione seu IP residencial
     - Para descobrir seu IP: https://whatismyipaddress.com/
   
   - **Passphrase:** Deixe em branco (não necessário)

5. **Salvar Chaves:**
   - **API Key:** Copie e guarde em local seguro
   - **Secret Key:** Copie e guarde em local seguro
   - ⚠️ **IMPORTANTE:** O Secret só aparece UMA VEZ!

### 🔧 PASSO 2: CONFIGURAR NO SISTEMA

1. **Copie o template:**
   ```bash
   copy .env.keys-test .env.test-mauro
   ```

2. **Edite o arquivo .env.test-mauro:**
   ```env
   # CONFIGURAÇÃO REAL PARA MAURO - BYBIT
   
   # Bybit API (REAL)
   BYBIT_API_KEY=SUA_API_KEY_REAL_AQUI
   BYBIT_API_SECRET=SEU_SECRET_REAL_AQUI
   BYBIT_TESTNET=true  # Para primeiros testes
   
   # Binance API (mantenha como exemplo por enquanto)
   BINANCE_API_KEY=sua_api_key_binance_aqui
   BINANCE_API_SECRET=sua_api_secret_binance_aqui
   BINANCE_TESTNET=true
   
   # OKX API (mantenha como exemplo por enquanto)
   OKX_API_KEY=sua_api_key_okx_aqui
   OKX_API_SECRET=sua_api_secret_okx_aqui
   OKX_API_PASSPHRASE=sua_passphrase_okx_aqui
   OKX_TESTNET=true
   
   # Fear & Greed Index (CoinStats)
   COINSTATS_API_KEY=CSApiKey_pKC6k3gL8QmC7jVkLFYhfrhF2LBxB1c
   
   # Email (Configure depois)
   EMAIL_SERVICE=gmail
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASS=sua_senha_app_gmail
   
   # Stripe (Configure depois)  
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Exemplo real (substitua com suas chaves):**
   ```env
   BYBIT_API_KEY=BKEX23dK9jL4nM6pQ7rS8tU5vW2xY3zA
   BYBIT_API_SECRET=9uT7rQ4pL3nM2kJ1hG6fD8sA5wX9zY2b
   BYBIT_TESTNET=true
   ```

### 🧪 PASSO 3: TESTAR CONFIGURAÇÃO

1. **Teste básico de conectividade:**
   ```bash
   node integrador-exchanges-real.js
   ```

2. **Teste com chaves do Mauro:**
   ```bash
   # Copie primeiro as configurações
   copy .env.test-mauro .env.keys-test
   
   # Execute o teste específico
   node teste-producao-bybit.js
   ```

3. **Resultados esperados:**
   ```json
   {
     "sucesso": true,
     "exchange": "bybit",
     "usuario": "mauro",
     "validacao": {
       "api_key_valida": true,
       "permissoes_corretas": true,
       "conectividade": "OK"
     },
     "conta": {
       "user_id": "12345678",
       "tipo": "SPOT",
       "status": "NORMAL"
     },
     "saldos": {
       "USDT": {
         "disponivel": 0.00,
         "total": 0.00
       }
     }
   }
   ```

### 🛡️ PASSO 4: SEGURANÇA

1. **Configuração de Testnet (Recomendado):**
   - Mantenha `BYBIT_TESTNET=true` inicialmente
   - Teste todas as funcionalidades
   - Só mude para `false` após validação completa

2. **IPs Permitidos:**
   - Servidor de produção: Configure IP fixo
   - Desenvolvimento: Configure IP dinâmico
   - Considere usar VPN para IP fixo

3. **Monitoramento:**
   - Verifique logs de API na Bybit regularmente
   - Configure alertas para tentativas de acesso suspeitas

### 🚀 PASSO 5: PRODUÇÃO

1. **Após testes bem-sucedidos:**
   ```env
   BYBIT_TESTNET=false  # ATIVAR PRODUÇÃO
   ```

2. **Deploy com chaves reais:**
   ```bash
   # Configure produção
   node configurador-producao.js
   
   # Execute deploy
   ./deploy.sh
   ```

3. **Verificação final:**
   ```bash
   # Teste todos os endpoints
   npm run test
   
   # Teste produção específica
   node teste-producao-completo.js
   ```

## 📞 SUPORTE

### Em caso de problemas:

1. **Erro de Autenticação:**
   - Verifique se API Key e Secret estão corretos
   - Confirme se IP está na lista permitida
   - Verifique se permissões estão habilitadas

2. **Erro de Conectividade:**
   - Teste: `node integrador-exchanges-real.js`
   - Verifique conexão com internet
   - Confirme se Bybit não está em manutenção

3. **Erro de Permissões:**
   - Volte à Bybit e verifique permissões
   - Recrie API Key se necessário

### 📞 Contato de Emergência:
- Telegram: @CoinbitClub
- Email: suporte@coinbitclub.com

---

## ✅ CHECKLIST FINAL

- [ ] Chaves API criadas na Bybit
- [ ] Arquivo .env.test-mauro configurado
- [ ] Teste de conectividade executado
- [ ] Teste com chaves reais executado
- [ ] Configuração de segurança validada
- [ ] Sistema pronto para produção

**🎉 MAURO, SEU SISTEMA ESTÁ PRONTO PARA OPERAR!**

# 🎯 INSTRUÇÕES PARA CONFIGURAR IP FIXO NAS EXCHANGES

## IP FIXO RAILWAY
```
132.255.160.140
```

## 🟡 BINANCE

### 1. Acesso às Configurações
1. Faça login em: https://binance.com/
2. Vá para: Profile → API Management
3. Selecione sua API Key ou crie uma nova

### 2. Configurar IP Whitelist
1. Clique em "Edit restrictions" na sua API Key
2. Enable "Restrict access to trusted IPs only"
3. Adicionar IP: `132.255.160.140`
4. Salvar alterações

### 3. Permissões Necessárias
- ✅ Enable Reading
- ✅ Enable Futures (para trading de futuros)
- ✅ Enable Spot & Margin Trading (opcional)

### 4. Testar Configuração
```bash
curl -X GET 'https://api.binance.com/api/v3/ping'
```

---

## 🟣 BYBIT

### 1. Acesso às Configurações
1. Faça login em: https://bybit.com/
2. Vá para: Profile → API Management
3. Selecione sua API Key ou crie uma nova

### 2. Configurar IP Whitelist
1. Clique em "Edit" na sua API Key
2. Enable "IP Restriction"
3. Adicionar IP: `132.255.160.140`
4. Salvar alterações

### 3. Permissões Necessárias
- ✅ Read (consultar dados da conta)
- ✅ Trade (executar ordens)
- ✅ Wallet (consultar saldo)

### 4. Testar Configuração
```bash
curl -X GET 'https://api.bybit.com/v5/market/time'
```

---

## 🚨 PONTOS IMPORTANTES

### Segurança
- ⚠️ Nunca compartilhe suas API keys
- ⚠️ Use apenas o IP 132.255.160.140
- ⚠️ Monitore os logs de acesso

### Timing
- ⏱️ Aguarde até 5 minutos para propagação das configurações
- ⏱️ Teste antes de usar em produção
- ⏱️ Mantenha backup das configurações

### Troubleshooting
- 🔍 Verifique se o IP está exatamente: 132.255.160.140
- 🔍 Confirme que as permissões estão habilitadas
- 🔍 Teste primeiro com pequenos valores

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Binance
- [ ] API Key criada
- [ ] IP 132.255.160.140 adicionado na whitelist
- [ ] Permissões "Reading" e "Futures" habilitadas
- [ ] Teste de conectividade realizado

### Bybit
- [ ] API Key criada
- [ ] IP 132.255.160.140 adicionado na whitelist
- [ ] Permissões "Read", "Trade" e "Wallet" habilitadas
- [ ] Teste de conectividade realizado

### Railway
- [ ] Variáveis de ambiente configuradas
- [ ] IP 132.255.160.140 confirmado
- [ ] Script de teste executado
- [ ] Logs monitorados

---

## 🆘 SUPORTE

Em caso de problemas:
1. Verificar logs do Railway
2. Executar script de teste: `npm run test:exchanges`
3. Verificar configurações nas exchanges
4. Aguardar propagação (até 5 minutos)

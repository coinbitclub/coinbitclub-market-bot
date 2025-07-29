## 🚨 INSTRUÇÕES PARA TESTAR O SISTEMA

### PASSO 1: ABRIR NOVA JANELA POWERSHELL
1. Pressione `Win + R`
2. Digite `powershell` e pressione Enter
3. Execute os comandos abaixo:

### PASSO 2: COMANDOS PARA COPIAR E COLAR

```powershell
# Teste rápido do sistema
$URL = "https://coinbitclub-market-bot.up.railway.app"
Write-Host "Testando sistema em: $URL" -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "$URL/health" -Method GET -TimeoutSec 10
    Write-Host "✅ SISTEMA ONLINE: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ SISTEMA OFFLINE: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste do painel de controle
try {
    $control = Invoke-WebRequest -Uri "$URL/control" -Method GET -TimeoutSec 10
    Write-Host "✅ PAINEL DE CONTROLE: Status $($control.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ PAINEL FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}
```

### PASSO 3: VERIFICAR RESULTADOS

✅ **Se ambos os testes passaram:**
- Sistema V3 está ATIVO
- Acesse: https://coinbitclub-market-bot.up.railway.app/control
- Ative o trading pelo painel

❌ **Se algum teste falhou:**
- Sistema antigo ainda pode estar ativo
- Verificar se BACKEND_URL foi atualizada
- Verificar se todas as variáveis estão corretas

### PASSO 4: ATUALIZAÇÕES OBRIGATÓRIAS NO RAILWAY

No painel do Railway, atualizar estas variáveis:

1. **BACKEND_URL** = `https://coinbitclub-market-bot.up.railway.app`
2. **COINSTATS_API_KEY** = [Obter em https://coinstats.app/api/]
3. **BINANCE_API_KEY** = [Suas chaves reais para trading]
4. **BYBIT_API_KEY** = [Suas chaves reais para trading]

### RESULTADO ESPERADO:
- Health: `{"status":"ok","timestamp":"2025-01-27T...","version":"3.0"}`
- Control: Status 200 com interface do painel

---
**Execute os comandos acima em uma nova janela PowerShell e me informe os resultados!**

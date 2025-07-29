# 🎯 SCRIPTS DISPONÍVEIS PARA DEPLOYMENT

## OPÇÃO 1 - CORREÇÃO SIMPLES
📁 fix-railway-deployment.ps1
- ✅ Atualiza package.json
- ✅ Remove alguns arquivos antigos  
- ✅ Faz git push normal

Comando:
```powershell
.\fix-railway-deployment.ps1
```

## OPÇÃO 2 - LIMPEZA COMPLETA (RECOMENDADA)
📁 force-deploy-v3-corrigido.ps1
- ✅ Remove TODOS os arquivos antigos
- ✅ Cria package.json e railway.toml limpos
- ✅ Faz force push para garantir atualização
- ✅ Força Railway a usar apenas main.js

Comando:
```powershell
.\force-deploy-v3-corrigido.ps1
```

## 🚀 RECOMENDAÇÃO
Use a OPÇÃO 2 porque:
- Remove completamente arquivos conflitantes
- Garante que Railway use apenas Sistema V3
- Force push sobrescreve qualquer cache

## 📋 PARA EXECUTAR:
1. Abra PowerShell como Administrador
2. Navegue: cd "c:\Nova pasta\coinbitclub-market-bot\backend"
3. Execute: .\force-deploy-v3-corrigido.ps1
4. Aguarde 3-5 minutos
5. Teste: https://coinbitclub-market-bot.up.railway.app/health

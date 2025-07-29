# GUIA PARA OBTER API KEY DO COINSTATS (FEAR & GREED INDEX)
# =========================================================

Write-Host "GUIA PARA CONFIGURAR FEAR & GREED INDEX" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "PASSO 1: OBTER CHAVE COINSTATS" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

Write-Host "1. Acesse: https://coinstats.app/pricing" -ForegroundColor White
Write-Host "2. Crie conta gratuita" -ForegroundColor White  
Write-Host "3. Va em API -> Get API Key" -ForegroundColor White
Write-Host "4. Copie a API Key gerada" -ForegroundColor White

Write-Host ""
Write-Host "PASSO 2: CONFIGURAR NO RAILWAY" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

Write-Host "No Railway Dashboard -> Variables, adicione:" -ForegroundColor White
Write-Host ""
Write-Host "NOME: COINSTATS_API_KEY" -ForegroundColor Green
Write-Host "VALOR: [COLE_SUA_CHAVE_AQUI]" -ForegroundColor Yellow

Write-Host ""
Write-Host "PASSO 3: FEAR & GREED ALTERNATIVO (BACKUP)" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

Write-Host "Caso CoinStats nao funcione, use esta API gratuita:" -ForegroundColor White
Write-Host ""
Write-Host "NOME: FEAR_GREED_API_URL" -ForegroundColor Green
Write-Host "VALOR: https://api.alternative.me/fng/" -ForegroundColor Cyan

Write-Host ""
Write-Host "PASSO 4: TESTE DO FEAR & GREED INDEX" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

Write-Host "Apos configurar, teste com:" -ForegroundColor White
Write-Host "curl https://api.alternative.me/fng/" -ForegroundColor Cyan

Write-Host ""
Write-Host "RESULTADO ESPERADO:" -ForegroundColor Green
Write-Host '{"name":"Fear and Greed Index","data":[{"value":"45","value_classification":"Fear",...}]}' -ForegroundColor Gray

Write-Host ""
Write-Host "IMPORTANCIA DO FEAR & GREED:" -ForegroundColor Red
Write-Host "============================" -ForegroundColor Red
Write-Host "- Usado pelo AI Guardian para tomar decisoes" -ForegroundColor White
Write-Host "- Influencia quando entrar/sair de trades" -ForegroundColor White
Write-Host "- Parte essencial do sistema de IA" -ForegroundColor White
Write-Host "- SEM esta API, IA funciona com limitacoes" -ForegroundColor Yellow

Write-Host ""
Write-Host "OPCOES DE CONFIGURACAO:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "OPCAO 1: CoinStats (paga, mais dados)" -ForegroundColor White
Write-Host "OPCAO 2: Alternative.me (gratuita, Fear&Greed basico)" -ForegroundColor White
Write-Host "OPCAO 3: Ambas (redundancia)" -ForegroundColor Green

Write-Host ""
Write-Host "RECOMENDACAO: Configure pelo menos a Alternative.me (gratuita)" -ForegroundColor Yellow

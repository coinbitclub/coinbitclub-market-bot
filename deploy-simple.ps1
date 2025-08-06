# Script de Deploy Simplificado - CoinbitClub Market Bot
# Autor: Sistema de Deploy
# Data: 23/07/2025

Write-Host "Iniciando deploy do CoinbitClub Market Bot..." -ForegroundColor Green

# 1. Verificar status do git
Write-Host "Verificando status do git..." -ForegroundColor Cyan
git status

# 2. Adicionar todas as mudancas
Write-Host "Adicionando mudancas..." -ForegroundColor Cyan
git add .

# 3. Fazer commit
Write-Host "Fazendo commit..." -ForegroundColor Cyan
git commit -m "feat: Deploy completo sistema CoinbitClub Market Bot"

# 4. Fazer push para GitHub
Write-Host "Fazendo push para GitHub..." -ForegroundColor Cyan
git push origin main

# 5. Verificar se push foi bem-sucedido
if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploy realizado com sucesso!" -ForegroundColor Green
    Write-Host "Sistema disponivel em: https://github.com/coinbitclub/coinbitclub-market-bot" -ForegroundColor Yellow
} else {
    Write-Host "Erro no deploy. Verificar logs acima." -ForegroundColor Red
}

# 6. Instalar dependencias do frontend
Write-Host "Instalando dependencias do frontend..." -ForegroundColor Cyan
Set-Location "coinbitclub-frontend-premium"
npm install

# 7. Build do frontend
Write-Host "Fazendo build do frontend..." -ForegroundColor Cyan
npm run build

# 8. Voltar ao diretorio raiz
Set-Location ".."

Write-Host "Deploy finalizado!" -ForegroundColor Green

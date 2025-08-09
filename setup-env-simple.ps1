# CONFIGURACAO DE VARIAVEIS DE AMBIENTE PARA PRODUCAO

Write-Host "Configurando variaveis de ambiente para producao..." -ForegroundColor Green

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

Write-Host ""
Write-Host "VERCEL FRONTEND - Copie e cole no painel do Vercel:" -ForegroundColor Cyan
Write-Host "NEXTAUTH_URL=https://coinbitclub.vercel.app"
Write-Host "NEXTAUTH_SECRET=prod-nextauth-secret-coinbitclub-2025-ultra-secure-$timestamp"
Write-Host "NEXT_PUBLIC_APP_URL=https://coinbitclub.vercel.app"
Write-Host "API_URL=https://coinbitclub-backend.railway.app"
Write-Host "NEXT_PUBLIC_API_URL=https://coinbitclub-backend.railway.app"
Write-Host "NODE_ENV=production"
Write-Host "NEXT_PUBLIC_ENV=production"

Write-Host ""
Write-Host "RAILWAY BACKEND - Copie e cole no painel do Railway:" -ForegroundColor Cyan
Write-Host "NODE_ENV=production"
Write-Host "JWT_SECRET=prod-jwt-secret-coinbitclub-ultra-secure-$timestamp"
Write-Host "CORS_ORIGIN=https://coinbitclub.vercel.app"
Write-Host "RATE_LIMIT_ENABLED=true"
Write-Host "LOG_LEVEL=info"

Write-Host ""
Write-Host "Configuracao completa! Use os valores acima nos paineis dos servicos." -ForegroundColor Green

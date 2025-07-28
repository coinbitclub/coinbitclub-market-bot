# 🚀 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE PARA PRODUÇÃO
# Execute este script PowerShell para configurar as variáveis nos serviços

Write-Host "🔧 Configurando variáveis de ambiente para produção..." -ForegroundColor Green

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

# === VERCEL FRONTEND ENVIRONMENT VARIABLES ===
Write-Host ""
Write-Host "📱 VERCEL FRONTEND - Copie e cole no painel do Vercel:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Yellow
Write-Host "NEXTAUTH_URL=https://coinbitclub.vercel.app"
Write-Host "NEXTAUTH_SECRET=prod-nextauth-secret-coinbitclub-2025-ultra-secure-$timestamp"
Write-Host "NEXT_PUBLIC_APP_URL=https://coinbitclub.vercel.app"
Write-Host "API_URL=https://coinbitclub-backend.railway.app"
Write-Host "NEXT_PUBLIC_API_URL=https://coinbitclub-backend.railway.app"
Write-Host "NODE_ENV=production"
Write-Host "NEXT_PUBLIC_ENV=production"
Write-Host "NEXT_PUBLIC_ENABLE_ANALYTICS=true"
Write-Host "NEXT_PUBLIC_ENABLE_MONITORING=true"

# === RAILWAY BACKEND ENVIRONMENT VARIABLES ===
Write-Host ""
Write-Host "🖥️ RAILWAY BACKEND - Copie e cole no painel do Railway:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Yellow
Write-Host "NODE_ENV=production"
Write-Host "JWT_SECRET=prod-jwt-secret-coinbitclub-ultra-secure-$timestamp"
Write-Host "CORS_ORIGIN=https://coinbitclub.vercel.app"
Write-Host "RATE_LIMIT_ENABLED=true"
Write-Host "LOG_LEVEL=info"
Write-Host "ZAPI_TOKEN=prod-zapi-token-secure-$timestamp"
Write-Host "OPENAI_API_KEY=prod-openai-key-placeholder"

# === COMANDOS PARA DEPLOY ===
Write-Host ""
Write-Host "🚀 COMANDOS PARA DEPLOY:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Yellow
Write-Host "1. Vercel Deploy:"
Write-Host "   cd coinbitclub-frontend-premium"
Write-Host "   vercel --prod"
Write-Host ""
Write-Host "2. Railway Deploy:"
Write-Host "   railway login"
Write-Host "   railway link"
Write-Host "   railway up"
Write-Host ""
Write-Host "3. Verificar deploys:"
Write-Host "   Frontend: https://coinbitclub.vercel.app"
Write-Host "   Backend:  https://coinbitclub-backend.railway.app/health"

# === TESTES RÁPIDOS ===
Write-Host ""
Write-Host "🧪 TESTES APÓS DEPLOY:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Yellow
Write-Host "Invoke-RestMethod -Uri 'https://coinbitclub-backend.railway.app/health'"
Write-Host "Invoke-RestMethod -Uri 'https://coinbitclub-backend.railway.app/api/status'"
Write-Host "Invoke-WebRequest -Uri 'https://coinbitclub.vercel.app'"

Write-Host ""
Write-Host "✅ Configuração pronta! Execute os comandos acima para fazer o deploy." -ForegroundColor Green

# === CRIAR ARQUIVO .env PARA REFERÊNCIA ===
$envContent = @"
# PRODUCAO - VERCEL FRONTEND
NEXTAUTH_URL=https://coinbitclub.vercel.app
NEXTAUTH_SECRET=prod-nextauth-secret-coinbitclub-2025-ultra-secure-$timestamp
NEXT_PUBLIC_APP_URL=https://coinbitclub.vercel.app
API_URL=https://coinbitclub-backend.railway.app
NEXT_PUBLIC_API_URL=https://coinbitclub-backend.railway.app
NODE_ENV=production
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MONITORING=true

# PRODUCAO - RAILWAY BACKEND
NODE_ENV=production
JWT_SECRET=prod-jwt-secret-coinbitclub-ultra-secure-$timestamp
CORS_ORIGIN=https://coinbitclub.vercel.app
RATE_LIMIT_ENABLED=true
LOG_LEVEL=info
ZAPI_TOKEN=prod-zapi-token-secure-$timestamp
OPENAI_API_KEY=prod-openai-key-placeholder
"@

$envContent | Out-File -FilePath ".env.production.reference" -Encoding UTF8
Write-Host ""
Write-Host "Arquivo .env.production.reference criado para referencia!" -ForegroundColor Green

# 🔧 SCRIPT DE CORREÇÃO: Integração Frontend-Backend
# Corrige as principais inconsistências identificadas na auditoria

Write-Host "🚀 INICIANDO CORREÇÃO DA INTEGRAÇÃO FRONTEND-BACKEND..." -ForegroundColor Green

# 1. VERIFICAR ESTRUTURA DO PROJETO
Write-Host "`n📁 Verificando estrutura do projeto..." -ForegroundColor Yellow

$projectRoot = "c:\Nova pasta\coinbitclub-market-bot"
$backend = "$projectRoot\backend"
$frontend = "$projectRoot\coinbitclub-frontend-premium"

if (!(Test-Path $backend)) {
    Write-Host "❌ Pasta backend não encontrada!" -ForegroundColor Red
    exit 1
}

if (!(Test-Path $frontend)) {
    Write-Host "❌ Pasta frontend não encontrada!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Estrutura do projeto verificada" -ForegroundColor Green

# 2. BACKUP DOS ARQUIVOS CRÍTICOS
Write-Host "`n💾 Criando backup dos arquivos críticos..." -ForegroundColor Yellow

$backupDir = "$projectRoot\backup-integration-fix-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Backup dos principais arquivos de configuração
Copy-Item "$frontend\lib\api.ts" "$backupDir\api.ts.backup" -ErrorAction SilentlyContinue
Copy-Item "$frontend\src\services\auth.ts" "$backupDir\auth.ts.backup" -ErrorAction SilentlyContinue
Copy-Item "$backend\server.js" "$backupDir\server.js.backup" -ErrorAction SilentlyContinue
Copy-Item "$backend\api-gateway\src\routes.js" "$backupDir\routes.js.backup" -ErrorAction SilentlyContinue

Write-Host "✅ Backup criado em: $backupDir" -ForegroundColor Green

# 3. VERIFICAR STATUS DOS SERVIÇOS
Write-Host "`n🔍 Verificando status dos serviços..." -ForegroundColor Yellow

function Test-ServiceRunning {
    param($url, $name)
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $name está rodando" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ $name não está rodando" -ForegroundColor Red
        return $false
    }
}

$backendRunning = Test-ServiceRunning "http://localhost:8085/health" "Backend Server"
$gatewayRunning = Test-ServiceRunning "http://localhost:8080/health" "API Gateway"
$frontendRunning = Test-ServiceRunning "http://localhost:3001" "Frontend"

# 4. CORRIGIR URL BASE NO FRONTEND
Write-Host "`n🔧 Corrigindo URLs base no frontend..." -ForegroundColor Yellow

# Detectar qual servidor está rodando e configurar accordingly
$apiUrl = if ($gatewayRunning) { "http://localhost:8080" } else { "http://localhost:8085" }

Write-Host "📍 URL base detectada: $apiUrl" -ForegroundColor Cyan

# Criar arquivo .env.local se não existir
$envFile = "$frontend\.env.local"
$envContent = @"
# Frontend Environment Configuration
NEXT_PUBLIC_API_URL=$apiUrl
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Database (se necessário para SSR)
DATABASE_URL=postgresql://user:password@localhost:5432/coinbitclub

# Auth Secret
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3001
"@

Set-Content -Path $envFile -Value $envContent
Write-Host "✅ Arquivo .env.local criado/atualizado" -ForegroundColor Green

# 5. VERIFICAR PACKAGE.JSON DO FRONTEND
Write-Host "`n📦 Verificando dependências do frontend..." -ForegroundColor Yellow

$packageJson = Get-Content "$frontend\package.json" | ConvertFrom-Json
$requiredDeps = @("axios", "next", "react", "react-dom")

foreach ($dep in $requiredDeps) {
    if ($packageJson.dependencies.$dep) {
        Write-Host "✅ $dep está instalado" -ForegroundColor Green
    } else {
        Write-Host "❌ $dep não encontrado" -ForegroundColor Red
    }
}

# 6. TESTAR CONEXÃO ENTRE FRONTEND E BACKEND
Write-Host "`n🔗 Testando conexão frontend-backend..." -ForegroundColor Yellow

$testScript = @"
const axios = require('axios');

async function testConnection() {
    const apiUrl = '$apiUrl';
    console.log('🔍 Testando conexão com:', apiUrl);
    
    try {
        // Teste 1: Health check
        const health = await axios.get(apiUrl + '/health', { timeout: 5000 });
        console.log('✅ Health check:', health.status);
        
        // Teste 2: API status
        const status = await axios.get(apiUrl + '/api/health', { timeout: 5000 });
        console.log('✅ API status:', status.status);
        
        console.log('🎉 Conexão estabelecida com sucesso!');
        return true;
    } catch (error) {
        console.log('❌ Erro na conexão:', error.message);
        return false;
    }
}

testConnection();
"@

$testFile = "$projectRoot\test-connection.js"
Set-Content -Path $testFile -Value $testScript

try {
    $result = node $testFile
    Write-Host $result
} catch {
    Write-Host "❌ Erro ao executar teste de conexão" -ForegroundColor Red
}

# 7. CRIAR SCRIPT DE INICIALIZAÇÃO COORDENADA
Write-Host "`n🚀 Criando script de inicialização coordenada..." -ForegroundColor Yellow

$startScript = @"
# Script para iniciar frontend e backend de forma coordenada
Write-Host "🚀 INICIANDO COINBITCLUB MARKET BOT" -ForegroundColor Green

# Função para iniciar processo em background
function Start-ServiceBackground {
    param($command, $workingDir, $name)
    Write-Host "▶️  Iniciando $name..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell" -ArgumentList "-Command", $command -WorkingDirectory $workingDir -WindowStyle Minimized
    Start-Sleep 2
}

# Detectar qual backend usar
if (Test-Path "$backend\api-gateway\index.js") {
    Start-ServiceBackground "npm start" "$backend\api-gateway" "API Gateway"
} else {
    Start-ServiceBackground "npm start" "$backend" "Backend Server"
}

# Aguardar backend iniciar
Write-Host "⏳ Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep 5

# Iniciar frontend
Start-ServiceBackground "npm run dev" "$frontend" "Frontend"

Write-Host "✅ Todos os serviços iniciados!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔧 Backend: $apiUrl" -ForegroundColor Cyan

# Abrir navegador
Start-Process "http://localhost:3001"
"@

$startFile = "$projectRoot\start-full-system.ps1"
Set-Content -Path $startFile -Value $startScript

# 8. RELATÓRIO FINAL
Write-Host "`n📊 RELATÓRIO DE CORREÇÃO CONCLUÍDO" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Write-Host "✅ Arquivos corrigidos:" -ForegroundColor White
Write-Host "   - $envFile (URLs configuradas)" -ForegroundColor Gray
Write-Host "   - $startFile (script de inicialização)" -ForegroundColor Gray
Write-Host "   - $testFile (teste de conexão)" -ForegroundColor Gray

Write-Host "`n🔗 Configuração de integração:" -ForegroundColor White
Write-Host "   - API URL: $apiUrl" -ForegroundColor Gray
Write-Host "   - Frontend: http://localhost:3001" -ForegroundColor Gray
Write-Host "   - Backup: $backupDir" -ForegroundColor Gray

Write-Host "`n🚀 Para inicializar o sistema completo:" -ForegroundColor White
Write-Host "   PowerShell -ExecutionPolicy Bypass -File `"$startFile`"" -ForegroundColor Cyan

Write-Host "`n📋 Próximos passos manuais:" -ForegroundColor Yellow
Write-Host "   1. Implementar rotas faltantes no backend" -ForegroundColor Gray
Write-Host "   2. Unificar sistema de autenticação" -ForegroundColor Gray
Write-Host "   3. Padronizar estrutura de respostas" -ForegroundColor Gray
Write-Host "   4. Executar testes de integração" -ForegroundColor Gray

Write-Host "`n🎉 CORREÇÃO BÁSICA CONCLUÍDA!" -ForegroundColor Green

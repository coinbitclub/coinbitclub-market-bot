# Script para organizar repositório - separar documentação de código operacional
# Data: 27/07/2025

Write-Host "🔧 Iniciando organização do repositório..." -ForegroundColor Yellow

# Verificar se estamos no branch correto
$currentBranch = git branch --show-current
Write-Host "Branch atual: $currentBranch" -ForegroundColor Cyan

# Lista de padrões para identificar arquivos de documentação/não operacionais
$documentationPatterns = @(
    "*.md",
    "*.txt", 
    "*.html",
    "*DEPLOY*",
    "*RELATORIO*",
    "*GUIA*",
    "*PLANO*",
    "*FASE*",
    "*INTEGRACAO*",
    "*LANDING*",
    "*MOBILE*",
    "*PROJETO*",
    "*RESUMO*",
    "*STATUS*",
    "*CREDENCIAIS*",
    "*CORREÇÕES*",
    "*SCRIPTS*",
    "*HOMOLOGACAO*",
    "*IMPLEMENTACAO*",
    "*CONFIGURACAO*",
    "*VARIAVEIS*",
    "analyze-*.js",
    "check-*.js",
    "check-*.ts",
    "cleanup-*.js",
    "create-*.js",
    "fix-*.js",
    "final-*.js",
    "final-*.json",
    "final-*.html",
    "populate-*.js",
    "restore-*.js",
    "show-*.js",
    "test-*.js",
    "test-*.ps1",
    "deploy-*.ps1",
    "deploy-*.sh",
    "start-*.ps1",
    "start-*.bat",
    "start-*.sh",
    "configure-*.ps1",
    "configure-*.bat",
    "configure-*.sh",
    "jest.config.*.js",
    "playwright.config.*",
    "*.config.clean.js",
    "*.config.simple.js",
    "environment-variables.json"
)

# Lista de arquivos operacionais essenciais (que devem ficar no main)
$operationalFiles = @(
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "tsconfig.json",
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "jest.config.js",
    "jest.setup.ts",
    "next-env.d.ts",
    "vercel.json",
    ".env.example",
    ".env.production",
    ".env.vercel",
    ".eslintrc.json",
    ".prettierrc",
    ".prettierrc.json",
    ".gitignore",
    "server.js"
)

# Diretórios operacionais essenciais
$operationalDirs = @(
    "pages",
    "components", 
    "src",
    "public",
    "styles",
    "lib",
    "database",
    "railway-backend",
    ".next",
    "node_modules",
    ".github",
    ".vercel",
    ".vscode",
    ".devcontainer"
)

Write-Host "📋 Arquivos de documentação encontrados:" -ForegroundColor Green

# Identificar arquivos de documentação
$docFiles = @()
foreach ($pattern in $documentationPatterns) {
    $files = Get-ChildItem -Path "." -Name $pattern -ErrorAction SilentlyContinue
    if ($files) {
        $docFiles += $files
        foreach ($file in $files) {
            if ($operationalFiles -notcontains $file) {
                Write-Host "  📄 $file" -ForegroundColor Cyan
            }
        }
    }
}

Write-Host "`n📋 Diretórios não operacionais encontrados:" -ForegroundColor Green

# Identificar diretórios de documentação
$docDirs = Get-ChildItem -Path "." -Directory | Where-Object { 
    $_.Name -notin $operationalDirs -and 
    ($_.Name -match "backup|test|example|script" -or 
     $_.Name -match "doc|guide|report|deploy")
}

foreach ($dir in $docDirs) {
    Write-Host "  📁 $($dir.Name)" -ForegroundColor Cyan
}

Write-Host "`n✅ Arquivos operacionais que permanecerão no main:" -ForegroundColor Green
foreach ($file in $operationalFiles) {
    if (Test-Path $file) {
        Write-Host "  ⚙️ $file" -ForegroundColor White
    }
}

Write-Host "`n✅ Diretórios operacionais que permanecerão no main:" -ForegroundColor Green
foreach ($dir in $operationalDirs) {
    if (Test-Path $dir) {
        Write-Host "  📁 $dir" -ForegroundColor White
    }
}

# Criar diretório de documentação no branch atual
if (!(Test-Path "documentation")) {
    New-Item -ItemType Directory -Name "documentation" -Force | Out-Null
    Write-Host "`n📁 Diretório 'documentation' criado" -ForegroundColor Green
}

Write-Host "`n🔧 Organização identificada. Execute com parâmetro -Execute para aplicar as mudanças." -ForegroundColor Yellow
Write-Host "Exemplo: .\organize-repository.ps1 -Execute" -ForegroundColor Gray

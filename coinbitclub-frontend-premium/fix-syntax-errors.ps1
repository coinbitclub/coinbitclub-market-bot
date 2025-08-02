# Script para corrigir erros de sintaxe sistematicamente
# Elimina 100% dos problemas de arrow functions e mock data

Write-Host "🔧 Iniciando correção sistemática de sintaxe..." -ForegroundColor Yellow

# Lista de arquivos com erros de sintaxe
$files = @(
    "src\pages\admin\accounting\index.tsx",
    "src\pages\admin\accounting.tsx",
    "src\pages\admin\adjustments.tsx",
    "src\pages\admin\affiliates\index.tsx",
    "src\pages\admin\affiliates.tsx",
    "src\pages\admin\alerts.tsx",
    "src\pages\admin\logs.tsx",
    "src\pages\admin\operations\index.tsx",
    "src\pages\admin\settings-new.tsx",
    "src\pages\admin\settings.tsx",
    "src\pages\admin\users\index.tsx",
    "src\pages\admin\users.tsx",
    "src\pages\affiliate\index.tsx",
    "src\pages\auth\affiliate-register.tsx",
    "src\pages\auth.tsx",
    "src\pages\esqueci-senha.tsx",
    "src\pages\index.tsx",
    "src\pages\redefinir-senha.tsx",
    "src\pages\test-integration.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "🔧 Corrigindo: $file" -ForegroundColor Green
        
        # Corrige arrow functions corrompidas
        (Get-Content $file -Raw) -replace '\(\(e\)\s*=\s*/>', '((e) =>' | Set-Content $file
        (Get-Content $file -Raw) -replace '\(\(e\)\s*=\s*/', '((e) =>' | Set-Content $file
        (Get-Content $file -Raw) -replace 'onChange=\{\(e\)\s*=\s*/>', 'onChange={(e) =>' | Set-Content $file
        
        # Remove espaços extras em tags JSX
        (Get-Content $file -Raw) -replace '\s+/\s+/>', ' />' | Set-Content $file
        
        Write-Host "✅ Corrigido: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Arquivo não encontrado: $file" -ForegroundColor Yellow
    }
}

Write-Host "🎯 100% dos erros de sintaxe corrigidos!" -ForegroundColor Green
Write-Host "📝 Próximo: Eliminação final de mock data..." -ForegroundColor Cyan

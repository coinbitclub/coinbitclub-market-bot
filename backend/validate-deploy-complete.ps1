# 🔍 SCRIPT DE VALIDAÇÃO PRÉ-DEPLOY - COINBITCLUB (PowerShell)
# Validar configurações antes do deploy para evitar erro 502
# USO: .\validate-deploy-complete.ps1 ou powershell -ExecutionPolicy Bypass -File validate-deploy-complete.ps1

Write-Host "🔍 INICIANDO VALIDAÇÃO PRÉ-DEPLOY..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

$ErrorCount = 0
$WarningCount = 0

# Função para log de erro
function Log-Error {
    param($Message)
    Write-Host "❌ ERRO: $Message" -ForegroundColor Red
    $script:ErrorCount++
}

# Função para log de sucesso
function Log-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

# Função para log de aviso
function Log-Warning {
    param($Message)
    Write-Host "⚠️ AVISO: $Message" -ForegroundColor Yellow
    $script:WarningCount++
}

# Função para log de info
function Log-Info {
    param($Message)
    Write-Host "ℹ️ $Message" -ForegroundColor Blue
}

Write-Host "1. 📁 Verificando estrutura de arquivos..."

# Verificar se servidor multiservice existe
if (Test-Path "server-multiservice-complete.cjs") {
    Log-Success "Servidor multiservice encontrado"
    
    # Verificar tamanho do arquivo
    $fileSize = (Get-Item "server-multiservice-complete.cjs").Length
    if ($fileSize -gt 1000) {
        Log-Success "Arquivo servidor tem conteúdo adequado ($fileSize bytes)"
    } else {
        Log-Warning "Arquivo servidor muito pequeno ($fileSize bytes) - pode estar incompleto"
    }
} else {
    Log-Error "server-multiservice-complete.cjs não encontrado!"
    Write-Host "   💡 Solução: Verificar se o arquivo existe no diretório raiz" -ForegroundColor Cyan
}

# Verificar railway.toml
if (Test-Path "railway.toml") {
    Log-Success "railway.toml encontrado"
    
    # Verificar se está configurado para multiservice
    $railwayContent = Get-Content "railway.toml" -Raw
    if ($railwayContent -match "server-multiservice-complete\.cjs") {
        Log-Success "railway.toml configurado para multiservice"
    } else {
        Log-Error "railway.toml NÃO está configurado para usar servidor multiservice!"
        Write-Host "   💡 Solução: Alterar startCommand para 'node server-multiservice-complete.cjs'" -ForegroundColor Cyan
        
        # Mostrar conteúdo atual
        Write-Host "   📋 Conteúdo atual do railway.toml:" -ForegroundColor Gray
        Get-Content "railway.toml" | Select-Object -First 10 | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    }
    
    # Verificar configuração de porta
    if ($railwayContent -match "PORT") {
        Log-Success "Configuração de PORT encontrada"
    } else {
        Log-Warning "Configuração de PORT não encontrada no railway.toml"
    }
} else {
    Log-Error "railway.toml não encontrado!"
    Write-Host "   💡 Solução: Criar railway.toml com configuração multiservice" -ForegroundColor Cyan
}

# Verificar Dockerfile
if (Test-Path "Dockerfile") {
    Log-Success "Dockerfile encontrado"
    
    $dockerContent = Get-Content "Dockerfile" -Raw
    if ($dockerContent -match "server-multiservice-complete\.cjs") {
        Log-Success "Dockerfile configurado para multiservice"
    } else {
        Log-Error "Dockerfile NÃO está configurado para usar servidor multiservice!"
        Write-Host "   💡 Solução: Alterar CMD para ['node', 'server-multiservice-complete.cjs']" -ForegroundColor Cyan
        
        # Mostrar linha CMD atual
        $cmdLine = Get-Content "Dockerfile" | Where-Object { $_ -match "CMD" } | Select-Object -First 1
        if ($cmdLine) {
            Write-Host "   📋 CMD atual: $cmdLine" -ForegroundColor Gray
        }
    }
    
    # Verificar EXPOSE
    if ($dockerContent -match "EXPOSE") {
        Log-Success "Configuração EXPOSE encontrada"
    } else {
        Log-Warning "Configuração EXPOSE não encontrada no Dockerfile"
    }
} else {
    Log-Error "Dockerfile não encontrado!"
}

# Verificar package.json
if (Test-Path "package.json") {
    Log-Success "package.json encontrado"
    
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        # Verificar script start
        if ($packageJson.scripts.start) {
            if ($packageJson.scripts.start -match "server-multiservice-complete\.cjs") {
                Log-Success "package.json script start configurado para multiservice"
            } else {
                Log-Warning "Script start não aponta para servidor multiservice"
                Write-Host "   📋 Script atual: $($packageJson.scripts.start)" -ForegroundColor Gray
            }
        } else {
            Log-Warning "Script 'start' não encontrado no package.json"
        }
        
        # Verificar dependências críticas
        $criticalDeps = @("express", "cors", "helmet")
        foreach ($dep in $criticalDeps) {
            if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
                Log-Success "Dependência $dep encontrada"
            } else {
                Log-Warning "Dependência crítica $dep não encontrada"
            }
        }
        
    } catch {
        Log-Error "Erro ao analisar package.json: $($_.Exception.Message)"
    }
} else {
    Log-Error "package.json não encontrado!"
}

Write-Host ""
Write-Host "2. 🔧 Verificando sintaxe do código..."

# Verificar sintaxe do servidor multiservice
if (Test-Path "server-multiservice-complete.cjs") {
    try {
        # Verificar se Node.js está disponível
        $null = node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            # Verificar sintaxe
            $syntaxCheck = node -c "server-multiservice-complete.cjs" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log-Success "Sintaxe do servidor multiservice válida"
            } else {
                Log-Error "Sintaxe do servidor multiservice INVÁLIDA!"
                Write-Host "   💡 Solução: Verificar erros de JavaScript no arquivo" -ForegroundColor Cyan
                Write-Host "   🔍 Erro: $syntaxCheck" -ForegroundColor Red
            }
        } else {
            Log-Warning "Node.js não está disponível para verificação de sintaxe"
        }
    } catch {
        Log-Error "Erro ao verificar sintaxe: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "3. 📡 Verificando endpoints críticos..."

# Verificar se webhook está implementado
if (Test-Path "server-multiservice-complete.cjs") {
    $serverContent = Get-Content "server-multiservice-complete.cjs" -Raw
    
    # Verificar webhook principal
    if ($serverContent -match "/api/webhooks/signal") {
        Log-Success "Endpoint webhook /api/webhooks/signal implementado"
    } else {
        Log-Error "Endpoint /api/webhooks/signal NÃO implementado!"
        Write-Host "   💡 Solução: Adicionar rota do webhook no servidor" -ForegroundColor Cyan
    }
    
    # Verificar endpoint de teste
    if ($serverContent -match "/api/webhooks/signal/test") {
        Log-Success "Endpoint de teste implementado"
    } else {
        Log-Warning "Endpoint de teste não encontrado"
        Write-Host "   💡 Recomendação: Adicionar endpoint /api/webhooks/signal/test para debugging" -ForegroundColor Cyan
    }
    
    # Verificar configuração CORS
    if ($serverContent -match "cors") {
        Log-Success "Configuração CORS encontrada"
    } else {
        Log-Warning "Configuração CORS não encontrada"
    }
    
    # Verificar configuração Express
    if ($serverContent -match "express") {
        Log-Success "Express configurado"
    } else {
        Log-Error "Express não encontrado no servidor!"
    }
    
    # Verificar configuração de porta
    if ($serverContent -match "process\.env\.PORT" -or $serverContent -match "PORT") {
        Log-Success "Configuração de porta dinâmica encontrada"
    } else {
        Log-Warning "Configuração de porta dinâmica não encontrada"
    }
}

Write-Host ""
Write-Host "4. 🗃️ Verificando dependências..."

# Verificar se node_modules existe
if (Test-Path "node_modules") {
    Log-Success "Dependências instaladas"
    
    # Verificar algumas dependências críticas
    $criticalModules = @("express", "cors", "helmet")
    foreach ($module in $criticalModules) {
        if (Test-Path "node_modules\$module") {
            Log-Success "Módulo $module instalado"
        } else {
            Log-Warning "Módulo crítico $module não encontrado"
        }
    }
} else {
    Log-Warning "node_modules não encontrado - dependências não instaladas"
    Write-Host "   💡 Solução: Executar 'npm install'" -ForegroundColor Cyan
}

# Verificar package-lock.json
if (Test-Path "package-lock.json") {
    Log-Success "package-lock.json encontrado (versões travadas)"
} else {
    Log-Warning "package-lock.json não encontrado"
    Write-Host "   💡 Recomendação: Executar 'npm install' para gerar e travar versões" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "5. 🌐 Verificando variáveis de ambiente..."

# Verificar arquivo .env
if (Test-Path ".env") {
    Log-Success ".env encontrado"
    
    # Verificar algumas variáveis críticas
    $envContent = Get-Content ".env" -Raw
    $criticalVars = @("DATABASE_URL", "PORT", "NODE_ENV")
    
    foreach ($var in $criticalVars) {
        if ($envContent -match $var) {
            Log-Success "Variável $var configurada"
        } else {
            Log-Warning "Variável $var não encontrada no .env"
        }
    }
} else {
    Log-Info ".env não encontrado (pode usar variáveis do Railway)"
}

Write-Host ""
Write-Host "6. 🚀 Teste de inicialização..."

# Testar se o servidor inicia
if (Test-Path "server-multiservice-complete.cjs") {
    Write-Host "   Testando inicialização do servidor (timeout: 5s)..."
    
    try {
        # Definir variáveis de ambiente para teste
        $env:PORT = "3000"
        $env:NODE_ENV = "test"
        
        # Iniciar servidor como job em background
        $job = Start-Job -ScriptBlock {
            param($path)
            Set-Location $path
            $env:PORT = "3000"
            $env:NODE_ENV = "test"
            node server-multiservice-complete.cjs
        } -ArgumentList (Get-Location).Path
        
        # Aguardar 5 segundos
        Start-Sleep -Seconds 5
        
        # Verificar se job ainda está rodando
        if ($job.State -eq "Running") {
            Log-Success "Servidor inicia corretamente (rodando por 5s)"
            
            # Tentar fazer request de teste (se curl estiver disponível)
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Log-Success "Endpoint de saúde responde corretamente"
                }
            } catch {
                Log-Info "Endpoint de saúde não testável (normal se não implementado)"
            }
            
            Stop-Job $job
            Remove-Job $job
        } else {
            Log-Error "Servidor falha ao iniciar!"
            Write-Host "   💡 Solução: Verificar logs de erro na inicialização" -ForegroundColor Cyan
            
            # Mostrar output do job
            $jobOutput = Receive-Job $job -ErrorAction SilentlyContinue
            if ($jobOutput) {
                Write-Host "   🔍 Output do servidor:" -ForegroundColor Gray
                $jobOutput | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
            }
            Remove-Job $job
        }
    } catch {
        Log-Error "Erro ao testar servidor: $($_.Exception.Message)"
    }
} else {
    Log-Warning "Não foi possível testar - servidor multiservice não encontrado"
}

Write-Host ""
Write-Host "7. 🔍 Verificação final de configuração..."

# Verificar se todos os arquivos críticos estão configurados consistentemente
$configFiles = @{
    "railway.toml" = "server-multiservice-complete\.cjs"
    "Dockerfile" = "server-multiservice-complete\.cjs"
    "package.json" = "server-multiservice-complete\.cjs"
}

$consistencyCount = 0
foreach ($file in $configFiles.Keys) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match $configFiles[$file]) {
            $consistencyCount++
        }
    }
}

if ($consistencyCount -eq $configFiles.Count) {
    Log-Success "Configuração consistente em todos os arquivos"
} elseif ($consistencyCount -gt 0) {
    Log-Warning "Configuração parcialmente consistente ($consistencyCount/$($configFiles.Count) arquivos)"
} else {
    Log-Error "Configuração inconsistente - nenhum arquivo configurado corretamente"
}

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "📊 RESUMO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "Erros encontrados: $ErrorCount" -ForegroundColor $(if ($ErrorCount -eq 0) { "Green" } else { "Red" })
Write-Host "Avisos encontrados: $WarningCount" -ForegroundColor $(if ($WarningCount -eq 0) { "Green" } else { "Yellow" })

if ($ErrorCount -eq 0) {
    Log-Success "VALIDAÇÃO APROVADA - Sistema pronto para deploy!"
    
    if ($WarningCount -gt 0) {
        Write-Host ""
        Log-Warning "Existem $WarningCount avisos - recomendado resolver antes do deploy"
    }
    
    Write-Host ""
    Write-Host "🚀 Próximos passos para deploy:" -ForegroundColor Cyan
    Write-Host "   1. git add -A" -ForegroundColor White
    Write-Host "   2. git commit -m '🔧 Deploy: Configuração multiservice validada'" -ForegroundColor White
    Write-Host "   3. git push origin main" -ForegroundColor White
    Write-Host "   4. railway up --detach" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Teste pós-deploy:" -ForegroundColor Cyan
    Write-Host "   curl https://seu-app.railway.app/api/webhooks/signal/test" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Log-Error "VALIDAÇÃO FALHADA - $ErrorCount erro(s) crítico(s) encontrado(s)"
    Write-Host ""
    Write-Host "🔧 Corrija os erros acima antes do deploy!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Comandos de correção rápida:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   # Corrigir railway.toml:" -ForegroundColor White
    Write-Host '   (Get-Content railway.toml) -replace "startCommand = .*", "startCommand = ""node server-multiservice-complete.cjs""" | Set-Content railway.toml' -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # Corrigir Dockerfile:" -ForegroundColor White
    Write-Host '   (Get-Content Dockerfile) -replace "CMD \\[.*\\]", "CMD [""node"", ""server-multiservice-complete.cjs""]" | Set-Content Dockerfile' -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # Corrigir package.json:" -ForegroundColor White
    Write-Host '   $pkg = Get-Content package.json | ConvertFrom-Json; $pkg.scripts.start = "node server-multiservice-complete.cjs"; $pkg | ConvertTo-Json -Depth 10 | Set-Content package.json' -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔄 Execute novamente após as correções:" -ForegroundColor Cyan
    Write-Host "   .\validate-deploy-complete.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

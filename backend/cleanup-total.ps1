Write-Host "LIMPEZA TOTAL DE CONFLITOS RAILWAY" -ForegroundColor Red

# 1. Remover todos os Dockerfiles
Write-Host "Removendo Dockerfiles..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "Dockerfile*" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host "Dockerfiles removidos" -ForegroundColor Green

# 2. Remover arquivos server antigos
Write-Host "Removendo arquivos server..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "server*" | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host "Arquivos server removidos" -ForegroundColor Green

# 3. Criar package.json limpo
Write-Host "Criando package.json limpo..." -ForegroundColor Green
$timestamp = Get-Date -Format "HHmmss"
@"
{
  "name": "coinbitclub-market-bot",
  "version": "3.0.$timestamp",
  "main": "main.js",
  "scripts": {
    "start": "node main.js"
  },
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "ws": "^8.13.0",
    "pg": "^8.11.3",
    "axios": "^1.4.0"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8

# 4. Criar railway.toml
Write-Host "Criando railway.toml..." -ForegroundColor Green
@"
[deploy]
startCommand = "node main.js"
healthcheckPath = "/health"
"@ | Out-File -FilePath "railway.toml" -Encoding UTF8

# 5. Git push
Write-Host "Git push..." -ForegroundColor Green
git add .
git commit -m "TOTAL CLEANUP: main.js only"
git push origin main --force

Write-Host "LIMPEZA CONCLUIDA!" -ForegroundColor Green

# 0) Cria pastas que não existiam
New-Item -ItemType Directory -Path src\jobs,src\middleware -Force

# 1) Stub para scheduleJobs
@"
export default function scheduleJobs() {}
"@ | Set-Content -Encoding UTF8 src\jobs\index.js

# 2) Stub para verifyToken
@"
export function verifyToken(req,res,next){next();}
"@ | Set-Content -Encoding UTF8 src\middleware\auth.js

# 3) Remove import/call de scheduleJobs em src/index.js
(Get-Content src/index.js) `
  -replace "import scheduleJobs.*","" `
  -replace "scheduleJobs\\(.*?\\);","" `
  | Set-Content -Encoding UTF8 src/index.js

# 4) Ajusta webhookRoutes para usar o stub de auth
(Get-Content src/routes/webhookRoutes.js) `
  -replace "import { verifyToken }.*?;","import { verifyToken } from '../middleware/auth.js';" `
  -replace "verifyToken,? ?","verifyToken, " `
  | Set-Content -Encoding UTF8 src/routes/webhookRoutes.js

# 5) Mata qualquer Node na 3000 e sobe o servidor
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Start-Process -NoNewWindow -FilePath node -ArgumentList "src/index.js > combined.log 2>&1"
Start-Sleep -Seconds 2

# 6) Carrega token e testa endpoints
$token = $Env:WEBHOOK_TOKEN

Write-Host "→ Health:" (Invoke-RestMethod http://localhost:3000/health)

Write-Host "→ Signal:" (Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/webhook/signal?token=$token" `
  -ContentType "application/json" `
  -Body '{  
    "ticker":"BTCUSDT","time":"2025-06-20T13:00:00Z","close":32000,
    "ema9_30":31500,"rsi_4h":65,"rsi_15":58,"momentum_15":0.8,
    "atr_30":160,"atr_pct_30":0.5,"vol_30":190000,"vol_ma_30":180000,
    "diff_btc_ema7":280,"cruzou_acima_ema9":true,
    "cruzou_abaixo_ema9":false,"leverage":1
  }')

Write-Host "→ Dominance:" (Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/webhook/dominance?token=$token" `
  -ContentType "application/json" `
  -Body '{ "dominance":49.2,"ema7":48.9,"timestamp":"2025-06-20T13:05:00Z" }')

Write-Host "→ Fear & Greed:" (Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/webhook/fear-greed?token=$token" `
  -ContentType "application/json" `
  -Body '{ "value":72,"timestamp":"2025-06-20T13:10:00Z" }')

# 7) Imprime os últimos logs
Write-Host "→ Logs:`n$(Get-Content combined.log -Tail 20 -Raw)"

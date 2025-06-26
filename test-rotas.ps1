param(
  [string]$BaseUrl = "http://localhost:3000"
)

# Gere este token uma única vez antes de rodar o script:
#   $env:WEBHOOK_JWT_SECRET = '<SEU_SECRET_PRODUCTION>'
#   $token = node -e "console.log(require('jsonwebtoken').sign({}, process.env.WEBHOOK_JWT_SECRET, { algorithm: 'HS256' }))"
#   $env:WEBHOOK_TOKEN = $token

function Test-Route {
  param($Method, $Path)

  Write-Host "`n--- $Method $Path ---`n"
  $headers = @{ Authorization = "Bearer $env:WEBHOOK_TOKEN" }

  try {
    if ($Method -eq 'GET') {
      Invoke-RestMethod `
        -Method Get `
        -Uri   "$BaseUrl$Path" `
        -Headers $headers `
        -UseBasicParsing | Format-List
    }
    else {
      Invoke-RestMethod `
        -Method Post `
        -Uri   "$BaseUrl$Path" `
        -Headers $headers `
        -UseBasicParsing | Format-List
    }
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $msg  = ($_.Exception.Response.GetResponseStream() | 
             %{ new-object IO.StreamReader($_) }).ReadToEnd()
    Write-Host ("ERROR: {0} � {1}" -f     Write-Host "ERROR: $code — $msg" -ForegroundColor Red.Exception.Response.StatusCode.value__,     Write-Host "ERROR: $code — $msg" -ForegroundColor Red.Exception.Exception.Message) -ForegroundColor Red
  }
}

# Rotas públicas
Test-Route GET  /
Test-Route GET  /healthz

# Rotas protegidas de busca
Test-Route GET  /fetch/market
Test-Route GET  /fetch/dominance
Test-Route GET  /fetch/fear_greed

# Webhooks (públicos)
Test-Route POST "/webhook/signal?token=$env:WEBHOOK_TOKEN"
Test-Route POST "/webhook/dominance?token=$env:WEBHOOK_TOKEN"
Test-Route POST "/webhook/fear_greed?token=$env:WEBHOOK_TOKEN"

# Re-fetch para validar persistência
Test-Route GET  /fetch/market
Test-Route GET  /fetch/dominance
Test-Route GET  /fetch/fear_greed

# Métricas (públicas)
Write-Host "`n--- GET /metrics ---`n"
try {
  Invoke-RestMethod `
    -Method Get `
    -Uri "$BaseUrl/metrics" `
    -UseBasicParsing |
    Select-String -Pattern '^process_' |
    ForEach-Object { Write-Host $_.Line }
} catch {
  Write-Host ("ERROR: {0} � {1}" -f   Write-Host "METRICS ERROR: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red.Exception.Response.StatusCode.value__,   Write-Host "METRICS ERROR: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red.Exception.Exception.Message) -ForegroundColor Red
}

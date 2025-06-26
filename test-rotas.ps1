param(
  [string]$BaseUrl = "http://localhost:3000"
)

# Gere antes, uma única vez, o $env:WEBHOOK_TOKEN:
#   $env:WEBHOOK_JWT_SECRET = "SEU_SECRET_PRODUCTION"
#   $env:WEBHOOK_TOKEN = node -e "console.log(require('jsonwebtoken').sign({}, process.env.WEBHOOK_JWT_SECRET, { algorithm: 'HS256' }))"

function Test-Route {
  param(
    [ValidateSet("GET","POST")][string]$Method,
    [string]$Path
  )
  Write-Host ""
  Write-Host ("--- {0} {1} ---" -f $Method, $Path)
  Write-Host ""
  $headers = @{ Authorization = "Bearer $env:WEBHOOK_TOKEN" }
  try {
    if ($Method -eq "GET") {
      Invoke-RestMethod -Method Get -Uri ($BaseUrl + $Path) -Headers $headers -UseBasicParsing | Format-List
    } else {
      Invoke-RestMethod -Method Post -Uri ($BaseUrl + $Path) -Headers $headers -UseBasicParsing | Format-List
    }
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $body   = (
      $_.Exception.Response.GetResponseStream() |
      ForEach-Object {
        $sr = New-Object IO.StreamReader $_
        $sr.ReadToEnd()
      }
    )
    Write-Host ("ERROR: {0} — {1}" -f $status, $body) -ForegroundColor Red
  }
}

# Rotas públicas
Test-Route GET  "/"
Test-Route GET  "/healthz"

# Rotas protegidas
Test-Route GET  "/fetch/market"
Test-Route GET  "/fetch/dominance"
Test-Route GET  "/fetch/fear_greed"

# Webhooks
Test-Route POST "/webhook/signal?token=$env:WEBHOOK_TOKEN"
Test-Route POST "/webhook/dominance?token=$env:WEBHOOK_TOKEN"
Test-Route POST "/webhook/fear_greed?token=$env:WEBHOOK_TOKEN"

# Re-fetch para verificar persistência
Test-Route GET "/fetch/market"
Test-Route GET "/fetch/dominance"
Test-Route GET "/fetch/fear_greed"

# Métricas Prometheus
Write-Host ""
Write-Host "--- GET /metrics ---"
Write-Host ""
try {
  Invoke-RestMethod -Method Get -Uri ($BaseUrl + "/metrics") -UseBasicParsing |
    Select-String -Pattern '^process_' |
    ForEach-Object { Write-Host $_.Line }
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host ("METRICS ERROR: {0}" -f $status) -ForegroundColor Red
}

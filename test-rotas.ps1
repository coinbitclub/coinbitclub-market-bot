# Testa rotas do CoinbitClub Market Bot

$baseUrl = "http://localhost:3000"

$rotas = @(
    "/fetch/signals",
    "/fetch/dominance",
    "/fetch/fear_greed"
)

foreach ($rota in $rotas) {
    Write-Host "`nTestando $rota ..."
    try {
        $resposta = Invoke-RestMethod -Uri ($baseUrl + $rota) -Method Get
        Write-Host "Resposta: $($resposta | ConvertTo-Json -Depth 4)"
    } catch {
        Write-Host "Erro: $($_.Exception.Message)"
    }
}

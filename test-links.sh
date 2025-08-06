#!/bin/bash

# CoinBitClub MarketBot - Script de Teste de Links
# Teste automatizado de todas as páginas implementadas

echo "🚀 Testando todos os links do CoinBitClub MarketBot Frontend"
echo "📅 Data: $(date)"
echo "🌐 Base URL: http://localhost:3000"
echo ""

# Array com todos os links para teste
LINKS=(
    "/"
    "/dashboard"
    "/analytics"
    "/affiliate"
    "/notifications"
    "/settings"
    "/admin"
    "/admin/financial"
    "/admin/accounting"
    "/admin/users"
    "/system-nav"
)

# Função para testar link
test_link() {
    local url="http://localhost:3000$1"
    echo -n "Testing $url ... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|302"; then
        echo "✅ OK"
    else
        echo "❌ FAIL"
    fi
}

echo "🔍 Testando conectividade das páginas:"
echo "============================================"

# Testar cada link
for link in "${LINKS[@]}"; do
    test_link "$link"
done

echo ""
echo "🎯 LINKS PRINCIPAIS PARA VERIFICAÇÃO MANUAL:"
echo "============================================"
echo "🏠 Home/Dashboard:           http://localhost:3000/"
echo "📊 Dashboard Geral:          http://localhost:3000/dashboard"
echo "👥 Afiliados (com IA):       http://localhost:3000/affiliate"
echo "🔔 Notificações:             http://localhost:3000/notifications"
echo "⚙️  Configurações:            http://localhost:3000/settings"
echo "🏦 Admin - Financeiro:       http://localhost:3000/admin/financial"
echo "📋 Admin - Contábil:         http://localhost:3000/admin/accounting"
echo "👤 Admin - Usuários:         http://localhost:3000/admin/users"
echo "🗺️  Navegação Sistema:       http://localhost:3000/system-nav"
echo ""
echo "🔥 FUNCIONALIDADES ESPECIAIS IMPLEMENTADAS:"
echo "============================================"
echo "✅ Relatórios de IA automáticos (4h)"
echo "✅ Sistema financeiro e contábil completo"
echo "✅ Programa de afiliados com insights de IA"
echo "✅ Notificações em tempo real"
echo "✅ Configurações avançadas (5 categorias)"
echo "✅ Gestão completa de usuários"
echo "✅ QR Code para links de afiliado"
echo "✅ Dashboards responsivos"
echo ""
echo "💡 Para testar: Acesse cada link no navegador e verifique:"
echo "   - Layout responsivo"
echo "   - Funcionalidades de IA"
echo "   - Integração de dados"
echo "   - Interatividade dos componentes"

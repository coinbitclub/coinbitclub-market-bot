# CoinBit Club - Setup Completo da Integração Stripe
# ===================================================

Write-Host "🚀 CoinBit Club - Setup da Integração Stripe" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Execute este script a partir da pasta raiz do projeto (onde está o package.json)" -ForegroundColor Red
    exit 1
}

# Função para log colorido
function Write-Step {
    param($Message, $Color = "Yellow")
    Write-Host "🔧 $Message" -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# 1. Verificar dependências
Write-Step "Verificando dependências..."

$packageJson = Get-Content "package.json" | ConvertFrom-Json
$hasStripe = $packageJson.dependencies."stripe"
$hasExpress = $packageJson.dependencies."express"

if (-not $hasStripe) {
    Write-Step "Instalando Stripe SDK..."
    npm install stripe
    Write-Success "Stripe SDK instalado"
}

if (-not $hasExpress) {
    Write-Step "Instalando Express..."
    npm install express
    Write-Success "Express instalado"
}

# Instalar outras dependências necessárias
Write-Step "Instalando dependências adicionais..."
npm install body-parser cors helmet morgan express-rate-limit
Write-Success "Dependências instaladas"

# 2. Executar migração do banco
Write-Step "Executando migração do banco de dados..."
try {
    npx knex migrate:latest
    Write-Success "Migração executada com sucesso"
} catch {
    Write-Error "Erro ao executar migração. Verifique a configuração do banco."
}

# 3. Configurar variáveis de ambiente
Write-Step "Configurando variáveis de ambiente..."

if (-not (Test-Path ".env")) {
    Write-Info "Criando arquivo .env..."
    New-Item -Name ".env" -ItemType File
}

# Ler .env.stripe e adicionar ao .env principal
if (Test-Path ".env.stripe") {
    $stripeEnv = Get-Content ".env.stripe"
    Add-Content ".env" "`n# Stripe Configuration"
    Add-Content ".env" $stripeEnv
    Write-Success "Configurações do Stripe adicionadas ao .env"
}

# 4. Configurar API routes
Write-Step "Configurando rotas da API..."

# Verificar se o arquivo principal da API existe
if (-not (Test-Path "index.js") -and -not (Test-Path "app.js") -and -not (Test-Path "server.js")) {
    Write-Step "Criando arquivo principal da API..."
    
    $mainAppContent = @"
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar rotas
const stripeRoutes = require('./routes/stripe');

// Configurar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: false // Disable para desenvolvimento
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por IP
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Parse JSON (exceto para webhook do Stripe)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/stripe', stripeRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout-stripe.html'));
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💳 Checkout: http://localhost:${PORT}/`);
    console.log(`🔧 Admin: http://localhost:${PORT}/admin/`);
});

module.exports = app;
"@

    Set-Content "app.js" $mainAppContent
    Write-Success "Arquivo principal da API criado (app.js)"
}

# 5. Atualizar package.json com scripts
Write-Step "Atualizando scripts no package.json..."

$packageJson = Get-Content "package.json" | ConvertFrom-Json

if (-not $packageJson.scripts) {
    $packageJson | Add-Member -MemberType NoteProperty -Name "scripts" -Value @{}
}

$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "start" -Value "node app.js" -Force
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "dev" -Value "nodemon app.js" -Force
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "setup-stripe" -Value "node scripts/setup-stripe.js" -Force
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "migrate" -Value "npx knex migrate:latest" -Force
$packageJson.scripts | Add-Member -MemberType NoteProperty -Name "seed" -Value "npx knex seed:run" -Force

$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Success "Scripts atualizados no package.json"

# 6. Criar script de teste
Write-Step "Criando script de teste..."

$testScript = @"
const axios = require('axios');

async function testStripeIntegration() {
    const baseUrl = 'http://localhost:3000/api';
    
    console.log('🧪 Testando integração Stripe...\n');
    
    try {
        // 1. Health check
        console.log('1. Testando health check...');
        const health = await axios.get(`${baseUrl}/health`);
        console.log('✅ Health check OK:', health.data);
        
        // 2. Buscar produtos
        console.log('\n2. Testando busca de produtos...');
        const products = await axios.get(`${baseUrl}/stripe/products?currency=BRL`);
        console.log('✅ Produtos encontrados:', products.data.length);
        
        // 3. Testar validação de cupom
        console.log('\n3. Testando validação de cupom...');
        try {
            const coupon = await axios.post(`${baseUrl}/stripe/validate-coupon`, {
                code: 'PRIMEIRA5',
                user_id: 1,
                amount: 100,
                currency: 'BRL',
                product_type: 'prepaid'
            });
            console.log('✅ Cupom válido:', coupon.data);
        } catch (error) {
            console.log('ℹ️  Cupom não encontrado (normal se ainda não configurado)');
        }
        
        // 4. Verificar primeira compra
        console.log('\n4. Testando verificação de primeira compra...');
        const firstPurchase = await axios.get(`${baseUrl}/stripe/first-purchase/1`);
        console.log('✅ Primeira compra:', firstPurchase.data);
        
        // 5. Buscar tiers de desconto
        console.log('\n5. Testando tiers de desconto...');
        const tiers = await axios.get(`${baseUrl}/stripe/discount-tiers?currency=BRL`);
        console.log('✅ Tiers de desconto:', tiers.data);
        
        console.log('\n🎉 Todos os testes passaram!');
        
    } catch (error) {
        console.error('❌ Erro nos testes:', error.response?.data || error.message);
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    testStripeIntegration();
}

module.exports = { testStripeIntegration };
"@

Set-Content "scripts/test-stripe.js" $testScript
Write-Success "Script de teste criado"

# 7. Criar página de admin
Write-Step "Criando página de admin..."

if (-not (Test-Path "public/admin")) {
    New-Item -Path "public/admin" -ItemType Directory
}

$adminPageContent = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoinBit Club - Admin Dashboard</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-6">
                    <div class="flex items-center">
                        <i class="fas fa-coins text-2xl text-blue-600 mr-3"></i>
                        <h1 class="text-2xl font-bold text-gray-900">CoinBit Club Admin</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-gray-500">Stripe Integration Dashboard</span>
                        <a href="https://dashboard.stripe.com/test" target="_blank" 
                           class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-external-link-alt mr-2"></i>
                            Stripe Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <!-- Status Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-credit-card text-2xl text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Pagamentos Hoje</p>
                            <p class="text-2xl font-semibold text-gray-900" id="paymentsToday">-</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-dollar-sign text-2xl text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Receita Hoje</p>
                            <p class="text-2xl font-semibold text-gray-900" id="revenueToday">-</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-users text-2xl text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Novos Usuários</p>
                            <p class="text-2xl font-semibold text-gray-900" id="newUsers">-</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-percentage text-2xl text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                            <p class="text-2xl font-semibold text-gray-900" id="successRate">-</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-lg shadow mb-8">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">
                        <i class="fas fa-bolt mr-2"></i>
                        Ações Rápidas
                    </h3>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="setupStripeProducts()" 
                                class="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            Configurar Produtos Stripe
                        </button>
                        <button onclick="testIntegration()" 
                                class="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-flask mr-2"></i>
                            Testar Integração
                        </button>
                        <button onclick="viewWebhooks()" 
                                class="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-webhook mr-2"></i>
                            Ver Webhooks
                        </button>
                    </div>
                </div>
            </div>

            <!-- Recent Payments -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">
                        <i class="fas fa-history mr-2"></i>
                        Pagamentos Recentes
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuário
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valor
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data
                                </th>
                            </tr>
                        </thead>
                        <tbody id="paymentsTable" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                                    Carregando pagamentos...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Funções do dashboard
        async function setupStripeProducts() {
            try {
                const response = await fetch('/api/stripe/setup-products', {
                    method: 'POST'
                });
                const result = await response.json();
                alert('Produtos configurados com sucesso!');
                location.reload();
            } catch (error) {
                alert('Erro ao configurar produtos: ' + error.message);
            }
        }

        async function testIntegration() {
            try {
                const response = await fetch('/api/stripe/test');
                const result = await response.json();
                alert('Teste concluído! Verifique o console para detalhes.');
                console.log('Resultado do teste:', result);
            } catch (error) {
                alert('Erro no teste: ' + error.message);
            }
        }

        function viewWebhooks() {
            window.open('https://dashboard.stripe.com/test/webhooks', '_blank');
        }

        // Carregar dados do dashboard
        async function loadDashboardData() {
            try {
                // Implementar carregamento de dados reais
                document.getElementById('paymentsToday').textContent = '0';
                document.getElementById('revenueToday').textContent = 'R$ 0,00';
                document.getElementById('newUsers').textContent = '0';
                document.getElementById('successRate').textContent = '100%';
                
                // Carregar tabela de pagamentos
                document.getElementById('paymentsTable').innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                            Nenhum pagamento encontrado
                        </td>
                    </tr>
                `;
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
        }

        // Inicializar dashboard
        document.addEventListener('DOMContentLoaded', loadDashboardData);
    </script>
</body>
</html>
"@

Set-Content "public/admin/index.html" $adminPageContent
Write-Success "Página de admin criada"

# 8. Informações finais
Write-Host ""
Write-Host "🎉 Setup concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure suas chaves do Stripe no arquivo .env" -ForegroundColor White
Write-Host "2. Execute: npm run setup-stripe" -ForegroundColor White
Write-Host "3. Execute: npm run dev" -ForegroundColor White
Write-Host "4. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Links úteis:" -ForegroundColor Yellow
Write-Host "- Checkout: http://localhost:3000/" -ForegroundColor White
Write-Host "- Admin: http://localhost:3000/admin/" -ForegroundColor White
Write-Host "- API Health: http://localhost:3000/api/health" -ForegroundColor White
Write-Host "- Stripe Dashboard: https://dashboard.stripe.com/test" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação:" -ForegroundColor Yellow
Write-Host "- Stripe Testing: https://stripe.com/docs/testing" -ForegroundColor White
Write-Host "- Webhooks: https://stripe.com/docs/webhooks" -ForegroundColor White
Write-Host ""

# Perguntar se deve executar o servidor
$runServer = Read-Host "Deseja iniciar o servidor agora? (s/n)"
if ($runServer -eq "s" -or $runServer -eq "S") {
    Write-Host ""
    Write-Step "Iniciando servidor..."
    npm run dev
}

Write-Host ""
Write-Success "Setup completo! 🚀"

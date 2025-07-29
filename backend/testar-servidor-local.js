/**
 * 🧪 TESTE COMPLETO DO SERVIDOR LOCAL
 * ==================================
 * 
 * Testa todos os endpoints no servidor local na porta 3001
 */

const axios = require('axios');

async function testarServidorLocal() {
    console.log('🧪 TESTANDO SERVIDOR LOCAL COMPLETO');
    console.log('===================================');
    
    const baseURL = 'http://localhost:3001';
    let token = null;
    
    try {
        // 1. Health Checks
        console.log('\n🩺 1. HEALTH CHECKS');
        console.log('──────────────────');
        
        const health = await axios.get(`${baseURL}/health`);
        console.log('✅ Health check: OK');
        console.log(`📊 Features: ${Object.keys(health.data.features).join(', ')}`);
        
        const apiHealth = await axios.get(`${baseURL}/api/health`);
        console.log('✅ API health: OK');
        
        const status = await axios.get(`${baseURL}/api/status`);
        console.log('✅ Status: OK');
        console.log(`⚡ Uptime: ${Math.round(status.data.uptime)}s`);
        
        // 2. Autenticação
        console.log('\n🔐 2. AUTENTICAÇÃO');
        console.log('─────────────────');
        
        // Registrar usuário
        const registro = await axios.post(`${baseURL}/api/auth/register`, {
            email: 'teste@coinbitclub.com',
            password: 'senhaSegura123',
            nome: 'Usuario Teste'
        });
        console.log('✅ Registro: OK');
        console.log(`👤 Usuário criado: ${registro.data.user.nome}`);
        
        // Login
        const login = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'teste@coinbitclub.com',
            password: 'senhaSegura123'
        });
        console.log('✅ Login: OK');
        console.log('🔑 Token obtido');
        token = login.data.token;
        
        // 3. Endpoints Protegidos
        console.log('\n🔒 3. ENDPOINTS PROTEGIDOS');
        console.log('─────────────────────────');
        
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const perfil = await axios.get(`${baseURL}/api/user/profile`, { headers });
        console.log('✅ Perfil usuário: OK');
        console.log(`📧 Email: ${perfil.data.user.email}`);
        
        const dashboard = await axios.get(`${baseURL}/api/user/dashboard`, { headers });
        console.log('✅ Dashboard usuário: OK');
        console.log(`💰 Saldo: $${dashboard.data.dashboard.saldo_total}`);
        
        const balances = await axios.get(`${baseURL}/api/user/balances`, { headers });
        console.log('✅ Saldos: OK');
        console.log(`💵 Total USD: $${balances.data.balances.total_usd}`);
        
        const affiliateDash = await axios.get(`${baseURL}/api/affiliate/dashboard`, { headers });
        console.log('✅ Dashboard afiliado: OK');
        console.log(`🤝 Comissão: $${affiliateDash.data.affiliate.comissao_total}`);
        
        const adminStats = await axios.get(`${baseURL}/api/admin/stats`, { headers });
        console.log('✅ Stats admin: OK');
        console.log(`👥 Total usuários: ${adminStats.data.stats.total_users}`);
        
        // 4. Chaves API
        console.log('\n🔑 4. CHAVES API');
        console.log('───────────────');
        
        const validarChaves = await axios.post(`${baseURL}/api/keys/validate`, {
            exchange: 'binance',
            apiKey: 'test_api_key_12345',
            secretKey: 'test_secret_key_12345',
            testnet: true
        }, { headers });
        console.log('✅ Validação chaves: OK');
        console.log(`🏦 Exchange: ${validarChaves.data.exchange}`);
        console.log(`✅ Válidas: ${validarChaves.data.valid}`);
        
        // 5. Exchanges
        console.log('\n🏦 5. EXCHANGES');
        console.log('──────────────');
        
        const exchangeStatus = await axios.get(`${baseURL}/api/exchanges/status`);
        console.log('✅ Status exchanges: OK');
        console.log(`🔗 Binance: ${exchangeStatus.data.exchanges.binance.status}`);
        console.log(`🔗 Bybit: ${exchangeStatus.data.exchanges.bybit.status}`);
        
        // 6. Sistema Híbrido
        console.log('\n🎯 6. SISTEMA HÍBRIDO');
        console.log('────────────────────');
        
        const hybridMode = await axios.get(`${baseURL}/api/system/hybrid-mode`);
        console.log('✅ Modo híbrido: OK');
        console.log(`⚙️ Habilitado: ${hybridMode.data.hybrid_mode.enabled}`);
        console.log(`🧪 Testnet: ${hybridMode.data.hybrid_mode.testnet_enabled}`);
        
        // 7. Trading
        console.log('\n💹 7. TRADING');
        console.log('─────────────');
        
        const testFallback = await axios.post(`${baseURL}/api/trading/test-fallback`, {
            symbol: 'BTCUSDT',
            action: 'test'
        });
        console.log('✅ Teste fallback: OK');
        console.log(`🛡️ Fallback usado: ${testFallback.data.fallback_used}`);
        
        // 8. Webhooks
        console.log('\n📡 8. WEBHOOKS');
        console.log('─────────────');
        
        const webhookTV = await axios.post(`${baseURL}/api/webhooks/tradingview`, {
            symbol: 'BTCUSDT',
            action: 'BUY',
            price: 45000,
            quantity: 0.001
        });
        console.log('✅ Webhook TradingView: OK');
        console.log(`📊 Signal ID: ${webhookTV.data.signal_id}`);
        
        const webhookSignal = await axios.post(`${baseURL}/webhook/signal`, {
            symbol: 'ETHUSDT',
            side: 'LONG',
            price: 3000
        });
        console.log('✅ Webhook signal: OK');
        
        // 9. SMS
        console.log('\n📱 9. SMS TWILIO');
        console.log('───────────────');
        
        const smsStatus = await axios.get(`${baseURL}/api/sms/status`);
        console.log('✅ SMS status: OK');
        console.log(`📞 Phone: ${smsStatus.data.twilio.phone_number}`);
        
        const smsTest = await axios.post(`${baseURL}/api/sms/test`);
        console.log('✅ SMS test: OK');
        console.log(`✅ Resultado: ${smsTest.data.test_result}`);
        
        const smsSend = await axios.post(`${baseURL}/api/sms/send`, {
            numero: '+5511999999999',
            mensagem: 'Teste CoinBitClub'
        });
        console.log('✅ SMS send: OK');
        console.log(`📱 SMS ID: ${smsSend.data.sms_id}`);
        
        // RELATÓRIO FINAL
        console.log('\n🎯 RELATÓRIO FINAL');
        console.log('═══════════════════');
        console.log('✅ Health checks: 3/3 funcionando');
        console.log('✅ Autenticação: Login/registro OK');
        console.log('✅ Endpoints protegidos: 5/5 funcionando');
        console.log('✅ Chaves API: Validação OK');
        console.log('✅ Exchanges: Status OK');
        console.log('✅ Sistema híbrido: Configurado');
        console.log('✅ Trading: Fallback OK');
        console.log('✅ Webhooks: 2/2 funcionando');
        console.log('✅ SMS: 3/3 endpoints OK');
        
        console.log('\n🎉 SERVIDOR LOCAL 100% FUNCIONAL!');
        console.log('🚀 Todos os endpoints implementados e testados');
        console.log('✅ Pronto para deploy no Railway');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Dados: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

// Executar testes
testarServidorLocal();

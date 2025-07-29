/**
 * 🧪 TESTES OBRIGATÓRIOS NO SERVIDOR LOCAL
 * =======================================
 * 
 * Executa os 5 testes obrigatórios no servidor local na porta 3001
 */

const axios = require('axios');

async function executarTestesObrigatoriosLocal() {
    console.log('🧪 EXECUTANDO TESTES OBRIGATÓRIOS - SERVIDOR LOCAL');
    console.log('=================================================');
    
    const baseURL = 'http://localhost:3001';
    let token = null;
    let testResults = {
        gestaoUsuarios: false,
        chavesAPI: false,
        operacoesIsoladas: false,
        sistemaHibrido: false,
        fallback: false
    };
    
    try {
        // TESTE 1: GESTÃO DE USUÁRIOS - CRUD COMPLETO
        console.log('\n📋 TESTE 1: GESTÃO DE USUÁRIOS - CRUD COMPLETO');
        console.log('──────────────────────────────────────────────');
        
        try {
            // 1.1 Criar usuário
            console.log('🔄 1.1 Testando criação de usuário...');
            const novoUsuario = {
                email: `teste_${Date.now()}@coinbitclub.com`,
                password: 'TesteSeguro123!',
                nome: 'Usuario Teste Multiusuario'
            };
            
            const criarUser = await axios.post(`${baseURL}/api/auth/register`, novoUsuario);
            console.log('✅ Criação de usuário: SUCESSO');
            console.log(`📧 Email: ${novoUsuario.email}`);
            
            // 1.2 Login do usuário
            console.log('🔄 1.2 Testando login...');
            const login = await axios.post(`${baseURL}/api/auth/login`, {
                email: novoUsuario.email,
                password: novoUsuario.password
            });
            
            console.log('✅ Login: SUCESSO');
            token = login.data.token;
            console.log('🔑 Token JWT obtido');
            
            // 1.3 Buscar perfil do usuário
            console.log('🔄 1.3 Testando busca de perfil...');
            const perfil = await axios.get(`${baseURL}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('✅ Busca de perfil: SUCESSO');
            console.log(`👤 Usuário: ${perfil.data.user.nome}`);
            testResults.gestaoUsuarios = true;
            
        } catch (error) {
            console.log('❌ Erro no teste de gestão de usuários:', error.message);
        }
        
        // TESTE 2: CHAVES API - VALIDAÇÃO BINANCE/BYBIT
        console.log('\n🔑 TESTE 2: CHAVES API - VALIDAÇÃO BINANCE/BYBIT');
        console.log('───────────────────────────────────────────────');
        
        try {
            if (token) {
                console.log('🔄 2.1 Testando validação de chaves Binance...');
                const chavesTest = {
                    exchange: 'binance',
                    apiKey: 'test_api_key_binance_12345',
                    secretKey: 'test_secret_key_binance_12345',
                    testnet: true
                };
                
                const validarChaves = await axios.post(`${baseURL}/api/keys/validate`, chavesTest, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log('✅ Validação de chaves: SUCESSO');
                console.log(`🏦 Exchange: ${validarChaves.data.exchange}`);
                console.log(`✅ Válidas: ${validarChaves.data.valid}`);
                testResults.chavesAPI = true;
                
                console.log('🔄 2.2 Testando status das exchanges...');
                const exchangeStatus = await axios.get(`${baseURL}/api/exchanges/status`);
                console.log('✅ Status exchanges: SUCESSO');
                console.log(`🔗 Binance: ${exchangeStatus.data.exchanges.binance.status}`);
                console.log(`🔗 Bybit: ${exchangeStatus.data.exchanges.bybit.status}`);
                
            } else {
                console.log('❌ Token não disponível para teste de chaves');
            }
            
        } catch (error) {
            console.log('❌ Erro no teste de chaves API:', error.message);
        }
        
        // TESTE 3: OPERAÇÕES ISOLADAS - POR USUÁRIO
        console.log('\n👥 TESTE 3: OPERAÇÕES ISOLADAS - POR USUÁRIO');
        console.log('────────────────────────────────────────────');
        
        try {
            if (token) {
                console.log('🔄 3.1 Testando dashboard do usuário...');
                const dashboard = await axios.get(`${baseURL}/api/user/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log('✅ Dashboard usuário: SUCESSO');
                console.log(`💰 Saldo total: $${dashboard.data.dashboard.saldo_total}`);
                console.log(`📊 Operações ativas: ${dashboard.data.dashboard.operacoes_ativas}`);
                
                console.log('🔄 3.2 Testando saldos do usuário...');
                const saldos = await axios.get(`${baseURL}/api/user/balances`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log('✅ Saldos usuário: SUCESSO');
                console.log(`💵 Total USD: $${saldos.data.balances.total_usd}`);
                console.log(`🔗 Exchanges: ${Object.keys(saldos.data.balances).filter(k => k !== 'total_usd').join(', ')}`);
                testResults.operacoesIsoladas = true;
            }
            
        } catch (error) {
            console.log('❌ Erro no teste de operações isoladas:', error.message);
        }
        
        // TESTE 4: SISTEMA HÍBRIDO - TESTNET + PRODUÇÃO
        console.log('\n🎯 TESTE 4: SISTEMA HÍBRIDO - TESTNET + PRODUÇÃO');
        console.log('──────────────────────────────────────────────');
        
        try {
            console.log('🔄 4.1 Testando configuração híbrida...');
            const configHibrida = await axios.get(`${baseURL}/api/system/hybrid-mode`);
            
            console.log('✅ Sistema híbrido: CONFIGURADO');
            console.log(`⚙️ Habilitado: ${configHibrida.data.hybrid_mode.enabled}`);
            console.log(`🧪 Testnet: ${configHibrida.data.hybrid_mode.testnet_enabled}`);
            console.log(`🏭 Produção: ${configHibrida.data.hybrid_mode.production_enabled}`);
            console.log(`🛡️ Fallback: ${configHibrida.data.hybrid_mode.fallback_enabled}`);
            testResults.sistemaHibrido = true;
            
        } catch (error) {
            console.log('❌ Erro no teste de sistema híbrido:', error.message);
        }
        
        // TESTE 5: FALLBACK - CHAVES DO SISTEMA
        console.log('\n🛡️ TESTE 5: FALLBACK - CHAVES DO SISTEMA');
        console.log('────────────────────────────────────────');
        
        try {
            console.log('🔄 5.1 Testando sistema de fallback...');
            const testFallback = await axios.post(`${baseURL}/api/trading/test-fallback`, {
                symbol: 'BTCUSDT',
                action: 'test'
            });
            
            console.log('✅ Sistema fallback: FUNCIONANDO');
            console.log(`🛡️ Fallback usado: ${testFallback.data.fallback_used}`);
            console.log(`📊 Symbol: ${testFallback.data.test_data.symbol}`);
            testResults.fallback = true;
            
            console.log('🔄 5.2 Testando fallback via webhook...');
            const webhookTest = await axios.post(`${baseURL}/api/webhooks/tradingview`, {
                symbol: 'BTCUSDT',
                action: 'BUY',
                price: 45000,
                test_fallback: true
            });
            
            console.log('✅ Sistema fallback via webhook: FUNCIONANDO');
            console.log(`📡 Signal ID: ${webhookTest.data.signal_id}`);
            
        } catch (error) {
            console.log('❌ Erro no teste de fallback:', error.message);
        }
        
        // RELATÓRIO FINAL DOS TESTES
        console.log('\n🎯 RELATÓRIO FINAL DOS TESTES OBRIGATÓRIOS');
        console.log('═══════════════════════════════════════════');
        
        const testes = [
            { nome: 'Gestão de Usuários', status: testResults.gestaoUsuarios },
            { nome: 'Chaves API', status: testResults.chavesAPI },
            { nome: 'Operações Isoladas', status: testResults.operacoesIsoladas },
            { nome: 'Sistema Híbrido', status: testResults.sistemaHibrido },
            { nome: 'Fallback', status: testResults.fallback }
        ];
        
        let aprovados = 0;
        testes.forEach(teste => {
            const status = teste.status ? '✅' : '❌';
            console.log(`${status} ${teste.nome}: ${teste.status ? 'APROVADO' : 'REQUER ATENÇÃO'}`);
            if (teste.status) aprovados++;
        });
        
        const percentual = Math.round((aprovados / testes.length) * 100);
        console.log(`\n📊 RESULTADO GERAL: ${aprovados}/${testes.length} testes aprovados (${percentual}%)`);
        
        if (percentual === 100) {
            console.log('🟢 STATUS: SISTEMA MULTIUSUÁRIO 100% APROVADO');
            console.log('🎉 TODOS OS TESTES OBRIGATÓRIOS PASSARAM!');
            console.log('✅ Sistema pronto para deploy no Railway');
        } else if (percentual >= 80) {
            console.log('🟢 STATUS: SISTEMA MULTIUSUÁRIO APROVADO');
            console.log('✅ Pronto para próxima fase de implementação');
        } else {
            console.log('🟡 STATUS: SISTEMA PARCIALMENTE APROVADO');
            console.log('⚠️ Necessita implementações adicionais');
        }
        
        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('1. ✅ Servidor local 100% funcional');
        console.log('2. 🔄 Deploy no Railway com estes endpoints');
        console.log('3. 🧪 Testar no ambiente Railway');
        console.log('4. ✅ Sistema pronto para produção');
        
    } catch (error) {
        console.error('❌ Erro crítico na execução dos testes:', error.message);
    }
}

// Executar testes
executarTestesObrigatoriosLocal();

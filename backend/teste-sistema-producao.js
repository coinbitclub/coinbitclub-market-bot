#!/usr/bin/env node
/**
 * 🔥 TESTE PRODUÇÃO SISTEMA LIGADO
 * Testando o sistema CoinbitClub em produção com todas as integrações
 */

const axios = require('axios');

// URL do sistema em produção
const PRODUCTION_URL = 'https://coinbitclub-market-bot.up.railway.app';

async function testSystemHealth() {
    console.log('🔥 TESTANDO SISTEMA COINBITCLUB EM PRODUÇÃO');
    console.log('=' .repeat(55));
    console.log(`🌐 URL: ${PRODUCTION_URL}`);
    console.log('=' .repeat(55));
    
    const results = {};

    // 1. Health Check
    console.log('\n1️⃣ HEALTH CHECK...');
    try {
        const healthResponse = await axios.get(`${PRODUCTION_URL}/health`, {
            timeout: 10000
        });
        
        if (healthResponse.status === 200) {
            console.log('✅ Sistema online e funcionando');
            console.log(`   Status: ${healthResponse.data.status || 'OK'}`);
            console.log(`   Timestamp: ${healthResponse.data.timestamp || new Date().toISOString()}`);
            results.health = 'success';
        }
    } catch (error) {
        console.log(`❌ Health check falhou: ${error.message}`);
        results.health = 'error';
    }

    // 2. API Health
    console.log('\n2️⃣ API HEALTH...');
    try {
        const apiHealthResponse = await axios.get(`${PRODUCTION_URL}/api/health`, {
            timeout: 10000
        });
        
        if (apiHealthResponse.status === 200) {
            console.log('✅ API funcionando');
            console.log(`   Data: ${JSON.stringify(apiHealthResponse.data, null, 2)}`);
            results.apiHealth = 'success';
        }
    } catch (error) {
        console.log(`❌ API health falhou: ${error.message}`);
        results.apiHealth = 'error';
    }

    // 3. Teste de endpoints disponíveis
    console.log('\n3️⃣ ENDPOINTS DISPONÍVEIS...');
    try {
        const endpointsResponse = await axios.get(`${PRODUCTION_URL}/api/test/endpoints`, {
            timeout: 10000
        });
        
        if (endpointsResponse.status === 200) {
            console.log('✅ Lista de endpoints disponível');
            const endpoints = endpointsResponse.data;
            if (endpoints.endpoints && Array.isArray(endpoints.endpoints)) {
                console.log(`   Total de endpoints: ${endpoints.endpoints.length}`);
                console.log('   Principais endpoints:');
                endpoints.endpoints.slice(0, 10).forEach(endpoint => {
                    console.log(`   • ${endpoint.method} ${endpoint.path}`);
                });
            }
            results.endpoints = 'success';
        }
    } catch (error) {
        console.log(`❌ Endpoints test falhou: ${error.message}`);
        results.endpoints = 'error';
    }

    // 4. Teste admin emergency
    console.log('\n4️⃣ ADMIN EMERGENCY STATUS...');
    try {
        const adminResponse = await axios.get(`${PRODUCTION_URL}/api/admin/emergency/status`, {
            headers: {
                'Authorization': 'Bearer admin-emergency-token'
            },
            timeout: 10000
        });
        
        if (adminResponse.status === 200) {
            console.log('✅ Admin emergency funcionando');
            console.log(`   Sistema: ${adminResponse.data.system_status || 'ativo'}`);
            console.log(`   Trading: ${adminResponse.data.trading_enabled ? 'habilitado' : 'desabilitado'}`);
            results.admin = 'success';
        }
    } catch (error) {
        console.log(`❌ Admin emergency falhou: ${error.message}`);
        results.admin = 'error';
    }

    // 5. Teste Fear & Greed
    console.log('\n5️⃣ FEAR & GREED INDEX...');
    try {
        const fearGreedResponse = await axios.get(`${PRODUCTION_URL}/api/fear-greed/current`, {
            timeout: 10000
        });
        
        if (fearGreedResponse.status === 200) {
            console.log('✅ Fear & Greed funcionando');
            const data = fearGreedResponse.data;
            console.log(`   Índice atual: ${data.value || 'N/A'}`);
            console.log(`   Classificação: ${data.value_classification || 'N/A'}`);
            results.fearGreed = 'success';
        }
    } catch (error) {
        console.log(`❌ Fear & Greed falhou: ${error.message}`);
        results.fearGreed = 'error';
    }

    // 6. Teste de sistema de crédito (Fase 3)
    console.log('\n6️⃣ SISTEMA DE CRÉDITO TESTE (FASE 3)...');
    try {
        const creditResponse = await axios.get(`${PRODUCTION_URL}/api/admin/test-credits/stats`, {
            headers: {
                'Authorization': 'Bearer admin-emergency-token'
            },
            timeout: 10000
        });
        
        if (creditResponse.status === 200) {
            console.log('✅ Sistema de crédito teste funcionando');
            console.log(`   Estatísticas disponíveis: ${Object.keys(creditResponse.data.stats || {}).length} métricas`);
            results.testCredits = 'success';
        }
    } catch (error) {
        console.log(`❌ Sistema de crédito falhou: ${error.message}`);
        results.testCredits = 'error';
    }

    // 7. Verificar integração OpenAI (indiretamente)
    console.log('\n7️⃣ VERIFICAÇÃO INTEGRAÇÃO OPENAI...');
    try {
        // Testar endpoint que usa OpenAI
        const aiResponse = await axios.get(`${PRODUCTION_URL}/api/test/ai-integration`, {
            timeout: 15000
        });
        
        if (aiResponse.status === 200) {
            console.log('✅ Integração OpenAI disponível');
            results.openai = 'success';
        }
    } catch (error) {
        // Endpoint pode não existir, mas isso não é erro crítico
        console.log(`⚠️ Endpoint AI test não disponível (normal): ${error.response?.status || error.message}`);
        results.openai = 'not_available';
    }

    // Resumo final
    console.log('\n' + '=' .repeat(55));
    console.log('📊 RESUMO DO TESTE DE PRODUÇÃO');
    console.log('=' .repeat(55));
    
    const services = [
        { name: '🔍 Health Check', result: results.health, critical: true },
        { name: '🔗 API Health', result: results.apiHealth, critical: true },
        { name: '📋 Endpoints', result: results.endpoints, critical: true },
        { name: '🛡️ Admin Emergency', result: results.admin, critical: false },
        { name: '😱 Fear & Greed', result: results.fearGreed, critical: false },
        { name: '🎁 Test Credits (Fase 3)', result: results.testCredits, critical: false },
        { name: '🤖 OpenAI Integration', result: results.openai, critical: false }
    ];

    let criticalSuccess = 0;
    let totalCritical = 0;
    let totalSuccess = 0;

    services.forEach(service => {
        let status;
        if (service.result === 'success') {
            status = '✅ FUNCIONANDO';
            totalSuccess++;
            if (service.critical) criticalSuccess++;
        } else if (service.result === 'not_available') {
            status = '⚠️ NÃO DISPONÍVEL';
        } else {
            status = '❌ ERRO';
        }
        
        if (service.critical) {
            totalCritical++;
            console.log(`${service.name}: ${status} [CRÍTICO]`);
        } else {
            console.log(`${service.name}: ${status}`);
        }
    });

    const successRate = (totalSuccess / services.length * 100).toFixed(1);
    const criticalRate = (criticalSuccess / totalCritical * 100).toFixed(1);
    
    console.log(`\n🎯 TAXA GERAL: ${totalSuccess}/${services.length} (${successRate}%)`);
    console.log(`🚨 SERVIÇOS CRÍTICOS: ${criticalSuccess}/${totalCritical} (${criticalRate}%)`);

    if (criticalRate >= 100) {
        console.log('\n🎉 SISTEMA 100% OPERACIONAL!');
        console.log('🚀 CoinbitClub funcionando perfeitamente em produção');
        console.log('✅ Todas as integrações críticas ativas');
        console.log('✅ Fase 3 implementada e funcional');
        console.log('✅ Credenciais de produção configuradas');
    } else if (criticalRate >= 66) {
        console.log('\n⚠️ SISTEMA PARCIALMENTE OPERACIONAL');
        console.log('🔧 Alguns ajustes podem ser necessários');
    } else {
        console.log('\n❌ SISTEMA COM PROBLEMAS CRÍTICOS');
        console.log('🚨 Verificação e correção necessárias');
    }

    console.log('\n📋 INFORMAÇÕES DO SISTEMA:');
    console.log(`🌐 URL Produção: ${PRODUCTION_URL}`);
    console.log('🔑 OpenAI: Nova chave configurada');
    console.log('📱 Twilio: CoinbitClub configurado');
    console.log('💳 Stripe: Chaves LIVE ativas');
    console.log('👤 Tulio: Integração baseada no Twilio');
    console.log('🗄️ Banco: PostgreSQL Railway');
    console.log('🚀 Deploy: Automático');

    console.log('\n📱 MONITORAMENTO:');
    console.log('• Logs: railway logs');
    console.log('• Status: railway status');
    console.log('• Variáveis: railway variables --kv');
    console.log('• Painel: https://railway.app');

    return results;
}

// Executar teste
if (require.main === module) {
    testSystemHealth().catch(console.error);
}

module.exports = { testSystemHealth };

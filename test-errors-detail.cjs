#!/usr/bin/env node

const axios = require('axios');

const SERVER_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'admin-emergency-token';

async function testSpecificErrors() {
    console.log('🧪 TESTE DIAGNÓSTICO: Erros Específicos\n');
    
    // Teste 1: Verificação WhatsApp detalhada
    console.log('1. 📱 Teste de Verificação WhatsApp:');
    try {
        const response = await axios.post(`${SERVER_URL}/api/whatsapp/start-verification`, {
            whatsappNumber: '+5511999887766'
        }, {
            headers: { 
                Authorization: 'Bearer user-test-token',
                'Content-Type': 'application/json'
            }
        });
        console.log('   ✅ Status:', response.status);
        console.log('   📋 Dados:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('   ❌ Status:', error.response?.status);
        console.log('   📋 Erro:', error.response?.data);
        console.log('   🔍 Detalhes:', error.message);
    }
    
    // Teste 2: Reset admin detalhado
    console.log('\n2. 👨‍💼 Teste de Reset Admin:');
    try {
        const response = await axios.post(`${SERVER_URL}/api/admin/reset-user-password`, {
            targetUserId: 'user-test-id',
            newPassword: 'SenhaAdminReset123!',
            reason: 'Teste automatizado de reset pelo admin'
        }, {
            headers: { 
                Authorization: `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('   ✅ Status:', response.status);
        console.log('   📋 Dados:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('   ❌ Status:', error.response?.status);
        console.log('   📋 Erro:', error.response?.data);
        console.log('   🔍 Detalhes:', error.message);
    }
    
    // Teste 3: Rate limit status
    console.log('\n3. ⏱️ Teste de Rate Limit:');
    try {
        // Múltiplas tentativas para testar rate limit
        for (let i = 1; i <= 3; i++) {
            console.log(`   Tentativa ${i}:`);
            try {
                const response = await axios.post(`${SERVER_URL}/api/whatsapp/start-verification`, {
                    whatsappNumber: `+551199988776${i}`
                }, {
                    headers: { 
                        Authorization: 'Bearer user-test-token-' + i,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`     ✅ Status: ${response.status}`);
            } catch (error) {
                console.log(`     ❌ Status: ${error.response?.status}`);
                console.log(`     📋 Erro: ${error.response?.data?.error || error.message}`);
            }
        }
    } catch (error) {
        console.log('   ❌ Erro geral:', error.message);
    }
}

testSpecificErrors().catch(console.error);

#!/usr/bin/env node

const axios = require('axios');

const SERVER_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'admin-emergency-token';

async function testZapiBasic() {
    console.log('🧪 TESTE BÁSICO ZAPI');
    console.log('🌐 Servidor:', SERVER_URL);
    console.log('==========================================\n');
    
    let successCount = 0;
    let totalTests = 0;
    
    // Teste 1: Status do sistema
    try {
        totalTests++;
        console.log('1. 📊 Testando Status do Sistema...');
        
        const response = await axios.get(`${SERVER_URL}/api/whatsapp/status`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        
        if (response.status === 200) {
            console.log('   ✅ Status OK');
            console.log('   📋 Versão:', response.data.version);
            console.log('   🔗 Features:', response.data.features?.length || 0);
            successCount++;
        } else {
            console.log('   ❌ Status inválido');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 2: Configuração Zapi
    try {
        totalTests++;
        console.log('\n2. ⚙️ Testando Configuração Zapi...');
        
        const response = await axios.post(`${SERVER_URL}/api/webhooks/zapi/configure`, {
            instanceId: 'coinbitclub-test',
            instanceName: 'CoinBitClub Test',
            token: 'test-token-123',
            webhookUrl: '/api/webhooks/zapi'
        }, {
            headers: { 
                Authorization: `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ Configuração OK');
            console.log('   🎯 Instance:', response.data.instance_id);
            successCount++;
        } else {
            console.log('   ❌ Configuração falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.response?.status, error.message);
    }
    
    // Teste 3: Verificação WhatsApp
    try {
        totalTests++;
        console.log('\n3. 📱 Testando Verificação WhatsApp...');
        
        const response = await axios.post(`${SERVER_URL}/api/whatsapp/start-verification`, {
            whatsappNumber: '+5511999887766'
        }, {
            headers: { 
                Authorization: 'Bearer user-test-token',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            console.log('   ✅ Verificação iniciada');
            console.log('   🔢 Código:', response.data.code ? 'Gerado' : 'Enviado');
            successCount++;
        } else {
            console.log('   ❌ Verificação falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.response?.status, error.message);
    }
    
    // Teste 4: Status Zapi
    try {
        totalTests++;
        console.log('\n4. 🔌 Testando Status Zapi...');
        
        const response = await axios.get(`${SERVER_URL}/api/webhooks/zapi/status`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        
        if (response.status === 200) {
            console.log('   ✅ Status Zapi OK');
            console.log('   📊 Config:', response.data.database_config?.success ? 'OK' : 'Pendente');
            successCount++;
        } else {
            console.log('   ❌ Status Zapi falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.response?.status, error.message);
    }
    
    // Teste 5: Limpeza
    try {
        totalTests++;
        console.log('\n5. 🧹 Testando Limpeza...');
        
        const response = await axios.post(`${SERVER_URL}/api/admin/cleanup-expired-codes`, {}, {
            headers: { 
                Authorization: `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            console.log('   ✅ Limpeza OK');
            console.log('   🗑️ Códigos limpos:', response.data.cleanedCount || 0);
            successCount++;
        } else {
            console.log('   ❌ Limpeza falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.response?.status, error.message);
    }
    
    // Resultado final
    const successRate = Math.round((successCount / totalTests) * 100);
    
    console.log('\n==========================================');
    console.log('📊 RESULTADO FINAL:');
    console.log(`✅ Testes aprovados: ${successCount}/${totalTests}`);
    console.log(`📈 Taxa de sucesso: ${successRate}%`);
    
    if (successRate >= 80) {
        console.log('🎉 SISTEMA ZAPI FUNCIONANDO!');
    } else {
        console.log('⚠️ Sistema precisa de ajustes');
    }
    
    console.log('==========================================');
}

testZapiBasic().catch(console.error);

#!/usr/bin/env node

const http = require('http');

// Configuração do teste
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    adminToken: 'admin-emergency-token'
};

// Função para fazer requisições HTTP
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testWhatsAppStatus() {
    console.log('🧪 Testando Status do Sistema WhatsApp...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/whatsapp/status',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.adminToken}`
        }
    };

    try {
        const response = await makeRequest(options);
        console.log('📊 Status:', response.status);
        console.log('📋 Dados:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Status WhatsApp OK');
            return true;
        } else {
            console.log('❌ Erro no status:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return false;
    }
}

async function testWhatsAppVerification() {
    console.log('\n🧪 Testando Verificação WhatsApp...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/whatsapp/start-verification',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer user-test-token`
        }
    };

    const data = {
        whatsappNumber: '+5511999887766'
    };

    try {
        const response = await makeRequest(options, data);
        console.log('📊 Status:', response.status);
        console.log('📋 Dados:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200) {
            console.log('✅ Verificação WhatsApp OK');
            return response.data.code;
        } else {
            console.log('❌ Erro na verificação:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Erro de conexão:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('🚀 TESTE SIMPLES: Sistema WhatsApp');
    console.log('🌐 Servidor:', CONFIG.baseUrl);
    console.log('============================================\n');

    // Teste 1: Status
    const statusOk = await testWhatsAppStatus();
    
    // Teste 2: Verificação
    const verificationCode = await testWhatsAppVerification();

    console.log('\n============================================');
    console.log('📊 RESUMO DOS TESTES:');
    console.log('✅ Status:', statusOk ? 'OK' : 'FALHOU');
    console.log('✅ Verificação:', verificationCode ? 'OK' : 'FALHOU');
    
    if (statusOk && verificationCode) {
        console.log('🎉 Todos os testes básicos passaram!');
    } else {
        console.log('⚠️ Alguns testes falharam');
    }
}

// Executar testes
runTests().catch(console.error);

#!/usr/bin/env node

const http = require('http');

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

async function cleanupExpiredCodes() {
    console.log('🧹 Limpando códigos expirados...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/cleanup-expired-codes',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-emergency-token'
        }
    };

    try {
        const response = await makeRequest(options);
        console.log('📊 Status:', response.status);
        console.log('📋 Dados:', JSON.stringify(response.data, null, 2));
        return response.status === 200;
    } catch (error) {
        console.log('❌ Erro:', error.message);
        return false;
    }
}

async function testNewVerification() {
    console.log('🧪 Testando nova verificação...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/whatsapp/start-verification',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer user-test-token'
        }
    };

    const data = {
        whatsappNumber: '+5511999887766'
    };

    try {
        const response = await makeRequest(options, data);
        console.log('📊 Status:', response.status);
        console.log('📋 Dados:', JSON.stringify(response.data, null, 2));
        return response.status === 200;
    } catch (error) {
        console.log('❌ Erro:', error.message);
        return false;
    }
}

async function run() {
    console.log('🧹 LIMPEZA E TESTE - Sistema WhatsApp\n');
    
    // Limpar códigos expirados
    const cleaned = await cleanupExpiredCodes();
    console.log('✅ Limpeza:', cleaned ? 'OK' : 'FALHOU');
    
    // Aguardar um pouco
    console.log('\n⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tentar nova verificação
    const verified = await testNewVerification();
    console.log('✅ Nova verificação:', verified ? 'OK' : 'FALHOU');
}

run().catch(console.error);

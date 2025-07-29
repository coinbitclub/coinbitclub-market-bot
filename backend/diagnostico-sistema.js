#!/usr/bin/env node

/**
 * Verificador do Sistema Deployado
 * Testa qual sistema está realmente rodando no Railway
 */

const https = require('https');

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

console.log('🔍 DIAGNÓSTICO DO SISTEMA DEPLOYADO');
console.log('==================================');
console.log(`⏰ ${new Date().toLocaleTimeString()}\n`);

// Testar endpoints para identificar qual sistema está rodando
const endpoints = [
    '/health',
    '/api/health', 
    '/api/status',
    '/control',
    '/api/system/status',
    '/api/config',
    '/'
];

async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const url = BASE_URL + endpoint;
        console.log(`🔍 Testando: ${endpoint}`);
        
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`   📊 Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`   ✅ Resposta:`, JSON.stringify(json, null, 2).substring(0, 200) + '...');
                    } catch (e) {
                        console.log(`   📄 HTML/Text response (primeiros 100 chars):`, data.substring(0, 100) + '...');
                    }
                } else {
                    console.log(`   ❌ Erro:`, data.substring(0, 100));
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log(`   🚫 Erro de conexão: ${error.message}`);
            resolve();
        });
        
        req.setTimeout(5000, () => {
            console.log(`   ⏰ Timeout`);
            req.destroy();
            resolve();
        });
    });
}

async function runDiagnostic() {
    console.log('🚀 Iniciando diagnóstico...\n');
    
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
        console.log('');
    }
    
    console.log('🎯 ANÁLISE:');
    console.log('===========');
    console.log('- Se viu "servidor-integrado-completo" na resposta: Sistema V3 OK ✅');
    console.log('- Se viu "multiservice-hybrid": Sistema antigo ainda ativo ❌');
    console.log('- Se encontrou /control: Painel de controle disponível ✅');
    console.log('- Se não encontrou /control: Precisa forçar redeploy ❌');
}

runDiagnostic();

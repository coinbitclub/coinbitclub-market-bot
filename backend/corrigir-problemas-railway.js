/**
 * 🔧 CORREÇÃO: RESTAURAR FUNCIONAMENTO PÓS-MIGRAÇÃO RAILWAY
 * Corrigir problemas causados pela mudança de projeto
 */

const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function obterIPServidor() {
    return new Promise((resolve) => {
        https.get('https://api.ipify.org?format=json', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const ip = JSON.parse(data).ip;
                    resolve(ip);
                } catch (error) {
                    resolve('Erro ao obter IP');
                }
            });
        }).on('error', () => {
            resolve('Erro de conexão');
        });
    });
}

async function corrigirProblemasRailway() {
    try {
        console.log('🔧 CORREÇÃO: RESTAURAR FUNCIONAMENTO PÓS-MIGRAÇÃO RAILWAY');
        console.log('='.repeat(65));
        
        // 1. Verificar IP atual do servidor
        console.log('\n📍 1. VERIFICANDO IP ATUAL DO SERVIDOR:');
        const ipAtual = await obterIPServidor();
        console.log(`   🌐 IP atual do servidor: ${ipAtual}`);
        console.log(`   ⚠️  IMPORTANTE: Este IP precisa estar na whitelist da Bybit!`);

        // 2. Verificar chaves atuais da Paloma
        console.log('\n🔑 2. VERIFICANDO CHAVES ATUAIS DA PALOMA:');
        const palomaChaves = await pool.query(`
            SELECT 
                u.name,
                k.api_key,
                k.secret_key,
                k.validation_status,
                k.error_message,
                k.created_at
            FROM user_api_keys k
            JOIN users u ON k.user_id = u.id
            WHERE u.name ILIKE '%paloma%'
        `);

        if (palomaChaves.rows.length > 0) {
            const paloma = palomaChaves.rows[0];
            console.log(`   👤 Usuário: ${paloma.name}`);
            console.log(`   🔑 API Key: ${paloma.api_key}`);
            console.log(`   📊 Status: ${paloma.validation_status}`);
            console.log(`   ❌ Último erro: ${paloma.error_message || 'Nenhum'}`);
            
            // Verificar se são chaves genéricas
            if (paloma.api_key.includes('API_KEY_REAL_PALOMA') || paloma.api_key.includes('PLACEHOLDER')) {
                console.log(`   🚨 PROBLEMA: Chaves são placeholders genéricos!`);
                console.log(`   💡 SOLUÇÃO: Precisamos das chaves reais da Paloma`);
            }
        }

        // 3. Criar script para configurar chaves reais
        console.log('\n🛠️  3. CRIANDO SCRIPT DE CORREÇÃO:');
        
        const scriptCorrecao = `
-- 🔧 SCRIPT DE CORREÇÃO PÓS-MIGRAÇÃO RAILWAY
-- Execute este script após obter as chaves reais da Paloma

-- 1. Atualizar chaves reais da Paloma
UPDATE user_api_keys SET
    api_key = 'CHAVE_API_REAL_AQUI',  -- Substituir pela chave real
    secret_key = 'SECRET_REAL_AQUI',   -- Substituir pelo secret real
    validation_status = 'pending',
    error_message = NULL,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM users WHERE name ILIKE '%paloma%'
) AND exchange = 'bybit';

-- 2. Verificar atualização
SELECT 
    u.name,
    k.api_key,
    k.secret_key,
    k.validation_status,
    k.updated_at
FROM user_api_keys k
JOIN users u ON k.user_id = u.id
WHERE u.name ILIKE '%paloma%';
        `;

        require('fs').writeFileSync('correcao-pos-railway.sql', scriptCorrecao);
        console.log(`   📄 Arquivo criado: correcao-pos-railway.sql`);

        // 4. Criar checklist de correções
        console.log('\n📋 4. CHECKLIST DE CORREÇÕES NECESSÁRIAS:');
        console.log('='.repeat(50));
        
        console.log('\n🔐 CONFIGURAÇÕES BYBIT:');
        console.log(`   ☐ 1. Acessar conta Bybit da Paloma`);
        console.log(`   ☐ 2. Verificar se as chaves API ainda existem`);
        console.log(`   ☐ 3. Adicionar IP ${ipAtual} na whitelist`);
        console.log(`   ☐ 4. Verificar permissões das chaves (Spot Trading, Futures, etc)`);
        console.log(`   ☐ 5. Se necessário, gerar novas chaves API`);

        console.log('\n🔧 CONFIGURAÇÕES RAILWAY:');
        console.log(`   ☐ 1. Configurar variável BYBIT_API_KEY no Railway`);
        console.log(`   ☐ 2. Configurar variável BYBIT_API_SECRET no Railway`);
        console.log(`   ☐ 3. Configurar variável NODE_ENV=production`);
        console.log(`   ☐ 4. Verificar se DATABASE_URL está correta`);
        console.log(`   ☐ 5. Redeploy do serviço após configurar variáveis`);

        console.log('\n💾 BANCO DE DADOS:');
        console.log(`   ☐ 1. Executar script correcao-pos-railway.sql`);
        console.log(`   ☐ 2. Testar conexão com chaves reais`);
        console.log(`   ☐ 3. Validar que todas as usuárias têm chaves corretas`);

        console.log('\n🧪 TESTES:');
        console.log(`   ☐ 1. Testar autenticação Bybit`);
        console.log(`   ☐ 2. Testar endpoints do sistema`);
        console.log(`   ☐ 3. Verificar se TradingView webhooks funcionam`);
        console.log(`   ☐ 4. Testar operações com saldo real`);

        // 5. Criar comando de teste rápido
        console.log('\n⚡ 5. CRIANDO TESTE RÁPIDO DE VALIDAÇÃO:');
        
        const testeRapido = `
// 🧪 TESTE RÁPIDO PÓS-CORREÇÃO
// Execute: node teste-rapido-pos-correcao.js

const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function testarPosCorrecao() {
    console.log('🧪 TESTE RÁPIDO PÓS-CORREÇÃO');
    console.log('============================');
    
    // Buscar chaves da Paloma
    const paloma = await pool.query(\`
        SELECT k.api_key, k.secret_key 
        FROM user_api_keys k
        JOIN users u ON k.user_id = u.id
        WHERE u.name ILIKE '%paloma%' AND k.exchange = 'bybit'
    \`);
    
    if (paloma.rows.length === 0) {
        console.log('❌ Paloma não encontrada');
        return;
    }
    
    const { api_key, secret_key } = paloma.rows[0];
    console.log(\`🔑 Testando chaves: \${api_key.substring(0, 8)}...\`);
    
    // Testar autenticação
    const timestamp = Date.now().toString();
    const signature = crypto
        .createHmac('sha256', secret_key)
        .update(timestamp + api_key + '5000')
        .digest('hex');
    
    const options = {
        hostname: 'api.bybit.com',
        path: '/v5/user/query-api',
        method: 'GET',
        headers: {
            'X-BAPI-API-KEY': api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': '5000'
        }
    };
    
    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            const response = JSON.parse(data);
            if (response.retCode === 0) {
                console.log('✅ SUCESSO! Chaves funcionando corretamente');
                console.log(\`📊 Dados: \${JSON.stringify(response.result).substring(0, 100)}...\`);
            } else {
                console.log(\`❌ ERRO: \${response.retMsg}\`);
            }
            pool.end();
        });
    });
    
    req.on('error', (error) => {
        console.log(\`❌ ERRO DE CONEXÃO: \${error.message}\`);
        pool.end();
    });
    
    req.end();
}

testarPosCorrecao();
        `;

        require('fs').writeFileSync('teste-rapido-pos-correcao.js', testeRapido);
        console.log(`   📄 Arquivo criado: teste-rapido-pos-correcao.js`);

        console.log('\n🎯 RESUMO DO PROBLEMA E SOLUÇÃO:');
        console.log('='.repeat(40));
        console.log('❌ PROBLEMA: Migração Railway quebrou autenticação');
        console.log('🔧 CAUSA: IP mudou + chaves genéricas + env vars perdidas');
        console.log('✅ SOLUÇÃO: Atualizar whitelist + configurar chaves reais');
        
        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('1. Obter chaves reais da conta Bybit da Paloma');
        console.log('2. Atualizar whitelist de IP na Bybit');
        console.log('3. Configurar variáveis de ambiente no Railway');
        console.log('4. Executar script de correção do banco');
        console.log('5. Testar com teste-rapido-pos-correcao.js');

    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
    } finally {
        pool.end();
    }
}

corrigirProblemasRailway();

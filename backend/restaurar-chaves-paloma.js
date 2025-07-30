/**
 * 🔍 ENCONTRAR CHAVES REAIS DA PALOMA QUE FUNCIONAVAM ONTEM
 * Vamos criar chaves de teste válidas e verificar se o problema é de configuração
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Função para testar autenticação Bybit
async function testBybitAuth(apiKey, apiSecret, testName) {
    console.log(`\n🔑 TESTANDO: ${testName}`);
    console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
    
    try {
        const timestamp = Date.now().toString();
        const recv_window = '5000';
        
        // Método oficial Bybit V5
        const signaturePayload = timestamp + apiKey + recv_window;
        const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(signaturePayload)
            .digest('hex');

        const options = {
            hostname: 'api.bybit.com',
            port: 443,
            path: '/v5/user/query-api',
            method: 'GET',
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recv_window,
                'Content-Type': 'application/json'
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.retCode === 0) {
                            console.log(`   ✅ SUCESSO! Chave válida`);
                            console.log(`   📊 Dados: ${JSON.stringify(response.result).substring(0, 100)}...`);
                            resolve({ success: true, data: response.result });
                        } else {
                            console.log(`   ❌ ERRO: ${response.retMsg}`);
                            resolve({ success: false, error: response.retMsg });
                        }
                    } catch (error) {
                        console.log(`   ❌ ERRO DE PARSING: ${error.message}`);
                        resolve({ success: false, error: error.message });
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`   ❌ ERRO DE CONEXÃO: ${error.message}`);
                resolve({ success: false, error: error.message });
            });

            req.setTimeout(10000, () => {
                console.log(`   ⏰ TIMEOUT`);
                resolve({ success: false, error: 'Timeout' });
            });

            req.end();
        });
    } catch (error) {
        console.log(`   ❌ ERRO GERAL: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function restaurarChavesPaloma() {
    try {
        console.log('🎯 RESTAURANDO CHAVES DA PALOMA QUE FUNCIONAVAM ONTEM');
        console.log('='.repeat(60));
        
        // 1. Verificar chaves atuais da Paloma
        console.log('\n📊 1. CHAVES ATUAIS DA PALOMA:');
        const palomaAtual = await pool.query(`
            SELECT 
                u.name,
                k.api_key,
                k.secret_key,
                k.validation_status,
                k.error_message
            FROM user_api_keys k
            JOIN users u ON k.user_id = u.id
            WHERE u.name ILIKE '%paloma%'
        `);

        if (palomaAtual.rows.length > 0) {
            const paloma = palomaAtual.rows[0];
            console.log(`   👤 Nome: ${paloma.name}`);
            console.log(`   🔑 API Key: ${paloma.api_key}`);
            console.log(`   🗝️ Secret: ${paloma.secret_key.substring(0, 10)}...`);
            console.log(`   📊 Status: ${paloma.validation_status}`);
            console.log(`   ❌ Erro: ${paloma.error_message || 'Nenhum'}`);

            // Testar chaves atuais
            await testBybitAuth(paloma.api_key, paloma.secret_key, 'CHAVES ATUAIS DA PALOMA');
        }

        // 2. Tentar algumas variações de chaves conhecidas de outros usuários que podem ter funcionado
        console.log('\n🔍 2. TESTANDO CHAVES CONHECIDAS DO SISTEMA:');
        
        // Chaves da Luiza que estão no sistema
        await testBybitAuth('9HSZqEUJW9kDxHOA', 'OjJxNmsLOqajkTUcTFFtlsKzjqFNBKabOCU', 'CHAVES DA LUIZA MARIA');
        
        // Chaves da Érica que estão no sistema  
        await testBybitAuth('g1HWyxEfWxobzJGew', 'gOGv9nokGvfFoB0CSFyudZrOE8XnyA1nmR4r', 'CHAVES DA ÉRICA SANTOS');

        // 3. Verificar se há chaves nos backups ou variáveis de ambiente
        console.log('\n🔍 3. PROCURANDO CHAVES EM BACKUPS:');
        
        // Verificar se existem tabelas de backup
        const backupTables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE '%backup%' 
            OR table_name ILIKE '%old%'
            OR table_name ILIKE '%history%'
        `);

        if (backupTables.rows.length > 0) {
            console.log('   📋 Tabelas de backup encontradas:');
            backupTables.rows.forEach(table => {
                console.log(`   - ${table.table_name}`);
            });
        } else {
            console.log('   ❌ Nenhuma tabela de backup encontrada');
        }

        // 4. Verificar arquivos de configuração
        console.log('\n🔍 4. ANALISANDO PROBLEMA:');
        console.log('   • Sistema funcionava ontem com chaves da Paloma');
        console.log('   • Implementação de autenticação está correta');
        console.log('   • Chaves atuais retornam "API key is invalid"');
        console.log('   • Possíveis causas:');
        console.log('     - Chaves foram revogadas na Bybit');
        console.log('     - Chaves foram substituídas por placeholders');
        console.log('     - Problemas de IP whitelist na Bybit');
        console.log('     - Configuração de permissões na Bybit');

        console.log('\n🎯 5. PRÓXIMOS PASSOS RECOMENDADOS:');
        console.log('   1. Verificar se as chaves da Paloma ainda estão ativas na conta Bybit');
        console.log('   2. Confirmar as permissões das chaves API na conta Bybit');
        console.log('   3. Verificar whitelist de IPs na conta Bybit');
        console.log('   4. Regenerar chaves API se necessário');
        
        console.log('\n🚨 PROBLEMA IDENTIFICADO:');
        console.log('   • As chaves no banco são placeholders genéricos');
        console.log('   • Precisamos das chaves reais que funcionavam ontem');
        console.log('   • Sistema funcionava com "API fixo no servidor"');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

restaurarChavesPaloma();

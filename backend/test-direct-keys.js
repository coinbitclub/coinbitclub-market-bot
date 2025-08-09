#!/usr/bin/env node

/**
 * 🔍 TESTE DIRETO COM CHAVES DOS USUÁRIOS
 * =======================================
 * 
 * Teste das chaves como estão no banco, assumindo que podem não estar criptografadas
 */

const { Pool } = require('pg');
const EnterpriseExchangeConnector = require('./enterprise-exchange-connector');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function testarChavesDirecto() {
    console.log('🔑 TESTE DIRETO COM CHAVES DOS USUÁRIOS');
    console.log('======================================');

    const connector = new EnterpriseExchangeConnector();
    
    try {
        // 1. Buscar todas as chaves possíveis
        console.log('\n🔍 BUSCANDO TODAS AS CHAVES DISPONÍVEIS...');

        const chaves = await pool.query(`
            SELECT 
                uak.id,
                u.id as user_id,
                u.username,
                u.email,
                uak.exchange,
                uak.environment,
                uak.api_key,
                uak.api_secret,
                uak.secret_key,
                uak.api_key_encrypted,
                uak.secret_key_encrypted,
                uak.is_active,
                uak.validation_status,
                uak.last_validated
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE u.is_active = true
            AND uak.is_active = true
            ORDER BY u.id, uak.exchange, uak.environment
        `);

        console.log(`✅ Encontradas ${chaves.rows.length} chaves para análise`);

        // 2. Analisar cada chave e tentar diferentes formatos
        for (const chave of chaves.rows) {
            console.log(`\n👤 ANALISANDO: ${chave.username} (ID: ${chave.user_id})`);
            console.log(`🔑 Chave ID: ${chave.id} | Exchange: ${chave.exchange} ${chave.environment}`);
            console.log(`📊 Status atual: ${chave.validation_status || 'pending'}`);
            console.log('─'.repeat(60));

            // Verificar quais campos estão disponíveis
            const campos = {
                api_key: chave.api_key,
                api_secret: chave.api_secret, 
                secret_key: chave.secret_key,
                api_key_encrypted: chave.api_key_encrypted,
                secret_key_encrypted: chave.secret_key_encrypted
            };

            console.log('  📋 Campos disponíveis:');
            for (const [campo, valor] of Object.entries(campos)) {
                if (valor) {
                    console.log(`    ✅ ${campo}: ${valor.substring(0, 8)}... (${valor.length} chars)`);
                } else {
                    console.log(`    ❌ ${campo}: NULL`);
                }
            }

            // Tentar diferentes combinações de chaves
            const tentativas = [];

            // Tentativa 1: api_key + api_secret
            if (chave.api_key && chave.api_secret) {
                tentativas.push({
                    nome: 'api_key + api_secret',
                    apiKey: chave.api_key,
                    secretKey: chave.api_secret
                });
            }

            // Tentativa 2: api_key + secret_key
            if (chave.api_key && chave.secret_key) {
                tentativas.push({
                    nome: 'api_key + secret_key',
                    apiKey: chave.api_key,
                    secretKey: chave.secret_key
                });
            }

            // Tentativa 3: chaves "criptografadas" direto (podem ser base64 ou outro formato)
            if (chave.api_key_encrypted && chave.secret_key_encrypted) {
                tentativas.push({
                    nome: 'encrypted fields (direto)',
                    apiKey: chave.api_key_encrypted,
                    secretKey: chave.secret_key_encrypted
                });

                // Tentativa 4: tentar base64 decode
                try {
                    const apiKeyDecoded = Buffer.from(chave.api_key_encrypted, 'base64').toString('utf8');
                    const secretKeyDecoded = Buffer.from(chave.secret_key_encrypted, 'base64').toString('utf8');
                    
                    tentativas.push({
                        nome: 'encrypted fields (base64 decoded)',
                        apiKey: apiKeyDecoded,
                        secretKey: secretKeyDecoded
                    });
                } catch (e) {
                    // Não é base64 válido
                }
            }

            if (tentativas.length === 0) {
                console.log('  ⚠️ Nenhuma combinação de chaves válida encontrada');
                continue;
            }

            // Testar cada tentativa
            for (const tentativa of tentativas) {
                console.log(`\n  🧪 Testando: ${tentativa.nome}`);
                console.log(`    🔑 API: ${tentativa.apiKey.substring(0, 8)}...`);
                console.log(`    🔐 Secret: ${tentativa.secretKey ? tentativa.secretKey.substring(0, 8) + '...' : 'NULL'}`);

                try {
                    const startTime = Date.now();
                    
                    const resultado = await connector.connectAndValidateExchange(
                        chave.user_id,
                        tentativa.apiKey,
                        tentativa.secretKey,
                        chave.exchange.toLowerCase()
                    );

                    const tempoExecucao = Date.now() - startTime;

                    if (resultado.success) {
                        console.log(`    ✅ SUCESSO! (${tempoExecucao}ms)`);
                        console.log(`       🎯 Exchange: ${resultado.exchange} ${resultado.environment}`);
                        console.log(`       📊 Conta: ${resultado.accountInfo?.accountType || 'N/A'}`);
                        
                        if (resultado.accountInfo?.totalWalletBalance) {
                            console.log(`       💰 Saldo: ${resultado.accountInfo.totalWalletBalance} USDT`);
                        }
                        
                        if (resultado.balances && resultado.balances.length > 0) {
                            const comSaldo = resultado.balances.filter(b => parseFloat(b.free) > 0);
                            console.log(`       💼 Ativos: ${resultado.balances.length} (${comSaldo.length} com saldo)`);
                            
                            if (comSaldo.length > 0) {
                                console.log(`       💎 Principais:`);
                                comSaldo
                                    .sort((a, b) => parseFloat(b.free) - parseFloat(a.free))
                                    .slice(0, 3)
                                    .forEach(asset => {
                                        console.log(`         - ${asset.asset}: ${asset.free}`);
                                    });
                            }
                        }

                        // Sucesso! Atualizar status no banco
                        await pool.query(`
                            UPDATE user_api_keys 
                            SET 
                                last_validated = NOW(),
                                validation_status = 'valid',
                                validation_error = NULL
                            WHERE id = $1
                        `, [chave.id]);

                        console.log(`    📝 Status atualizado no banco para: VALID`);
                        break; // Parar de testar outras tentativas para esta chave

                    } else {
                        console.log(`    ❌ Falha (${tempoExecucao}ms): ${resultado.error}`);
                        console.log(`       📋 Detalhes: ${resultado.details || 'N/A'}`);
                    }

                } catch (error) {
                    console.log(`    💥 Erro: ${error.message}`);
                }

                // Pausa pequena entre tentativas
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Pausa maior entre usuários
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 3. Relatório final
        console.log('\n\n📊 VERIFICAÇÃO FINAL DO STATUS');
        console.log('==============================');

        const statusFinal = await pool.query(`
            SELECT 
                validation_status,
                COUNT(*) as quantidade,
                STRING_AGG(DISTINCT u.username, ', ') as usuarios
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.is_active = true
            GROUP BY validation_status
            ORDER BY quantidade DESC
        `);

        for (const status of statusFinal.rows) {
            const emoji = status.validation_status === 'valid' ? '✅' : 
                         status.validation_status === 'invalid' ? '❌' : 
                         status.validation_status === 'error' ? '💥' : '⚠️';
            
            console.log(`${emoji} ${status.validation_status || 'pending'}: ${status.quantidade} chaves`);
            console.log(`   👤 Usuários: ${status.usuarios}`);
        }

    } catch (error) {
        console.error('\n❌ Erro no teste:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testarChavesDirecto()
        .then(() => {
            console.log('\n✅ TESTE DIRETO COM CHAVES CONCLUÍDO!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 ERRO:', error.message);
            process.exit(1);
        });
}

module.exports = { testarChavesDirecto };

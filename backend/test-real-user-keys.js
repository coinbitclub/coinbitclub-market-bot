#!/usr/bin/env node

/**
 * 🔑 TESTE DE CONEXÃO COM CHAVES REAIS DOS USUÁRIOS
 * =================================================
 * 
 * Script para testar conexões enterprise com chaves reais do banco
 */

const { Pool } = require('pg');
const EnterpriseExchangeConnector = require('./enterprise-exchange-connector');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function testarChavesReais() {
    console.log('🔑 TESTANDO CHAVES REAIS DOS USUÁRIOS');
    console.log('====================================');

    const connector = new EnterpriseExchangeConnector();
    
    try {
        // 1. Verificar estrutura das tabelas de chaves
        console.log('\n📋 ANALISANDO TABELAS DE CHAVES...');

        // Verificar user_api_keys
        const userApiKeys = await pool.query(`
            SELECT 
                table_name,
                column_name,
                data_type
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);

        if (userApiKeys.rows.length > 0) {
            console.log('\n🔍 Estrutura user_api_keys:');
            for (const col of userApiKeys.rows) {
                console.log(`  - ${col.column_name} (${col.data_type})`);
            }

            // Verificar quantos registros
            const count = await pool.query('SELECT COUNT(*) as total FROM user_api_keys');
            console.log(`  📊 Total de registros: ${count.rows[0].total}`);

            if (count.rows[0].total > 0) {
                // Mostrar alguns registros
                const sample = await pool.query(`
                    SELECT 
                        id,
                        user_id,
                        exchange,
                        environment,
                        CASE 
                            WHEN api_key IS NOT NULL THEN 'PRESENTE'
                            ELSE 'AUSENTE'
                        END as api_key_status,
                        CASE 
                            WHEN secret_key IS NOT NULL THEN 'PRESENTE'
                            ELSE 'AUSENTE'
                        END as secret_key_status,
                        is_active,
                        created_at
                    FROM user_api_keys 
                    ORDER BY created_at DESC 
                    LIMIT 10
                `);

                console.log('\n  📋 Amostras de registros:');
                for (const record of sample.rows) {
                    console.log(`    ID ${record.id}: User ${record.user_id} | ${record.exchange} ${record.environment}`);
                    console.log(`      API: ${record.api_key_status} | Secret: ${record.secret_key_status} | Ativo: ${record.is_active}`);
                }
            }
        } else {
            console.log('  ❌ Tabela user_api_keys não encontrada');
        }

        // 2. Verificar tabela api_keys  
        const apiKeys = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'api_keys' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);

        if (apiKeys.rows.length > 0) {
            console.log('\n🔍 Estrutura api_keys:');
            for (const col of apiKeys.rows) {
                console.log(`  - ${col.column_name} (${col.data_type})`);
            }

            const count = await pool.query('SELECT COUNT(*) as total FROM api_keys');
            console.log(`  📊 Total de registros: ${count.rows[0].total}`);
        }

        // 3. Testar com usuários que têm chaves ativas
        console.log('\n🧪 TESTANDO CONEXÕES COM CHAVES REAIS...');

        const usuariosComChaves = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.email,
                u.plan_type,
                uak.id as api_key_id,
                uak.exchange,
                uak.environment,
                uak.api_key,
                uak.secret_key,
                uak.is_active,
                uak.last_validated
            FROM users u
            JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.is_active = true 
            AND uak.is_active = true
            AND uak.api_key IS NOT NULL 
            AND uak.secret_key IS NOT NULL
            ORDER BY u.id, uak.exchange, uak.environment
        `);

        if (usuariosComChaves.rows.length === 0) {
            console.log('❌ Nenhum usuário ativo encontrado com chaves API válidas');
            
            // Verificar usuários sem filtros
            const todosusuarios = await pool.query(`
                SELECT 
                    COUNT(DISTINCT u.id) as total_usuarios,
                    COUNT(uak.id) as total_chaves,
                    COUNT(CASE WHEN uak.is_active = true THEN 1 END) as chaves_ativas,
                    COUNT(CASE WHEN uak.api_key IS NOT NULL THEN 1 END) as com_api_key,
                    COUNT(CASE WHEN uak.secret_key IS NOT NULL THEN 1 END) as com_secret_key
                FROM users u
                LEFT JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE u.is_active = true
            `);

            const stats = todosusuarios.rows[0];
            console.log('\n📊 Estatísticas gerais:');
            console.log(`  👥 Total de usuários ativos: ${stats.total_usuarios}`);
            console.log(`  🔑 Total de chaves: ${stats.total_chaves}`);
            console.log(`  ✅ Chaves ativas: ${stats.chaves_ativas}`);
            console.log(`  🔐 Com API Key: ${stats.com_api_key}`);
            console.log(`  🗝️ Com Secret Key: ${stats.com_secret_key}`);

            return;
        }

        console.log(`✅ Encontrados ${usuariosComChaves.rows.length} registros de chaves ativas`);

        // 4. Testar cada chave
        let sucessos = 0;
        let falhas = 0;
        let errosDescriptografia = 0;

        for (const registro of usuariosComChaves.rows) {
            console.log(`\n👤 TESTANDO: ${registro.username} (ID: ${registro.id})`);
            console.log(`📧 Email: ${registro.email}`);
            console.log(`🔑 Chave ID: ${registro.api_key_id}`);
            console.log(`📊 Exchange: ${registro.exchange} ${registro.environment}`);
            console.log(`🕐 Última validação: ${registro.last_validated || 'Nunca'}`);
            console.log('─'.repeat(60));

            try {
                // As chaves podem estar criptografadas, vamos tentar descriptografar
                let apiKey = registro.api_key;
                let secretKey = registro.secret_key;

                // Se as chaves parecem estar criptografadas (base64 longo), tentar descriptografar
                if (apiKey && apiKey.length > 100) {
                    console.log('  🔓 Tentando descriptografar chaves...');
                    try {
                        // Aqui você precisaria da chave de descriptografia do seu sistema
                        // Por enquanto, vamos assumir que não conseguimos descriptografar
                        console.log('  ⚠️ Chaves parecem estar criptografadas - pulando teste');
                        errosDescriptografia++;
                        continue;
                    } catch (decryptError) {
                        console.log('  ❌ Erro na descriptografia:', decryptError.message);
                        errosDescriptografia++;
                        continue;
                    }
                }

                console.log(`  🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(-4)}`);
                console.log(`  🔐 Secret: ${secretKey ? '***Presente***' : 'AUSENTE'}`);

                // Testar conexão enterprise
                console.log('  🔄 Testando conexão enterprise...');
                
                const startTime = Date.now();
                
                const resultado = await connector.connectAndValidateExchange(
                    registro.id,
                    apiKey,
                    secretKey,
                    registro.exchange.toLowerCase()
                );

                const tempoExecucao = Date.now() - startTime;

                if (resultado.success) {
                    console.log(`  ✅ SUCESSO! (${tempoExecucao}ms)`);
                    console.log(`     🎯 Exchange detectada: ${resultado.exchange} ${resultado.environment}`);
                    console.log(`     📊 Conta: ${resultado.accountInfo?.accountType || 'N/A'}`);
                    
                    if (resultado.accountInfo?.totalWalletBalance) {
                        console.log(`     💰 Saldo: ${resultado.accountInfo.totalWalletBalance} USDT`);
                    }
                    
                    if (resultado.balances && resultado.balances.length > 0) {
                        const saldosPositivos = resultado.balances.filter(b => parseFloat(b.free) > 0);
                        console.log(`     💼 Ativos: ${resultado.balances.length} moedas (${saldosPositivos.length} com saldo)`);
                        
                        if (saldosPositivos.length > 0) {
                            console.log(`     💎 Top ativos:`);
                            saldosPositivos
                                .sort((a, b) => parseFloat(b.free) - parseFloat(a.free))
                                .slice(0, 3)
                                .forEach(asset => {
                                    console.log(`       - ${asset.asset}: ${asset.free}`);
                                });
                        }
                    }
                    sucessos++;
                } else {
                    console.log(`  ❌ FALHA! (${tempoExecucao}ms)`);
                    console.log(`     🔍 Motivo: ${resultado.error}`);
                    console.log(`     📋 Detalhes: ${resultado.details || 'N/A'}`);
                    falhas++;
                }

            } catch (error) {
                console.log(`  💥 ERRO CRÍTICO!`);
                console.log(`     ❌ ${error.message}`);
                falhas++;
            }

            // Pausa entre testes
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 5. Relatório final
        console.log('\n\n📊 RELATÓRIO FINAL');
        console.log('==================');

        const total = sucessos + falhas + errosDescriptografia;
        
        console.log(`✅ Sucessos: ${sucessos}`);
        console.log(`❌ Falhas: ${falhas}`);
        console.log(`🔐 Erros de descriptografia: ${errosDescriptografia}`);
        console.log(`📊 Total testado: ${total}`);

        if (total > 0) {
            const taxaSucesso = ((sucessos / total) * 100).toFixed(1);
            console.log(`📈 Taxa de sucesso: ${taxaSucesso}%`);
        }

        // Verificar estado do sistema enterprise
        console.log('\n🏢 ESTADO DO SISTEMA ENTERPRISE:');
        const enterpriseStatus = await pool.query(`
            SELECT 
                COUNT(*) as total_conexoes,
                COUNT(CASE WHEN is_active = true THEN 1 END) as conexoes_ativas,
                COUNT(DISTINCT user_id) as usuarios_conectados
            FROM user_exchange_connections
        `);

        const status = enterpriseStatus.rows[0];
        console.log(`🔗 Conexões enterprise: ${status.total_conexoes}`);
        console.log(`✅ Conexões ativas: ${status.conexoes_ativas}`);
        console.log(`👥 Usuários conectados: ${status.usuarios_conectados}`);

    } catch (error) {
        console.error('\n❌ Erro no teste:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testarChavesReais()
        .then(() => {
            console.log('\n✅ TESTE DE CHAVES REAIS CONCLUÍDO!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 ERRO:', error.message);
            process.exit(1);
        });
}

module.exports = { testarChavesReais };

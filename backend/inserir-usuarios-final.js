/**
 * 🔄 ATUALIZAR CHAVES API - PALOMA E MAURO (VERSÃO SIMPLIFICADA)
 * 
 * Versão compatível com a estrutura atual do banco
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

/**
 * Dados dos usuários com as chaves corretas
 */
const usuariosParaAtualizar = [
    {
        nome: "PALOMA AMARAL",
        email: "pamaral15@hotmail.com",
        senha: "Diogo1520",
        saldo_inicial: 500.00,
        // Chaves Bybit Produção
        bybit_api_key: "AfFEGdxLuYPnSFaXEJ",
        bybit_secret: "kxCAy7yDenRFKKrHinGfysmP2wknmvRk16Wb",
        environment: "mainnet",
        exchange: "bybit"
    },
    {
        nome: "MAURO ALVES",
        email: "mauroalves150391@gmail.com",
        senha: "M@urovilhoso",
        saldo_inicial: 4000.00,
        // Chaves Bybit Testnet
        bybit_api_key: "JQVNAD0aCqNqPLvo25",
        bybit_secret: "rQ1Qle81XBKeL5NrvSIOLqpT60rbZ7wA0dYk",
        environment: "testnet",
        exchange: "bybit-testnet"
    }
];

/**
 * Verificar estrutura da tabela users
 */
async function verificarEstruturaBanco() {
    try {
        console.log('🔍 VERIFICANDO ESTRUTURA DO BANCO...');
        
        // Verificar colunas da tabela users
        const usersQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        `;
        
        const usersResult = await pool.query(usersQuery);
        console.log('📊 Colunas da tabela USERS:');
        usersResult.rows.forEach(col => {
            console.log(`   • ${col.column_name} (${col.data_type}) - ${col.is_nullable}`);
        });
        
        // Verificar colunas da tabela user_api_keys
        const keysQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' 
            ORDER BY ordinal_position;
        `;
        
        const keysResult = await pool.query(keysQuery);
        console.log('\n📊 Colunas da tabela USER_API_KEYS:');
        keysResult.rows.forEach(col => {
            console.log(`   • ${col.column_name} (${col.data_type}) - ${col.is_nullable}`);
        });
        
        // Verificar colunas da tabela user_balances
        const balancesQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_balances' 
            ORDER BY ordinal_position;
        `;
        
        const balancesResult = await pool.query(balancesQuery);
        console.log('\n📊 Colunas da tabela USER_BALANCES:');
        balancesResult.rows.forEach(col => {
            console.log(`   • ${col.column_name} (${col.data_type}) - ${col.is_nullable}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error.message);
    }
}

/**
 * Cadastrar ou atualizar usuário (versão simplificada)
 */
async function cadastrarOuAtualizarUsuario(dadosUsuario) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log(`🔄 PROCESSANDO: ${dadosUsuario.nome}`);
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(dadosUsuario.senha, 10);
        
        // 1. Inserir ou atualizar usuário (apenas campos básicos)
        const userQuery = `
            INSERT INTO users (name, email, password_hash, is_active, created_at)
            VALUES ($1, $2, $3, true, NOW())
            ON CONFLICT (email) 
            DO UPDATE SET
                name = EXCLUDED.name,
                password_hash = EXCLUDED.password_hash,
                updated_at = NOW()
            RETURNING id, name, email;
        `;
        
        const userResult = await client.query(userQuery, [
            dadosUsuario.nome,
            dadosUsuario.email,
            senhaHash
        ]);
        
        const userId = userResult.rows[0].id;
        console.log(`   ✅ Usuário: ${userResult.rows[0].name} (ID: ${userId})`);
        
        // 2. Inserir ou atualizar chaves API Bybit
        const keyQuery = `
            INSERT INTO user_api_keys (user_id, exchange, api_key, secret_key, environment, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, true, NOW())
            ON CONFLICT (user_id, exchange, environment)
            DO UPDATE SET
                api_key = EXCLUDED.api_key,
                secret_key = EXCLUDED.secret_key,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING id, exchange, environment;
        `;
        
        const keyResult = await client.query(keyQuery, [
            userId,
            dadosUsuario.exchange,
            dadosUsuario.bybit_api_key,
            dadosUsuario.bybit_secret,
            dadosUsuario.environment
        ]);
        
        console.log(`   🔑 Chave API: ${dadosUsuario.exchange} ${dadosUsuario.environment} (ID: ${keyResult.rows[0].id})`);
        
        // 3. Inserir ou atualizar saldo
        const balanceQuery = `
            INSERT INTO user_balances (user_id, balance_brl, balance_usd, created_at)
            VALUES ($1, $2, 0.00, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                balance_brl = EXCLUDED.balance_brl,
                updated_at = NOW()
            RETURNING id, balance_brl;
        `;
        
        const balanceResult = await client.query(balanceQuery, [
            userId,
            dadosUsuario.saldo_inicial
        ]);
        
        console.log(`   💰 Saldo: R$ ${balanceResult.rows[0].balance_brl} (ID: ${balanceResult.rows[0].id})`);
        
        await client.query('COMMIT');
        console.log(`   ✅ ${dadosUsuario.nome} processado com sucesso!`);
        
        return {
            sucesso: true,
            userId: userId,
            dados: userResult.rows[0]
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Erro ao processar ${dadosUsuario.nome}:`, error.message);
        return {
            sucesso: false,
            erro: error.message
        };
    } finally {
        client.release();
    }
}

/**
 * Executar atualização dos usuários
 */
async function executarAtualizacao() {
    try {
        console.log('🔄 ATUALIZAÇÃO DE CHAVES API - PALOMA E MAURO');
        console.log('='.repeat(60));
        console.log('📅 Data: 29 de Julho de 2025');
        console.log('🎯 Objetivo: Inserir usuários e chaves API no banco');
        console.log('');
        
        // Verificar estrutura do banco
        await verificarEstruturaBanco();
        console.log('');
        
        // Processar cada usuário
        console.log('🚀 INICIANDO INSERÇÃO...');
        const resultados = [];
        
        for (const usuario of usuariosParaAtualizar) {
            const resultado = await cadastrarOuAtualizarUsuario(usuario);
            resultados.push({
                nome: usuario.nome,
                email: usuario.email,
                ...resultado
            });
            console.log('');
        }
        
        // Resumo final
        console.log('📊 RESUMO DA ATUALIZAÇÃO:');
        console.log('='.repeat(40));
        
        const sucessos = resultados.filter(r => r.sucesso);
        const falhas = resultados.filter(r => !r.sucesso);
        
        console.log(`✅ Sucessos: ${sucessos.length}`);
        console.log(`❌ Falhas: ${falhas.length}`);
        
        if (sucessos.length > 0) {
            console.log('\n✅ USUÁRIOS PROCESSADOS:');
            sucessos.forEach(s => {
                console.log(`   • ${s.nome} (${s.email})`);
            });
        }
        
        if (falhas.length > 0) {
            console.log('\n❌ USUÁRIOS COM ERRO:');
            falhas.forEach(f => {
                console.log(`   • ${f.nome}: ${f.erro}`);
            });
        }
        
        if (sucessos.length === resultados.length) {
            console.log('\n🎉 INSERÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('🔑 Chaves API inseridas/atualizadas');
            console.log('💰 Saldos iniciais configurados');
            console.log('🚀 Usuários prontos para testes');
            
            // Agora vamos testar a conectividade
            console.log('\n🧪 INICIANDO TESTE DE CONECTIVIDADE...');
            await testarConectividadeUsuarios();
        }
        
    } catch (error) {
        console.error('❌ ERRO NA ATUALIZAÇÃO:', error.message);
    } finally {
        await pool.end();
    }
}

/**
 * Testar conectividade dos usuários inseridos
 */
async function testarConectividadeUsuarios() {
    const axios = require('axios');
    const crypto = require('crypto');
    
    function generateBybitSignature(queryString, secret, timestamp, apiKey, recvWindow) {
        const paramStr = timestamp + apiKey + recvWindow + queryString;
        return crypto.createHmac('sha256', secret).update(paramStr).digest('hex');
    }
    
    try {
        console.log('🧪 TESTE DE CONECTIVIDADE DAS CHAVES');
        console.log('-'.repeat(50));
        
        for (const usuario of usuariosParaAtualizar) {
            console.log(`\n🔍 TESTANDO: ${usuario.nome}`);
            
            const baseUrl = usuario.environment === 'testnet' 
                ? 'https://api-testnet.bybit.com' 
                : 'https://api.bybit.com';
                
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            const queryString = 'accountType=UNIFIED';
            
            const signature = generateBybitSignature(
                queryString,
                usuario.bybit_secret,
                timestamp,
                usuario.bybit_api_key,
                recvWindow
            );
            
            try {
                const response = await axios.get(`${baseUrl}/v5/account/wallet-balance`, {
                    headers: {
                        'X-BAPI-API-KEY': usuario.bybit_api_key,
                        'X-BAPI-SIGN': signature,
                        'X-BAPI-SIGN-TYPE': '2',
                        'X-BAPI-TIMESTAMP': timestamp,
                        'X-BAPI-RECV-WINDOW': recvWindow
                    },
                    params: { accountType: 'UNIFIED' },
                    timeout: 10000
                });
                
                if (response.data.retCode === 0) {
                    console.log(`   ✅ CONECTIVIDADE OK`);
                    
                    if (response.data.result?.list) {
                        response.data.result.list.forEach(account => {
                            if (account.totalWalletBalance && parseFloat(account.totalWalletBalance) > 0) {
                                console.log(`   💰 Saldo Total: ${account.totalWalletBalance} USD`);
                            }
                        });
                    }
                } else {
                    console.log(`   ❌ ERRO API: ${response.data.retCode} - ${response.data.retMsg}`);
                }
                
            } catch (error) {
                if (error.response?.data) {
                    console.log(`   ❌ ERRO: ${error.response.status}`);
                    console.log(`   📊 Detalhes: ${JSON.stringify(error.response.data)}`);
                } else {
                    console.log(`   ❌ ERRO: ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no teste de conectividade:', error.message);
    }
}

// Executar atualização
if (require.main === module) {
    executarAtualizacao();
}

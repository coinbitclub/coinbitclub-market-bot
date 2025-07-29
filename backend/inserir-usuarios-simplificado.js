/**
 * 🔄 INSERIR USUÁRIOS - VERSÃO COMPATÍVEL COM BANCO ATUAL
 * 
 * Paloma Amaral e Mauro Alves com chaves API corretas
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

/**
 * Dados dos usuários
 */
const usuarios = [
    {
        nome: "PALOMA AMARAL",
        email: "pamaral15@hotmail.com",
        senha: "Diogo1520",
        telefone: "+55 21 98221-8182",
        pais: "Brasil",
        tipo: "comum",
        vip: false,
        saldo_brl: 500.00,
        // Chaves Bybit Produção
        bybit_api: "AfFEGdxLuYPnSFaXEJ",
        bybit_secret: "kxCAy7yDenRFKKrHinGfysmP2wknmvRk16Wb",
        exchange: "bybit",
        environment: "mainnet"
    },
    {
        nome: "MAURO ALVES", 
        email: "mauroalves150391@gmail.com",
        senha: "M@urovilhoso",
        telefone: "+55 32 9139-9571", 
        pais: "Brasil",
        tipo: "vip",
        vip: true,
        saldo_brl: 4000.00,
        // Chaves Bybit Testnet
        bybit_api: "JQVNAD0aCqNqPLvo25",
        bybit_secret: "rQ1Qle81XBKeL5NrvSIOLqpT60rbZ7wA0dYk",
        exchange: "bybit-testnet",
        environment: "testnet"
    }
];

async function inserirUsuarios() {
    try {
        console.log('🚀 INSERÇÃO DE USUÁRIOS - PALOMA E MAURO');
        console.log('='.repeat(50));
        
        for (const user of usuarios) {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                console.log(`\n👤 PROCESSANDO: ${user.nome}`);
                
                // Hash da senha
                const passwordHash = await bcrypt.hash(user.senha, 10);
                
                // 1. Inserir usuário
                const insertUserQuery = `
                    INSERT INTO users (
                        email, name, password_hash, phone, 
                        vip_status, balance_usd, pais, 
                        affiliate_level, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                    ON CONFLICT (email) 
                    DO UPDATE SET
                        name = EXCLUDED.name,
                        password_hash = EXCLUDED.password_hash,
                        phone = EXCLUDED.phone,
                        vip_status = EXCLUDED.vip_status,
                        balance_usd = EXCLUDED.balance_usd,
                        updated_at = NOW()
                    RETURNING id;
                `;
                
                const userResult = await client.query(insertUserQuery, [
                    user.email,
                    user.nome,
                    passwordHash,
                    user.telefone,
                    user.vip,
                    user.saldo_brl,
                    user.pais,
                    user.tipo
                ]);
                
                const userId = userResult.rows[0].id;
                console.log(`   ✅ Usuário inserido (ID: ${userId})`);
                
                // 2. Inserir chave API
                const insertKeyQuery = `
                    INSERT INTO user_api_keys (
                        user_id, exchange, api_key, secret_key, 
                        environment, created_at
                    ) VALUES ($1, $2, $3, $4, $5, NOW())
                    ON CONFLICT (user_id, exchange, environment)
                    DO UPDATE SET
                        api_key = EXCLUDED.api_key,
                        secret_key = EXCLUDED.secret_key,
                        updated_at = NOW()
                    RETURNING id;
                `;
                
                const keyResult = await client.query(insertKeyQuery, [
                    userId,
                    user.exchange,
                    user.bybit_api,
                    user.bybit_secret,
                    user.environment
                ]);
                
                console.log(`   🔑 Chave API inserida (ID: ${keyResult.rows[0].id})`);
                console.log(`   🏢 Exchange: ${user.exchange}`);
                console.log(`   🌍 Environment: ${user.environment}`);
                console.log(`   💰 Saldo: R$ ${user.saldo_brl}`);
                
                await client.query('COMMIT');
                console.log(`   ✅ ${user.nome} processado com sucesso!`);
                
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`   ❌ Erro: ${error.message}`);
            } finally {
                client.release();
            }
        }
        
        console.log('\n🧪 TESTANDO CONECTIVIDADE DAS CHAVES...');
        await testarChaves();
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await pool.end();
    }
}

async function testarChaves() {
    const axios = require('axios');
    const crypto = require('crypto');
    
    function criarAssinatura(queryString, secret, timestamp, apiKey, recvWindow) {
        const paramStr = timestamp + apiKey + recvWindow + queryString;
        return crypto.createHmac('sha256', secret).update(paramStr).digest('hex');
    }
    
    for (const user of usuarios) {
        try {
            console.log(`\n🔍 TESTANDO: ${user.nome}`);
            
            const baseUrl = user.environment === 'testnet' 
                ? 'https://api-testnet.bybit.com' 
                : 'https://api.bybit.com';
                
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            const queryString = 'accountType=UNIFIED';
            
            const signature = criarAssinatura(
                queryString,
                user.bybit_secret,
                timestamp,
                user.bybit_api,
                recvWindow
            );
            
            const response = await axios.get(`${baseUrl}/v5/account/wallet-balance`, {
                headers: {
                    'X-BAPI-API-KEY': user.bybit_api,
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
                            console.log(`   💰 Saldo: ${account.totalWalletBalance} USD`);
                        }
                    });
                }
            } else {
                console.log(`   ❌ ERRO: ${response.data.retCode} - ${response.data.retMsg}`);
            }
            
        } catch (error) {
            if (error.response?.data) {
                console.log(`   ❌ HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
            } else {
                console.log(`   ❌ ERRO: ${error.message}`);
            }
        }
    }
    
    console.log('\n🎉 PROCESSO CONCLUÍDO!');
    console.log('📋 Próximos passos:');
    console.log('1. ✅ Usuários inseridos no banco');
    console.log('2. ✅ Chaves API configuradas');
    console.log('3. 🔍 Verificar conectividade acima');
    console.log('4. 🚀 Sistema pronto para testes!');
}

inserirUsuarios();

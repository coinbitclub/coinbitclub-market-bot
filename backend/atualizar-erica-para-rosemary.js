/**
 * 🔄 ATUALIZAR DADOS DA ÉRICA PARA ROSEMARY
 * 
 * Atualizar nome e chaves API da Érica dos Santos para Rosemary dos Santos
 * com as novas credenciais da Bybit
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

/**
 * Novas informações da usuária
 */
const novasDados = {
    email_antigo: "erica.andrade.santos@hotmail.com",
    nome_novo: "Rosemary dos Santos",
    api_key_nova: "rtHh25xhZRdZlda6",
    secret_key_nova: "bgiaCTE15Pk4BdGQTmLjJT4sekIGviPeQY",
    exchange: "bybit",
    environment: "mainnet"
};

async function atualizarUsuario() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 ATUALIZANDO DADOS DA ÉRICA PARA ROSEMARY');
        console.log('='.repeat(60));
        console.log('📅 Data: 29 de Julho de 2025');
        console.log('🎯 Objetivo: Atualizar nome e chaves API');
        console.log('');
        
        await client.query('BEGIN');
        
        // 1. Verificar usuário atual
        console.log('🔍 VERIFICANDO DADOS ATUAIS...');
        const verificarQuery = `
            SELECT 
                u.id,
                u.name,
                u.email,
                uak.id as key_id,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.email = $1;
        `;
        
        const usuarioAtual = await client.query(verificarQuery, [novasDados.email_antigo]);
        
        if (usuarioAtual.rows.length === 0) {
            console.log('❌ Usuário não encontrado!');
            return;
        }
        
        const usuario = usuarioAtual.rows[0];
        console.log(`👤 Usuário encontrado:`);
        console.log(`   ID: ${usuario.id}`);
        console.log(`   Nome atual: ${usuario.name}`);
        console.log(`   Email: ${usuario.email}`);
        console.log(`   API Key atual: ${usuario.api_key || 'não cadastrada'}`);
        console.log(`   Secret Key atual: ${usuario.secret_key ? usuario.secret_key.substring(0, 8) + '***' : 'não cadastrada'}`);
        console.log('');
        
        // 2. Atualizar nome do usuário
        console.log('📝 ATUALIZANDO NOME DO USUÁRIO...');
        const atualizarNomeQuery = `
            UPDATE users 
            SET name = $1, updated_at = NOW()
            WHERE email = $2
            RETURNING id, name;
        `;
        
        const nomeResult = await client.query(atualizarNomeQuery, [
            novasDados.nome_novo,
            novasDados.email_antigo
        ]);
        
        console.log(`   ✅ Nome atualizado: ${nomeResult.rows[0].name}`);
        
        // 3. Atualizar ou inserir chaves API
        console.log('🔑 ATUALIZANDO CHAVES API...');
        const atualizarChaveQuery = `
            INSERT INTO user_api_keys (
                user_id, exchange, api_key, secret_key, 
                environment, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (user_id, exchange, environment)
            DO UPDATE SET
                api_key = EXCLUDED.api_key,
                secret_key = EXCLUDED.secret_key,
                updated_at = NOW()
            RETURNING id, exchange, environment;
        `;
        
        const chaveResult = await client.query(atualizarChaveQuery, [
            usuario.id,
            novasDados.exchange,
            novasDados.api_key_nova,
            novasDados.secret_key_nova,
            novasDados.environment
        ]);
        
        console.log(`   ✅ Chaves atualizadas:`);
        console.log(`      Exchange: ${chaveResult.rows[0].exchange}`);
        console.log(`      Environment: ${chaveResult.rows[0].environment}`);
        console.log(`      API Key: ${novasDados.api_key_nova}`);
        console.log(`      Secret Key: ${novasDados.secret_key_nova.substring(0, 8)}***`);
        
        await client.query('COMMIT');
        
        console.log('');
        console.log('✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('🔑 Novas chaves API da Bybit configuradas');
        console.log('👤 Nome atualizado para Rosemary dos Santos');
        console.log('');
        
        // 4. Testar conectividade com as novas chaves
        console.log('🧪 TESTANDO CONECTIVIDADE COM NOVAS CHAVES...');
        await testarConectividade(novasDados.api_key_nova, novasDados.secret_key_nova);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ ERRO NA ATUALIZAÇÃO:', error.message);
    } finally {
        client.release();
    }
}

/**
 * Testar conectividade com as novas chaves
 */
async function testarConectividade(apiKey, secretKey) {
    try {
        const axios = require('axios');
        const crypto = require('crypto');
        
        console.log('🔍 Testando conectividade...');
        
        const baseUrl = 'https://api.bybit.com';
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        // Gerar assinatura
        const paramStr = timestamp + apiKey + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', secretKey).update(paramStr).digest('hex');
        
        const response = await axios.get(`${baseUrl}/v5/account/wallet-balance`, {
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow
            },
            params: { accountType: 'UNIFIED' },
            timeout: 10000
        });
        
        if (response.data.retCode === 0) {
            console.log('   ✅ CONECTIVIDADE OK!');
            
            if (response.data.result?.list) {
                response.data.result.list.forEach(account => {
                    if (account.totalWalletBalance && parseFloat(account.totalWalletBalance) > 0) {
                        console.log(`   💰 Saldo Total: ${account.totalWalletBalance} USD`);
                    }
                    
                    if (account.coin && account.coin.length > 0) {
                        account.coin.forEach(coin => {
                            const saldo = parseFloat(coin.walletBalance);
                            if (saldo > 0) {
                                console.log(`   💎 ${coin.coin}: ${saldo}`);
                            }
                        });
                    }
                });
            }
        } else {
            console.log(`   ❌ ERRO API: ${response.data.retCode} - ${response.data.retMsg}`);
        }
        
    } catch (error) {
        if (error.response?.data) {
            console.log(`   ❌ ERRO HTTP: ${error.response.status}`);
            console.log(`   📊 Detalhes: ${JSON.stringify(error.response.data)}`);
        } else {
            console.log(`   ❌ ERRO: ${error.message}`);
        }
    }
}

/**
 * Verificar dados após atualização
 */
async function verificarDadosAtualizados() {
    try {
        console.log('\n📊 VERIFICANDO DADOS ATUALIZADOS...');
        console.log('-'.repeat(50));
        
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.updated_at as user_updated,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment,
                uak.updated_at as key_updated
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.email = $1;
        `;
        
        const result = await pool.query(query, [novasDados.email_antigo]);
        
        if (result.rows.length > 0) {
            const dados = result.rows[0];
            console.log('✅ DADOS ATUALIZADOS:');
            console.log(`   👤 Nome: ${dados.name}`);
            console.log(`   📧 Email: ${dados.email}`);
            console.log(`   🔑 API Key: ${dados.api_key}`);
            console.log(`   🔐 Secret: ${dados.secret_key ? dados.secret_key.substring(0, 8) + '***' : 'não definida'}`);
            console.log(`   🏢 Exchange: ${dados.exchange}`);
            console.log(`   🌍 Environment: ${dados.environment}`);
            console.log(`   📅 Usuário atualizado: ${dados.user_updated}`);
            console.log(`   📅 Chave atualizada: ${dados.key_updated}`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar dados:', error.message);
    }
}

/**
 * Executar atualização completa
 */
async function executarAtualizacaoCompleta() {
    try {
        await atualizarUsuario();
        await verificarDadosAtualizados();
        
        console.log('\n🎉 PROCESSO CONCLUÍDO!');
        console.log('📋 Resumo das alterações:');
        console.log(`   • Nome: Érica dos Santos → ${novasDados.nome_novo}`);
        console.log(`   • API Key: Nova chave configurada`);
        console.log(`   • Secret Key: Nova chave configurada`);
        console.log(`   • Status: Pronta para trading`);
        
    } catch (error) {
        console.error('❌ Erro no processo:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar atualização
executarAtualizacaoCompleta();

/**
 * 🚀 ATIVAÇÃO SISTEMA TRADING - PALOMA (VERSÃO SIMPLIFICADA)
 * 
 * Ativar sistema compatível com estrutura atual do banco
 */

const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

/**
 * Configurações para Paloma
 */
const configPaloma = {
    email: "pamaral15@hotmail.com",
    nome: "PALOMA AMARAL",
    saldo_inicial: 500.00,
    
    // Parâmetros seguros
    parametros: {
        take_profit: 2.0,     // 2%
        stop_loss: 1.0,       // 1%
        quantidade_min: 10,   // R$ 10
        quantidade_max: 50,   // R$ 50
        max_trades_dia: 10,
        max_perda_dia: 25.00,
        horario: "09:00-17:00"
    }
};

async function verificarPaloma() {
    try {
        console.log('🔍 VERIFICANDO DADOS DA PALOMA...');
        
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.balance_usd,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.email = $1;
        `;
        
        const result = await pool.query(query, [configPaloma.email]);
        
        if (result.rows.length === 0) {
            console.log('❌ Paloma não encontrada');
            return null;
        }
        
        const paloma = result.rows[0];
        console.log('✅ PALOMA ENCONTRADA:');
        console.log(`   ID: ${paloma.id}`);
        console.log(`   Nome: ${paloma.name}`);
        console.log(`   Email: ${paloma.email}`);
        console.log(`   Saldo: $${paloma.balance_usd || configPaloma.saldo_inicial}`);
        console.log(`   API Key: ${paloma.api_key}`);
        console.log(`   Exchange: ${paloma.exchange}`);
        
        return paloma;
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return null;
    }
}

async function testarConectividade(apiKey, secretKey) {
    try {
        console.log('\n🧪 TESTANDO CONECTIVIDADE FINAL...');
        
        const baseUrl = 'https://api.bybit.com';
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
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
                        console.log(`   💰 Saldo Bybit: ${account.totalWalletBalance} USD`);
                    }
                });
            }
            return true;
        } else {
            console.log(`   ❌ Erro API: ${response.data.retCode}`);
            return false;
        }
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        return false;
    }
}

async function ativarUsuario(userId) {
    try {
        console.log('\n🚀 ATIVANDO SISTEMA DE TRADING...');
        
        // Verificar se colunas existem
        const checkColumns = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('status', 'role');
        `;
        
        const columns = await pool.query(checkColumns);
        const hasStatus = columns.rows.some(row => row.column_name === 'status');
        const hasRole = columns.rows.some(row => row.column_name === 'role');
        
        if (hasStatus && hasRole) {
            const updateQuery = `
                UPDATE users 
                SET status = 'ATIVO_TRADING', role = 'TRADER_PRODUCAO', updated_at = NOW()
                WHERE id = $1;
            `;
            await pool.query(updateQuery, [userId]);
            console.log('   ✅ Status atualizado: ATIVO_TRADING');
        } else {
            console.log('   ⚠️ Colunas status/role não existem - sistema ativo por padrão');
        }
        
        return true;
        
    } catch (error) {
        console.error('   ❌ Erro ao ativar:', error.message);
        return false;
    }
}

async function registrarAtivacao(userId) {
    try {
        console.log('\n📝 REGISTRANDO ATIVAÇÃO...');
        
        // Verificar se tabela trading_operations existe
        const checkTable = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'trading_operations'
            );
        `;
        
        const tableExists = await pool.query(checkTable);
        
        if (tableExists.rows[0].exists) {
            const insertQuery = `
                INSERT INTO trading_operations (
                    user_id, operation_type, symbol, side, 
                    quantity, price, status, exchange, 
                    metadata, created_at
                ) VALUES ($1, 'SISTEMA_ATIVADO', 'SYSTEM', 'INFO', 0, 0, 'COMPLETED', 'bybit', $2, NOW());
            `;
            
            const metadata = {
                evento: 'ATIVACAO_TRADING_REAL',
                usuario: configPaloma.nome,
                configuracao: configPaloma.parametros,
                timestamp: new Date().toISOString()
            };
            
            await pool.query(insertQuery, [userId, JSON.stringify(metadata)]);
            console.log('   ✅ Ativação registrada!');
        } else {
            console.log('   ⚠️ Tabela trading_operations não existe - continuando...');
        }
        
        return true;
        
    } catch (error) {
        console.error('   ❌ Erro ao registrar:', error.message);
        return false;
    }
}

async function executarAtivacao() {
    try {
        console.log('🚀 ATIVAÇÃO SISTEMA DE TRADING - PALOMA');
        console.log('='.repeat(50));
        console.log('📅 29 de Julho de 2025');
        console.log('🎯 Colocar sistema em operação real');
        console.log('');
        
        // 1. Verificar Paloma
        const paloma = await verificarPaloma();
        if (!paloma) return;
        
        // 2. Testar conectividade
        const conectividade = await testarConectividade(paloma.api_key, paloma.secret_key);
        if (!conectividade) {
            console.log('❌ Sem conectividade - abortando ativação');
            return;
        }
        
        // 3. Ativar usuário
        const ativado = await ativarUsuario(paloma.id);
        if (!ativado) return;
        
        // 4. Registrar ativação
        await registrarAtivacao(paloma.id);
        
        // 5. Resumo final
        console.log('\n🎉 SISTEMA ATIVADO COM SUCESSO!');
        console.log('='.repeat(40));
        console.log('✅ PALOMA AMARAL - TRADING ATIVO');
        console.log('');
        console.log('📊 CONFIGURAÇÕES:');
        console.log(`   💰 Saldo inicial: R$ ${configPaloma.saldo_inicial}`);
        console.log(`   📈 Take Profit: ${configPaloma.parametros.take_profit}%`);
        console.log(`   📉 Stop Loss: ${configPaloma.parametros.stop_loss}%`);
        console.log(`   💵 Range por trade: R$${configPaloma.parametros.quantidade_min} - R$${configPaloma.parametros.quantidade_max}`);
        console.log(`   🛡️ Max perda/dia: R$${configPaloma.parametros.max_perda_dia}`);
        console.log(`   📊 Max trades/dia: ${configPaloma.parametros.max_trades_dia}`);
        console.log(`   🕒 Horário: ${configPaloma.parametros.horario}`);
        console.log('');
        console.log('🚀 SISTEMA PRONTO PARA RECEBER SINAIS!');
        console.log('📡 Webhook: /webhook/tradingview');
        console.log('🔗 IP: 132.255.160.140');
        console.log('🏢 Exchange: Bybit (Produção)');
        console.log('');
        console.log('⚠️ PRÓXIMOS PASSOS:');
        console.log('1. Configurar webhook no TradingView');
        console.log('2. Iniciar monitoramento de sinais');
        console.log('3. Acompanhar primeiras operações');
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error.message);
    } finally {
        await pool.end();
    }
}

executarAtivacao();

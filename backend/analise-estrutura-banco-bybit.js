/**
 * 🔍 ANÁLISE ESTRUTURA BANCO VS RETORNO BYBIT
 * Verificar se nossa estrutura de banco está alinhada com os dados da Bybit
 */

const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 ANÁLISE ESTRUTURA BANCO VS RETORNO BYBIT');
console.log('='.repeat(60));

async function analisarEstruturaBanco() {
    try {
        console.log('📊 1. VERIFICANDO ESTRUTURA DAS TABELAS DO BANCO...\n');
        
        // 1. Verificar estrutura da tabela user_api_keys
        console.log('🔑 TABELA user_api_keys:');
        const userApiKeysSchema = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys'
            ORDER BY ordinal_position
        `);
        
        userApiKeysSchema.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // 2. Verificar estrutura da tabela user_operations
        console.log('\n📈 TABELA user_operations:');
        const userOperationsSchema = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_operations'
            ORDER BY ordinal_position
        `);
        
        userOperationsSchema.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // 3. Verificar estrutura da tabela trading_signals
        console.log('\n📡 TABELA trading_signals:');
        const tradingSignalsSchema = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals'
            ORDER BY ordinal_position
        `);
        
        tradingSignalsSchema.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // 4. Verificar estrutura da tabela users
        console.log('\n👤 TABELA users:');
        const usersSchema = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        
        usersSchema.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 2. ANALISANDO RETORNO DA API BYBIT...\n');
        
        // Usar as chaves corretas da Luiza para testar
        const API_KEY = '9HZy9BiUW95iXprVRl';
        const API_SECRET = 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const query = 'accountType=UNIFIED';
        const signPayload = timestamp + API_KEY + recvWindow + query;
        
        const signature = crypto
            .createHmac('sha256', API_SECRET)
            .update(signPayload)
            .digest('hex');
        
        const headers = {
            'Content-Type': 'application/json',
            'X-BAPI-API-KEY': API_KEY,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'X-BAPI-SIGN-TYPE': '2'
        };
        
        console.log('🌐 Testando diferentes endpoints da Bybit:\n');
        
        // Teste 1: Wallet Balance
        try {
            console.log('💰 WALLET BALANCE:');
            const walletRes = await axios.get('https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED', { headers });
            console.log('   ✅ Status:', walletRes.status);
            console.log('   📊 Estrutura principal:', Object.keys(walletRes.data));
            
            if (walletRes.data.result && walletRes.data.result.list && walletRes.data.result.list.length > 0) {
                const account = walletRes.data.result.list[0];
                console.log('   🏦 Campos da conta:', Object.keys(account));
                
                if (account.coin && account.coin.length > 0) {
                    console.log('   💎 Campos por moeda:', Object.keys(account.coin[0]));
                }
            }
        } catch (err) {
            console.log('   ❌ Erro:', err.message);
        }
        
        console.log('');
        
        // Teste 2: Position Info
        try {
            console.log('📊 POSITION INFO:');
            const posQuery = 'category=linear';
            const posSignPayload = timestamp + API_KEY + recvWindow + posQuery;
            const posSignature = crypto.createHmac('sha256', API_SECRET).update(posSignPayload).digest('hex');
            
            const posHeaders = { ...headers, 'X-BAPI-SIGN': posSignature };
            const posRes = await axios.get('https://api.bybit.com/v5/position/list?category=linear', { headers: posHeaders });
            
            console.log('   ✅ Status:', posRes.status);
            console.log('   📊 Estrutura principal:', Object.keys(posRes.data));
            
            if (posRes.data.result && posRes.data.result.list && posRes.data.result.list.length > 0) {
                console.log('   📈 Campos da posição:', Object.keys(posRes.data.result.list[0]));
            } else {
                console.log('   📝 Nenhuma posição ativa encontrada');
            }
        } catch (err) {
            console.log('   ❌ Erro:', err.message);
        }
        
        console.log('');
        
        // Teste 3: Order History
        try {
            console.log('📋 ORDER HISTORY:');
            const orderQuery = 'category=linear&limit=10';
            const orderSignPayload = timestamp + API_KEY + recvWindow + orderQuery;
            const orderSignature = crypto.createHmac('sha256', API_SECRET).update(orderSignPayload).digest('hex');
            
            const orderHeaders = { ...headers, 'X-BAPI-SIGN': orderSignature };
            const orderRes = await axios.get('https://api.bybit.com/v5/order/history?category=linear&limit=10', { headers: orderHeaders });
            
            console.log('   ✅ Status:', orderRes.status);
            console.log('   📊 Estrutura principal:', Object.keys(orderRes.data));
            
            if (orderRes.data.result && orderRes.data.result.list && orderRes.data.result.list.length > 0) {
                console.log('   📋 Campos da ordem:', Object.keys(orderRes.data.result.list[0]));
            } else {
                console.log('   📝 Nenhuma ordem encontrada no histórico');
            }
        } catch (err) {
            console.log('   ❌ Erro:', err.message);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🔍 3. ANÁLISE DE COMPATIBILIDADE...\n');
        
        console.log('📊 MAPEAMENTO NECESSÁRIO ENTRE BYBIT E NOSSO BANCO:\n');
        
        console.log('💰 WALLET BALANCE → user_operations:');
        console.log('   Bybit: totalEquity → Banco: balance (numeric)');
        console.log('   Bybit: totalAvailableBalance → Banco: available_balance (numeric)');
        console.log('   Bybit: coin[].walletBalance → Banco: wallet_balance (numeric)');
        console.log('   Bybit: coin[].coin → Banco: asset/symbol (varchar)');
        
        console.log('\n📈 POSITION INFO → user_operations:');
        console.log('   Bybit: symbol → Banco: symbol (varchar)');
        console.log('   Bybit: side → Banco: side (varchar)');
        console.log('   Bybit: size → Banco: quantity (numeric)');
        console.log('   Bybit: entryPrice → Banco: entry_price (numeric)');
        console.log('   Bybit: markPrice → Banco: current_price (numeric)');
        console.log('   Bybit: unrealisedPnl → Banco: unrealized_pnl (numeric)');
        console.log('   Bybit: positionStatus → Banco: status (varchar)');
        
        console.log('\n📋 ORDER HISTORY → user_operations:');
        console.log('   Bybit: orderId → Banco: order_id (varchar)');
        console.log('   Bybit: symbol → Banco: symbol (varchar)');
        console.log('   Bybit: side → Banco: side (varchar)');
        console.log('   Bybit: orderType → Banco: order_type (varchar)');
        console.log('   Bybit: qty → Banco: quantity (numeric)');
        console.log('   Bybit: price → Banco: price (numeric)');
        console.log('   Bybit: orderStatus → Banco: status (varchar)');
        console.log('   Bybit: createdTime → Banco: created_at (timestamp)');
        
        console.log('\n🔧 VERIFICANDO SE PRECISAMOS DE NOVOS CAMPOS...\n');
        
        // Verificar se temos todos os campos necessários
        const operationsFields = userOperationsSchema.rows.map(row => row.column_name);
        
        const camposNecessarios = [
            'user_id', 'symbol', 'side', 'quantity', 'entry_price', 'current_price',
            'unrealized_pnl', 'status', 'order_id', 'order_type', 'balance',
            'available_balance', 'wallet_balance', 'created_at', 'updated_at'
        ];
        
        console.log('✅ CAMPOS EXISTENTES NO BANCO:');
        operationsFields.forEach(field => {
            console.log(`   ✓ ${field}`);
        });
        
        console.log('\n🔍 CAMPOS NECESSÁRIOS PARA BYBIT:');
        const camposFaltando = [];
        camposNecessarios.forEach(campo => {
            const existe = operationsFields.includes(campo);
            console.log(`   ${existe ? '✅' : '❌'} ${campo} ${existe ? '(existe)' : '(FALTANDO)'}`);
            if (!existe) camposFaltando.push(campo);
        });
        
        if (camposFaltando.length > 0) {
            console.log('\n🔧 CAMPOS QUE PRECISAM SER ADICIONADOS:');
            camposFaltando.forEach(campo => {
                console.log(`   📝 ALTER TABLE user_operations ADD COLUMN ${campo} ...`);
            });
        } else {
            console.log('\n✅ ESTRUTURA DO BANCO ESTÁ COMPLETA PARA BYBIT!');
        }
        
    } catch (error) {
        console.error('❌ Erro na análise:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
        console.log('\n🔚 Análise finalizada.');
    }
}

analisarEstruturaBanco();

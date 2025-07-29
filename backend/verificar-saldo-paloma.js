/**
 * 🔍 VERIFICAR SALDO ATUAL DA PALOMA
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarSaldoPaloma() {
    try {
        console.log('🔍 VERIFICANDO SALDO ATUAL DA PALOMA');
        console.log('='.repeat(50));
        
        // 1. Buscar ID da Paloma
        const palomaQuery = `
            SELECT id, name, email, status
            FROM users 
            WHERE email = 'pamaral15@hotmail.com';
        `;
        
        const paloma = await pool.query(palomaQuery);
        console.log(`✅ Paloma ID: ${paloma.rows[0].id}`);
        
        // 2. Verificar saldos existentes
        console.log('\n💰 SALDOS EXISTENTES:');
        const saldosQuery = `
            SELECT * FROM user_balances 
            WHERE user_id = $1
            ORDER BY exchange, currency;
        `;
        
        const saldos = await pool.query(saldosQuery, [paloma.rows[0].id]);
        
        if (saldos.rows.length > 0) {
            console.log('📊 SALDOS ENCONTRADOS:');
            saldos.rows.forEach((saldo, index) => {
                console.log(`   ${index + 1}. Exchange: ${saldo.exchange}`);
                console.log(`      Currency: ${saldo.currency}`);
                console.log(`      Available: ${saldo.available_balance}`);
                console.log(`      Locked: ${saldo.locked_balance}`);
                console.log(`      Total: ${saldo.total_balance}`);
                console.log(`      Created: ${saldo.created_at}`);
                console.log(`      ---`);
            });
            
            console.log(`\n✅ Total de ${saldos.rows.length} saldo(s) encontrado(s)`);
            
            // 3. Verificar se já tem saldo USDT Bybit
            const saldoBybitUSDT = saldos.rows.find(s => 
                s.exchange === 'bybit' && s.currency === 'USDT'
            );
            
            if (saldoBybitUSDT) {
                console.log('\n💎 SALDO BYBIT USDT JÁ EXISTE:');
                console.log(`   💰 Disponível: $${saldoBybitUSDT.available_balance}`);
                console.log(`   🔒 Bloqueado: $${saldoBybitUSDT.locked_balance}`);
                console.log(`   📊 Total: $${saldoBybitUSDT.total_balance}`);
                console.log('\n✅ NÃO PRECISA CRIAR NOVO SALDO!');
            } else {
                console.log('\n⚠️ SALDO BYBIT USDT NÃO ENCONTRADO');
                console.log('💡 Precisa criar saldo para Bybit USDT');
            }
            
        } else {
            console.log('❌ NENHUM SALDO ENCONTRADO');
            console.log('💡 Precisa criar saldo inicial');
        }
        
        // 4. Verificar estrutura da coluna total_balance
        console.log('\n🔍 VERIFICANDO ESTRUTURA DA COLUNA total_balance:');
        const estruturaQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_balances' AND column_name = 'total_balance';
        `;
        
        const estrutura = await pool.query(estruturaQuery);
        if (estrutura.rows.length > 0) {
            const col = estrutura.rows[0];
            console.log(`   📊 Tipo: ${col.data_type}`);
            console.log(`   📊 Nullable: ${col.is_nullable}`);
            console.log(`   📊 Default: ${col.column_default || 'NENHUM'}`);
            
            if (col.column_default && col.column_default.includes('GENERATED')) {
                console.log('\n⚠️ COLUNA total_balance É GENERATED/COMPUTED!');
                console.log('💡 Não deve ser inserida manualmente');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarSaldoPaloma();

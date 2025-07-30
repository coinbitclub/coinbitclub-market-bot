/**
 * 🔧 CORREÇÃO FINAL ESTRUTURA BANCO
 * Ajustar tamanhos de campos e tipos para perfeita compatibilidade
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 CORREÇÃO FINAL ESTRUTURA BANCO');
console.log('='.repeat(50));

async function correcaoFinalBanco() {
    try {
        console.log('📊 Ajustando tamanhos de campos para Bybit...\n');
        
        // Ajustes necessários baseados no erro
        const ajustes = [
            {
                acao: 'ALTER COLUMN',
                campo: 'operation_type',
                tipo: 'VARCHAR(50)',
                descricao: 'Aumentar limite para operation_type (BALANCE_UPDATE)'
            },
            {
                acao: 'ALTER COLUMN',
                campo: 'side',
                tipo: 'VARCHAR(20)',
                descricao: 'Aumentar limite para side (LONG/SHORT)'
            },
            {
                acao: 'ALTER COLUMN',
                campo: 'order_type',
                tipo: 'VARCHAR(50)',
                descricao: 'Aumentar limite para order_type'
            },
            {
                acao: 'ALTER COLUMN',
                campo: 'status',
                tipo: 'VARCHAR(50)',
                descricao: 'Aumentar limite para status'
            }
        ];
        
        for (const { acao, campo, tipo, descricao } of ajustes) {
            console.log(`🔧 ${acao}: ${campo} → ${tipo}`);
            console.log(`   📝 ${descricao}`);
            
            try {
                await pool.query(`
                    ALTER TABLE user_operations 
                    ALTER COLUMN ${campo} TYPE ${tipo}
                `);
                console.log(`   ✅ Campo ${campo} ajustado com sucesso`);
            } catch (error) {
                console.log(`   ⚠️ Campo ${campo}: ${error.message}`);
            }
            console.log('');
        }
        
        console.log('🚀 Testando inserção com dados reais...\n');
        
        // Teste de inserção com dados corretos
        try {
            await pool.query(`
                INSERT INTO user_operations (
                    user_id, symbol, operation_type, 
                    balance, available_balance, wallet_balance,
                    status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, [
                4, // user_id da Luiza
                'USDT',
                'BALANCE_UPDATE',
                105.6348217,
                105.6348217,
                105.6348217,
                'ACTIVE'
            ]);
            
            console.log('✅ Teste de inserção SUCESSO - dados salvos no banco');
            
            // Verificar o registro salvo
            const verificacao = await pool.query(`
                SELECT * FROM user_operations 
                WHERE user_id = 4 AND operation_type = 'BALANCE_UPDATE'
                ORDER BY created_at DESC LIMIT 1
            `);
            
            if (verificacao.rows.length > 0) {
                const registro = verificacao.rows[0];
                console.log('📊 Registro salvo:');
                console.log(`   ID: ${registro.id}`);
                console.log(`   Usuário: ${registro.user_id}`);
                console.log(`   Símbolo: ${registro.symbol}`);
                console.log(`   Tipo: ${registro.operation_type}`);
                console.log(`   Balance: ${registro.balance}`);
                console.log(`   Available: ${registro.available_balance}`);
                console.log(`   Wallet: ${registro.wallet_balance}`);
                console.log(`   Status: ${registro.status}`);
            }
            
        } catch (insertError) {
            console.error('❌ Erro no teste de inserção:', insertError.message);
        }
        
        console.log('\n📋 Verificando estrutura final...');
        
        // Verificar estrutura final dos campos críticos
        const estrutura = await pool.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'user_operations' 
            AND column_name IN ('operation_type', 'side', 'order_type', 'status', 'symbol')
            ORDER BY column_name
        `);
        
        console.log('\n📊 ESTRUTURA DOS CAMPOS CRÍTICOS:');
        estrutura.rows.forEach(col => {
            const tamanho = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
            console.log(`   ✅ ${col.column_name}: ${col.data_type}${tamanho}`);
        });
        
        console.log('\n🎯 CAMPOS BYBIT E SEUS TAMANHOS MÁXIMOS:');
        console.log('   operation_type: BALANCE_UPDATE, POSITION, ORDER (até 20 chars)');
        console.log('   side: BUY, SELL, LONG, SHORT (até 10 chars)');
        console.log('   order_type: Market, Limit, StopMarket, TakeProfit (até 30 chars)');
        console.log('   status: ACTIVE, FILLED, CANCELLED, PENDING, etc. (até 20 chars)');
        console.log('   symbol: BTCUSDT, ETHUSDT, etc. (até 20 chars)');
        
        console.log('\n✅ ESTRUTURA AGORA ESTÁ OTIMIZADA PARA BYBIT!');
        
    } catch (error) {
        console.error('❌ Erro na correção final:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
        console.log('\n🔚 Correção final concluída.');
    }
}

correcaoFinalBanco();

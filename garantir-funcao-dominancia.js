/**
 * 🔧 GARANTIR FUNÇÃO DE DOMINÂNCIA NO BANCO DE PRODUÇÃO
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 CRIANDO FUNÇÃO DE DOMINÂNCIA NO BANCO DE PRODUÇÃO');
console.log('===================================================');

async function criarFuncaoDominancia() {
    try {
        // 1. Verificar se a tabela btc_dominance_signals existe
        console.log('\n📊 1. VERIFICANDO TABELA btc_dominance_signals:');
        
        const tabelaExiste = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'btc_dominance_signals'
            );
        `);
        
        if (!tabelaExiste.rows[0].exists) {
            console.log('   🔄 Criando tabela btc_dominance_signals...');
            await pool.query(`
                CREATE TABLE btc_dominance_signals (
                    id SERIAL PRIMARY KEY,
                    ticker VARCHAR(20) NOT NULL DEFAULT 'BTC.D',
                    time_str VARCHAR(50) NOT NULL,
                    btc_dominance DECIMAL(6,3) NOT NULL,
                    ema_7 DECIMAL(6,3),
                    diff_pct DECIMAL(8,4),
                    sinal VARCHAR(10) NOT NULL,
                    timestamp_parsed TIMESTAMP,
                    raw_json JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_btc_dominance_signals_timestamp 
                ON btc_dominance_signals(timestamp_parsed DESC);
                
                CREATE INDEX IF NOT EXISTS idx_btc_dominance_signals_sinal 
                ON btc_dominance_signals(sinal);
            `);
            console.log('   ✅ Tabela criada com sucesso');
        } else {
            console.log('   ✅ Tabela já existe');
        }

        // 2. Verificar se a função existe
        console.log('\n⚙️ 2. VERIFICANDO FUNÇÃO process_btc_dominance_signal:');
        
        const funcaoExiste = await pool.query(`
            SELECT EXISTS (
                SELECT FROM pg_proc 
                WHERE proname = 'process_btc_dominance_signal'
            );
        `);
        
        if (!funcaoExiste.rows[0].exists) {
            console.log('   🔄 Criando função process_btc_dominance_signal...');
        } else {
            console.log('   🔄 Atualizando função process_btc_dominance_signal...');
        }

        // 3. Criar/Atualizar função
        const funcaoSQL = `
        CREATE OR REPLACE FUNCTION process_btc_dominance_signal(
            p_ticker TEXT,
            p_time_str TEXT,
            p_btc_dominance DECIMAL,
            p_ema_7 DECIMAL,
            p_diff_pct DECIMAL,
            p_sinal TEXT,
            p_raw_json JSONB
        ) RETURNS JSON AS $$
        DECLARE
            v_parsed_timestamp TIMESTAMP;
            v_signal_id INTEGER;
            v_dominance_signal_id INTEGER;
            v_result JSON;
        BEGIN
            -- Parse do timestamp
            BEGIN
                v_parsed_timestamp := TO_TIMESTAMP(p_time_str, 'YYYY-MM-DD HH24:MI:SS');
            EXCEPTION WHEN OTHERS THEN
                v_parsed_timestamp := NOW();
            END;
            
            -- Inserir na tabela de dominância específica
            INSERT INTO btc_dominance_signals (
                ticker, time_str, btc_dominance, ema_7, diff_pct, 
                sinal, timestamp_parsed, raw_json
            ) VALUES (
                p_ticker, p_time_str, p_btc_dominance, p_ema_7, p_diff_pct,
                p_sinal, v_parsed_timestamp, p_raw_json
            ) RETURNING id INTO v_dominance_signal_id;
            
            -- Inserir na tabela signals para compatibilidade
            INSERT INTO signals (
                symbol, action, strategy, timeframe, alert_message, 
                price, processed, created_at
            ) VALUES (
                p_ticker,
                CASE 
                    WHEN p_sinal = 'LONG' THEN 'BUY_DOMINANCE'
                    WHEN p_sinal = 'SHORT' THEN 'SELL_DOMINANCE'  
                    ELSE 'HOLD_DOMINANCE'
                END,
                'btc_dominance',
                '1h',
                p_sinal || ': BTC.D ' || p_btc_dominance::TEXT || '% (diff: ' || COALESCE(p_diff_pct::TEXT, 'N/A') || '%)',
                p_btc_dominance,
                false,
                v_parsed_timestamp
            ) RETURNING id INTO v_signal_id;
            
            -- Retornar resultado
            v_result := json_build_object(
                'success', true,
                'signal_id', v_signal_id,
                'dominance_signal_id', v_dominance_signal_id,
                'ticker', p_ticker,
                'dominance', p_btc_dominance,
                'signal', p_sinal,
                'diff_pct', p_diff_pct,
                'timestamp', v_parsed_timestamp
            );
            
            RETURN v_result;
        END;
        $$ LANGUAGE plpgsql;
        `;
        
        await pool.query(funcaoSQL);
        console.log('   ✅ Função criada/atualizada com sucesso');

        // 4. Teste da função
        console.log('\n🧪 3. TESTANDO FUNÇÃO:');
        
        const testeResult = await pool.query(`
            SELECT process_btc_dominance_signal($1, $2, $3, $4, $5, $6, $7) as result;
        `, [
            'BTC.D',
            '2025-07-30 17:30:00',
            59.123,
            58.456,
            1.141,
            'LONG',
            JSON.stringify({ test: true })
        ]);
        
        console.log('   ✅ Teste realizado com sucesso');
        console.log('   📊 Resultado:', JSON.stringify(testeResult.rows[0].result, null, 2));

        // 5. Verificar dados
        console.log('\n📋 4. VERIFICANDO DADOS:');
        
        const ultimoSinal = await pool.query(`
            SELECT * FROM btc_dominance_signals 
            ORDER BY created_at DESC 
            LIMIT 1;
        `);
        
        if (ultimoSinal.rows.length > 0) {
            const sinal = ultimoSinal.rows[0];
            console.log(`   📊 Último sinal: ${sinal.sinal} - BTC.D: ${sinal.btc_dominance}%`);
            console.log(`   🕐 Tempo: ${sinal.time_str}`);
        }

        console.log('\n✅ FUNÇÃO DE DOMINÂNCIA CONFIGURADA COM SUCESSO!');
        console.log('   🎯 Tabela criada/verificada');
        console.log('   ⚙️ Função criada/atualizada');
        console.log('   🧪 Teste executado com sucesso');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar
criarFuncaoDominancia().catch(console.error);

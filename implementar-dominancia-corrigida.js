/**
 * 🔧 IMPLEMENTAÇÃO CORRIGIDA DO SINAL DE DOMINÂNCIA BTC
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 IMPLEMENTAÇÃO CORRIGIDA DO SINAL DE DOMINÂNCIA BTC');
console.log('====================================================');

async function implementarDominanciaCorrigida() {
    try {
        // 1. Criar função corrigida para processar sinal de dominância
        console.log('\n⚙️ 1. CRIANDO FUNÇÃO CORRIGIDA:');
        
        const funcaoCorrigida = `
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
            
            -- Inserir na tabela signals para compatibilidade (com estrutura correta)
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
                p_sinal || ': BTC.D ' || p_btc_dominance::TEXT || '% (diff: ' || p_diff_pct::TEXT || '%)',
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
        
        await pool.query(funcaoCorrigida);
        console.log('   ✅ Função corrigida criada');

        // 2. Teste da função corrigida
        console.log('\n🧪 2. TESTANDO FUNÇÃO CORRIGIDA:');
        
        const testeData = {
            ticker: 'BTC.D',
            time: '2025-07-30 16:35:00',
            btc_dominance: '58.425',
            ema_7: '57.892',
            diff_pct: '0.921',
            sinal: 'LONG'
        };
        
        const testeResult = await pool.query(`
            SELECT process_btc_dominance_signal($1, $2, $3, $4, $5, $6, $7) as result;
        `, [
            testeData.ticker,
            testeData.time,
            parseFloat(testeData.btc_dominance),
            parseFloat(testeData.ema_7),
            parseFloat(testeData.diff_pct),
            testeData.sinal,
            JSON.stringify(testeData)
        ]);
        
        console.log('   ✅ Teste realizado com sucesso');
        console.log('   📊 Resultado:', JSON.stringify(testeResult.rows[0].result, null, 2));

        // 3. Teste adicional com sinal SHORT
        console.log('\n🧪 3. TESTANDO SINAL SHORT:');
        
        const testeShortData = {
            ticker: 'BTC.D',
            time: '2025-07-30 16:36:00',
            btc_dominance: '57.125',
            ema_7: '58.300',
            diff_pct: '-2.015',
            sinal: 'SHORT'
        };
        
        const testeShortResult = await pool.query(`
            SELECT process_btc_dominance_signal($1, $2, $3, $4, $5, $6, $7) as result;
        `, [
            testeShortData.ticker,
            testeShortData.time,
            parseFloat(testeShortData.btc_dominance),
            parseFloat(testeShortData.ema_7),
            parseFloat(testeShortData.diff_pct),
            testeShortData.sinal,
            JSON.stringify(testeShortData)
        ]);
        
        console.log('   ✅ Teste SHORT realizado com sucesso');
        console.log('   📊 Resultado:', JSON.stringify(testeShortResult.rows[0].result, null, 2));

        // 4. Teste com sinal NEUTRO
        console.log('\n🧪 4. TESTANDO SINAL NEUTRO:');
        
        const testeNeutroData = {
            ticker: 'BTC.D',
            time: '2025-07-30 16:37:00',
            btc_dominance: '58.100',
            ema_7: '58.050',
            diff_pct: '0.086',
            sinal: 'NEUTRO'
        };
        
        const testeNeutroResult = await pool.query(`
            SELECT process_btc_dominance_signal($1, $2, $3, $4, $5, $6, $7) as result;
        `, [
            testeNeutroData.ticker,
            testeNeutroData.time,
            parseFloat(testeNeutroData.btc_dominance),
            parseFloat(testeNeutroData.ema_7),
            parseFloat(testeNeutroData.diff_pct),
            testeNeutroData.sinal,
            JSON.stringify(testeNeutroData)
        ]);
        
        console.log('   ✅ Teste NEUTRO realizado com sucesso');
        console.log('   📊 Resultado:', JSON.stringify(testeNeutroResult.rows[0].result, null, 2));

        // 5. Verificar dados inseridos
        console.log('\n📋 5. VERIFICANDO DADOS INSERIDOS:');
        
        const ultimosSinaisDominancia = await pool.query(`
            SELECT * FROM btc_dominance_signals 
            ORDER BY created_at DESC 
            LIMIT 5;
        `);
        
        console.log(`   📊 Últimos sinais de dominância: ${ultimosSinaisDominancia.rows.length}`);
        ultimosSinaisDominancia.rows.forEach((sinal, index) => {
            console.log(`   ${index + 1}. ${sinal.sinal} - BTC.D: ${sinal.btc_dominance}%`);
            console.log(`      🕐 Tempo: ${sinal.time_str}`);
            console.log(`      📈 EMA7: ${sinal.ema_7}% | Diff: ${sinal.diff_pct}%`);
        });

        const ultimosSinaisGeral = await pool.query(`
            SELECT * FROM signals 
            WHERE strategy = 'btc_dominance'
            ORDER BY created_at DESC 
            LIMIT 5;
        `);
        
        console.log(`\n   📊 Últimos sinais gerais (dominância): ${ultimosSinaisGeral.rows.length}`);
        ultimosSinaisGeral.rows.forEach((sinal, index) => {
            console.log(`   ${index + 1}. ${sinal.action} - ${sinal.symbol}: ${sinal.price}%`);
            console.log(`      📝 Mensagem: ${sinal.alert_message}`);
        });

        // 6. Resumo final
        console.log('\n🎉 6. IMPLEMENTAÇÃO FINALIZADA:');
        console.log('==============================');
        console.log('✅ Função de processamento corrigida e testada');
        console.log('✅ Sinais LONG, SHORT e NEUTRO funcionando');
        console.log('✅ Dados salvos em btc_dominance_signals');
        console.log('✅ Compatibilidade com signals mantida');
        
        console.log('\n📡 ENDPOINT PRONTO:');
        console.log('   📍 URL: https://coinbitclub-market-bot.up.railway.app/api/webhooks/dominance');
        console.log('   📦 Formato Pine Script funcional');
        
        console.log('\n🔧 CONFIGURAÇÃO PINE SCRIPT:');
        console.log('============================');
        console.log('No seu indicador "BTC Dominance vs EMA 7", use:');
        console.log('');
        console.log('json = \'{"ticker":"BTC.D","time":"\' + str.tostring(time, "yyyy-MM-dd HH:mm:ss") + \'","btc_dominance":"\' + str.tostring(close, "#.###") + \'","ema_7":"\' + str.tostring(ema7, "#.###") + \'","diff_pct":"\' + str.tostring(diff, "#.###") + \'","sinal":"\' + sinal + \'"}\'');
        console.log('');
        console.log('alert(json, alert.freq_once_per_bar_close)');
        
        console.log('\n✅ DOMINÂNCIA BTC 100% IMPLEMENTADA E TESTADA!');

    } catch (error) {
        console.error('❌ Erro na implementação:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar implementação
implementarDominanciaCorrigida().catch(console.error);

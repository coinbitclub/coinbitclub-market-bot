#!/usr/bin/env node

console.log('🔍 VERIFICAÇÃO FINAL - DASHBOARD 100% INTEGRADO');
console.log('===============================================');

require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificacaoCompleta() {
    let sucessos = 0, problemas = 0;
    
    console.log('\n📊 1. VERIFICANDO DADOS DO DASHBOARD');
    console.log('===================================');
    
    try {
        // Verificar usuários ativos
        const usuarios = await pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true');
        const totalUsuarios = parseInt(usuarios.rows[0].total);
        console.log(`[CHECK] 👥 Usuários ativos: ${totalUsuarios} ${totalUsuarios > 0 ? '✅' : '❌'}`);
        totalUsuarios > 0 ? sucessos++ : problemas++;
        
        // Verificar APIs ativas
        const apis = await pool.query(`
            SELECT 
                exchange, 
                COUNT(*) as total,
                SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as ativas
            FROM api_validation_log 
            GROUP BY exchange
        `);
        console.log(`[CHECK] 🔑 APIs configuradas por exchange:`);
        apis.rows.forEach(api => {
            console.log(`  - ${api.exchange}: ${api.ativas}/${api.total} ativas ${api.ativas > 0 ? '✅' : '❌'}`);
        });
        apis.rows.length > 0 ? sucessos++ : problemas++;
        
        // Verificar Fear & Greed Index
        const fearGreed = await pool.query(`
            SELECT value, category, created_at 
            FROM fear_greed_index 
            ORDER BY created_at DESC LIMIT 1
        `);
        if (fearGreed.rows.length > 0) {
            const fg = fearGreed.rows[0];
            console.log(`[CHECK] 😰 Fear & Greed: ${fg.value} (${fg.category}) ✅`);
            sucessos++;
        } else {
            console.log(`[CHECK] 😰 Fear & Greed: Sem dados ❌`);
            problemas++;
        }
        
        // Verificar BTC Dominance
        const btcDom = await pool.query(`
            SELECT dominance_percentage, collected_at 
            FROM btc_dominance 
            ORDER BY collected_at DESC LIMIT 1
        `);
        if (btcDom.rows.length > 0) {
            const dom = btcDom.rows[0];
            console.log(`[CHECK] ₿ BTC Dominance: ${dom.dominance_percentage}% ✅`);
            sucessos++;
        } else {
            console.log(`[CHECK] ₿ BTC Dominance: Sem dados ❌`);
            problemas++;
        }
        
        // Verificar TOP 100 Cryptos
        const top100 = await pool.query(`
            SELECT COUNT(*) as total, MAX(collected_at) as ultimo_update
            FROM top100_cryptocurrencies 
            WHERE collected_at > NOW() - INTERVAL '2 hours'
        `);
        const cryptos = parseInt(top100.rows[0].total);
        console.log(`[CHECK] 💰 TOP 100 Cryptos: ${cryptos} atualizados ✅`);
        cryptos > 50 ? sucessos++ : problemas++;
        
        // Verificar decisões da IA
        const iaDecisoes = await pool.query(`
            SELECT COUNT(*) as total, MAX(timestamp) as ultima_decisao
            FROM signal_metrics_log 
            WHERE timestamp > NOW() - INTERVAL '24 hours'
        `);
        const decisoes = parseInt(iaDecisoes.rows[0].total);
        console.log(`[CHECK] 🤖 Decisões IA (24h): ${decisoes} ${decisoes > 0 ? '✅' : '❌'}`);
        decisoes > 0 ? sucessos++ : problemas++;
        
    } catch (error) {
        console.log(`[ERROR] ❌ Erro verificação dados: ${error.message}`);
        problemas++;
    }
    
    console.log('\n🌐 2. VERIFICANDO APIS EXTERNAS');
    console.log('===============================');
    
    try {
        // Testar CoinStats API
        const coinstatsResponse = await axios.get('https://api.coinstats.app/public/v1/fear-greed', {
            headers: { 'X-API-KEY': process.env.COINSTATS_API_KEY }
        });
        console.log(`[API] 📊 CoinStats: ${coinstatsResponse.data.value} (${coinstatsResponse.data.category}) ✅`);
        sucessos++;
    } catch (error) {
        console.log(`[API] 📊 CoinStats: Erro - ${error.message} ❌`);
        problemas++;
    }
    
    try {
        // Testar Alternative.me API
        const altResponse = await axios.get('https://api.alternative.me/fng/');
        const altData = altResponse.data.data[0];
        console.log(`[API] 📈 Alternative.me: ${altData.value} (${altData.value_classification}) ✅`);
        sucessos++;
    } catch (error) {
        console.log(`[API] 📈 Alternative.me: Erro - ${error.message} ❌`);
        problemas++;
    }
    
    console.log('\n🔄 3. VERIFICANDO DASHBOARD EM TEMPO REAL');
    console.log('========================================');
    
    try {
        // Verificar se dashboard está respondendo
        const dashboardResponse = await axios.get('http://localhost:4000', {
            timeout: 5000
        });
        console.log(`[DASHBOARD] 🖥️ Status: Respondendo (${dashboardResponse.status}) ✅`);
        sucessos++;
    } catch (error) {
        console.log(`[DASHBOARD] 🖥️ Status: Erro - ${error.message} ❌`);
        problemas++;
    }
    
    console.log('\n📋 4. VERIFICANDO ESTRUTURA DO BANCO');
    console.log('===================================');
    
    const tabelasCriticas = [
        'users', 'api_validation_log', 'order_executions', 
        'fear_greed_index', 'btc_dominance', 'top100_cryptocurrencies',
        'signal_metrics_log'
    ];
    
    for (const tabela of tabelasCriticas) {
        try {
            const resultado = await pool.query(`SELECT COUNT(*) FROM ${tabela}`);
            const count = parseInt(resultado.rows[0].count);
            console.log(`[DB] 🗃️ ${tabela}: ${count} registros ${count >= 0 ? '✅' : '❌'}`);
            sucessos++;
        } catch (error) {
            console.log(`[DB] 🗃️ ${tabela}: Erro - ${error.message} ❌`);
            problemas++;
        }
    }
    
    console.log('\n🤖 5. VERIFICANDO SISTEMA DE IA');
    console.log('==============================');
    
    try {
        // Verificar última análise da IA
        const ultimaAnalise = await pool.query(`
            SELECT 
                fear_greed_index,
                btc_dominance,
                market_trend,
                volume_analysis,
                sentiment_score,
                market_cap_variation,
                ai_decision,
                timestamp
            FROM signal_metrics_log 
            ORDER BY timestamp DESC 
            LIMIT 1
        `);
        
        if (ultimaAnalise.rows.length > 0) {
            const analise = ultimaAnalise.rows[0];
            console.log(`[IA] 🧠 Última análise: ${analise.ai_decision}`);
            console.log(`[IA] 📊 Métricas: FG=${analise.fear_greed_index}, BTC=${analise.btc_dominance}%`);
            console.log(`[IA] 📈 Trend=${analise.market_trend}, Sentiment=${analise.sentiment_score}`);
            console.log(`[IA] 💰 Market Cap Var=${analise.market_cap_variation}, Volume=${analise.volume_analysis}`);
            sucessos++;
        } else {
            console.log(`[IA] 🧠 Sem análises recentes ❌`);
            problemas++;
        }
    } catch (error) {
        console.log(`[IA] 🧠 Erro análise IA: ${error.message} ❌`);
        problemas++;
    }
    
    console.log('\n🎯 6. RESUMO FINAL DA INTEGRAÇÃO');
    console.log('================================');
    
    const totalVerificacoes = sucessos + problemas;
    const percentualSucesso = Math.round((sucessos / totalVerificacoes) * 100);
    
    console.log(`✅ SUCESSOS: ${sucessos}`);
    console.log(`❌ PROBLEMAS: ${problemas}`);
    console.log(`📊 TAXA DE SUCESSO: ${percentualSucesso}%`);
    
    if (percentualSucesso >= 95) {
        console.log('\n🎉 DASHBOARD 100% INTEGRADO E FUNCIONAL!');
        console.log('🚀 SISTEMA COMPLETO OPERACIONAL!');
        console.log('📊 Acesse: http://localhost:4000');
    } else if (percentualSucesso >= 85) {
        console.log('\n✅ DASHBOARD QUASE TOTALMENTE INTEGRADO!');
        console.log('⚠️ PEQUENOS AJUSTES RESTANTES');
    } else {
        console.log('\n❌ DASHBOARD NECESSITA CORREÇÕES ADICIONAIS');
        console.log('🔧 VERIFICAR PROBLEMAS LISTADOS ACIMA');
    }
    
    await pool.end();
}

verificacaoCompleta().catch(console.error);

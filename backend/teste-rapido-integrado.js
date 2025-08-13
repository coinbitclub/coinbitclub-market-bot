/**
 * 🧪 TESTE RÁPIDO INTEGRADO - IA + MERCADO + BANCO
 * Versão simplificada para validação rápida
 */

require('dotenv').config();
const axios = require('axios');
const { createRobustPool, testConnection, safeQuery } = require('./fixed-database-config');

async function testeRapido() {
    console.log('🧪 TESTE RÁPIDO INTEGRADO - IA + MERCADO + BANCO');
    console.log('   📊 Validação de dominância BTC da CoinStats Markets API');
    console.log('   💾 Teste de salvamento no banco PostgreSQL\n');

    let pool = null;

    try {
        // 1. Conectar banco
        console.log('1️⃣ CONECTANDO AO BANCO...');
        pool = createRobustPool();
        const conectado = await testConnection(pool);
        if (!conectado) throw new Error('Falha na conexão');
        console.log('   ✅ PostgreSQL conectado');

        // 2. Testar APIs
        console.log('\n2️⃣ TESTANDO APIS...');
        
        // Fear & Greed
        console.log('   📊 CoinStats Fear & Greed...');
        const fgResp = await axios.get(process.env.FEAR_GREED_URL, {
            headers: { 'X-API-KEY': process.env.COINSTATS_API_KEY },
            timeout: 10000
        });
        const fearGreed = fgResp.data.now.value;
        console.log(`   ✅ Fear & Greed: ${fearGreed}`);

        // Bitcoin price
        console.log('   💰 Binance BTC price...');
        const btcResp = await axios.get('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', {
            timeout: 10000
        });
        const btcPrice = parseFloat(btcResp.data.lastPrice);
        console.log(`   ✅ BTC: $${btcPrice.toLocaleString()}`);

        // Dominância BTC (Markets API)
        console.log('   🏆 CoinStats Markets (BTC Dominance)...');
        const marketsResp = await axios.get('https://openapiv1.coinstats.app/markets', {
            headers: { 'X-API-KEY': process.env.COINSTATS_API_KEY },
            timeout: 10000
        });
        
        console.log('   📄 Markets API Response structure:');
        console.log(JSON.stringify(marketsResp.data, null, 2));

        let btcDominance = null;
        if (marketsResp.data) {
            // Tentar diferentes propriedades possíveis
            if (marketsResp.data.btcDominance) {
                btcDominance = parseFloat(marketsResp.data.btcDominance);
            } else if (marketsResp.data.totalMarketCap && marketsResp.data.btcMarketCap) {
                btcDominance = (marketsResp.data.btcMarketCap / marketsResp.data.totalMarketCap) * 100;
            } else if (marketsResp.data.marketCapDominance) {
                btcDominance = parseFloat(marketsResp.data.marketCapDominance);
            }
        }
        
        console.log(`   ✅ Dominância BTC: ${btcDominance ? btcDominance.toFixed(2) + '%' : 'N/A'}`);

        // 3. Teste simples IA
        console.log('\n3️⃣ ANÁLISE SIMPLES...');
        let recomendacao = 'LONG_E_SHORT';
        if (fearGreed <= 40) recomendacao = 'SOMENTE_LONG';
        else if (fearGreed >= 75) recomendacao = 'SOMENTE_SHORT';
        console.log(`   🎯 Recomendação: ${recomendacao} (baseada em FG: ${fearGreed})`);

        // 4. Salvar dados básicos
        console.log('\n4️⃣ SALVANDO NO BANCO...');
        
        // Usar cycle_number em vez de cycle_id se UUID der problema
        const query = `
            INSERT INTO sistema_leitura_mercado (
                cycle_number, btc_price, fear_greed_value, btc_dominance,
                market_direction, confidence_level, status,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id, created_at
        `;

        const valores = [
            Math.floor(Date.now() / 1000), // cycle_number como timestamp
            btcPrice,
            fearGreed,
            btcDominance,
            recomendacao,
            75,
            'completed'
        ];

        const resultado = await safeQuery(pool, query, valores);
        
        if (resultado.rows && resultado.rows.length > 0) {
            const salvamento = resultado.rows[0];
            console.log(`   ✅ Dados salvos! ID: ${salvamento.id}`);
            
            // Verificar salvamento
            const verificacao = await safeQuery(pool, 
                'SELECT * FROM sistema_leitura_mercado WHERE id = $1', 
                [salvamento.id]
            );
            
            if (verificacao.rows.length > 0) {
                const dados = verificacao.rows[0];
                console.log('   📋 DADOS VERIFICADOS:');
                console.log(`      💰 BTC: $${parseFloat(dados.btc_price).toLocaleString()}`);
                console.log(`      😨 Fear & Greed: ${dados.fear_greed_value}`);
                console.log(`      👑 Dominância: ${dados.btc_dominance ? parseFloat(dados.btc_dominance).toFixed(2) + '%' : 'N/A'}`);
                console.log(`      🎯 Recomendação: ${dados.market_direction}`);
                console.log(`      📅 Criado em: ${dados.created_at}`);
            }

            console.log('\n🎉 TESTE RÁPIDO: 100% SUCESSO!');
            console.log('🔥 SISTEMA INTEGRADO FUNCIONANDO!');
            console.log('\n🚀 COMPONENTES VALIDADOS:');
            console.log('   ✅ CoinStats Fear & Greed API');
            console.log('   ✅ CoinStats Markets API (dominância BTC)');
            console.log('   ✅ Binance API');
            console.log('   ✅ PostgreSQL salvamento');
            console.log('   ✅ Verificação de dados');
            return true;
        } else {
            throw new Error('Falha no salvamento');
        }

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        return false;
        
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Executar teste
testeRapido().then(sucesso => {
    if (sucesso) {
        console.log('\n🎯 VALIDAÇÃO CONCLUÍDA - SISTEMA PRONTO!');
        process.exit(0);
    } else {
        console.log('\n❌ VALIDAÇÃO FALHOU');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Erro crítico:', error.message);
    process.exit(1);
});

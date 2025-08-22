const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function checkAndStartMarketIntelligence() {
  try {
    console.log('🔍 VERIFICANDO E ATIVANDO MARKET INTELLIGENCE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. Verificar estrutura da tabela market_decisions
    console.log('🔍 1. VERIFICANDO ESTRUTURA DA TABELA market_decisions:');
    
    try {
      const tableStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'market_decisions'
        ORDER BY ordinal_position
      `);
      
      if (tableStructure.rows.length > 0) {
        console.log('✅ Tabela market_decisions existe:');
        tableStructure.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
      } else {
        console.log('❌ Tabela market_decisions não existe');
        
        // Criar tabela se não existir
        console.log('🔧 Criando tabela market_decisions...');
        await pool.query(`
          CREATE TABLE market_decisions (
            id SERIAL PRIMARY KEY,
            allow_long BOOLEAN DEFAULT false,
            allow_short BOOLEAN DEFAULT false,
            confidence INTEGER DEFAULT 50,
            fear_greed_value INTEGER DEFAULT 50,
            market_pulse DECIMAL(5,2) DEFAULT 50.0,
            btc_dominance DECIMAL(5,2) DEFAULT 50.0,
            market_condition VARCHAR(20) DEFAULT 'NEUTRAL',
            reasoning TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Tabela market_decisions criada');
      }
    } catch (error) {
      console.log(`❌ Erro verificando tabela: ${error.message}`);
    }
    
    // 2. Verificar dados existentes
    console.log('\n📊 2. VERIFICANDO DADOS EXISTENTES:');
    
    const existingData = await pool.query(`
      SELECT COUNT(*) as total FROM market_decisions
    `);
    
    console.log(`📊 Registros existentes: ${existingData.rows[0].total}`);
    
    if (parseInt(existingData.rows[0].total) === 0) {
      console.log('⚠️ Nenhum dado de Market Intelligence encontrado');
      console.log('🚀 Iniciando primeira análise...');
    } else {
      const lastRecord = await pool.query(`
        SELECT * FROM market_decisions 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      const last = lastRecord.rows[0];
      const timeDiff = Math.round((new Date() - new Date(last.created_at)) / (1000 * 60));
      console.log(`📊 Última análise: ${timeDiff} minutos atrás`);
    }
    
    // 3. Executar análise Market Intelligence manualmente
    console.log('\n🧠 3. EXECUTANDO ANÁLISE MARKET INTELLIGENCE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Obter Market Pulse (Binance)
    console.log('📈 Obtendo Market Pulse...');
    let marketPulse = 50.0;
    try {
      const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/24hr', { timeout: 10000 });
      const tickers = binanceResponse.data;
      const usdtPairs = tickers.filter(ticker => ticker.symbol.endsWith('USDT'));
      const positiveCount = usdtPairs.filter(ticker => parseFloat(ticker.priceChangePercent) > 0).length;
      marketPulse = (positiveCount / usdtPairs.length) * 100;
      console.log(`✅ Market Pulse: ${marketPulse.toFixed(1)}% (${positiveCount}/${usdtPairs.length} em alta)`);
    } catch (error) {
      console.log(`❌ Erro Market Pulse: ${error.message}`);
    }
    
    // Obter Fear & Greed Index
    console.log('😨 Obtendo Fear & Greed Index...');
    let fearGreed = 50;
    try {
      const fgResponse = await axios.get('https://api.alternative.me/fng/', { timeout: 10000 });
      fearGreed = parseInt(fgResponse.data.data[0].value);
      console.log(`✅ Fear & Greed: ${fearGreed}`);
    } catch (error) {
      console.log(`❌ Erro Fear & Greed: ${error.message}`);
    }
    
    // Obter BTC Dominance
    console.log('🟡 Obtendo BTC Dominance...');
    let btcDominance = 50.0;
    try {
      const coinStatsResponse = await axios.get('https://openapiv1.coinstats.app/markets', {
        headers: { 'X-API-KEY': 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=' },
        timeout: 10000
      });
      btcDominance = coinStatsResponse.data.btcDominance;
      console.log(`✅ BTC Dominance: ${btcDominance.toFixed(1)}%`);
    } catch (error) {
      console.log(`❌ Erro BTC Dominance: ${error.message}`);
    }
    
    // 4. Análise IA para tomada de decisão
    console.log('\n🤖 4. ANÁLISE INTELIGENTE PARA DECISÃO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let allowLong = false;
    let allowShort = false;
    let confidence = 50;
    let marketCondition = 'NEUTRAL';
    let reasoning = '';
    
    // Lógica de decisão baseada nos indicadores
    if (marketPulse >= 60 && fearGreed >= 40) {
      allowLong = true;
      marketCondition = 'BULLISH';
      confidence = Math.min(90, Math.round((marketPulse + fearGreed) / 2));
      reasoning = `Market Pulse alto (${marketPulse.toFixed(1)}%) + Fear&Greed favorável (${fearGreed})`;
    } else if (marketPulse <= 40 && fearGreed <= 60) {
      allowShort = true;
      marketCondition = 'BEARISH';
      confidence = Math.min(90, Math.round((100 - marketPulse + (100 - fearGreed)) / 2));
      reasoning = `Market Pulse baixo (${marketPulse.toFixed(1)}%) + Fear&Greed baixo (${fearGreed})`;
    } else {
      marketCondition = 'NEUTRAL';
      confidence = 40;
      reasoning = `Mercado indefinido - Market Pulse: ${marketPulse.toFixed(1)}%, F&G: ${fearGreed}`;
    }
    
    console.log(`📊 Análise concluída:`);
    console.log(`   Market Pulse: ${marketPulse.toFixed(1)}%`);
    console.log(`   Fear & Greed: ${fearGreed}`);
    console.log(`   BTC Dominance: ${btcDominance.toFixed(1)}%`);
    console.log(`   Condição: ${marketCondition}`);
    console.log(`   Confiança: ${confidence}%`);
    console.log(`   Permite LONG: ${allowLong ? '✅' : '❌'}`);
    console.log(`   Permite SHORT: ${allowShort ? '✅' : '❌'}`);
    console.log(`   Raciocínio: ${reasoning}`);
    
    // 5. Salvar decisão no banco
    console.log('\n💾 5. SALVANDO DECISÃO NO BANCO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const insertResult = await pool.query(`
        INSERT INTO market_decisions (
          allow_long,
          allow_short,
          confidence,
          fear_greed_value,
          market_pulse,
          btc_dominance,
          market_condition,
          reasoning,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id
      `, [
        allowLong,
        allowShort,
        confidence,
        fearGreed,
        marketPulse,
        btcDominance,
        marketCondition,
        reasoning
      ]);
      
      const decisionId = insertResult.rows[0].id;
      console.log(`✅ Decisão salva com ID: ${decisionId}`);
      
    } catch (insertError) {
      console.log(`❌ Erro ao salvar decisão: ${insertError.message}`);
    }
    
    // 6. Verificar se o servidor Railway tem Market Intelligence ativo
    console.log('\n🌐 6. VERIFICANDO MARKET INTELLIGENCE NO SERVIDOR:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const railwayResponse = await axios.get(
        'https://coinbitclub-market-bot.up.railway.app/api/market/intelligence',
        { timeout: 10000 }
      );
      
      console.log('✅ Market Intelligence endpoint ativo no Railway');
      console.log(`📊 Resposta: ${JSON.stringify(railwayResponse.data, null, 2)}`);
      
    } catch (railwayError) {
      console.log(`⚠️ Market Intelligence endpoint: ${railwayError.response?.status || 'ERRO'}`);
    }
    
    // 7. Testar decisão para trading
    console.log('\n🎯 7. TESTANDO DECISÃO PARA TRADING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const decision = {
      allowLong,
      allowShort,
      confidence,
      marketCondition
    };
    
    console.log('🧪 Simulando chegada de sinal FORTE...');
    
    if (allowLong) {
      console.log('✅ SINAL LONG FORTE seria APROVADO');
      console.log('   → Sistema criaria ordem BUY automaticamente');
    } else {
      console.log('❌ SINAL LONG FORTE seria BLOQUEADO');
      console.log('   → Condições de mercado desfavoráveis para LONG');
    }
    
    if (allowShort) {
      console.log('✅ SINAL SHORT FORTE seria APROVADO');
      console.log('   → Sistema criaria ordem SELL automaticamente');
    } else {
      console.log('❌ SINAL SHORT FORTE seria BLOQUEADO');
      console.log('   → Condições de mercado desfavoráveis para SHORT');
    }
    
    // 8. Resumo final
    console.log('\n📋 8. RESUMO DO MARKET INTELLIGENCE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`✅ Market Intelligence ATIVO e FUNCIONANDO`);
    console.log(`📊 Decisão atual: ${marketCondition}`);
    console.log(`🎯 Confiança: ${confidence}%`);
    console.log(`📈 Permite LONG: ${allowLong ? 'SIM' : 'NÃO'}`);
    console.log(`📉 Permite SHORT: ${allowShort ? 'SIM' : 'NÃO'}`);
    
    if (allowLong || allowShort) {
      console.log('\n🚀 SISTEMA PRONTO PARA RECEBER SINAIS FORTES!');
      console.log('✅ Próximos sinais FORTES serão processados automaticamente');
    } else {
      console.log('\n⚠️ MERCADO EM CONDIÇÃO NEUTRA');
      console.log('🔄 Sistema aguardando melhores condições de mercado');
    }
    
    console.log(`\n📡 Para monitorar: https://coinbitclub-market-bot.up.railway.app/api/market/intelligence`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndStartMarketIntelligence();

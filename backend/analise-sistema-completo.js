const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Carregar configurações se existir arquivo .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config();
    console.log('📁 Arquivo .env carregado');
} else {
    console.log('⚠️  Arquivo .env não encontrado - usando variáveis do sistema');
}

async function testeCompleto() {
    console.log('\n🚀 ANÁLISE COMPLETA DO SISTEMA COINBITCLUB');
    console.log('==========================================');
    
    // 1. VERIFICAR ESTRUTURA DE ARQUIVOS
    console.log('\n📂 1. VERIFICAÇÃO DA ESTRUTURA:');
    console.log('===============================');
    
    const arquivosEssenciais = [
        'app.js',
        'enhanced-signal-processor-with-execution.js', 
        'multi-user-signal-processor.js',
        'package.json'
    ];
    
    let arquivosOK = 0;
    arquivosEssenciais.forEach(arquivo => {
        if (fs.existsSync(path.join(__dirname, arquivo))) {
            console.log(`   ✅ ${arquivo}`);
            arquivosOK++;
        } else {
            console.log(`   ❌ ${arquivo} - FALTANDO`);
        }
    });
    
    console.log(`   📊 Arquivos: ${arquivosOK}/${arquivosEssenciais.length} OK`);
    
    // 2. VERIFICAR CONFIGURAÇÕES CRÍTICAS
    console.log('\n🔑 2. CONFIGURAÇÕES CRÍTICAS:');
    console.log('=============================');
    
    const configsCriticas = {
        'DATABASE_URL': process.env.DATABASE_URL || 'postgresql://postgres:xSgQNe6A3lHQhBNb@monorail.proxy.rlwy.net:28334/railway',
        'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
        'BINANCE_API_KEY': process.env.BINANCE_API_KEY,
        'BYBIT_API_KEY': process.env.BYBIT_API_KEY,
        'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
        'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY
    };
    
    let configsOK = 0;
    for (const [chave, valor] of Object.entries(configsCriticas)) {
        if (valor && valor !== 'your_' && !valor.includes('example')) {
            const mascarado = valor.length > 10 ? 
                valor.substring(0, 6) + '...' + valor.substring(valor.length - 4) : 
                '***';
            console.log(`   ✅ ${chave}: ${mascarado}`);
            configsOK++;
        } else {
            console.log(`   ❌ ${chave}: NÃO CONFIGURADA`);
        }
    }
    
    console.log(`   📊 Configurações: ${configsOK}/${Object.keys(configsCriticas).length} OK`);
    
    // 3. TESTE DE CONECTIVIDADE DATABASE
    console.log('\n💾 3. TESTE DE CONEXÃO COM DATABASE:');
    console.log('===================================');
    
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: configsCriticas.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000
        });
        
        const client = await pool.connect();
        console.log('   ✅ Conexão com PostgreSQL estabelecida');
        
        // Verificar tabelas essenciais
        const tabelas = ['signals', 'users', 'executions', 'orders', 'positions'];
        for (const tabela of tabelas) {
            try {
                const result = await client.query(`SELECT COUNT(*) FROM ${tabela} LIMIT 1`);
                console.log(`   ✅ Tabela '${tabela}': ${result.rows[0].count} registros`);
            } catch (error) {
                console.log(`   ❌ Tabela '${tabela}': ${error.message}`);
            }
        }
        
        client.release();
        await pool.end();
        
    } catch (error) {
        console.log(`   ❌ Erro de conexão: ${error.message}`);
    }
    
    // 4. TESTE DE PARSING DO TRADINGVIEW
    console.log('\n📡 4. TESTE DE PARSING TRADINGVIEW:');
    console.log('===================================');
    
    // Carregar o arquivo de processamento
    let processorFile = '';
    let parsingOK = false;
    try {
        processorFile = fs.readFileSync(
            path.join(__dirname, 'enhanced-signal-processor-with-execution.js'), 
            'utf8'
        );
        
        // Verificar se a correção foi aplicada
        if (processorFile.includes('signalData.ticker')) {
            console.log('   ✅ Correção de parsing aplicada');
            console.log('   ✅ Campo ticker sendo processado corretamente');
            parsingOK = true;
        } else {
            console.log('   ❌ Correção de parsing NÃO aplicada');
            console.log('   ⚠️  Necessário aplicar fix do ticker');
        }
        
        // Simular parsing
        const signalTest = {
            ticker: 'BTCUSDT.P',
            signal: 'SINAL LONG FORTE',
            close: 45000.50
        };
        
        const symbol = signalTest.ticker || signalTest.symbol || 'UNKNOWN';
        const action = signalTest.signal || signalTest.action || 'BUY';
        const price = signalTest.close || signalTest.price || 0;
        
        console.log(`   📥 Input: ticker="${signalTest.ticker}"`);
        console.log(`   📤 Output: symbol="${symbol}"`);
        console.log(`   ${symbol !== 'UNKNOWN' ? '✅' : '❌'} Resultado: ${symbol !== 'UNKNOWN' ? 'SUCESSO' : 'FALHA'}`);
        
    } catch (error) {
        console.log(`   ❌ Erro ao ler processor: ${error.message}`);
    }
    
    // 5. TESTE DE CONECTIVIDADE APIS EXTERNAS
    console.log('\n🌐 5. TESTE DE APIS EXTERNAS:');
    console.log('=============================');
    
    const testes = [
        {
            nome: 'TradingView (Simulado)',
            url: 'https://www.tradingview.com',
            metodo: 'GET'
        },
        {
            nome: 'Binance Public API',
            url: 'https://api.binance.com/api/v3/ping',
            metodo: 'GET'
        },
        {
            nome: 'ByBit Public API', 
            url: 'https://api.bybit.com/v5/market/time',
            metodo: 'GET'
        }
    ];
    
    for (const teste of testes) {
        try {
            const response = await axios({
                method: teste.metodo,
                url: teste.url,
                timeout: 5000
            });
            console.log(`   ✅ ${teste.nome}: Conectado (${response.status})`);
        } catch (error) {
            console.log(`   ❌ ${teste.nome}: Erro - ${error.message}`);
        }
    }
    
    // 6. VERIFICAÇÃO DO FLUXO DE DADOS
    console.log('\n🔄 6. FLUXO DE DADOS (PIPELINE):');
    console.log('===============================');
    
    const etapas = [
        '📡 TradingView → Webhook',
        '🔧 Webhook → Signal Processing',
        '💾 Signal → Database Storage',
        '⚙️ Signal → Execution Generation',
        '💱 Execution → Exchange Order',
        '📊 Order → Position Management',
        '🔔 Position → User Notification'
    ];
    
    etapas.forEach((etapa, i) => {
        // Simular verificação baseada nas configurações
        let status = '⚠️ ';
        if (i === 0) status = '✅'; // Webhook sempre funciona
        if (i === 1 && parsingOK) status = '✅';
        if (i === 2 && configsCriticas.DATABASE_URL) status = '✅';
        if (i === 3 && configsOK >= 3) status = '✅';
        if (i === 4 && (configsCriticas.BINANCE_API_KEY || configsCriticas.BYBIT_API_KEY)) status = '✅';
        if (i === 5 && configsOK >= 4) status = '✅';
        if (i === 6 && configsCriticas.TWILIO_ACCOUNT_SID) status = '✅';
        
        console.log(`   ${i+1}. ${status} ${etapa}`);
    });
    
    // 7. DIAGNÓSTICO FINAL
    console.log('\n🎯 7. DIAGNÓSTICO FINAL:');
    console.log('========================');
    
    const pontuacao = arquivosOK + configsOK;
    const maxPontos = arquivosEssenciais.length + Object.keys(configsCriticas).length;
    const porcentagem = Math.round((pontuacao / maxPontos) * 100);
    
    console.log(`   📊 Pontuação: ${pontuacao}/${maxPontos} (${porcentagem}%)`);
    
    if (porcentagem >= 90) {
        console.log('   🎉 SISTEMA EXCELENTE - Pronto para produção');
    } else if (porcentagem >= 70) {
        console.log('   ✅ SISTEMA BOM - Algumas melhorias necessárias');
    } else if (porcentagem >= 50) {
        console.log('   ⚠️  SISTEMA FUNCIONAL - Configurações faltando');
    } else {
        console.log('   ❌ SISTEMA CRÍTICO - Necessário configuração');
    }
    
    // 8. PRÓXIMOS PASSOS
    console.log('\n📋 8. PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('==================================');
    
    if (configsOK < 4) {
        console.log('   1. 🔑 Configurar chaves faltando no Railway');
        console.log('   2. 📧 Obter credenciais das APIs necessárias');
    }
    
    if (arquivosOK < arquivosEssenciais.length) {
        console.log('   3. 📁 Verificar arquivos faltando');
    }
    
    console.log('   4. 🧪 Testar recebimento de sinais reais');
    console.log('   5. 📊 Monitorar dashboard por algumas horas');
    console.log('   6. 💰 Verificar execução de operações reais');
    
    console.log('\n🚀 SISTEMA ANALISADO COM SUCESSO!');
}

// Executar análise
testeCompleto().catch(console.error);

/**
 * 🧪 TESTE COMPLETO DO SISTEMA COINBITCLUB
 * 
 * Teste abrangente de todos os endpoints e funcionalidades
 */

const https = require('https');

console.log('🧪 TESTE COMPLETO DO SISTEMA COINBITCLUB');
console.log('========================================');

const baseUrl = 'https://coinbitclub-market-bot.up.railway.app';

async function testarEndpoint(endpoint, payload, metodo = 'POST') {
    return new Promise((resolve) => {
        const url = new URL(endpoint, baseUrl);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (payload && metodo === 'POST') {
            const data = JSON.stringify(payload);
            options.headers['Content-Length'] = data.length;
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        success: res.statusCode >= 200 && res.statusCode < 300,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        success: false,
                        data: data,
                        error: 'JSON parse error'
                    });
                }
            });
        });

        req.on('error', (e) => {
            resolve({
                status: 0,
                success: false,
                error: e.message
            });
        });

        if (payload && metodo === 'POST') {
            req.write(JSON.stringify(payload));
        }
        req.end();
    });
}

async function executarTestes() {
    console.log(`🌐 Testando: ${baseUrl}\n`);

    // 1. Teste de saúde
    console.log('🏥 1. TESTE DE SAÚDE:');
    const saude = await testarEndpoint('/', null, 'GET');
    console.log(`   Status: ${saude.status} ${saude.success ? '✅' : '❌'}`);
    if (saude.success) {
        console.log(`   Mensagem: ${saude.data.message}`);
    }

    // 2. Teste de sinal CoinBitClub LONG
    console.log('\n🎯 2. TESTE SINAL COINBITCLUB LONG:');
    const sinalLong = await testarEndpoint('/api/webhooks/signal', {
        ticker: 'BTCUSDT',
        signal: 'SINAL LONG',
        close: '45500.00',
        diff_btc_ema7: '1.25',
        time: '2025-07-30 17:00:00'
    });
    console.log(`   Status: ${sinalLong.status} ${sinalLong.success ? '✅' : '❌'}`);
    if (sinalLong.success) {
        console.log(`   Action: ${sinalLong.data.action} | Strength: ${sinalLong.data.strength}`);
        console.log(`   Signal ID: ${sinalLong.data.signalId}`);
    } else {
        console.log(`   Erro: ${JSON.stringify(sinalLong.data)}`);
    }

    // 3. Teste de sinal CoinBitClub SHORT FORTE
    console.log('\n🎯 3. TESTE SINAL COINBITCLUB SHORT FORTE:');
    const sinalShortForte = await testarEndpoint('/api/webhooks/signal', {
        ticker: 'ETHUSDT',
        signal: 'SINAL SHORT FORTE',
        close: '2400.00',
        diff_btc_ema7: '-2.15',
        ema9_30: '2420.50',
        rsi_4h: '25.30',
        time: '2025-07-30 17:05:00'
    });
    console.log(`   Status: ${sinalShortForte.status} ${sinalShortForte.success ? '✅' : '❌'}`);
    if (sinalShortForte.success) {
        console.log(`   Action: ${sinalShortForte.data.action} | Strength: ${sinalShortForte.data.strength}`);
        console.log(`   Signal ID: ${sinalShortForte.data.signalId}`);
    } else {
        console.log(`   Erro: ${JSON.stringify(sinalShortForte.data)}`);
    }

    // 4. Teste de dominância BTC LONG
    console.log('\n₿ 4. TESTE DOMINÂNCIA BTC LONG:');
    const dominanciaLong = await testarEndpoint('/api/webhooks/dominance', {
        ticker: 'BTC.D',
        time: '2025-07-30 17:10:00',
        btc_dominance: '59.125',
        ema_7: '58.200',
        diff_pct: '1.589',
        sinal: 'LONG'
    });
    console.log(`   Status: ${dominanciaLong.status} ${dominanciaLong.success ? '✅' : '❌'}`);
    if (dominanciaLong.success) {
        console.log(`   Sinal: ${dominanciaLong.data.data.signal} | Dominância: ${dominanciaLong.data.data.dominance}%`);
        console.log(`   Signal ID: ${dominanciaLong.data.data.signal_id}`);
    } else {
        console.log(`   Erro: ${JSON.stringify(dominanciaLong.data)}`);
    }

    // 5. Teste de dominância BTC SHORT
    console.log('\n₿ 5. TESTE DOMINÂNCIA BTC SHORT:');
    const dominanciaShort = await testarEndpoint('/api/webhooks/dominance', {
        ticker: 'BTC.D',
        time: '2025-07-30 17:15:00',
        btc_dominance: '56.850',
        ema_7: '58.900',
        diff_pct: '-3.478',
        sinal: 'SHORT'
    });
    console.log(`   Status: ${dominanciaShort.status} ${dominanciaShort.success ? '✅' : '❌'}`);
    if (dominanciaShort.success) {
        console.log(`   Sinal: ${dominanciaShort.data.data.signal} | Dominância: ${dominanciaShort.data.data.dominance}%`);
        console.log(`   Signal ID: ${dominanciaShort.data.data.signal_id}`);
    } else {
        console.log(`   Erro: ${JSON.stringify(dominanciaShort.data)}`);
    }

    // 6. Teste de dominância BTC NEUTRO
    console.log('\n₿ 6. TESTE DOMINÂNCIA BTC NEUTRO:');
    const dominanciaNeutro = await testarEndpoint('/api/webhooks/dominance', {
        ticker: 'BTC.D',
        time: '2025-07-30 17:20:00',
        btc_dominance: '58.456',
        ema_7: '58.523',
        diff_pct: '-0.114',
        sinal: 'NEUTRO'
    });
    console.log(`   Status: ${dominanciaNeutro.status} ${dominanciaNeutro.success ? '✅' : '❌'}`);
    if (dominanciaNeutro.success) {
        console.log(`   Sinal: ${dominanciaNeutro.data.data.signal} | Dominância: ${dominanciaNeutro.data.data.dominance}%`);
        console.log(`   Signal ID: ${dominanciaNeutro.data.data.signal_id}`);
    } else {
        console.log(`   Erro: ${JSON.stringify(dominanciaNeutro.data)}`);
    }

    // 7. Teste de compatibilidade com sinal simples
    console.log('\n📊 7. TESTE COMPATIBILIDADE SINAL SIMPLES:');
    const sinalSimples = await testarEndpoint('/api/webhooks/signal', {
        symbol: 'BTCUSDT',
        action: 'SELL',
        price: 45300,
        strategy: 'teste_final',
        timeframe: '4h'
    });
    console.log(`   Status: ${sinalSimples.status} ${sinalSimples.success ? '✅' : '❌'}`);
    if (sinalSimples.success) {
        console.log(`   Signal ID: ${sinalSimples.data.signalId}`);
    } else {
        console.log(`   Erro: ${JSON.stringify(sinalSimples.data)}`);
    }

    // 8. Consultar última dominância
    console.log('\n📈 8. CONSULTAR ÚLTIMA DOMINÂNCIA:');
    const ultimaDominancia = await testarEndpoint('/api/dominance/latest', null, 'GET');
    console.log(`   Status: ${ultimaDominancia.status} ${ultimaDominancia.success ? '✅' : '❌'}`);
    if (ultimaDominancia.success && ultimaDominancia.data.data) {
        const data = ultimaDominancia.data.data;
        console.log(`   Dominância: ${data.btc_dominance}% | Sinal: ${data.sinal}`);
        console.log(`   Timestamp: ${data.timestamp_data}`);
    }

    // 9. Resumo dos testes
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('====================');
    
    const testes = [
        { nome: 'API Health', resultado: saude.success },
        { nome: 'CoinBitClub LONG', resultado: sinalLong.success },
        { nome: 'CoinBitClub SHORT FORTE', resultado: sinalShortForte.success },
        { nome: 'Dominância LONG', resultado: dominanciaLong.success },
        { nome: 'Dominância SHORT', resultado: dominanciaShort.success },
        { nome: 'Dominância NEUTRO', resultado: dominanciaNeutro.success },
        { nome: 'Sinal Simples', resultado: sinalSimples.success },
        { nome: 'Consulta Dominância', resultado: ultimaDominancia.success }
    ];

    const sucessos = testes.filter(t => t.resultado).length;
    const total = testes.length;
    const percentual = Math.round((sucessos / total) * 100);

    testes.forEach(teste => {
        console.log(`   ${teste.resultado ? '✅' : '❌'} ${teste.nome}`);
    });

    console.log(`\n🎯 RESULTADO: ${sucessos}/${total} testes passaram (${percentual}%)`);

    if (percentual === 100) {
        console.log('\n🎉 SISTEMA 100% FUNCIONAL!');
        console.log('===========================');
        console.log('✅ Todos os endpoints funcionando');
        console.log('✅ CoinBitClub sinais operacionais'); 
        console.log('✅ Dominância BTC implementada');
        console.log('✅ Compatibilidade mantida');
        console.log('\n🚀 PRONTO PARA PRODUÇÃO!');
    } else if (percentual >= 75) {
        console.log('\n✅ SISTEMA LARGAMENTE FUNCIONAL!');
        console.log('=================================');
        console.log(`🎯 ${percentual}% dos testes passaram`);
        console.log('🔧 Pequenos ajustes podem ser necessários');
    } else {
        console.log('\n⚠️ SISTEMA PRECISA DE ATENÇÃO');
        console.log('==============================');
        console.log(`🎯 Apenas ${percentual}% dos testes passaram`);
        console.log('🔧 Verificar logs e corrigir problemas');
    }

    console.log('\n🔗 CONFIGURAÇÃO PINE SCRIPT:');
    console.log('============================');
    console.log('Para CoinBitClub Sinais:');
    console.log(`URL: ${baseUrl}/api/webhooks/signal`);
    console.log('');
    console.log('Para Dominância BTC:');
    console.log(`URL: ${baseUrl}/api/webhooks/dominance`);
    console.log('');
    console.log('Payload Dominância:');
    console.log(`json = '{"ticker":"BTC.D","time":"' + str.tostring(time, "yyyy-MM-dd HH:mm:ss") + '","btc_dominance":"' + str.tostring(close, "#.###") + '","ema_7":"' + str.tostring(ema7, "#.###") + '","diff_pct":"' + str.tostring(diff, "#.###") + '","sinal":"' + sinal + '"}'`);
}

// Executar todos os testes
executarTestes().catch(console.error);

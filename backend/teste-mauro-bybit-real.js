/**
 * 🎯 TESTE ESPECÍFICO PARA MAURO - BYBIT TESTNET
 * Validação completa das chaves API da Bybit em ambiente de teste
 */

require('dotenv').config({ path: '.env.test-mauro-completo' });
const crypto = require('crypto');
const https = require('https');

console.log('🎯 TESTE ESPECÍFICO PARA MAURO - BYBIT TESTNET');
console.log('============================================\n');

class TesteBinanceBybit {
    constructor() {
        this.configuracao = {
            BYBIT_API_KEY: process.env.BYBIT_API_KEY,
            BYBIT_API_SECRET: process.env.BYBIT_API_SECRET,
            BYBIT_TESTNET: process.env.BYBIT_TESTNET || 'true'
        };
    }

    async executarTeste() {
        console.log('🚀 Iniciando teste para usuário Mauro...\n');

        try {
            // 1. Carregar configuração
            await this.carregarConfiguracao();
            
            // 2. Validar chaves configuradas
            await this.validarChaves();
            
            // 3. Testar conectividade
            await this.testarConectividade();
            
            // 4. Testar autenticação
            await this.testarAutenticacao();
            
            // 5. Obter informações da conta
            await this.obterInformacoesConta();
            
            // 6. Testar operações básicas
            await this.testarOperacoesBasicas();
            
            // 7. Gerar relatório
            await this.gerarRelatorio();

            console.log('\n🎉 TESTE COMPLETO EXECUTADO!');

        } catch (error) {
            console.error('❌ Erro no teste:', error.message);
            await this.gerarRelatorioErro(error);
        }
    }

    async carregarConfiguracao() {
        console.log('📋 1. CARREGANDO CONFIGURAÇÃO BYBIT');
        console.log('─'.repeat(45));

        if (!this.configuracao.BYBIT_API_KEY || !this.configuracao.BYBIT_API_SECRET) {
            throw new Error('Configurações da Bybit não encontradas no arquivo .env');
        }

        console.log('✅ Arquivo .env.test-mauro-completo encontrado');
        console.log('📊 Configurações Bybit carregadas:');
        console.log(`   • BYBIT_API_KEY: ${this.configuracao.BYBIT_API_KEY ? '✅ Configurada' : '❌ Não encontrada'}`);
        console.log(`   • BYBIT_API_SECRET: ${this.configuracao.BYBIT_API_SECRET ? '✅ Configurada' : '❌ Não encontrada'}`);
        console.log(`   • BYBIT_TESTNET: ${this.configuracao.BYBIT_TESTNET}`);

        this.resultados.configuracao = { sucesso: true };
        console.log('');
    }

    async validarChaves() {
        console.log('🔑 2. VALIDANDO CHAVES API');
        console.log('─'.repeat(40));

        const apiKey = this.configuracao.BYBIT_API_KEY;
        const apiSecret = this.configuracao.BYBIT_API_SECRET;

        if (!apiKey || apiKey.includes('sua_api_key')) {
            console.log('❌ API Key não configurada ou usando valor exemplo');
            console.log('📝 Configure sua API Key real no arquivo .env.test-mauro');
            console.log('');
            
            console.log('🔧 INSTRUÇÕES RÁPIDAS:');
            console.log('   1. Acesse: https://www.bybit.com/app/user/api-management');
            console.log('   2. Crie nova API Key com permissões: Read + Spot Trading');
            console.log('   3. Copie e configure no arquivo .env.test-mauro');
            console.log('   4. Execute novamente este teste');
            
            throw new Error('Chaves API não configuradas');
        }

        if (!apiSecret || apiSecret.includes('sua_api_secret')) {
            throw new Error('API Secret não configurado');
        }

        console.log('✅ API Key configurada');
        console.log('✅ API Secret configurado');
        console.log(`📍 Modo: ${this.configuracao.BYBIT_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO'}`);
        
        // Validar formato das chaves
        if (apiKey.length < 20) {
            console.log('⚠️  API Key parece muito curta');
        }
        
        if (apiSecret.length < 20) {
            console.log('⚠️  API Secret parece muito curto');
        }

        console.log('');
    }

    async testarConectividade() {
        console.log('🌐 3. TESTANDO CONECTIVIDADE');
        console.log('─'.repeat(40));

        const isTestnet = this.configuracao.BYBIT_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';

        try {
            console.log(`🔍 Testando conexão com ${isTestnet ? 'TESTNET' : 'PRODUÇÃO'}...`);
            
            const startTime = Date.now();
            const response = await this.fazerRequisicao(`${baseUrl}/v5/market/time`);
            const latencia = Date.now() - startTime;

            if (response.retCode === 0) {
                console.log(`✅ Conectividade OK (${latencia}ms)`);
                console.log(`⏰ Hora do servidor: ${new Date(parseInt(response.result.timeNano) / 1000000).toISOString()}`);
                this.resultados.conectividade = { sucesso: true, latencia };
            } else {
                throw new Error(`Erro na resposta: ${response.retMsg}`);
            }

        } catch (error) {
            console.log('❌ Falha na conectividade:', error.message);
            this.resultados.conectividade = { sucesso: false, erro: error.message };
            throw error;
        }

        console.log('');
    }

    async testarAutenticacao() {
        console.log('🔐 4. TESTANDO AUTENTICAÇÃO');
        console.log('─'.repeat(40));

        const isTestnet = this.configuracao.BYBIT_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';

        try {
            console.log('🔍 Validando API Key e Secret...');
            
            const timestamp = Date.now().toString();
            const endpoint = '/v5/account/wallet-balance';
            const params = 'accountType=SPOT';
            
            // Criar assinatura
            const queryString = timestamp + this.configuracao.BYBIT_API_KEY + '5000' + params;
            const signature = crypto
                .createHmac('sha256', this.configuracao.BYBIT_API_SECRET)
                .update(queryString)
                .digest('hex');

            const headers = {
                'X-BAPI-API-KEY': this.configuracao.BYBIT_API_KEY,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': '5000',
                'Content-Type': 'application/json'
            };

            const response = await this.fazerRequisicaoAutenticada(
                `${baseUrl}${endpoint}?${params}`,
                { headers }
            );

            if (response.retCode === 0) {
                console.log('✅ Autenticação bem-sucedida');
                console.log(`📋 Tipo de conta: ${response.result.accountType}`);
                this.resultados.autenticacao = { sucesso: true };
                this.resultados.dadosConta = response.result;
            } else if (response.retCode === 10003) {
                console.log('❌ API Key inválida');
                this.resultados.autenticacao = { sucesso: false, erro: 'API Key inválida' };
                throw new Error('API Key inválida');
            } else if (response.retCode === 10004) {
                console.log('❌ Assinatura inválida (API Secret incorreto)');
                this.resultados.autenticacao = { sucesso: false, erro: 'API Secret incorreto' };
                throw new Error('API Secret incorreto');
            } else {
                throw new Error(`Erro ${response.retCode}: ${response.retMsg}`);
            }

        } catch (error) {
            console.log('❌ Falha na autenticação:', error.message);
            this.resultados.autenticacao = { sucesso: false, erro: error.message };
            throw error;
        }

        console.log('');
    }

    async obterInformacoesConta() {
        console.log('👤 5. INFORMAÇÕES DA CONTA');
        console.log('─'.repeat(40));

        try {
            if (this.resultados.dadosConta) {
                const conta = this.resultados.dadosConta;
                
                console.log('📊 Detalhes da conta:');
                console.log(`   • Account Type: ${conta.accountType}`);
                console.log(`   • Account UID: ${conta.accountUID || 'N/A'}`);
                console.log(`   • Total de moedas: ${conta.list?.length || 0}`);

                if (conta.list && conta.list.length > 0) {
                    console.log('\n💰 Saldos disponíveis:');
                    conta.list.forEach(coin => {
                        const saldo = parseFloat(coin.walletBalance);
                        if (saldo > 0) {
                            console.log(`   • ${coin.coin}: ${saldo} (disponível: ${coin.availableBalance})`);
                        }
                    });

                    // Verificar se tem USDT
                    const usdt = conta.list.find(c => c.coin === 'USDT');
                    if (usdt) {
                        console.log(`\n💵 USDT Principal: ${usdt.walletBalance} USDT`);
                    }
                } else {
                    console.log('   • Nenhum saldo encontrado (conta nova/vazia)');
                }

                this.resultados.saldos = conta.list || [];
            }

        } catch (error) {
            console.log('❌ Erro ao obter informações:', error.message);
        }

        console.log('');
    }

    async testarOperacoesBasicas() {
        console.log('⚙️ 6. TESTANDO OPERAÇÕES BÁSICAS');
        console.log('─'.repeat(40));

        const isTestnet = this.configuracao.BYBIT_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';

        try {
            // Teste 1: Obter informações de instrumentos
            console.log('🔍 Testando consulta de instrumentos...');
            const instrumentsResponse = await this.fazerRequisicao(
                `${baseUrl}/v5/market/instruments-info?category=spot&symbol=BTCUSDT`
            );

            if (instrumentsResponse.retCode === 0) {
                console.log('✅ Consulta de instrumentos OK');
                const btc = instrumentsResponse.result.list[0];
                if (btc) {
                    console.log(`   • BTC/USDT - Status: ${btc.status}`);
                    console.log(`   • Preço mínimo: ${btc.priceFilter.minPrice}`);
                    console.log(`   • Quantidade mínima: ${btc.lotSizeFilter.minOrderQty}`);
                }
            }

            // Teste 2: Obter ticker atual
            console.log('\n📈 Testando consulta de preços...');
            const tickerResponse = await this.fazerRequisicao(
                `${baseUrl}/v5/market/tickers?category=spot&symbol=BTCUSDT`
            );

            if (tickerResponse.retCode === 0) {
                console.log('✅ Consulta de preços OK');
                const ticker = tickerResponse.result.list[0];
                if (ticker) {
                    console.log(`   • BTC/USDT: $${parseFloat(ticker.lastPrice).toLocaleString()}`);
                    console.log(`   • Variação 24h: ${ticker.price24hPcnt}%`);
                }
            }

            this.resultados.operacoesBasicas = { sucesso: true };

        } catch (error) {
            console.log('❌ Erro nas operações básicas:', error.message);
            this.resultados.operacoesBasicas = { sucesso: false, erro: error.message };
        }

        console.log('');
    }

    async fazerRequisicao(url) {
        const https = require('https');
        
        return new Promise((resolve, reject) => {
            const req = https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error('Resposta inválida da API'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout na requisição'));
            });
        });
    }

    async fazerRequisicaoAutenticada(url, options) {
        const https = require('https');
        const urlObj = new URL(url);
        
        return new Promise((resolve, reject) => {
            const reqOptions = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: options.headers
            };

            const req = https.request(reqOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error('Resposta inválida da API'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout na requisição'));
            });
            
            req.end();
        });
    }

    async gerarRelatorio() {
        console.log('📊 7. RELATÓRIO FINAL DO TESTE');
        console.log('═'.repeat(50));

        const usuario = 'MAURO';
        const exchange = 'BYBIT';
        const modo = this.configuracao.BYBIT_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO';

        console.log(`\n👤 USUÁRIO: ${usuario}`);
        console.log(`🏦 EXCHANGE: ${exchange}`);
        console.log(`🌐 MODO: ${modo}`);
        console.log(`⏰ DATA/HORA: ${new Date().toISOString()}`);

        console.log('\n🔍 RESULTADOS DOS TESTES:');
        
        // Conectividade
        const conectividade = this.resultados.conectividade;
        console.log(`   🌐 Conectividade: ${conectividade?.sucesso ? '✅ OK' : '❌ FALHOU'}`);
        if (conectividade?.latencia) {
            console.log(`      Latência: ${conectividade.latencia}ms`);
        }

        // Autenticação
        const auth = this.resultados.autenticacao;
        console.log(`   🔐 Autenticação: ${auth?.sucesso ? '✅ OK' : '❌ FALHOU'}`);

        // Operações básicas
        const ops = this.resultados.operacoesBasicas;
        console.log(`   ⚙️  Operações: ${ops?.sucesso ? '✅ OK' : '❌ FALHOU'}`);

        // Saldos
        const saldos = this.resultados.saldos;
        console.log(`   💰 Saldos: ${saldos ? '✅ OBTIDOS' : '❌ NÃO OBTIDOS'}`);

        // Status geral
        const todosOk = conectividade?.sucesso && auth?.sucesso && ops?.sucesso;
        console.log(`\n🎯 STATUS GERAL: ${todosOk ? '✅ TUDO OK' : '❌ PROBLEMAS ENCONTRADOS'}`);

        if (todosOk) {
            console.log('\n🎉 PARABÉNS MAURO!');
            console.log('Sua configuração está perfeita para operar!');
            
            if (modo === 'TESTNET') {
                console.log('\n🚀 PRÓXIMOS PASSOS:');
                console.log('   1. Teste algumas operações no testnet');
                console.log('   2. Quando confortável, mude BYBIT_TESTNET=false');
                console.log('   3. Execute este teste novamente');
                console.log('   4. Deploy para produção');
            } else {
                console.log('\n🚀 SISTEMA PRONTO PARA PRODUÇÃO!');
                console.log('   Execute: ./deploy.sh para fazer deploy');
            }
        }

        console.log('\n' + '═'.repeat(50));
    }

    async gerarRelatorioErro(error) {
        console.log('\n❌ RELATÓRIO DE ERRO');
        console.log('═'.repeat(30));
        console.log(`Erro: ${error.message}`);
        
        console.log('\n🔧 SOLUÇÕES COMUNS:');
        if (error.message.includes('não configurada')) {
            console.log('   1. Configure suas chaves API no arquivo .env.test-mauro');
            console.log('   2. Siga o guia: GUIA-CHAVES-MAURO.md');
        } else if (error.message.includes('inválida')) {
            console.log('   1. Verifique se a API Key está correta');
            console.log('   2. Verifique se o IP está autorizado na Bybit');
            console.log('   3. Recrie as chaves se necessário');
        } else if (error.message.includes('incorreto')) {
            console.log('   1. Verifique se o API Secret está correto');
            console.log('   2. Certifique-se de copiar o secret completo');
        }
        
        console.log('\n📞 Para ajuda: Telegram @CoinbitClub');
    }
}

// Executar teste
if (require.main === module) {
    const teste = new TesteMauroBybit();
    
    teste.executarTeste()
        .then(() => {
            console.log('\n✅ Teste concluído!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Teste falhou:', error.message);
            process.exit(1);
        });
}

module.exports = TesteMauroBybit;

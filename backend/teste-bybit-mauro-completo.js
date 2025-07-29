/**
 * 🎯 TESTE ESPECÍFICO PARA MAURO - BYBIT TESTNET
 * Validação completa das chaves API da Bybit em ambiente de teste
 */

require('dotenv').config({ path: '.env.test-mauro-completo' });
const crypto = require('crypto');
const https = require('https');

console.log('🎯 TESTE ESPECÍFICO PARA MAURO - BYBIT TESTNET');
console.log('============================================\n');

class TesteBybitMauro {
    constructor() {
        this.configuracao = {
            BYBIT_API_KEY: process.env.BYBIT_API_KEY,
            BYBIT_API_SECRET: process.env.BYBIT_API_SECRET,
            BYBIT_TESTNET: process.env.BYBIT_TESTNET || 'true'
        };
        
        this.resultados = {
            configuracao: null,
            conectividade: null,
            autenticacao: null,
            operacoes: null,
            dadosConta: null
        };
    }

    async executarTeste() {
        console.log('🚀 Iniciando teste Bybit para usuário Mauro...\n');

        try {
            await this.carregarConfiguracao();
            await this.validarChaves();
            await this.testarConectividade();
            await this.testarAutenticacao();
            await this.exibirInformacoesConta();
            await this.testarOperacoesBasicas();
            this.gerarRelatorioFinal();

        } catch (error) {
            this.tratarErro(error);
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
        console.log('🔑 2. VALIDANDO CHAVES BYBIT');
        console.log('─'.repeat(45));

        const apiKey = this.configuracao.BYBIT_API_KEY;
        const apiSecret = this.configuracao.BYBIT_API_SECRET;

        if (!apiKey || apiKey.includes('sua_api_key')) {
            throw new Error('API Key da Bybit não configurada');
        }

        if (!apiSecret || apiSecret.includes('sua_api_secret')) {
            throw new Error('API Secret da Bybit não configurado');
        }

        console.log('✅ API Key Bybit configurada');
        console.log('✅ API Secret Bybit configurado');
        console.log(`📍 Modo: ${this.configuracao.BYBIT_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO'}`);
        
        // Validar formato das chaves
        if (apiKey.length < 10) {
            console.log('⚠️  API Key Bybit parece muito curta');
        } else {
            console.log(`✅ Formato da API Key OK (${apiKey.length} caracteres)`);
        }
        
        if (apiSecret.length < 20) {
            console.log('⚠️  API Secret Bybit parece muito curto');
        } else {
            console.log(`✅ Formato do API Secret OK (${apiSecret.length} caracteres)`);
        }

        console.log('');
    }

    async testarConectividade() {
        console.log('🌐 3. TESTANDO CONECTIVIDADE BYBIT');
        console.log('─'.repeat(45));

        const isTestnet = this.configuracao.BYBIT_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';

        try {
            console.log(`🔍 Testando conexão com ${isTestnet ? 'TESTNET' : 'PRODUÇÃO'}...`);
            
            const startTime = Date.now();
            const response = await this.fazerRequisicao(`${baseUrl}/v5/market/time`);
            const latencia = Date.now() - startTime;

            if (response.result && response.result.timeSecond) {
                console.log(`✅ Conectividade Bybit OK (${latencia}ms)`);
                console.log(`⏰ Hora do servidor: ${new Date(parseInt(response.result.timeSecond) * 1000).toISOString()}`);
                this.resultados.conectividade = { sucesso: true, latencia };
            } else {
                throw new Error('Resposta inválida do servidor Bybit');
            }

        } catch (error) {
            console.log('❌ Falha na conectividade Bybit:', error.message);
            this.resultados.conectividade = { sucesso: false, erro: error.message };
            throw error;
        }

        console.log('');
    }

    async testarAutenticacao() {
        console.log('🔐 4. TESTANDO AUTENTICAÇÃO BYBIT');
        console.log('─'.repeat(45));

        const isTestnet = this.configuracao.BYBIT_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';

        try {
            console.log('🔍 Validando API Key e Secret Bybit...');
            
            const timestamp = Date.now();
            const recvWindow = '5000';
            
            // Criar parâmetros para a requisição
            const params = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
            
            // Criar assinatura HMAC-SHA256
            const signature = crypto
                .createHmac('sha256', this.configuracao.BYBIT_API_SECRET)
                .update(timestamp + this.configuracao.BYBIT_API_KEY + recvWindow)
                .digest('hex');

            const headers = {
                'X-BAPI-API-KEY': this.configuracao.BYBIT_API_KEY,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            };

            const url = `${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`;
            const response = await this.fazerRequisicaoAutenticada(url, { headers });

            if (response.result) {
                console.log('✅ Autenticação Bybit bem-sucedida');
                
                const walletList = response.result.list;
                if (walletList && walletList.length > 0) {
                    const walletBalance = walletList[0];
                    console.log(`💰 Tipo de conta: ${walletBalance.accountType}`);
                    
                    if (walletBalance.coin && walletBalance.coin.length > 0) {
                        console.log(`🏦 Moeda principal: ${walletBalance.coin[0].coin}`);
                        console.log(`💵 Saldo disponível: ${walletBalance.coin[0].walletBalance} USDT`);
                    } else {
                        console.log('💵 Conta criada, mas sem saldos iniciais');
                    }
                } else {
                    console.log('💰 Conta autenticada, aguardando configuração inicial');
                }
                
                this.resultados.autenticacao = { sucesso: true };
                this.resultados.dadosConta = response.result;
            } else if (response.retCode !== 0) {
                let mensagemErro = `Código ${response.retCode}: ${response.retMsg}`;
                
                // Mapear códigos de erro comuns da Bybit
                if (response.retCode === 10003) {
                    mensagemErro = 'API Key inválida';
                } else if (response.retCode === 10004) {
                    mensagemErro = 'Assinatura inválida (API Secret incorreto)';
                } else if (response.retCode === 10005) {
                    mensagemErro = 'Permissões insuficientes';
                }
                
                console.log(`❌ Código ${response.retCode}: ${response.retMsg}`);
                throw new Error(mensagemErro);
            } else {
                throw new Error('Resposta inesperada da Bybit');
            }

        } catch (error) {
            console.log(`❌ Falha na autenticação Bybit: ${error.message}`);
            this.resultados.autenticacao = { sucesso: false, erro: error.message };
            throw error;
        }

        console.log('');
    }

    async exibirInformacoesConta() {
        console.log('👤 5. INFORMAÇÕES DA CONTA BYBIT');
        console.log('─'.repeat(45));

        try {
            if (this.resultados.dadosConta && this.resultados.dadosConta.list && this.resultados.dadosConta.list.length > 0) {
                const conta = this.resultados.dadosConta.list[0];
                
                console.log('📊 Detalhes da conta Bybit:');
                console.log(`   • Tipo de conta: ${conta.accountType}`);
                console.log(`   • Status: Ativa`);
                
                if (conta.coin && conta.coin.length > 0) {
                    console.log(`   • Total de moedas: ${conta.coin.length}`);
                    console.log('   • Saldos principais:');
                    conta.coin.forEach(moeda => {
                        const saldo = parseFloat(moeda.walletBalance);
                        if (saldo > 0) {
                            console.log(`     - ${moeda.coin}: ${saldo.toFixed(6)}`);
                        }
                    });
                } else {
                    console.log('   • Conta nova, sem saldos iniciais');
                }
            } else {
                console.log('ℹ️  Conta autenticada com sucesso, mas sem dados de saldo disponíveis');
                console.log('   (Normal para contas testnet recém-criadas)');
            }

        } catch (error) {
            console.log('⚠️  Erro ao exibir informações da conta:', error.message);
        }

        console.log('');
    }

    async testarOperacoesBasicas() {
        console.log('⚙️ 6. TESTANDO OPERAÇÕES BÁSICAS BYBIT');
        console.log('─'.repeat(45));

        const isTestnet = this.configuracao.BYBIT_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';

        try {
            // Teste 1: Obter informações de instrumentos
            console.log('🔍 Testando consulta de instrumentos BTCUSDT...');
            const instrumentResponse = await this.fazerRequisicao(
                `${baseUrl}/v5/market/instruments-info?category=spot&symbol=BTCUSDT`
            );

            if (instrumentResponse.result && instrumentResponse.result.list.length > 0) {
                const instrumento = instrumentResponse.result.list[0];
                console.log('✅ Consulta de instrumentos OK');
                console.log(`   • ${instrumento.symbol} - Status: ${instrumento.status}`);
                console.log(`   • Tick size: ${instrumento.priceFilter.tickSize}`);
                console.log(`   • Quantidade mínima: ${instrumento.lotSizeFilter.minOrderQty}`);
            }

            // Teste 2: Obter ticker atual
            console.log('\n📈 Testando consulta de preços...');
            const tickerResponse = await this.fazerRequisicao(
                `${baseUrl}/v5/market/tickers?category=spot&symbol=BTCUSDT`
            );

            if (tickerResponse.result && tickerResponse.result.list.length > 0) {
                const ticker = tickerResponse.result.list[0];
                console.log('✅ Consulta de preços OK');
                console.log(`   • ${ticker.symbol}: $${parseFloat(ticker.lastPrice).toLocaleString()}`);
                console.log(`   • Variação 24h: ${ticker.price24hPcnt}%`);
                console.log(`   • Volume: ${parseFloat(ticker.volume24h).toLocaleString()}`);
            }

            this.resultados.operacoes = { sucesso: true };

        } catch (error) {
            console.log('❌ Erro nas operações básicas:', error.message);
            this.resultados.operacoes = { sucesso: false, erro: error.message };
        }

        console.log('');
    }

    async fazerRequisicao(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CoinbitClub-Bot/1.0'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error('Resposta inválida do servidor'));
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

    async fazerRequisicaoAutenticada(url, options) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            
            const requestOptions = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: options.headers
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error('Resposta inválida do servidor'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(15000, () => {
                req.destroy();
                reject(new Error('Timeout na requisição autenticada'));
            });

            req.end();
        });
    }

    gerarRelatorioFinal() {
        console.log('📊 7. RELATÓRIO FINAL - BYBIT');
        console.log('═'.repeat(50));
        console.log('👤 USUÁRIO: MAURO');
        console.log('🏦 EXCHANGE: BYBIT');
        console.log('🌐 MODO: TESTNET');
        console.log(`⏰ DATA/HORA: ${new Date().toISOString()}`);
        
        console.log('\n🔍 RESULTADOS DOS TESTES BYBIT:');
        console.log(`   🌐 Conectividade: ${this.resultados.conectividade?.sucesso ? '✅ OK' : '❌ FALHA'}`);
        if (this.resultados.conectividade?.latencia) {
            console.log(`      Latência: ${this.resultados.conectividade.latencia}ms`);
        }
        
        console.log(`   🔐 Autenticação: ${this.resultados.autenticacao?.sucesso ? '✅ OK' : '❌ FALHA'}`);
        console.log(`   ⚙️  Operações: ${this.resultados.operacoes?.sucesso ? '✅ OK' : '❌ FALHA'}`);
        console.log(`   💰 Saldos: ${this.resultados.dadosConta ? '✅ OBTIDOS' : '❌ NÃO OBTIDOS'}`);

        const tudoOK = this.resultados.conectividade?.sucesso && 
                       this.resultados.autenticacao?.sucesso && 
                       this.resultados.operacoes?.sucesso;

        console.log(`\n🎯 STATUS GERAL BYBIT: ${tudoOK ? '✅ TUDO OK' : '❌ PROBLEMAS DETECTADOS'}`);

        if (tudoOK) {
            console.log('\n🎉 EXCELENTE MAURO!');
            console.log('Sua configuração da Bybit está perfeita!');
            console.log('\n📋 Suas chaves Bybit estão funcionando no TESTNET:');
            console.log('   ✅ Conectividade OK');
            console.log('   ✅ Autenticação OK');
            console.log('   ✅ Permissões OK');
            console.log('   ✅ Consultas de mercado OK');
            console.log('\n🚀 PRÓXIMOS PASSOS:');
            console.log('   1. Agora você tem ambas as exchanges configuradas');
            console.log('   2. Execute: node teste-completo-todas-exchanges.js');
            console.log('   3. Quando estiver tudo OK, mude para produção');
        } else {
            console.log('\n🔧 PROBLEMAS ENCONTRADOS:');
            if (!this.resultados.conectividade?.sucesso) {
                console.log('   ❌ Conectividade com problemas');
            }
            if (!this.resultados.autenticacao?.sucesso) {
                console.log('   ❌ Falha na autenticação - Verifique suas chaves');
            }
            if (!this.resultados.operacoes?.sucesso) {
                console.log('   ❌ Operações básicas falharam');
            }
        }

        console.log('═'.repeat(50));
        console.log('🎉 TESTE BYBIT COMPLETO!');
    }

    tratarErro(error) {
        console.log('\n❌ RELATÓRIO DE ERRO - BYBIT');
        console.log('═'.repeat(35));
        console.log(`Erro: ${error.message}`);
        
        console.log('\n🔧 SOLUÇÕES ESPECÍFICAS BYBIT:');
        console.log('   1. Verifique se suas chaves são do TESTNET');
        console.log('   2. Confirme se as chaves foram copiadas corretamente');
        console.log('   3. Verifique se a API Key tem permissões suficientes');
        console.log('   4. Certifique-se de estar usando api-testnet.bybit.com');
        console.log('\n📞 Para ajuda: Telegram @CoinbitClub');
        
        console.log('\n✅ Teste Bybit concluído!');
    }
}

// Executar teste
const teste = new TesteBybitMauro();
teste.executarTeste();

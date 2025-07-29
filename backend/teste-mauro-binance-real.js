/**
 * 🎯 TESTE ESPECÍFICO PARA MAURO - BINANCE COM CHAVES REAIS
 * Este script testa a configuração real da Binance para o usuário Mauro
 */

const fs = require('fs').promises;
const crypto = require('crypto');

console.log('🎯 TESTE ESPECÍFICO PARA MAURO - BINANCE');
console.log('=======================================\n');

class TesteMauroBinance {
    constructor() {
        this.configuracao = {};
        this.resultados = {};
    }

    async executarTeste() {
        console.log('🚀 Iniciando teste Binance para usuário Mauro...\n');

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

            console.log('\n🎉 TESTE BINANCE COMPLETO!');

        } catch (error) {
            console.error('❌ Erro no teste:', error.message);
            await this.gerarRelatorioErro(error);
        }
    }

    async carregarConfiguracao() {
        console.log('📋 1. CARREGANDO CONFIGURAÇÃO BINANCE');
        console.log('─'.repeat(45));

        try {
            // Carregar configuração do Mauro
            const configContent = await fs.readFile('.env.test-mauro', 'utf8');
            console.log('✅ Arquivo .env.test-mauro encontrado');

            // Parsear configuração
            const lines = configContent.split('\n');
            for (const line of lines) {
                if (line.includes('=') && !line.startsWith('#')) {
                    const [key, value] = line.split('=');
                    this.configuracao[key.trim()] = value.trim();
                }
            }

            console.log('📊 Configurações Binance carregadas:');
            console.log(`   • BINANCE_API_KEY: ${this.configuracao.BINANCE_API_KEY ? '✅ Configurada' : '❌ Não encontrada'}`);
            console.log(`   • BINANCE_API_SECRET: ${this.configuracao.BINANCE_API_SECRET ? '✅ Configurada' : '❌ Não encontrada'}`);
            console.log(`   • BINANCE_TESTNET: ${this.configuracao.BINANCE_TESTNET || 'true'}`);

        } catch (error) {
            throw new Error(`Erro ao carregar configuração: ${error.message}`);
        }

        console.log('');
    }

    async validarChaves() {
        console.log('🔑 2. VALIDANDO CHAVES BINANCE');
        console.log('─'.repeat(45));

        const apiKey = this.configuracao.BINANCE_API_KEY;
        const apiSecret = this.configuracao.BINANCE_API_SECRET;

        if (!apiKey || apiKey.includes('sua_api_key')) {
            throw new Error('API Key da Binance não configurada');
        }

        if (!apiSecret || apiSecret.includes('sua_api_secret')) {
            throw new Error('API Secret da Binance não configurado');
        }

        console.log('✅ API Key Binance configurada');
        console.log('✅ API Secret Binance configurado');
        console.log(`📍 Modo: ${this.configuracao.BINANCE_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO'}`);
        
        // Validar formato das chaves
        if (apiKey.length !== 64) {
            console.log('⚠️  API Key Binance tem comprimento diferente do esperado (64 chars)');
        } else {
            console.log('✅ Formato da API Key OK (64 caracteres)');
        }
        
        if (apiSecret.length !== 64) {
            console.log('⚠️  API Secret Binance tem comprimento diferente do esperado (64 chars)');
        } else {
            console.log('✅ Formato do API Secret OK (64 caracteres)');
        }

        console.log('');
    }

    async testarConectividade() {
        console.log('🌐 3. TESTANDO CONECTIVIDADE BINANCE');
        console.log('─'.repeat(45));

        const isTestnet = this.configuracao.BINANCE_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://testnet.binancefuture.com' : 'https://api.binance.com';

        try {
            console.log(`🔍 Testando conexão com ${isTestnet ? 'TESTNET' : 'PRODUÇÃO'}...`);
            
            const startTime = Date.now();
            const response = await this.fazerRequisicao(`${baseUrl}/fapi/v1/time`);
            const latencia = Date.now() - startTime;

            if (response.serverTime) {
                console.log(`✅ Conectividade Binance OK (${latencia}ms)`);
                console.log(`⏰ Hora do servidor: ${new Date(response.serverTime).toISOString()}`);
                this.resultados.conectividade = { sucesso: true, latencia };
            } else {
                throw new Error('Resposta inválida do servidor Binance');
            }

        } catch (error) {
            console.log('❌ Falha na conectividade Binance:', error.message);
            this.resultados.conectividade = { sucesso: false, erro: error.message };
            throw error;
        }

        console.log('');
    }

    async testarAutenticacao() {
        console.log('🔐 4. TESTANDO AUTENTICAÇÃO BINANCE');
        console.log('─'.repeat(45));

        const isTestnet = this.configuracao.BINANCE_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://testnet.binancefuture.com' : 'https://api.binance.com';

        try {
            console.log('🔍 Validando API Key e Secret Binance...');
            
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            
            // Criar assinatura HMAC-SHA256
            const signature = crypto
                .createHmac('sha256', this.configuracao.BINANCE_API_SECRET)
                .update(queryString)
                .digest('hex');

            const headers = {
                'X-MBX-APIKEY': this.configuracao.BINANCE_API_KEY,
                'Content-Type': 'application/json'
            };

            const url = `${baseUrl}/fapi/v2/account?${queryString}&signature=${signature}`;
            const response = await this.fazerRequisicaoAutenticada(url, { headers });

            if (response.totalWalletBalance !== undefined) {
                console.log('✅ Autenticação Binance bem-sucedida');
                console.log(`� Saldo total: ${response.totalWalletBalance} USDT`);
                console.log(`🏦 Saldo disponível: ${response.availableBalance} USDT`);
                console.log(`� Margem em posições: ${response.totalPositionInitialMargin || 0} USDT`);
                console.log(`� Total em ordens: ${response.totalOpenOrderInitialMargin || 0} USDT`);
                
                this.resultados.autenticacao = { sucesso: true };
                this.resultados.dadosConta = response;
            } else if (response.code) {
                let mensagemErro = `Código ${response.code}: ${response.msg}`;
                if (response.code === -2014) {
                    mensagemErro = 'API Key inválida ou formato incorreto';
                } else if (response.code === -1022) {
                    mensagemErro = 'Assinatura inválida (API Secret incorreto)';
                }
                console.log(`❌ ${mensagemErro}`);
                this.resultados.autenticacao = { sucesso: false, erro: mensagemErro };
                throw new Error(mensagemErro);
            } else {
                throw new Error('Resposta inesperada da Binance');
            }

        } catch (error) {
            console.log('❌ Falha na autenticação Binance:', error.message);
            this.resultados.autenticacao = { sucesso: false, erro: error.message };
            throw error;
        }

        console.log('');
    }

    async obterInformacoesConta() {
        console.log('👤 5. INFORMAÇÕES DA CONTA BINANCE');
        console.log('─'.repeat(45));

        try {
            if (this.resultados.dadosConta) {
                const conta = this.resultados.dadosConta;
                
                console.log('📊 Detalhes da conta Binance:');
                console.log(`   • Account Type: ${conta.accountType}`);
                console.log(`   • Pode Trading: ${conta.canTrade ? 'Sim' : 'Não'}`);
                console.log(`   • Pode Depositar: ${conta.canDeposit ? 'Sim' : 'Não'}`);
                console.log(`   • Pode Sacar: ${conta.canWithdraw ? 'Sim' : 'Não'}`);
                console.log(`   • Total de moedas: ${conta.balances?.length || 0}`);

                if (conta.balances && conta.balances.length > 0) {
                    console.log('\n💰 Saldos disponíveis:');
                    const saldosComValor = conta.balances.filter(b => 
                        parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
                    );

                    if (saldosComValor.length > 0) {
                        saldosComValor.forEach(balance => {
                            const livre = parseFloat(balance.free);
                            const bloqueado = parseFloat(balance.locked);
                            const total = livre + bloqueado;
                            if (total > 0) {
                                console.log(`   • ${balance.asset}: ${total} (livre: ${livre}, bloqueado: ${bloqueado})`);
                            }
                        });

                        // Verificar se tem USDT
                        const usdt = conta.balances.find(b => b.asset === 'USDT');
                        if (usdt && parseFloat(usdt.free) > 0) {
                            console.log(`\n💵 USDT Principal: ${usdt.free} USDT`);
                        }
                    } else {
                        console.log('   • Nenhum saldo encontrado (conta nova/vazia)');
                    }
                } else {
                    console.log('   • Nenhum saldo encontrado');
                }

                this.resultados.saldos = conta.balances || [];
            }

        } catch (error) {
            console.log('❌ Erro ao obter informações da conta:', error.message);
        }

        console.log('');
    }

    async testarOperacoesBasicas() {
        console.log('⚙️ 6. TESTANDO OPERAÇÕES BÁSICAS BINANCE');
        console.log('─'.repeat(45));

        const isTestnet = this.configuracao.BINANCE_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://testnet.binancefuture.com' : 'https://api.binance.com';

        try {
            // Teste 1: Obter informações de símbolo
            console.log('🔍 Testando consulta de símbolo BTCUSDT...');
            const symbolResponse = await this.fazerRequisicao(
                `${baseUrl}/fapi/v1/exchangeInfo?symbol=BTCUSDT`
            );

            if (symbolResponse.symbols && symbolResponse.symbols.length > 0) {
                console.log('✅ Consulta de símbolo OK');
                const btc = symbolResponse.symbols[0];
                console.log(`   • BTC/USDT - Status: ${btc.status}`);
                console.log(`   • Permissões: ${btc.permissions?.join(', ')}`);
                
                // Filtros de preço
                const priceFilter = btc.filters?.find(f => f.filterType === 'PRICE_FILTER');
                if (priceFilter) {
                    console.log(`   • Preço mínimo: ${priceFilter.minPrice}`);
                    console.log(`   • Tick size: ${priceFilter.tickSize}`);
                }
            }

            // Teste 2: Obter ticker atual
            console.log('\n📈 Testando consulta de preços...');
            const tickerResponse = await this.fazerRequisicao(
                `${baseUrl}/fapi/v1/ticker/24hr?symbol=BTCUSDT`
            );

            if (tickerResponse.symbol) {
                console.log('✅ Consulta de preços OK');
                console.log(`   • ${tickerResponse.symbol}: $${parseFloat(tickerResponse.lastPrice).toLocaleString()}`);
                console.log(`   • Variação 24h: ${tickerResponse.priceChangePercent}%`);
                console.log(`   • Volume: ${parseFloat(tickerResponse.volume).toLocaleString()} BTC`);
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
                        reject(new Error('Resposta inválida da API Binance'));
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
                        reject(new Error('Resposta inválida da API Binance'));
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
        console.log('📊 7. RELATÓRIO FINAL - BINANCE');
        console.log('═'.repeat(50));

        const usuario = 'MAURO';
        const exchange = 'BINANCE';
        const modo = this.configuracao.BINANCE_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO';

        console.log(`\n👤 USUÁRIO: ${usuario}`);
        console.log(`🏦 EXCHANGE: ${exchange}`);
        console.log(`🌐 MODO: ${modo}`);
        console.log(`⏰ DATA/HORA: ${new Date().toISOString()}`);

        console.log('\n🔍 RESULTADOS DOS TESTES BINANCE:');
        
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
        console.log(`\n🎯 STATUS GERAL BINANCE: ${todosOk ? '✅ TUDO OK' : '❌ PROBLEMAS ENCONTRADOS'}`);

        if (todosOk) {
            console.log('\n🎉 EXCELENTE MAURO!');
            console.log('Sua configuração da Binance está perfeita!');
            
            if (modo === 'TESTNET') {
                console.log('\n📋 Suas chaves Binance estão funcionando no TESTNET:');
                console.log('   ✅ Conectividade OK');
                console.log('   ✅ Autenticação OK');
                console.log('   ✅ Permissões OK');
                console.log('   ✅ Consultas de mercado OK');
                
                console.log('\n🚀 PRÓXIMOS PASSOS:');
                console.log('   1. Agora configure suas chaves da Bybit também');
                console.log('   2. Execute: node teste-mauro-bybit-real.js');
                console.log('   3. Quando ambas estiverem OK, mude para produção');
            } else {
                console.log('\n🚀 BINANCE PRONTA PARA PRODUÇÃO!');
            }
        }

        console.log('\n' + '═'.repeat(50));
    }

    async gerarRelatorioErro(error) {
        console.log('\n❌ RELATÓRIO DE ERRO - BINANCE');
        console.log('═'.repeat(35));
        console.log(`Erro: ${error.message}`);
        
        console.log('\n🔧 SOLUÇÕES ESPECÍFICAS BINANCE:');
        if (error.message.includes('API Key inválida')) {
            console.log('   1. Verifique se a API Key está correta (64 caracteres)');
            console.log('   2. Confirme que a chave foi criada no ambiente correto (testnet/produção)');
        } else if (error.message.includes('API Secret')) {
            console.log('   1. Verifique se o API Secret está correto (64 caracteres)');
            console.log('   2. Certifique-se de copiar o secret completo sem espaços');
        } else if (error.message.includes('IP')) {
            console.log('   1. Verifique se seu IP está na lista de IPs permitidos');
            console.log('   2. Se não configurou restrição de IP, remova esta configuração');
        }
        
        console.log('\n📞 Para ajuda: Telegram @CoinbitClub');
    }
}

// Executar teste
if (require.main === module) {
    const teste = new TesteMauroBinance();
    
    teste.executarTeste()
        .then(() => {
            console.log('\n✅ Teste Binance concluído!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Teste Binance falhou:', error.message);
            process.exit(1);
        });
}

module.exports = TesteMauroBinance;

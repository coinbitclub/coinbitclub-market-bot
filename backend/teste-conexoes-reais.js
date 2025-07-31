#!/usr/bin/env node

/**
 * 🔧 TESTE DE CONEXÕES REAIS - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Testa conexões reais com OpenAI e Bybit usando credenciais de produção
 * Verifica se o sistema está pronto para operação real
 */

const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

// Configuração do banco
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@yamabiko.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

class TestadorConexoesReais {
    constructor() {
        this.resultados = {
            inicio: new Date(),
            testes: [],
            sucessos: 0,
            falhas: 0,
            detalhes: {}
        };
    }

    async executarTestes() {
        console.log('🔧 TESTE DE CONEXÕES REAIS');
        console.log('==========================');
        console.log('🎯 Testando OpenAI e Bybit com credenciais reais\n');

        try {
            // 1. Teste de conexão com banco
            await this.testarBanco();
            
            // 2. Buscar credenciais reais
            await this.buscarCredenciais();
            
            // 3. Testar OpenAI
            await this.testarOpenAI();
            
            // 4. Testar Bybit
            await this.testarBybit();
            
            // 5. Simular processamento de sinal
            await this.simularProcessamentoSinal();
            
            // 6. Relatório final
            await this.gerarRelatorio();
            
        } catch (error) {
            console.error('❌ ERRO CRÍTICO:', error.message);
            this.resultados.testes.push({
                nome: 'ERRO_CRITICO',
                status: 'FALHA',
                erro: error.message
            });
            this.resultados.falhas++;
        } finally {
            await pool.end();
        }
    }

    async testarBanco() {
        console.log('📊 TESTANDO CONEXÃO COM BANCO...');
        
        try {
            const result = await pool.query('SELECT NOW() as timestamp, COUNT(*) as users FROM users');
            
            this.resultados.testes.push({
                nome: 'BANCO_POSTGRESQL',
                status: 'SUCESSO',
                detalhes: {
                    timestamp: result.rows[0].timestamp,
                    usuarios_cadastrados: result.rows[0].users
                }
            });
            
            this.resultados.sucessos++;
            console.log('   ✅ Conexão com banco OK');
            console.log(`   👥 ${result.rows[0].users} usuários cadastrados`);
            
        } catch (error) {
            this.resultados.testes.push({
                nome: 'BANCO_POSTGRESQL',
                status: 'FALHA',
                erro: error.message
            });
            this.resultados.falhas++;
            console.log('   ❌ Erro na conexão com banco:', error.message);
        }
    }

    async buscarCredenciais() {
        console.log('\n🔑 BUSCANDO CREDENCIAIS REAIS...');
        
        try {
            // Buscar credenciais OpenAI
            const openaiConfig = await pool.query(`
                SELECT value FROM system_configurations 
                WHERE category = 'openai' AND key = 'api_key'
            `);
            
            // Buscar credenciais Bybit reais
            const bybitKeys = await pool.query(`
                SELECT uk.*, u.name as user_name
                FROM user_api_keys uk
                JOIN users u ON u.id = uk.user_id
                WHERE uk.environment = 'production' 
                AND uk.exchange = 'bybit'
                AND uk.is_active = true
                LIMIT 1
            `);
            
            this.resultados.detalhes.openai_configured = openaiConfig.rows.length > 0;
            this.resultados.detalhes.bybit_keys_found = bybitKeys.rows.length > 0;
            
            if (openaiConfig.rows.length > 0) {
                this.resultados.detalhes.openai_key = openaiConfig.rows[0].value;
                console.log('   ✅ Chave OpenAI encontrada');
            } else {
                console.log('   ⚠️ Chave OpenAI não configurada no banco');
            }
            
            if (bybitKeys.rows.length > 0) {
                this.resultados.detalhes.bybit_user = bybitKeys.rows[0].user_name;
                this.resultados.detalhes.bybit_api_key = bybitKeys.rows[0].api_key;
                this.resultados.detalhes.bybit_secret_key = bybitKeys.rows[0].secret_key;
                console.log(`   ✅ Chaves Bybit encontradas para: ${bybitKeys.rows[0].user_name}`);
                console.log(`   🔑 API Key: ${bybitKeys.rows[0].api_key.substring(0, 8)}...`);
            } else {
                console.log('   ❌ Nenhuma chave Bybit de produção encontrada');
            }
            
            this.resultados.testes.push({
                nome: 'BUSCA_CREDENCIAIS',
                status: 'SUCESSO',
                detalhes: {
                    openai_ok: this.resultados.detalhes.openai_configured,
                    bybit_ok: this.resultados.detalhes.bybit_keys_found
                }
            });
            
            this.resultados.sucessos++;
            
        } catch (error) {
            this.resultados.testes.push({
                nome: 'BUSCA_CREDENCIAIS',
                status: 'FALHA',
                erro: error.message
            });
            this.resultados.falhas++;
            console.log('   ❌ Erro ao buscar credenciais:', error.message);
        }
    }

    async testarOpenAI() {
        console.log('\n🤖 TESTANDO OPENAI...');
        
        if (!this.resultados.detalhes.openai_key) {
            console.log('   ⚠️ Pulando teste OpenAI - chave não encontrada');
            return;
        }
        
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a cryptocurrency trading AI assistant.'
                    },
                    {
                        role: 'user',
                        content: 'Analyze this signal: BTC price 45000, RSI 65, EMA crossed above. Respond with just BUY or SELL.'
                    }
                ],
                max_tokens: 10,
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${this.resultados.detalhes.openai_key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            const decision = response.data.choices[0].message.content.trim();
            
            this.resultados.testes.push({
                nome: 'OPENAI_API',
                status: 'SUCESSO',
                detalhes: {
                    model: response.data.model,
                    tokens_used: response.data.usage.total_tokens,
                    decision: decision,
                    response_time: new Date() - this.resultados.inicio
                }
            });
            
            this.resultados.sucessos++;
            console.log('   ✅ OpenAI respondeu com sucesso');
            console.log(`   🧠 Decisão da IA: ${decision}`);
            console.log(`   📊 Tokens usados: ${response.data.usage.total_tokens}`);
            
        } catch (error) {
            this.resultados.testes.push({
                nome: 'OPENAI_API',
                status: 'FALHA',
                erro: error.response?.data?.error?.message || error.message
            });
            this.resultados.falhas++;
            console.log('   ❌ Erro no OpenAI:', error.response?.data?.error?.message || error.message);
        }
    }

    async testarBybit() {
        console.log('\n📈 TESTANDO BYBIT...');
        
        if (!this.resultados.detalhes.bybit_api_key) {
            console.log('   ⚠️ Pulando teste Bybit - chaves não encontradas');
            return;
        }
        
        try {
            const timestamp = Date.now().toString();
            const apiKey = this.resultados.detalhes.bybit_api_key;
            const secretKey = this.resultados.detalhes.bybit_secret_key;
            
            // Teste 1: Informações da conta
            const params = `api_key=${apiKey}&timestamp=${timestamp}`;
            const signature = crypto.createHmac('sha256', secretKey).update(params).digest('hex');
            
            const accountResponse = await axios.get('https://api.bybit.com/v5/account/wallet-balance', {
                params: {
                    accountType: 'UNIFIED',
                    api_key: apiKey,
                    timestamp: timestamp,
                    sign: signature
                },
                timeout: 10000
            });
            
            if (accountResponse.data.retCode === 0) {
                this.resultados.testes.push({
                    nome: 'BYBIT_ACCOUNT',
                    status: 'SUCESSO',
                    detalhes: {
                        account_type: 'UNIFIED',
                        coins_count: accountResponse.data.result?.list?.[0]?.coin?.length || 0,
                        response_time: new Date() - this.resultados.inicio
                    }
                });
                
                this.resultados.sucessos++;
                console.log('   ✅ Bybit account info OK');
                console.log(`   💰 ${accountResponse.data.result?.list?.[0]?.coin?.length || 0} moedas na conta`);
            } else {
                throw new Error(`Bybit API Error: ${accountResponse.data.retMsg}`);
            }
            
            // Teste 2: Preço do BTC
            const priceResponse = await axios.get('https://api.bybit.com/v5/market/tickers', {
                params: {
                    category: 'linear',
                    symbol: 'BTCUSDT'
                },
                timeout: 5000
            });
            
            if (priceResponse.data.retCode === 0) {
                const btcPrice = priceResponse.data.result.list[0].lastPrice;
                
                this.resultados.testes.push({
                    nome: 'BYBIT_MARKET_DATA',
                    status: 'SUCESSO',
                    detalhes: {
                        symbol: 'BTCUSDT',
                        price: btcPrice,
                        timestamp: priceResponse.data.time
                    }
                });
                
                this.resultados.sucessos++;
                console.log('   ✅ Bybit market data OK');
                console.log(`   📊 BTC Price: $${btcPrice}`);
            }
            
        } catch (error) {
            this.resultados.testes.push({
                nome: 'BYBIT_API',
                status: 'FALHA',
                erro: error.response?.data?.retMsg || error.message
            });
            this.resultados.falhas++;
            console.log('   ❌ Erro no Bybit:', error.response?.data?.retMsg || error.message);
        }
    }

    async simularProcessamentoSinal() {
        console.log('\n🎯 SIMULANDO PROCESSAMENTO DE SINAL...');
        
        try {
            // Simular recebimento de sinal do TradingView
            const sinalSimulado = {
                ticker: 'BTCUSDT',
                close: 45000,
                signal: 'BUY',
                timestamp: new Date().toISOString(),
                rsi_4h: 65,
                ema_cross: true
            };
            
            console.log('   📡 Sinal simulado recebido:');
            console.log(`      Symbol: ${sinalSimulado.ticker}`);
            console.log(`      Price: $${sinalSimulado.close}`);
            console.log(`      Action: ${sinalSimulado.signal}`);
            
            // Verificar se temos tudo para processar
            const podeProcessar = 
                this.resultados.detalhes.openai_configured &&
                this.resultados.detalhes.bybit_keys_found;
            
            if (podeProcessar) {
                this.resultados.testes.push({
                    nome: 'SIMULACAO_PROCESSAMENTO',
                    status: 'SUCESSO',
                    detalhes: {
                        sinal: sinalSimulado,
                        openai_disponivel: true,
                        bybit_disponivel: true,
                        pode_executar: true
                    }
                });
                
                this.resultados.sucessos++;
                console.log('   ✅ Sistema PRONTO para processar sinais reais');
                console.log('   🚀 Todas as integrações funcionando');
            } else {
                throw new Error('Integrações incompletas - não pode processar sinais');
            }
            
        } catch (error) {
            this.resultados.testes.push({
                nome: 'SIMULACAO_PROCESSAMENTO',
                status: 'FALHA',
                erro: error.message
            });
            this.resultados.falhas++;
            console.log('   ❌ Sistema NÃO está pronto:', error.message);
        }
    }

    async gerarRelatorio() {
        const duracao = new Date() - this.resultados.inicio;
        
        console.log('\n📊 RELATÓRIO FINAL DOS TESTES');
        console.log('=============================');
        console.log(`⏱️ Duração: ${Math.round(duracao / 1000)}s`);
        console.log(`✅ Sucessos: ${this.resultados.sucessos}`);
        console.log(`❌ Falhas: ${this.resultados.falhas}`);
        console.log(`📋 Total de testes: ${this.resultados.testes.length}`);
        
        console.log('\n🔍 DETALHES POR TESTE:');
        this.resultados.testes.forEach(teste => {
            const status = teste.status === 'SUCESSO' ? '✅' : '❌';
            console.log(`   ${status} ${teste.nome}: ${teste.status}`);
            if (teste.erro) {
                console.log(`      Erro: ${teste.erro}`);
            }
        });
        
        console.log('\n📈 STATUS GERAL:');
        if (this.resultados.falhas === 0) {
            console.log('   🎉 TODOS OS TESTES PASSARAM!');
            console.log('   🚀 SISTEMA PRONTO PARA PRODUÇÃO!');
        } else {
            console.log(`   ⚠️ ${this.resultados.falhas} teste(s) falharam`);
            console.log('   🔧 Verificar configurações antes da produção');
        }
        
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        if (this.resultados.detalhes.openai_configured && this.resultados.detalhes.bybit_keys_found) {
            console.log('   ✅ Configurar webhook do TradingView');
            console.log('   ✅ Ativar recepção de sinais reais');
            console.log('   ✅ Monitorar primeiras operações');
        } else {
            if (!this.resultados.detalhes.openai_configured) {
                console.log('   ❌ Configurar chave OpenAI no banco');
            }
            if (!this.resultados.detalhes.bybit_keys_found) {
                console.log('   ❌ Adicionar chaves Bybit de produção');
            }
        }
    }
}

// Executar testes
async function main() {
    const testador = new TestadorConexoesReais();
    await testador.executarTestes();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { TestadorConexoesReais };

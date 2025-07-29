/**
 * 🛠️ DIAGNÓSTICO E CORREÇÃO - BINANCE API
 * Script para diagnosticar e resolver problemas comuns da Binance
 */

const fs = require('fs').promises;
const crypto = require('crypto');

console.log('🛠️ DIAGNÓSTICO BINANCE API');
console.log('===========================\n');

class DiagnosticoBinance {
    constructor() {
        this.configuracao = {};
        this.resultados = {};
    }

    async executarDiagnostico() {
        console.log('🔍 Iniciando diagnóstico completo da Binance...\n');

        try {
            // 1. Carregar configuração
            await this.carregarConfiguracao();
            
            // 2. Testar endpoints públicos
            await this.testarEndpointsPublicos();
            
            // 3. Diagnosticar problemas de autenticação
            await this.diagnosticarAutenticacao();
            
            // 4. Testar diferentes métodos de autenticação
            await this.testarMetodosAutenticacao();
            
            // 5. Gerar relatório e soluções
            await this.gerarRelatorioSolucoes();

        } catch (error) {
            console.error('❌ Erro no diagnóstico:', error.message);
        }
    }

    async carregarConfiguracao() {
        console.log('📋 1. CARREGANDO CONFIGURAÇÃO');
        console.log('─'.repeat(40));

        try {
            const configContent = await fs.readFile('.env.test-mauro', 'utf8');
            
            const lines = configContent.split('\n');
            for (const line of lines) {
                if (line.includes('=') && !line.startsWith('#')) {
                    const [key, value] = line.split('=');
                    this.configuracao[key.trim()] = value.trim();
                }
            }

            console.log('✅ Configuração carregada');
            console.log(`📊 API Key: ${this.configuracao.BINANCE_API_KEY?.substring(0, 8)}...`);
            console.log(`📊 Secret: ${this.configuracao.BINANCE_API_SECRET?.substring(0, 8)}...`);
            console.log(`📊 Testnet: ${this.configuracao.BINANCE_TESTNET}`);

        } catch (error) {
            throw new Error(`Erro ao carregar configuração: ${error.message}`);
        }

        console.log('');
    }

    async testarEndpointsPublicos() {
        console.log('🌐 2. TESTANDO ENDPOINTS PÚBLICOS');
        console.log('─'.repeat(40));

        const isTestnet = this.configuracao.BINANCE_TESTNET === 'true';
        
        // Testar ambos os endpoints
        const endpoints = [
            { nome: 'Testnet', url: 'https://testnet.binance.vision' },
            { nome: 'Produção', url: 'https://api.binance.com' }
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`🔍 Testando ${endpoint.nome}...`);
                
                const startTime = Date.now();
                const response = await this.fazerRequisicao(`${endpoint.url}/api/v3/ping`);
                const latencia = Date.now() - startTime;

                if (response === '' || typeof response === 'object') {
                    console.log(`   ✅ ${endpoint.nome}: OK (${latencia}ms)`);
                    
                    // Testar horário do servidor
                    const timeResponse = await this.fazerRequisicao(`${endpoint.url}/api/v3/time`);
                    if (timeResponse.serverTime) {
                        console.log(`   ⏰ Hora: ${new Date(timeResponse.serverTime).toISOString()}`);
                    }
                } else {
                    console.log(`   ❌ ${endpoint.nome}: Resposta inesperada`);
                }

            } catch (error) {
                console.log(`   ❌ ${endpoint.nome}: ${error.message}`);
            }
        }

        console.log('');
    }

    async diagnosticarAutenticacao() {
        console.log('🔐 3. DIAGNOSTICANDO AUTENTICAÇÃO');
        console.log('─'.repeat(40));

        const isTestnet = this.configuracao.BINANCE_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://testnet.binance.vision' : 'https://api.binance.com';

        console.log(`🎯 Testando autenticação no ${isTestnet ? 'TESTNET' : 'PRODUÇÃO'}...`);

        // Teste 1: Account info básico
        try {
            console.log('\n📋 Teste 1: Account Info...');
            
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            
            const signature = crypto
                .createHmac('sha256', this.configuracao.BINANCE_API_SECRET)
                .update(queryString)
                .digest('hex');

            const headers = {
                'X-MBX-APIKEY': this.configuracao.BINANCE_API_KEY,
                'Content-Type': 'application/json'
            };

            const url = `${baseUrl}/api/v3/account?${queryString}&signature=${signature}`;
            const response = await this.fazerRequisicaoAutenticada(url, { headers });

            if (response.accountType) {
                console.log('   ✅ Autenticação básica funcionando');
                console.log(`   📊 Tipo: ${response.accountType}`);
                console.log(`   🚀 Pode trading: ${response.canTrade}`);
                this.resultados.accountInfo = response;
            } else if (response.code) {
                console.log(`   ❌ Erro ${response.code}: ${response.msg}`);
                this.resultados.erroAccount = response;
            }

        } catch (error) {
            console.log(`   ❌ Falha: ${error.message}`);
        }

        // Teste 2: Listening key (para WebSocket)
        try {
            console.log('\n📡 Teste 2: User Data Stream...');
            
            const headers = {
                'X-MBX-APIKEY': this.configuracao.BINANCE_API_KEY,
                'Content-Type': 'application/json'
            };

            const response = await this.fazerRequisicaoPost(
                `${baseUrl}/api/v3/userDataStream`, 
                '', 
                { headers }
            );

            if (response.listenKey) {
                console.log('   ✅ User Data Stream funcionando');
                console.log(`   🔑 Listen Key: ${response.listenKey.substring(0, 20)}...`);
                this.resultados.listenKey = response.listenKey;
            } else if (response.code) {
                console.log(`   ❌ Erro ${response.code}: ${response.msg}`);
            }

        } catch (error) {
            console.log(`   ❌ Falha: ${error.message}`);
        }

        console.log('');
    }

    async testarMetodosAutenticacao() {
        console.log('🧪 4. TESTANDO MÉTODOS ALTERNATIVOS');
        console.log('─'.repeat(40));

        const isTestnet = this.configuracao.BINANCE_TESTNET === 'true';
        const baseUrl = isTestnet ? 'https://testnet.binance.vision' : 'https://api.binance.com';

        // Método 1: Com recvWindow maior
        try {
            console.log('📊 Método 1: RecvWindow 60000ms...');
            
            const timestamp = Date.now();
            const recvWindow = 60000;
            const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
            
            const signature = crypto
                .createHmac('sha256', this.configuracao.BINANCE_API_SECRET)
                .update(queryString)
                .digest('hex');

            const headers = {
                'X-MBX-APIKEY': this.configuracao.BINANCE_API_KEY
            };

            const url = `${baseUrl}/api/v3/account?${queryString}&signature=${signature}`;
            const response = await this.fazerRequisicaoAutenticada(url, { headers });

            if (response.accountType) {
                console.log('   ✅ Funcionou com recvWindow maior!');
                this.resultados.metodo1 = true;
            } else {
                console.log(`   ❌ Erro: ${response.code} - ${response.msg}`);
                this.resultados.metodo1 = false;
            }

        } catch (error) {
            console.log(`   ❌ Falha: ${error.message}`);
            this.resultados.metodo1 = false;
        }

        // Método 2: Endpoint mais simples
        try {
            console.log('\n📊 Método 2: API Key Info...');
            
            const headers = {
                'X-MBX-APIKEY': this.configuracao.BINANCE_API_KEY
            };

            // Este endpoint só precisa da API Key
            const response = await this.fazerRequisicaoAutenticada(
                `${baseUrl}/sapi/v1/system/status`,
                { headers }
            );

            if (response.status === 0 || response.msg) {
                console.log('   ✅ API Key válida para consultas básicas');
                this.resultados.metodo2 = true;
            } else {
                console.log('   ❌ API Key pode estar inválida');
                this.resultados.metodo2 = false;
            }

        } catch (error) {
            console.log(`   ❌ Falha: ${error.message}`);
            this.resultados.metodo2 = false;
        }

        console.log('');
    }

    async gerarRelatorioSolucoes() {
        console.log('📊 5. RELATÓRIO E SOLUÇÕES');
        console.log('═'.repeat(50));

        console.log('\n🔍 DIAGNÓSTICO COMPLETO:');

        // Analisar resultados
        if (this.resultados.accountInfo) {
            console.log('✅ SUCESSO: Suas chaves estão funcionando!');
            console.log(`   • Tipo de conta: ${this.resultados.accountInfo.accountType}`);
            console.log(`   • Trading habilitado: ${this.resultados.accountInfo.canTrade ? 'Sim' : 'Não'}`);
            console.log(`   • Permissões: ${this.resultados.accountInfo.permissions?.join(', ') || 'N/A'}`);
            
            if (this.resultados.accountInfo.balances) {
                const saldosComValor = this.resultados.accountInfo.balances.filter(b => 
                    parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
                );
                console.log(`   • Moedas com saldo: ${saldosComValor.length}`);
            }

        } else if (this.resultados.erroAccount) {
            const erro = this.resultados.erroAccount;
            console.log(`❌ PROBLEMA IDENTIFICADO: Código ${erro.code}`);
            
            console.log('\n🔧 SOLUÇÕES ESPECÍFICAS:');
            
            switch (erro.code) {
                case -2014:
                    console.log('   📝 API Key inválida:');
                    console.log('      1. Verifique se copiou a API Key completa');
                    console.log('      2. Confirme que a chave foi criada no TESTNET');
                    console.log('      3. Recrie a API Key se necessário');
                    break;
                    
                case -2015:
                    console.log('   🌐 Problema de IP ou permissões:');
                    console.log('      1. SOLUÇÃO IMEDIATA: Remova restrições de IP');
                    console.log('      2. Na Binance, vá em API Management');
                    console.log('      3. Edite sua API Key');
                    console.log('      4. Desmarque "Restrict access to trusted IPs only"');
                    console.log('      5. Salve as alterações');
                    console.log('      6. Execute o teste novamente');
                    break;
                    
                case -1022:
                    console.log('   🔐 Assinatura inválida:');
                    console.log('      1. Verifique se o API Secret está correto');
                    console.log('      2. Certifique-se que não há espaços extras');
                    console.log('      3. Recrie as chaves se necessário');
                    break;
                    
                default:
                    console.log(`   ❓ Erro ${erro.code}: ${erro.msg}`);
                    console.log('      1. Consulte a documentação da Binance');
                    console.log('      2. Verifique status da API');
            }
        }

        // Verificar método alternativo
        if (this.resultados.metodo1) {
            console.log('\n✅ DICA: Use recvWindow maior para melhor estabilidade');
        }

        if (this.resultados.listenKey) {
            console.log('✅ WebSocket funcionando - Dados em tempo real disponíveis');
        }

        console.log('\n🚀 PRÓXIMOS PASSOS:');
        if (this.resultados.accountInfo) {
            console.log('   1. ✅ Binance configurada com sucesso!');
            console.log('   2. Configure agora suas chaves da Bybit');
            console.log('   3. Execute: node teste-mauro-bybit-real.js');
            console.log('   4. Quando ambas estiverem OK, mude para produção');
        } else {
            console.log('   1. Siga as soluções específicas acima');
            console.log('   2. Execute este diagnóstico novamente');
            console.log('   3. Entre em contato se persistir o problema');
        }

        console.log('\n📞 SUPORTE:');
        console.log('   • Telegram: @CoinbitClub');
        console.log('   • Email: suporte@coinbitclub.com');
        console.log('   • Este diagnóstico: node diagnostico-binance.js');

        console.log('\n' + '═'.repeat(50));
    }

    async fazerRequisicao(url) {
        const https = require('https');
        
        return new Promise((resolve, reject) => {
            const req = https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        if (data === '') {
                            resolve('');
                        } else {
                            resolve(JSON.parse(data));
                        }
                    } catch (error) {
                        reject(new Error('Resposta inválida da API'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
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
                        reject(new Error('Resposta inválida'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
            
            req.end();
        });
    }

    async fazerRequisicaoPost(url, body, options) {
        const https = require('https');
        const urlObj = new URL(url);
        
        return new Promise((resolve, reject) => {
            const reqOptions = {
                hostname: urlObj.hostname,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    ...options.headers,
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const req = https.request(reqOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error('Resposta inválida'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
            
            req.write(body);
            req.end();
        });
    }
}

// Executar diagnóstico
if (require.main === module) {
    const diagnostico = new DiagnosticoBinance();
    
    diagnostico.executarDiagnostico()
        .then(() => {
            console.log('\n✅ Diagnóstico concluído!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro no diagnóstico:', error.message);
            process.exit(1);
        });
}

module.exports = DiagnosticoBinance;

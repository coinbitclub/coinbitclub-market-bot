/**
 * 🌐 VERIFICADOR DE IP E CONFIGURAÇÃO BINANCE
 * Descobre seu IP atual e verifica configuração da API
 */

const https = require('https');
const fs = require('fs').promises;

console.log('🌐 VERIFICADOR DE IP E CONFIGURAÇÃO');
console.log('===================================\n');

class VerificadorIP {
    constructor() {
        this.ipAtual = null;
        this.configuracao = {};
    }

    async executarVerificacao() {
        console.log('🔍 Iniciando verificação completa...\n');

        try {
            // 1. Descobrir IP atual
            await this.descobrirIPAtual();
            
            // 2. Carregar configuração
            await this.carregarConfiguracao();
            
            // 3. Verificar configuração da Binance
            await this.verificarConfiguracaoBinance();
            
            // 4. Testar conectividade
            await this.testarConectividade();
            
            // 5. Gerar relatório com soluções
            await this.gerarRelatorioSolucoes();

        } catch (error) {
            console.error('❌ Erro na verificação:', error.message);
        }
    }

    async descobrirIPAtual() {
        console.log('🔍 1. DESCOBRINDO SEU IP ATUAL');
        console.log('─'.repeat(40));

        try {
            // Método 1: ipify.org
            console.log('🌐 Consultando ipify.org...');
            const ip1 = await this.consultarIP('https://api.ipify.org?format=json');
            
            // Método 2: httpbin.org
            console.log('🌐 Consultando httpbin.org...');
            const ip2 = await this.consultarIP('https://httpbin.org/ip');
            
            // Método 3: ifconfig.me
            console.log('🌐 Consultando ifconfig.me...');
            const ip3 = await this.consultarIPTexto('https://ifconfig.me/ip');

            console.log('\n📊 Resultados:');
            console.log(`   • ipify.org: ${ip1}`);
            console.log(`   • httpbin.org: ${ip2}`);
            console.log(`   • ifconfig.me: ${ip3}`);

            // Verificar consistência
            const ips = [ip1, ip2, ip3].filter(ip => ip && ip !== 'erro');
            if (ips.length > 0) {
                this.ipAtual = ips[0];
                const todosIguais = ips.every(ip => ip === ips[0]);
                
                if (todosIguais) {
                    console.log(`\n✅ SEU IP ATUAL: ${this.ipAtual}`);
                } else {
                    console.log(`\n⚠️  IPs diferentes detectados. Usando: ${this.ipAtual}`);
                }
            } else {
                console.log('\n❌ Não foi possível determinar o IP');
                this.ipAtual = 'DESCONHECIDO';
            }

        } catch (error) {
            console.log('❌ Erro ao descobrir IP:', error.message);
            this.ipAtual = 'ERRO';
        }

        console.log('');
    }

    async consultarIP(url) {
        try {
            const response = await this.fazerRequisicao(url);
            
            if (url.includes('ipify')) {
                return response.ip;
            } else if (url.includes('httpbin')) {
                return response.origin;
            }
            
            return 'erro';
        } catch (error) {
            return 'erro';
        }
    }

    async consultarIPTexto(url) {
        try {
            return new Promise((resolve, reject) => {
                const req = https.get(url, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        resolve(data.trim());
                    });
                });

                req.on('error', () => resolve('erro'));
                req.setTimeout(5000, () => {
                    req.destroy();
                    resolve('erro');
                });
            });
        } catch (error) {
            return 'erro';
        }
    }

    async carregarConfiguracao() {
        console.log('📋 2. CARREGANDO CONFIGURAÇÃO');
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
            console.log(`📊 API Key: ${this.configuracao.BINANCE_API_KEY?.substring(0, 10)}...`);
            console.log(`📊 Testnet: ${this.configuracao.BINANCE_TESTNET}`);

        } catch (error) {
            console.log('❌ Erro ao carregar configuração:', error.message);
        }

        console.log('');
    }

    async verificarConfiguracaoBinance() {
        console.log('🔐 3. VERIFICANDO CONFIGURAÇÃO BINANCE');
        console.log('─'.repeat(40));

        console.log('📋 Status da sua API Key na Binance:');
        console.log(`   • Chave termina em: ...${this.configuracao.BINANCE_API_KEY?.slice(-8)}`);
        console.log(`   • Ambiente: ${this.configuracao.BINANCE_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO'}`);
        console.log(`   • Seu IP atual: ${this.ipAtual}`);
        
        console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
        console.log('   Erro -2015 indica que seu IP não está autorizado');
        console.log('   ou que há restrições de permissão na API Key');

        console.log('');
    }

    async testarConectividade() {
        console.log('🌐 4. TESTANDO CONECTIVIDADE');
        console.log('─'.repeat(40));

        const testnet = this.configuracao.BINANCE_TESTNET === 'true';
        const baseUrl = testnet ? 'https://testnet.binance.vision' : 'https://api.binance.com';

        try {
            console.log(`🔍 Testando ${testnet ? 'TESTNET' : 'PRODUÇÃO'}...`);
            
            // Teste público
            const startTime = Date.now();
            const response = await this.fazerRequisicao(`${baseUrl}/api/v3/ping`);
            const latencia = Date.now() - startTime;

            console.log(`✅ Conectividade pública OK (${latencia}ms)`);
            
            // Teste de horário
            const timeResponse = await this.fazerRequisicao(`${baseUrl}/api/v3/time`);
            console.log(`⏰ Sincronização: ${new Date(timeResponse.serverTime).toISOString()}`);

        } catch (error) {
            console.log('❌ Problema de conectividade:', error.message);
        }

        console.log('');
    }

    async gerarRelatorioSolucoes() {
        console.log('🔧 5. SOLUÇÕES PARA O ERRO -2015');
        console.log('═'.repeat(50));

        console.log(`\n📊 RESUMO DA SITUAÇÃO:`);
        console.log(`   • Seu IP atual: ${this.ipAtual}`);
        console.log(`   • API Key: ...${this.configuracao.BINANCE_API_KEY?.slice(-8)}`);
        console.log(`   • Ambiente: ${this.configuracao.BINANCE_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO'}`);
        console.log(`   • Erro: -2015 (IP ou permissões)`);

        console.log('\n🚀 SOLUÇÕES PRIORITÁRIAS:\n');

        console.log('📋 OPÇÃO 1 - REMOVER RESTRIÇÕES DE IP (MAIS SIMPLES):');
        console.log('   1. Acesse: https://www.binance.com/en/my/settings/api-management');
        console.log('   2. Encontre sua API Key que termina em: ...882803');
        console.log('   3. Clique em "Edit"');
        console.log('   4. DESMAQUE: "Restrict access to trusted IPs only"');
        console.log('   5. Salve as alterações');
        console.log('   6. Aguarde 2-3 minutos');
        console.log('   7. Execute: node teste-mauro-binance-real.js\n');

        console.log('📋 OPÇÃO 2 - ADICIONAR SEU IP À LISTA:');
        console.log('   1. Acesse: https://www.binance.com/en/my/settings/api-management');
        console.log('   2. Encontre sua API Key que termina em: ...882803');
        console.log('   3. Clique em "Edit"');
        console.log('   4. MANTENHA marcado: "Restrict access to trusted IPs only"');
        console.log(`   5. ADICIONE o IP: ${this.ipAtual}`);
        console.log('   6. Salve as alterações');
        console.log('   7. Aguarde 2-3 minutos');
        console.log('   8. Execute: node teste-mauro-binance-real.js\n');

        console.log('📋 OPÇÃO 3 - VERIFICAR PERMISSÕES:');
        console.log('   1. Na mesma tela de API Management');
        console.log('   2. Verifique se estão habilitadas:');
        console.log('      ✅ Enable Reading');
        console.log('      ✅ Enable Spot & Margin Trading');
        console.log('   3. Se não estiverem, habilite e salve\n');

        console.log('⚡ TESTE RÁPIDO APÓS MUDANÇAS:');
        console.log('   node verificador-ip.js  # Este script');
        console.log('   node teste-mauro-binance-real.js  # Teste completo\n');

        console.log('🎯 RESULTADO ESPERADO APÓS CORREÇÃO:');
        console.log('   ✅ Conectividade Binance OK');
        console.log('   ✅ Autenticação Binance bem-sucedida');
        console.log('   ✅ Permissões validadas');
        console.log('   ✅ Saldos obtidos');
        console.log('   🎉 BINANCE CONFIGURADA COM SUCESSO!\n');

        console.log('📞 SUPORTE:');
        console.log('   • Telegram: @CoinbitClub');
        console.log('   • Email: suporte@coinbitclub.com');
        console.log('   • Re-execute este script: node verificador-ip.js');

        console.log('\n' + '═'.repeat(50));
        console.log('💡 DICA: A Opção 1 (remover restrições) é mais simples para testes!');
    }

    async fazerRequisicao(url) {
        return new Promise((resolve, reject) => {
            const req = https.get(url, (res) => {
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
        });
    }
}

// Executar verificação
if (require.main === module) {
    const verificador = new VerificadorIP();
    
    verificador.executarVerificacao()
        .then(() => {
            console.log('\n✅ Verificação concluída!');
            console.log('🚀 Siga as soluções acima para resolver o problema!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na verificação:', error.message);
            process.exit(1);
        });
}

module.exports = VerificadorIP;

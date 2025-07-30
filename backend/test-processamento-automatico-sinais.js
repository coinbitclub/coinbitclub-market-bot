/**
 * 🧪 TESTE DE PROCESSAMENTO AUTOMÁTICO DE SINAIS
 * Envia um sinal de teste e monitora se é processado automaticamente
 */

const axios = require('axios');

console.log('🧪 ====================================================');
console.log('     TESTE DE PROCESSAMENTO AUTOMÁTICO DE SINAIS');
console.log('====================================================');

class TestadorProcessamentoAutomatico {
    constructor() {
        this.baseURL = 'http://localhost:8080';
        this.webhookToken = '210406';
    }

    async enviarSinalTeste() {
        console.log('\n📤 1. ENVIANDO SINAL DE TESTE...');
        
        const sinalTeste = {
            ticker: 'BTCUSDT',
            symbol: 'BTCUSDT', 
            action: 'BUY',
            price: 45000,
            timestamp: new Date().toISOString(),
            confidence: 0.85,
            strategy: 'TESTE_AUTOMATICO',
            timeframe: '15m',
            source: 'teste_automatico',
            token: this.webhookToken
        };
        
        try {
            console.log('🎯 Enviando sinal:', JSON.stringify(sinalTeste, null, 2));
            
            const response = await axios.post(`${this.baseURL}/api/webhooks/signal?token=${this.webhookToken}`, sinalTeste, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-token': this.webhookToken
                },
                timeout: 10000
            });
            
            console.log('✅ Sinal enviado com sucesso!');
            console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
            
            return response.data.signal_id;
            
        } catch (error) {
            if (error.response) {
                console.error('❌ Erro HTTP:', error.response.status, error.response.data);
            } else {
                console.error('❌ Erro de conexão:', error.message);
            }
            throw error;
        }
    }

    async verificarFearGreed() {
        console.log('\n📊 2. VERIFICANDO FEAR & GREED ATUAL...');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/fear-greed/current`, {
                timeout: 5000
            });
            
            const fg = response.data.fear_greed;
            console.log(`🎯 Fear & Greed: ${fg.value} (${fg.classificacao_pt})`);
            console.log(`📈 Direção permitida: ${fg.direction_allowed}`);
            console.log(`✅ Recomendação: ${fg.trading_recommendation}`);
            
            return fg;
            
        } catch (error) {
            console.error('❌ Erro ao verificar Fear & Greed:', error.message);
            return null;
        }
    }

    async monitorarProcessamento(signalId, tempoLimite = 60000) {
        console.log('\n⏰ 3. MONITORANDO PROCESSAMENTO AUTOMÁTICO...');
        console.log(`🔍 Aguardando processamento do sinal ID: ${signalId}`);
        console.log(`⏱️ Tempo limite: ${tempoLimite/1000} segundos`);
        
        const inicio = Date.now();
        let tentativas = 0;
        
        while (Date.now() - inicio < tempoLimite) {
            tentativas++;
            console.log(`\n🔄 Tentativa ${tentativas} - ${Math.floor((Date.now() - inicio)/1000)}s decorridos`);
            
            try {
                // Verificar sinais recentes
                const response = await axios.get(`${this.baseURL}/api/webhooks/signals/recent?limit=5`, {
                    timeout: 5000
                });
                
                if (response.data.success && response.data.signals) {
                    const sinalEncontrado = response.data.signals.find(s => s.id == signalId);
                    
                    if (sinalEncontrado) {
                        console.log('📍 Sinal encontrado no banco:');
                        console.log(`   - ID: ${sinalEncontrado.id}`);
                        console.log(`   - Symbol: ${sinalEncontrado.symbol}`);
                        console.log(`   - Processado: ${sinalEncontrado.processed ? '✅ SIM' : '⏳ NÃO'}`);
                        console.log(`   - Recebido em: ${sinalEncontrado.received_at}`);
                        
                        if (sinalEncontrado.processed) {
                            console.log('✅ SINAL PROCESSADO AUTOMATICAMENTE!');
                            return true;
                        }
                    } else {
                        console.log('❓ Sinal não encontrado nos recentes');
                    }
                } else {
                    console.log('⚠️ Erro ao consultar sinais recentes');
                }
                
            } catch (error) {
                console.log(`❌ Erro na verificação: ${error.message}`);
            }
            
            // Aguardar antes da próxima verificação
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        console.log('⏰ TIMEOUT: Sinal não foi processado automaticamente dentro do tempo limite');
        return false;
    }

    async verificarOperacoesAbertas() {
        console.log('\n📈 4. VERIFICANDO OPERAÇÕES ABERTAS...');
        
        // Como não temos endpoint específico, vamos verificar se há algo no console
        console.log('📋 Verificando se houve abertura de posições...');
        console.log('❓ Endpoint de operações não disponível - verificação manual necessária');
        
        // Sugestão para logs
        console.log('\n💡 DICA: Verificar logs do sistema para:');
        console.log('   - Mensagens de "Abrindo operação"');
        console.log('   - Conexões com exchanges (Binance/Bybit)');
        console.log('   - Erros de API ou chaves');
        console.log('   - Validações de Fear & Greed');
    }

    async executarTesteTotalAutomatico() {
        console.log('🚀 Iniciando teste completo de automação...\n');
        
        try {
            // 1. Verificar Fear & Greed primeiro
            const fearGreed = await this.verificarFearGreed();
            
            // 2. Enviar sinal de teste
            const signalId = await this.enviarSinalTeste();
            
            if (!signalId) {
                throw new Error('Falha ao enviar sinal - não é possível continuar teste');
            }
            
            // 3. Monitorar processamento
            const processado = await this.monitorarProcessamento(signalId, 30000);
            
            // 4. Verificar operações
            await this.verificarOperacoesAbertas();
            
            // 5. Relatório final
            console.log('\n📋 ====================================================');
            console.log('                     RELATÓRIO FINAL');
            console.log('====================================================');
            
            if (fearGreed) {
                console.log(`✅ Fear & Greed: Funcionando (${fearGreed.value})`);
            } else {
                console.log('❌ Fear & Greed: Erro na consulta');
            }
            
            console.log(`✅ Webhook: Funcionando (Signal ID: ${signalId})`);
            
            if (processado) {
                console.log('✅ Processamento: AUTOMÁTICO CONFIRMADO');
            } else {
                console.log('❌ Processamento: NÃO AUTOMÁTICO ou FALHA');
            }
            
            console.log('\n🎯 CONCLUSÃO:');
            if (processado) {
                console.log('🟢 Sistema possui processamento automático de sinais');
                console.log('🔧 Verificar se há abertura automática de posições');
            } else {
                console.log('🟡 Sistema NÃO possui processamento automático completo');
                console.log('🔧 Necessário implementar gestor automático de sinais');
            }
            
        } catch (error) {
            console.error('\n❌ ERRO NO TESTE:', error.message);
            console.log('\n📋 Status parcial:');
            console.log('❓ Processamento automático: INDEFINIDO (erro no teste)');
        }
        
        console.log('\n✅ Teste concluído!');
    }
}

// Executar teste
const testador = new TestadorProcessamentoAutomatico();
testador.executarTesteTotalAutomatico().catch(console.error);

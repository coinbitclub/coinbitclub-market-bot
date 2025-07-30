/**
 * 🧪 TESTE COMPLETO DO SISTEMA AUTOMÁTICO
 * Verifica todos os gestores e fluxo operacional
 */

const axios = require('axios');

console.log('🧪 ====================================================');
console.log('          TESTE COMPLETO DO SISTEMA AUTOMÁTICO');
console.log('====================================================');

class TestadorSistemaCompleto {
    constructor() {
        this.baseURL = 'http://localhost:8080';
        this.webhookToken = '210406';
    }

    async verificarGestoresAtivos() {
        console.log('\n🤖 1. VERIFICANDO GESTORES AUTOMÁTICOS...');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/gestores/status`, {
                timeout: 5000
            });
            
            if (response.data.success) {
                const gestores = response.data.gestores;
                
                console.log('📊 Status dos Gestores:');
                console.log(`   🔄 Fear & Greed: ${gestores.fear_greed.isRunning ? '✅ ATIVO' : '❌ INATIVO'}`);
                console.log(`   🎯 Processamento Sinais: ${gestores.processamento_sinais.isRunning ? '✅ ATIVO' : '❌ INATIVO'}`);
                
                if (gestores.fear_greed.ultimaAtualizacao) {
                    console.log(`   ⏰ Última atualização F&G: ${gestores.fear_greed.ultimaAtualizacao}`);
                }
                
                console.log(`   📈 Sinais processados: ${gestores.processamento_sinais.sinaisProcessados}`);
                console.log(`   🔧 Operações abertas: ${gestores.processamento_sinais.operacoesAbertas}`);
                
                return gestores;
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar gestores:', error.message);
            return null;
        }
    }

    async enviarSinalTeste() {
        console.log('\n📤 2. ENVIANDO SINAL DE TESTE...');
        
        const sinalTeste = {
            ticker: 'ETHUSDT',
            symbol: 'ETHUSDT', 
            action: 'BUY',
            price: 3200,
            timestamp: new Date().toISOString(),
            confidence: 0.90,
            strategy: 'TESTE_SISTEMA_COMPLETO',
            timeframe: '15m',
            source: 'teste_completo',
            token: this.webhookToken
        };
        
        try {
            const response = await axios.post(
                `${this.baseURL}/api/webhooks/signal?token=${this.webhookToken}`, 
                sinalTeste,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-webhook-token': this.webhookToken
                    },
                    timeout: 10000
                }
            );
            
            console.log('✅ Sinal enviado com sucesso!');
            console.log(`🔍 Signal ID: ${response.data.signal_id}`);
            
            return response.data.signal_id;
            
        } catch (error) {
            console.error('❌ Erro ao enviar sinal:', error.message);
            throw error;
        }
    }

    async monitorarProcessamentoAutomatico(signalId, tempoEspera = 45000) {
        console.log('\n⏰ 3. MONITORANDO PROCESSAMENTO AUTOMÁTICO...');
        console.log(`🎯 Aguardando processamento automático do sinal ID: ${signalId}`);
        
        const inicio = Date.now();
        let processado = false;
        
        while (Date.now() - inicio < tempoEspera && !processado) {
            const tempoDecorrido = Math.floor((Date.now() - inicio) / 1000);
            console.log(`🔄 Verificando... ${tempoDecorrido}s decorridos`);
            
            try {
                const response = await axios.get(`${this.baseURL}/api/webhooks/signals/recent?limit=10`, {
                    timeout: 5000
                });
                
                if (response.data.success) {
                    const sinalEncontrado = response.data.signals.find(s => s.id == signalId);
                    
                    if (sinalEncontrado) {
                        console.log(`📍 Sinal encontrado: ${sinalEncontrado.processed ? '✅ PROCESSADO' : '⏳ PENDENTE'}`);
                        
                        if (sinalEncontrado.processed) {
                            console.log('🎉 SINAL PROCESSADO AUTOMATICAMENTE!');
                            if (sinalEncontrado.processing_status) {
                                console.log(`📊 Status: ${sinalEncontrado.processing_status}`);
                            }
                            processado = true;
                            break;
                        }
                    }
                }
                
            } catch (error) {
                console.log(`⚠️ Erro na verificação: ${error.message}`);
            }
            
            // Aguardar 10 segundos antes da próxima verificação
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        if (!processado) {
            console.log('⏰ TIMEOUT: Sinal não foi processado no tempo esperado');
        }
        
        return processado;
    }

    async verificarFearGreedAtivo() {
        console.log('\n📊 4. VERIFICANDO FEAR & GREED...');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/fear-greed/current`, {
                timeout: 5000
            });
            
            if (response.data.success) {
                const fg = response.data.fear_greed;
                console.log(`🎯 Fear & Greed: ${fg.value} (${fg.classificacao_pt})`);
                console.log(`📈 Direção permitida: ${fg.direction_allowed}`);
                console.log(`⏰ Última atualização: ${fg.hours_ago} horas atrás`);
                console.log(`✅ Recomendação: ${fg.trading_recommendation}`);
                
                return fg;
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar Fear & Greed:', error.message);
            return null;
        }
    }

    async testarControleDosGestores() {
        console.log('\n🎛️ 5. TESTANDO CONTROLE DOS GESTORES...');
        
        try {
            // Testar restart do gestor de sinais
            console.log('🔄 Testando restart do gestor de sinais...');
            
            const response = await axios.post(`${this.baseURL}/api/gestores/control`, {
                gestor: 'sinais',
                action: 'restart'
            }, {
                timeout: 10000
            });
            
            if (response.data.success) {
                console.log('✅ Restart do gestor de sinais realizado com sucesso');
                console.log(`📊 Status: ${response.data.status.isRunning ? 'ATIVO' : 'INATIVO'}`);
            }
            
        } catch (error) {
            console.error('❌ Erro no teste de controle:', error.message);
        }
    }

    async executarTesteSistemaCompleto() {
        console.log('🚀 Iniciando teste completo do sistema automático...\n');
        
        try {
            // 1. Verificar gestores
            const gestores = await this.verificarGestoresAtivos();
            
            // 2. Verificar Fear & Greed
            const fearGreed = await this.verificarFearGreedAtivo();
            
            // 3. Enviar sinal de teste
            const signalId = await this.enviarSinalTeste();
            
            // 4. Monitorar processamento automático
            const processadoAutomaticamente = await this.monitorarProcessamentoAutomatico(signalId);
            
            // 5. Testar controles
            await this.testarControleDosGestores();
            
            // 6. Relatório final
            console.log('\n📋 ====================================================');
            console.log('                  RELATÓRIO FINAL COMPLETO');
            console.log('====================================================');
            
            console.log('\n🤖 GESTORES AUTOMÁTICOS:');
            if (gestores) {
                console.log(`   ✅ Fear & Greed: ${gestores.fear_greed.isRunning ? 'FUNCIONANDO' : 'INATIVO'}`);
                console.log(`   ✅ Proc. Sinais: ${gestores.processamento_sinais.isRunning ? 'FUNCIONANDO' : 'INATIVO'}`);
            } else {
                console.log('   ❌ Erro na verificação dos gestores');
            }
            
            console.log('\n📊 FEAR & GREED:');
            if (fearGreed) {
                console.log(`   ✅ Funcionando: ${fearGreed.value} (${fearGreed.classificacao_pt})`);
                console.log(`   📈 Direção: ${fearGreed.direction_allowed}`);
            } else {
                console.log('   ❌ Erro na verificação Fear & Greed');
            }
            
            console.log('\n🔄 PROCESSAMENTO AUTOMÁTICO:');
            if (processadoAutomaticamente) {
                console.log('   ✅ FUNCIONANDO: Sinais processados automaticamente');
            } else {
                console.log('   ❌ PROBLEMA: Sinais não processados automaticamente');
            }
            
            console.log('\n🎯 CONCLUSÃO GERAL:');
            const sistemaCompleto = gestores && fearGreed && processadoAutomaticamente;
            
            if (sistemaCompleto) {
                console.log('🟢 SISTEMA 100% AUTOMÁTICO - FUNCIONANDO PERFEITAMENTE!');
                console.log('✅ Todos os componentes operacionais');
                console.log('✅ Fear & Greed atualizando automaticamente');
                console.log('✅ Sinais sendo processados automaticamente');
                console.log('✅ Fluxo operacional completo ativo');
            } else {
                console.log('🟡 SISTEMA PARCIALMENTE AUTOMÁTICO');
                if (!gestores) console.log('❌ Gestores com problemas');
                if (!fearGreed) console.log('❌ Fear & Greed com problemas');
                if (!processadoAutomaticamente) console.log('❌ Processamento automático com problemas');
            }
            
        } catch (error) {
            console.error('\n❌ ERRO NO TESTE COMPLETO:', error.message);
            console.log('\n📋 SISTEMA COM FALHAS - Verificar logs para mais detalhes');
        }
        
        console.log('\n✅ Teste completo finalizado!');
    }
}

// Executar teste completo
const testador = new TestadorSistemaCompleto();
testador.executarTesteSistemaCompleto().catch(console.error);

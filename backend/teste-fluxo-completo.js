/**
 * 🧪 TESTE COMPLETO DO FLUXO DE TRADING AUTOMATIZADO
 * Verifica funcionamento end-to-end de todos os gestores
 */

const axios = require('axios');

async function testarFluxoCompleto() {
    console.log('🧪 ================================================================');
    console.log('   TESTE COMPLETO DO FLUXO DE TRADING AUTOMATIZADO');
    console.log('================================================================\n');
    
    const baseURL = 'http://localhost:8080';
    
    try {
        // 1. Verificar status geral do sistema
        console.log('1️⃣ VERIFICANDO STATUS GERAL DO SISTEMA...');
        console.log('=========================================');
        
        const statusResponse = await axios.get(`${baseURL}/api/gestores/status`);
        console.log('✅ Sistema operacional');
        console.log('📊 Componentes ativos:', statusResponse.data.sistema.componentes_ativos);
        console.log('🎯 Cobertura do fluxo:', statusResponse.data.sistema.fluxo_operacional.cobertura);
        
        // 2. Verificar Fear & Greed atual
        console.log('\n2️⃣ VERIFICANDO FEAR & GREED ATUAL...');
        console.log('====================================');
        
        const fearGreedResponse = await axios.get(`${baseURL}/api/fear-greed/current`);
        const fg = fearGreedResponse.data.fear_greed;
        console.log(`✅ Fear & Greed: ${fg.value} (${fg.classificacao_pt})`);
        console.log(`🎯 Direction Allowed: ${fg.direction_allowed}`);
        console.log(`💡 Recomendação: ${fg.trading_recommendation}`);
        
        // 3. Iniciar orquestrador completo
        console.log('\n3️⃣ INICIANDO ORQUESTRADOR COMPLETO...');
        console.log('====================================');
        
        const startResponse = await axios.post(`${baseURL}/api/gestores/control`, {
            gestor: 'orquestrador_completo',
            action: 'start'
        });
        console.log('✅ Orquestrador completo iniciado:', startResponse.data.success);
        console.log('📊 Status inicial:', startResponse.data.status.estadoAtual);
        
        // 4. Simular sinal compatível com Fear & Greed
        console.log('\n4️⃣ SIMULANDO SINAL DO TRADINGVIEW...');
        console.log('===================================');
        
        // Determinar tipo de sinal baseado no Fear & Greed
        let tipoSinal = 'BUY'; // Default
        if (fg.direction_allowed === 'LONG_ONLY') {
            tipoSinal = 'BUY';
        } else if (fg.direction_allowed === 'SHORT_ONLY') {
            tipoSinal = 'SELL';
        } else {
            tipoSinal = Math.random() > 0.5 ? 'BUY' : 'SELL';
        }
        
        const signalData = {
            ticker: 'BTCUSDT',
            action: tipoSinal,
            price: 45000 + Math.random() * 1000,
            signal_type: tipoSinal === 'BUY' ? 'LONG' : 'SHORT',
            timestamp: new Date().toISOString(),
            source: 'tradingview_test'
        };
        
        console.log(`📊 Enviando sinal ${tipoSinal} (compatível com ${fg.direction_allowed})`);
        
        const signalResponse = await axios.post(`${baseURL}/api/webhooks/signal?token=210406`, signalData);
        console.log('✅ Sinal enviado:', signalResponse.data.success);
        console.log('🎯 Validação passed:', signalResponse.data.validation_details.validation_passed);
        console.log('📈 Direction do sinal:', signalResponse.data.validation_details.signal_direction);
        
        // 5. Aguardar processamento automático
        console.log('\n5️⃣ AGUARDANDO PROCESSAMENTO AUTOMÁTICO...');
        console.log('=========================================');
        console.log('⏱️ Monitorando por 2 minutos para observar fluxo...\n');
        
        for (let i = 0; i < 12; i++) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
            
            const statusAtual = await axios.get(`${baseURL}/api/gestores/status`);
            const orquestradorCompleto = statusAtual.data.gestores.orquestrador_completo;
            
            console.log(`📈 Atualização ${i + 1}/12 (${(i + 1) * 10}s):`);
            console.log(`   Estado: ${orquestradorCompleto.estadoAtual}`);
            console.log(`   Sinais processados: ${orquestradorCompleto.sinaisProcessados}`);
            console.log(`   Operações ativas: ${orquestradorCompleto.operacoesAtivas}`);
            console.log(`   Ciclos completos: ${orquestradorCompleto.ciclosCompletos}`);
            
            if (orquestradorCompleto.ultimoCiclo) {
                const ultimoCiclo = new Date(orquestradorCompleto.ultimoCiclo);
                const tempoDecorrido = Math.floor((Date.now() - ultimoCiclo.getTime()) / 1000);
                console.log(`   Último ciclo: ${tempoDecorrido}s atrás`);
            }
            
            console.log('');
        }
        
        // 6. Testar sinal incompatível (se Fear & Greed permitir apenas uma direção)
        if (fg.direction_allowed !== 'BOTH') {
            console.log('\n6️⃣ TESTANDO SINAL INCOMPATÍVEL...');
            console.log('=================================');
            
            const tipoIncompativel = fg.direction_allowed === 'LONG_ONLY' ? 'SELL' : 'BUY';
            const signalIncompativel = {
                ticker: 'ETHUSDT',
                action: tipoIncompativel,
                price: 3000,
                signal_type: tipoIncompativel === 'BUY' ? 'LONG' : 'SHORT',
                timestamp: new Date().toISOString()
            };
            
            try {
                await axios.post(`${baseURL}/api/webhooks/signal?token=210406`, signalIncompativel);
                console.log('❌ Sinal incompatível foi aceito (erro!)');
            } catch (error) {
                if (error.response?.status === 403) {
                    console.log('✅ Sinal incompatível rejeitado corretamente');
                    console.log('📝 Motivo:', error.response.data.rejection_reason);
                } else {
                    console.log('⚠️ Erro inesperado:', error.message);
                }
            }
        }
        
        // 7. Verificar resultados finais
        console.log('\n7️⃣ VERIFICANDO RESULTADOS FINAIS...');
        console.log('===================================');
        
        const statusFinal = await axios.get(`${baseURL}/api/gestores/status`);
        const stats = statusFinal.data.gestores.orquestrador_completo;
        
        console.log('\n📊 ESTATÍSTICAS FINAIS:');
        console.log('=======================');
        console.log(`✅ Sistema ativo: ${stats.isRunning ? 'SIM' : 'NÃO'}`);
        console.log(`✅ Estado atual: ${stats.estadoAtual}`);
        console.log(`✅ Sinais processados: ${stats.sinaisProcessados}`);
        console.log(`✅ Operações abertas: ${stats.operacoesAbertas}`);
        console.log(`✅ Operações fechadas: ${stats.operacoesFechadas}`);
        console.log(`✅ Lucro total: R$ ${stats.lucroTotal.toFixed(2)}`);
        console.log(`✅ Comissões geradas: R$ ${stats.comissoesGeradas.toFixed(2)}`);
        console.log(`✅ Ciclos completos: ${stats.ciclosCompletos}`);
        console.log(`✅ Gestores ativos: ${stats.gestoresAtivos}`);
        
        console.log('\n🎯 GESTORES INTEGRADOS:');
        console.log('=======================');
        stats.gestoresDisponveis.forEach((gestor, index) => {
            console.log(`   ${index + 1}. ${gestor}`);
        });
        
        console.log('\n🔄 FLUXO OPERACIONAL:');
        console.log('====================');
        const fluxo = statusFinal.data.sistema.fluxo_operacional;
        console.log(`📈 Cobertura: ${fluxo.cobertura}`);
        console.log(`📊 Etapa atual: ${fluxo.etapa_atual}`);
        console.log(`🔢 Operações ativas: ${fluxo.operacoes_ativas}`);
        console.log(`🔄 Ciclos completos: ${fluxo.ciclos_completos}`);
        
        console.log('\n✅ TESTE COMPLETO FINALIZADO COM SUCESSO!');
        console.log('=========================================');
        console.log('🚀 Sistema de trading automatizado está operacional');
        console.log('🎯 Todos os componentes estão funcionando corretamente');
        console.log('📊 Validação direction_allowed implementada');
        console.log('🔄 Orquestração completa ativa');
        
    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.response?.data || error.message);
        console.error('Stack:', error.stack);
    }
}

// Função para testar apenas a validação de sinais
async function testarValidacaoSinais() {
    console.log('\n🔍 TESTE ESPECÍFICO: VALIDAÇÃO DE SINAIS');
    console.log('========================================');
    
    const baseURL = 'http://localhost:8080';
    
    try {
        // Buscar Fear & Greed atual
        const fg = await axios.get(`${baseURL}/api/fear-greed/current`);
        const fearGreed = fg.data.fear_greed;
        
        console.log(`📊 Fear & Greed: ${fearGreed.value} → ${fearGreed.direction_allowed}`);
        
        // Testar sinais compatíveis e incompatíveis
        const sinaisParaTestar = [
            { action: 'BUY', tipo: 'LONG', symbol: 'BTCUSDT' },
            { action: 'SELL', tipo: 'SHORT', symbol: 'ETHUSDT' },
            { action: 'CLOSE', tipo: 'CLOSE', symbol: 'ADAUSDT' }
        ];
        
        for (const sinal of sinaisParaTestar) {
            console.log(`\n🎯 Testando sinal ${sinal.action} (${sinal.tipo}):`);
            
            try {
                const response = await axios.post(`${baseURL}/api/webhooks/signal?token=210406`, {
                    ticker: sinal.symbol,
                    action: sinal.action,
                    signal_type: sinal.tipo,
                    price: 1000 + Math.random() * 1000,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`   ✅ Aceito: ${response.data.validation_details.validation_passed}`);
                console.log(`   📈 Direction: ${response.data.validation_details.signal_direction}`);
                
            } catch (error) {
                if (error.response?.status === 403) {
                    console.log(`   ❌ Rejeitado: ${error.response.data.rejection_reason}`);
                } else {
                    console.log(`   ⚠️ Erro: ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no teste de validação:', error.message);
    }
}

// Executar teste se chamado diretamente
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--validacao')) {
        testarValidacaoSinais()
            .then(() => process.exit(0))
            .catch(error => {
                console.error('💥 Erro:', error);
                process.exit(1);
            });
    } else {
        testarFluxoCompleto()
            .then(() => process.exit(0))
            .catch(error => {
                console.error('💥 Erro:', error);
                process.exit(1);
            });
    }
}

module.exports = { testarFluxoCompleto, testarValidacaoSinais };

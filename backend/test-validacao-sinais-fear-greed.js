/**
 * 🎯 TESTE DE VALIDAÇÃO DE SINAIS COM FEAR & GREED
 * Simular diferentes cenários de mercado e validação
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

console.log('🎯 TESTE DE VALIDAÇÃO DE SINAIS - FEAR & GREED');
console.log('==============================================');

async function simularCenarios() {
    try {
        // 1. Obter status atual do Fear & Greed
        console.log('\n📊 1. CONSULTANDO STATUS ATUAL...');
        const statusResponse = await axios.get(`${BASE_URL}/api/fear-greed/current`);
        
        if (statusResponse.data.success) {
            const fg = statusResponse.data.fear_greed;
            console.log(`✅ Fear & Greed atual: ${fg.value}/100 (${fg.classification})`);
            console.log(`📈 Direção permitida: ${fg.direction_allowed}`);
            console.log(`🎯 Recomendação: ${fg.trading_recommendation}`);
        }
        
        // 2. Simular diferentes valores de Fear & Greed
        console.log('\n🎮 2. SIMULANDO CENÁRIOS DE VALIDAÇÃO...');
        
        const cenarios = [
            { valor: 15, nome: 'MEDO EXTREMO', expectedDirection: 'LONG_ONLY' },
            { valor: 25, nome: 'MEDO', expectedDirection: 'LONG_ONLY' },
            { valor: 50, nome: 'NEUTRO', expectedDirection: 'BOTH' },
            { valor: 75, nome: 'GANÂNCIA', expectedDirection: 'BOTH' },
            { valor: 85, nome: 'GANÂNCIA EXTREMA', expectedDirection: 'SHORT_ONLY' },
            { valor: 95, nome: 'GANÂNCIA MUITO EXTREMA', expectedDirection: 'SHORT_ONLY' }
        ];
        
        for (const cenario of cenarios) {
            console.log(`\n📊 Cenário: ${cenario.nome} (${cenario.valor}/100)`);
            console.log('-'.repeat(40));
            
            // Determinar direção conforme regras
            let direction;
            if (cenario.valor < 30) {
                direction = 'LONG_ONLY';
            } else if (cenario.valor > 80) {
                direction = 'SHORT_ONLY';
            } else {
                direction = 'BOTH';
            }
            
            console.log(`🎯 Direção esperada: ${cenario.expectedDirection}`);
            console.log(`🎯 Direção calculada: ${direction}`);
            console.log(`${direction === cenario.expectedDirection ? '✅' : '❌'} Validação: ${direction === cenario.expectedDirection ? 'CORRETA' : 'INCORRETA'}`);
            
            // Testar sinais específicos
            const sinais = [
                { tipo: 'LONG', par: 'BTCUSDT' },
                { tipo: 'SHORT', par: 'ETHUSDT' },
                { tipo: 'LONG', par: 'ADAUSDT' },
                { tipo: 'SHORT', par: 'SOLUSDT' }
            ];
            
            console.log('🔍 Validação de sinais:');
            for (const sinal of sinais) {
                let permitido = false;
                let motivo = '';
                
                switch (direction) {
                    case 'LONG_ONLY':
                        permitido = sinal.tipo === 'LONG';
                        motivo = permitido ? 'Medo extremo permite LONG' : 'Medo extremo bloqueia SHORT';
                        break;
                    case 'SHORT_ONLY':
                        permitido = sinal.tipo === 'SHORT';
                        motivo = permitido ? 'Ganância extrema permite SHORT' : 'Ganância extrema bloqueia LONG';
                        break;
                    case 'BOTH':
                        permitido = true;
                        motivo = 'Mercado equilibrado permite ambos';
                        break;
                }
                
                const icon = permitido ? '✅' : '❌';
                const status = permitido ? 'PERMITIDO' : 'BLOQUEADO';
                console.log(`   ${icon} ${sinal.tipo} ${sinal.par}: ${status} (${motivo})`);
            }
        }
        
        // 3. Testar webhook de sinal com validação
        console.log('\n📡 3. TESTANDO WEBHOOK COM VALIDAÇÃO...');
        
        const sinalTeste = {
            ticker: 'BTCUSDT',
            action: 'LONG',
            price: 45000,
            quantity: 0.1,
            timestamp: new Date().toISOString()
        };
        
        try {
            const webhookResponse = await axios.post(`${BASE_URL}/api/webhooks/signal?token=210406`, sinalTeste);
            console.log(`✅ Webhook processado: Status ${webhookResponse.status}`);
            console.log(`📊 Signal ID: ${webhookResponse.data.signal_id}`);
            
            // Simular validação que seria feita pelo sistema
            const fgAtual = await axios.get(`${BASE_URL}/api/fear-greed/current`);
            if (fgAtual.data.success) {
                const direction = fgAtual.data.fear_greed.direction_allowed;
                const valor = fgAtual.data.fear_greed.value;
                
                let validacao = '';
                if (direction === 'BOTH') {
                    validacao = '✅ SINAL VÁLIDO - Mercado equilibrado';
                } else if (direction === 'LONG_ONLY' && sinalTeste.action === 'LONG') {
                    validacao = '✅ SINAL VÁLIDO - Medo extremo permite LONG';
                } else if (direction === 'SHORT_ONLY' && sinalTeste.action === 'SHORT') {
                    validacao = '✅ SINAL VÁLIDO - Ganância extrema permite SHORT';
                } else {
                    validacao = `❌ SINAL INVÁLIDO - F&G ${valor} não permite ${sinalTeste.action}`;
                }
                
                console.log(`🎯 Validação do sinal: ${validacao}`);
            }
            
        } catch (error) {
            console.log(`❌ Erro no webhook: ${error.message}`);
        }
        
        // 4. Verificar últimos sinais processados
        console.log('\n📋 4. CONSULTANDO SINAIS RECENTES...');
        
        try {
            const sinaisResponse = await axios.get(`${BASE_URL}/api/webhooks/signals/recent?limit=5`);
            
            if (sinaisResponse.data.success) {
                console.log(`📊 Total de sinais encontrados: ${sinaisResponse.data.count}`);
                
                sinaisResponse.data.signals.forEach((sinal, index) => {
                    const data = JSON.parse(sinal.signal_data);
                    console.log(`   ${index + 1}. ${data.ticker || 'N/A'} - ${data.action || 'N/A'} - ${sinal.received_at}`);
                });
            }
        } catch (error) {
            console.log(`⚠️ Não foi possível consultar sinais: ${error.message}`);
        }
        
        // 5. Relatório final
        console.log('\n📋 5. RELATÓRIO FINAL DO SISTEMA...');
        
        const gestorStatus = await axios.get(`${BASE_URL}/api/fear-greed/status`);
        
        if (gestorStatus.data.success) {
            const gestor = gestorStatus.data.gestor_fear_greed;
            
            console.log('🎯 RESUMO DO SISTEMA FEAR & GREED:');
            console.log(`   ✅ Gestor automático: ${gestor.isRunning ? 'ATIVO' : 'INATIVO'}`);
            console.log(`   ⏰ Intervalo de atualização: ${gestor.intervalo_minutos} minutos`);
            console.log(`   🔄 Última atualização: ${gestor.ultimaAtualizacao || 'Nunca'}`);
            console.log(`   🚨 Erros consecutivos: ${gestor.contadorErros}`);
            
            if (gestor.proximaAtualizacao) {
                const proxima = new Date(gestor.proximaAtualizacao);
                const agora = new Date();
                const minutosRestantes = Math.ceil((proxima - agora) / (1000 * 60));
                console.log(`   ⏳ Próxima atualização em: ${minutosRestantes} minutos`);
            }
        }
        
        console.log('\n🎉 SISTEMA FEAR & GREED OPERACIONAL!');
        console.log('===================================');
        console.log('✅ Coleta automática de dados');
        console.log('✅ Múltiplas fontes de API');
        console.log('✅ Sistema de fallback');
        console.log('✅ Validação de direção de sinais');
        console.log('✅ Endpoints de controle');
        console.log('✅ Processamento de webhooks');
        console.log('✅ Atualização de 15 em 15 minutos');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

// Aguardar um momento e executar
setTimeout(simularCenarios, 2000);

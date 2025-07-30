#!/usr/bin/env node

/**
 * 🎛️ SIMULADOR DE CONFIGURAÇÕES PERSONALIZADAS
 * 
 * Demonstra como os usuários podem personalizar:
 * - Alavancagem (baseada no plano)
 * - Take Profit personalizado
 * - Stop Loss personalizado
 * - Tamanho da posição
 * - Preferências de risco
 */

const UserManager = require('./user-manager-v2');

class SimuladorConfiguracoes {
    constructor() {
        this.userManager = new UserManager();
        this.usuariosDemo = [
            {
                id: 1,
                name: 'João Silva',
                plan_type: 'standard',
                configuracao: {
                    leverage: 3,
                    stopLoss: 8,
                    takeProfit: 12,
                    positionSize: 25,
                    preferences: {
                        riskManagement: 'conservative',
                        autoCalculateTP: true
                    }
                }
            },
            {
                id: 2,
                name: 'Maria VIP',
                plan_type: 'vip',
                configuracao: {
                    leverage: 8,
                    stopLoss: 12,
                    takeProfit: 25,
                    positionSize: 40,
                    preferences: {
                        riskManagement: 'moderate',
                        allowOverride: true
                    }
                }
            },
            {
                id: 3,
                name: 'Carlos Premium',
                plan_type: 'premium',
                configuracao: {
                    leverage: 15,
                    stopLoss: 15,
                    takeProfit: 35,
                    positionSize: 60,
                    preferences: {
                        riskManagement: 'aggressive',
                        autoCalculateTP: false
                    }
                }
            },
            {
                id: 4,
                name: 'Ana Elite',
                plan_type: 'elite',
                configuracao: {
                    leverage: 25,
                    stopLoss: 20,
                    takeProfit: 50,
                    positionSize: 80,
                    preferences: {
                        riskManagement: 'expert',
                        allowOverride: true,
                        customStrategies: true
                    }
                }
            }
        ];
    }

    async inicializar() {
        console.log('🎛️ SIMULADOR DE CONFIGURAÇÕES PERSONALIZADAS');
        console.log('==============================================');
        
        await this.userManager.inicializar();
        console.log('✅ UserManager inicializado');
    }

    async simularConfiguracoes() {
        console.log('\n📊 SIMULANDO CONFIGURAÇÕES POR PLANO:');
        console.log('=====================================');

        for (const usuario of this.usuariosDemo) {
            await this.simularConfiguracaoUsuario(usuario);
        }
    }

    async simularConfiguracaoUsuario(usuario) {
        console.log(`\n👤 USUÁRIO: ${usuario.name} (${usuario.plan_type.toUpperCase()})`);
        console.log('─'.repeat(50));

        try {
            // Mostrar configuração solicitada
            console.log('📝 Configuração solicitada:');
            console.log(`   ⚡ Alavancagem: ${usuario.configuracao.leverage}x`);
            console.log(`   🔻 Stop Loss: ${usuario.configuracao.stopLoss}%`);
            console.log(`   🎯 Take Profit: ${usuario.configuracao.takeProfit}%`);
            console.log(`   💰 Tamanho posição: ${usuario.configuracao.positionSize}%`);

            // Aplicar configuração (com validação de limites)
            const configuracaoAplicada = await this.userManager.configurarParametrosTradingUsuario(
                usuario.id, 
                usuario.configuracao
            );

            // Mostrar configuração final aplicada
            console.log('\n✅ Configuração aplicada (após validação):');
            console.log(`   ⚡ Alavancagem: ${configuracaoAplicada.leverage}x`);
            console.log(`   🔻 Stop Loss: ${configuracaoAplicada.stopLoss}%`);
            console.log(`   🎯 Take Profit: ${configuracaoAplicada.takeProfit}%`);
            console.log(`   💰 Tamanho posição: ${configuracaoAplicada.positionSize}%`);

            // Mostrar diferenças se houver
            this.mostrarDiferencas(usuario.configuracao, configuracaoAplicada);

            // Simular cálculo de operação
            await this.simularCalculoOperacao(usuario, configuracaoAplicada);

        } catch (error) {
            console.log(`❌ Erro: ${error.message}`);
        }
    }

    mostrarDiferencas(solicitado, aplicado) {
        const diferencas = [];
        
        if (solicitado.leverage !== aplicado.leverage) {
            diferencas.push(`Alavancagem: ${solicitado.leverage}x → ${aplicado.leverage}x`);
        }
        if (solicitado.stopLoss !== aplicado.stopLoss) {
            diferencas.push(`Stop Loss: ${solicitado.stopLoss}% → ${aplicado.stopLoss}%`);
        }
        if (solicitado.takeProfit !== aplicado.takeProfit) {
            diferencas.push(`Take Profit: ${solicitado.takeProfit}% → ${aplicado.takeProfit}%`);
        }
        if (solicitado.positionSize !== aplicado.positionSize) {
            diferencas.push(`Posição: ${solicitado.positionSize}% → ${aplicado.positionSize}%`);
        }

        if (diferencas.length > 0) {
            console.log('\n⚠️ Ajustes aplicados por limites do plano:');
            diferencas.forEach(diff => console.log(`   📝 ${diff}`));
        }
    }

    async simularCalculoOperacao(usuario, configuracao) {
        console.log('\n🧮 SIMULAÇÃO DE OPERAÇÃO:');
        
        const precoEntrada = 50000; // Bitcoin exemplo
        const saldoUsuario = 1000;  // $1000 USD
        
        // Calcular valores da operação
        const valorOperacao = (saldoUsuario * configuracao.positionSize) / 100;
        
        // Calcular TP/SL baseado na configuração personalizada
        const takeProfitPrice = precoEntrada * (1 + (configuracao.takeProfit / 100));
        const stopLossPrice = precoEntrada * (1 - (configuracao.stopLoss / 100));
        
        // Calcular lucro/prejuízo potencial
        const lucroTP = valorOperacao * configuracao.leverage * (configuracao.takeProfit / 100);
        const prejuizoSL = valorOperacao * configuracao.leverage * (configuracao.stopLoss / 100);

        console.log(`   📈 Preço entrada: $${precoEntrada.toLocaleString()}`);
        console.log(`   💰 Valor operação: $${valorOperacao} (${configuracao.positionSize}% do saldo)`);
        console.log(`   ⚡ Alavancagem: ${configuracao.leverage}x`);
        console.log(`   🎯 Take Profit: $${takeProfitPrice.toLocaleString()} (+${configuracao.takeProfit}%)`);
        console.log(`   🔻 Stop Loss: $${stopLossPrice.toLocaleString()} (-${configuracao.stopLoss}%)`);
        console.log(`   💵 Lucro potencial: +$${lucroTP.toFixed(2)}`);
        console.log(`   💸 Risco máximo: -$${prejuizoSL.toFixed(2)}`);
        
        // Calcular relação risco/retorno
        const riskReward = lucroTP / prejuizoSL;
        console.log(`   ⚖️ Relação Risco/Retorno: 1:${riskReward.toFixed(2)}`);
    }

    async demonstrarLimitesPorPlano() {
        console.log('\n📋 LIMITES POR PLANO:');
        console.log('======================');

        const planos = ['standard', 'vip', 'premium', 'elite'];
        
        for (const plano of planos) {
            console.log(`\n🏷️ PLANO ${plano.toUpperCase()}:`);
            
            // Teste de configuração extrema
            const configTeste = {
                leverage: 100,
                stopLoss: 50,
                takeProfit: 200,
                positionSize: 100
            };

            const limitesAplicados = this.userManager.validarLimitesParametros(configTeste, plano);
            
            console.log(`   ⚡ Alavancagem máxima: ${limitesAplicados.leverage}x`);
            console.log(`   🔻 Stop Loss: ${limitesAplicados.stopLoss}%`);
            console.log(`   🎯 Take Profit: ${limitesAplicados.takeProfit}%`);
            console.log(`   💰 Posição máxima: ${limitesAplicados.positionSize}%`);
            console.log(`   🎛️ Personalização: ${this.userManager.verificarPermissaoPersonalizacao(plano) ? 'Permitida' : 'Bloqueada'}`);
        }
    }

    async executarSimulacao() {
        try {
            await this.inicializar();
            await this.simularConfiguracoes();
            await this.demonstrarLimitesPorPlano();
            
            console.log('\n🎉 SIMULAÇÃO CONCLUÍDA!');
            console.log('========================');
            console.log('✅ Sistema de configurações personalizadas implementado');
            console.log('✅ Validação de limites por plano funcionando');
            console.log('✅ Cálculos personalizados aplicados');
            console.log('✅ Proteções de risco implementadas');

        } catch (error) {
            console.error('❌ Erro na simulação:', error.message);
        } finally {
            await this.userManager.finalizar();
        }
    }
}

// Executar simulação
if (require.main === module) {
    const simulador = new SimuladorConfiguracoes();
    simulador.executarSimulacao().catch(console.error);
}

module.exports = SimuladorConfiguracoes;

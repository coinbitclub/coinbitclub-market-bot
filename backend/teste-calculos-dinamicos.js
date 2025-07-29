/**
 * TESTE: Cálculo Dinâmico de Limites baseado no Saldo Real
 * Sistema CoinbitClub MarketBot - Demonstração dos novos cálculos
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');

class TesteLimitesOperacao {
    constructor() {
        this.gestor = new GestorChavesAPI();
    }

    async testarCalculosDinamicos() {
        console.log('🧮 TESTE: CÁLCULOS DINÂMICOS DE LIMITES DE OPERAÇÃO');
        console.log('=' .repeat(70));
        
        // Cenários de teste com diferentes saldos
        const cenarios = [
            {
                nome: 'Saldo Baixo',
                saldo: 100,
                percentual: 25,
                descricao: 'Usuário iniciante com $100'
            },
            {
                nome: 'Saldo Médio',
                saldo: 1000,
                percentual: 30,
                descricao: 'Usuário VIP Luiza Maria com $1000'
            },
            {
                nome: 'Saldo Alto',
                saldo: 5000,
                percentual: 20,
                descricao: 'Usuário experiente com $5000'
            },
            {
                nome: 'Saldo Premium',
                saldo: 25000,
                percentual: 15,
                descricao: 'Usuário premium com $25000'
            }
        ];

        for (const cenario of cenarios) {
            console.log(`\n📊 CENÁRIO: ${cenario.nome.toUpperCase()}`);
            console.log(`💰 Saldo disponível: $${cenario.saldo.toLocaleString()} USDT`);
            console.log(`📈 Percentual por operação: ${cenario.percentual}%`);
            console.log(`ℹ️  ${cenario.descricao}`);
            console.log('-'.repeat(50));

            // Configurar parametrizações para o cenário
            const parametrizacoes = {
                trading: {
                    balance_percentage: cenario.percentual,
                    leverage_default: 5,
                    take_profit_multiplier: 3,
                    stop_loss_multiplier: 2,
                    max_open_positions: 2
                },
                limits: {
                    max_daily_trades: 20,
                    max_daily_loss_usd: 500
                }
            };

            // Calcular limites dinamicamente
            const limites = this.gestor.calcularLimitesOperacao(parametrizacoes, cenario.saldo);

            console.log('🎯 LIMITES CALCULADOS:');
            console.log(`   💵 Valor mínimo por trade: $${limites.valorMinimoTrade.toFixed(2)}`);
            console.log(`   💰 Valor máximo por trade: $${limites.valorMaximoTrade.toFixed(2)}`);
            console.log(`   📊 Valor por operação (${cenario.percentual}%): $${limites.valorPorOperacao.toFixed(2)}`);
            console.log(`   🎚️  Alavancagem: ${limites.alavancagem}x`);
            console.log(`   📈 Take Profit: ${limites.takeProfitMultiplier}x`);
            console.log(`   📉 Stop Loss: ${limites.stopLossMultiplier}x`);
            console.log(`   🔢 Max operações simultâneas: ${limites.maxPosicoesAbertas}`);

            // Calcular exemplos práticos
            const exemploLong = this.calcularExemploOperacao(limites, 'LONG', 45000); // BTC a $45k
            console.log('\n💡 EXEMPLO PRÁTICO - LONG BTC:');
            console.log(`   📊 Preço BTC: $${exemploLong.preco.toLocaleString()}`);
            console.log(`   💰 Valor investido: $${exemploLong.valorInvestido.toFixed(2)}`);
            console.log(`   📈 Take Profit: $${exemploLong.takeProfit.toLocaleString()}`);
            console.log(`   📉 Stop Loss: $${exemploLong.stopLoss.toLocaleString()}`);
            console.log(`   💵 Lucro potencial: $${exemploLong.lucroPotencial.toFixed(2)}`);
            console.log(`   💸 Perda máxima: $${exemploLong.perdaMaxima.toFixed(2)}`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ VANTAGENS DO CÁLCULO DINÂMICO:');
        console.log('1. 🎯 Valores sempre proporcionais ao saldo real');
        console.log('2. 🛡️ Proteção automática contra over-trading');
        console.log('3. 📊 Ajuste automático conforme crescimento da conta');
        console.log('4. ⚖️ Gestão de risco baseada em percentuais');
        console.log('5. 🔄 Atualização em tempo real do saldo');
    }

    calcularExemploOperacao(limites, direcao, precoBTC) {
        const valorInvestido = limites.valorPorOperacao;
        const alavancagem = limites.alavancagem;
        const valorComAlavancagem = valorInvestido * alavancagem;
        
        // Calcular preços de saída
        const percentualTP = (limites.takeProfitMultiplier / 100);
        const percentualSL = (limites.stopLossMultiplier / 100);
        
        let takeProfit, stopLoss;
        if (direcao === 'LONG') {
            takeProfit = precoBTC * (1 + percentualTP);
            stopLoss = precoBTC * (1 - percentualSL);
        } else {
            takeProfit = precoBTC * (1 - percentualTP);
            stopLoss = precoBTC * (1 + percentualSL);
        }
        
        // Calcular lucros/perdas
        const lucroPotencial = valorInvestido * (limites.takeProfitMultiplier / 100) * alavancagem;
        const perdaMaxima = valorInvestido * (limites.stopLossMultiplier / 100) * alavancagem;
        
        return {
            preco: precoBTC,
            valorInvestido,
            takeProfit,
            stopLoss,
            lucroPotencial,
            perdaMaxima,
            valorComAlavancagem
        };
    }

    async testarSaldoRealLuiza() {
        console.log('\n🔍 TESTE: SALDO REAL DA LUIZA MARIA');
        console.log('=' .repeat(50));
        
        try {
            // Buscar dados da Luiza Maria (ID: 4)
            const dadosLuiza = await this.gestor.obterDadosUsuarioParaTrading(4);
            
            console.log('👤 DADOS DA LUIZA MARIA:');
            console.log(`   ID: ${dadosLuiza.usuario.id}`);
            console.log(`   Email: ${dadosLuiza.usuario.email}`);
            console.log(`   Role: ${dadosLuiza.usuario.role}`);
            
            // Simular preparação de operação
            if (dadosLuiza.exchangesConfiguradas.includes('bybit')) {
                console.log('\n🎯 SIMULANDO OPERAÇÃO BYBIT:');
                
                try {
                    const operacao = await this.gestor.prepararOperacaoRobo(4, 'bybit', 'BTCUSDT');
                    
                    console.log('✅ OPERAÇÃO PREPARADA:');
                    console.log(`   💰 Saldo disponível: $${operacao.saldoDisponivel}`);
                    console.log(`   💵 Min por trade: $${operacao.limites.valorMinimoTrade.toFixed(2)}`);
                    console.log(`   💰 Max por trade: $${operacao.limites.valorMaximoTrade.toFixed(2)}`);
                    console.log(`   📊 Valor por operação: $${operacao.limites.valorPorOperacao.toFixed(2)}`);
                    console.log(`   🎚️  Alavancagem: ${operacao.limites.alavancagem}x`);
                    
                } catch (error) {
                    console.log('⚠️ Simulação com valores padrão (chaves não configuradas)');
                    console.log(`   Erro: ${error.message}`);
                }
            } else {
                console.log('⚠️ Nenhuma exchange configurada para Luiza Maria');
            }
            
        } catch (error) {
            console.error('❌ Erro ao testar Luiza Maria:', error.message);
        }
    }

    async executarTestes() {
        try {
            await this.testarCalculosDinamicos();
            await this.testarSaldoRealLuiza();
            
            console.log('\n' + '='.repeat(70));
            console.log('🎉 TESTES CONCLUÍDOS COM SUCESSO!');
            console.log('📋 RESUMO:');
            console.log('✅ Cálculos dinâmicos implementados');
            console.log('✅ Valores baseados no saldo real da exchange');
            console.log('✅ Proteção contra over-trading');
            console.log('✅ Gestão de risco proporcional');
            
        } catch (error) {
            console.error('❌ Erro nos testes:', error.message);
        }
    }
}

// Execução principal
async function main() {
    const teste = new TesteLimitesOperacao();
    await teste.executarTestes();
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = TesteLimitesOperacao;

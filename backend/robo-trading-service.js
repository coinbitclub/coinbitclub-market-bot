/**
 * 🤖 MÓDULO DO ROBÔ - INTEGRAÇÃO COM BANCO DE DADOS
 * Sistema para o robô buscar chaves e executar operações
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes.js');

class RoboTradingService {
    constructor() {
        this.gestor = new GestorChavesAPI();
        this.operacoesAtivas = new Map(); // Cache de operações ativas
    }

    /**
     * 🔑 Buscar chaves de API do usuário para uma exchange específica
     */
    async obterChavesUsuario(userId, exchangeName) {
        console.log(`🔑 Robô buscando chaves - Usuário: ${userId}, Exchange: ${exchangeName}`);
        
        try {
            const chaves = await this.gestor.obterChavesParaTrading(userId, exchangeName);
            
            console.log(`✅ Chaves obtidas - Fonte: ${chaves.source}`);
            console.log(`   🧪 Testnet: ${chaves.testnet}`);
            console.log(`   📅 Última validação: ${chaves.lastValidated}`);
            
            return chaves;
            
        } catch (error) {
            console.error(`❌ Erro ao obter chaves: ${error.message}`);
            throw new Error(`Falha ao obter chaves para ${exchangeName}: ${error.message}`);
        }
    }

    /**
     * 📊 Preparar operação completa para um usuário
     */
    async prepararOperacao(userId, exchangeName, simbolo, sinalTrading) {
        console.log(`🤖 Preparando operação - Usuário: ${userId}, ${exchangeName}, ${simbolo}`);
        
        try {
            // Obter dados completos para trading
            const dadosOperacao = await this.gestor.prepararOperacaoRobo(userId, exchangeName, simbolo);
            
            // Adicionar dados do sinal
            dadosOperacao.sinal = sinalTrading;
            dadosOperacao.dadosCalculados = this.calcularParametrosOperacao(dadosOperacao, sinalTrading);
            
            console.log(`✅ Operação preparada:`);
            console.log(`   💰 Valor: $${dadosOperacao.dadosCalculados.valorOperacao}`);
            console.log(`   📈 Alavancagem: ${dadosOperacao.dadosCalculados.alavancagem}x`);
            console.log(`   🎯 Take Profit: $${dadosOperacao.dadosCalculados.takeProfit}`);
            console.log(`   🛡️  Stop Loss: $${dadosOperacao.dadosCalculados.stopLoss}`);
            
            return dadosOperacao;
            
        } catch (error) {
            console.error(`❌ Erro ao preparar operação: ${error.message}`);
            throw error;
        }
    }

    /**
     * 📈 Calcular parâmetros da operação baseado no sinal e limites do usuário
     */
    calcularParametrosOperacao(dadosOperacao, sinal) {
        const limites = dadosOperacao.limites;
        const precoEntrada = parseFloat(sinal.price || sinal.entryPrice || 0);
        
        // Calcular valor da operação baseado no percentual do saldo
        const saldoTotal = this.obterSaldoTotal(dadosOperacao.chaves.source);
        const valorOperacao = (saldoTotal * limites.percentualSaldo) / 100;
        
        // Limitar valor da operação
        const valorFinal = Math.min(
            Math.max(valorOperacao, limites.valorMinimoTrade),
            limites.valorMaximoTrade
        );
        
        // Calcular take profit e stop loss
        const multiplicadorTP = limites.takeProfitMultiplier;
        const multiplicadorSL = limites.stopLossMultiplier;
        
        const takeProfit = sinal.direction === 'LONG' 
            ? precoEntrada * (1 + (multiplicadorTP / limites.alavancagem / 100))
            : precoEntrada * (1 - (multiplicadorTP / limites.alavancagem / 100));
            
        const stopLoss = sinal.direction === 'LONG'
            ? precoEntrada * (1 - (multiplicadorSL / limites.alavancagem / 100))
            : precoEntrada * (1 + (multiplicadorSL / limites.alavancagem / 100));
        
        return {
            valorOperacao: valorFinal,
            quantidade: valorFinal / precoEntrada,
            alavancagem: limites.alavancagem,
            precoEntrada: precoEntrada,
            takeProfit: takeProfit,
            stopLoss: stopLoss,
            direcao: sinal.direction,
            confianca: sinal.confidence || 0.8
        };
    }

    /**
     * 💰 Obter saldo total estimado (mock para exemplo)
     */
    obterSaldoTotal(source) {
        // Em produção, isso viria do saldo real das exchanges
        if (source === 'USER_DATABASE') {
            return 1000; // Saldo do usuário
        } else {
            return 5000; // Saldo do sistema Railway
        }
    }

    /**
     * 🚀 Executar operação na exchange (mock)
     */
    async executarOperacao(dadosOperacao) {
        console.log(`🚀 Executando operação na ${dadosOperacao.exchange.toUpperCase()}`);
        
        try {
            const chaves = dadosOperacao.chaves;
            const calc = dadosOperacao.dadosCalculados;
            
            // Simular execução da operação
            const operacao = {
                id: Date.now(),
                userId: dadosOperacao.usuario.id,
                exchange: dadosOperacao.exchange,
                simbolo: dadosOperacao.simbolo,
                tipo: calc.direcao,
                quantidade: calc.quantidade,
                precoEntrada: calc.precoEntrada,
                alavancagem: calc.alavancagem,
                takeProfit: calc.takeProfit,
                stopLoss: calc.stopLoss,
                status: 'EXECUTADA',
                timestamp: new Date(),
                apiSource: chaves.source
            };
            
            // Registrar no banco de dados
            await this.registrarOperacaoNoBanco(operacao);
            
            // Adicionar ao cache de operações ativas
            this.operacoesAtivas.set(operacao.id, operacao);
            
            console.log(`✅ Operação executada com sucesso - ID: ${operacao.id}`);
            console.log(`   📊 ${calc.direcao} ${calc.quantidade} ${dadosOperacao.simbolo}`);
            console.log(`   💰 Valor: $${calc.valorOperacao}`);
            console.log(`   📈 Alavancagem: ${calc.alavancagem}x`);
            
            return operacao;
            
        } catch (error) {
            console.error(`❌ Erro ao executar operação: ${error.message}`);
            throw error;
        }
    }

    /**
     * 📝 Registrar operação no banco de dados
     */
    async registrarOperacaoNoBanco(operacao) {
        try {
            // Usar método do gestor para registrar
            const operacaoCompleta = {
                simbolo: operacao.simbolo,
                tipo: operacao.tipo,
                quantidade: operacao.quantidade,
                alavancagem: operacao.alavancagem,
                precoEntrada: operacao.precoEntrada,
                takeProfit: operacao.takeProfit,
                stopLoss: operacao.stopLoss,
                parametrizacoes: {}, // Será preenchido pelo gestor
                apiSource: operacao.apiSource
            };
            
            const id = await this.gestor.registrarOperacaoRobo(
                operacao.userId,
                operacao.exchange,
                operacaoCompleta
            );
            
            console.log(`📝 Operação registrada no banco - ID: ${id}`);
            return id;
            
        } catch (error) {
            console.error(`❌ Erro ao registrar no banco: ${error.message}`);
            // Não quebrar a operação por erro de banco
            return null;
        }
    }

    /**
     * 📋 Processar sinal do TradingView
     */
    async processarSinalTradingView(sinal) {
        console.log(`📡 Processando sinal do TradingView: ${sinal.symbol} ${sinal.direction}`);
        
        try {
            // Obter lista de usuários ativos
            const usuariosAtivos = await this.obterUsuariosAtivos();
            
            const resultados = [];
            
            for (const usuario of usuariosAtivos) {
                try {
                    console.log(`👤 Processando usuário: ${usuario.username} (ID: ${usuario.id})`);
                    
                    // Verificar se usuário tem a exchange configurada
                    const exchanges = await this.obterExchangesDoUsuario(usuario.id);
                    
                    for (const exchange of exchanges) {
                        try {
                            // Preparar operação
                            const dadosOperacao = await this.prepararOperacao(
                                usuario.id,
                                exchange,
                                sinal.symbol,
                                sinal
                            );
                            
                            // Executar operação
                            const operacao = await this.executarOperacao(dadosOperacao);
                            
                            resultados.push({
                                usuario: usuario.username,
                                exchange: exchange,
                                operacao: operacao,
                                sucesso: true
                            });
                            
                        } catch (error) {
                            console.log(`⚠️  Erro para ${usuario.username} na ${exchange}: ${error.message}`);
                            resultados.push({
                                usuario: usuario.username,
                                exchange: exchange,
                                erro: error.message,
                                sucesso: false
                            });
                        }
                    }
                    
                } catch (error) {
                    console.log(`⚠️  Erro para usuário ${usuario.username}: ${error.message}`);
                }
            }
            
            console.log(`✅ Sinal processado para ${resultados.length} operações`);
            return resultados;
            
        } catch (error) {
            console.error(`❌ Erro ao processar sinal: ${error.message}`);
            throw error;
        }
    }

    /**
     * 👥 Obter usuários ativos do sistema
     */
    async obterUsuariosAtivos() {
        try {
            const relatorio = await this.gestor.gerarRelatorioUsuarios();
            return relatorio.filter(u => u.status === 'active' && u.exchanges_configuradas > 0);
        } catch (error) {
            console.log('⚠️  Usando usuários mock para teste');
            return [
                { id: 1, username: 'Mauro', status: 'active' },
                { id: 2, username: 'Luiza Maria', status: 'active' }
            ];
        }
    }

    /**
     * 🏪 Obter exchanges configuradas para um usuário
     */
    async obterExchangesDoUsuario(userId) {
        try {
            const dados = await this.gestor.obterDadosUsuarioParaTrading(userId);
            return dados.exchangesConfiguradas;
        } catch (error) {
            console.log(`⚠️  Erro ao obter exchanges do usuário ${userId}: ${error.message}`);
            return ['binance', 'bybit']; // Fallback
        }
    }

    /**
     * 📊 Relatório das operações ativas
     */
    relatorioOperacoesAtivas() {
        console.log('📊 OPERAÇÕES ATIVAS:');
        console.log('===================');
        
        if (this.operacoesAtivas.size === 0) {
            console.log('Nenhuma operação ativa no momento');
            return;
        }
        
        this.operacoesAtivas.forEach((operacao, id) => {
            console.log(`🆔 ${id}: ${operacao.tipo} ${operacao.simbolo} (${operacao.exchange})`);
            console.log(`   👤 Usuário: ${operacao.userId}`);
            console.log(`   💰 Quantidade: ${operacao.quantidade}`);
            console.log(`   📈 Preço: $${operacao.precoEntrada}`);
            console.log(`   🌐 Fonte: ${operacao.apiSource}`);
            console.log('');
        });
    }
}

module.exports = RoboTradingService;

/**
 * 📊 SIMULADOR DE DADOS DINÂMICOS - OPERAÇÕES EM TEMPO REAL
 * Sistema para simular operações ativas quando o banco não está disponível
 */

class OperationsSimulator {
    constructor() {
        this.simulationData = {
            operacoesAbertas: 0,
            operacoesFechadas: 0,
            operacoesLucrativas: 0,
            operacoesPrejuizo: 0,
            taxaSucessoReal: 0,
            volumeTotal: 0,
            pnlTotal: 0,
            ultimaAtualizacao: new Date()
        };

        this.operacoesAbertas = [];
        this.historicoOperacoes = [];

        // Iniciar simulação
        this.iniciarSimulacao();
    }

    iniciarSimulacao() {
        console.log('🎮 INICIANDO SIMULADOR DE DADOS DINÂMICOS');
        
        // Gerar algumas operações iniciais
        this.gerarOperacoesIniciais();
        
        // Atualizar dados a cada 5 segundos
        setInterval(() => {
            this.atualizarDados();
        }, 5000);

        // Simular novas operações ocasionalmente
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance a cada 15s
                this.simularNovaOperacao();
            }
        }, 15000);

        // Fechar operações ocasionalmente
        setInterval(() => {
            if (this.operacoesAbertas.length > 0 && Math.random() > 0.6) { // 40% chance
                this.fecharOperacaoAleatoria();
            }
        }, 12000);
    }

    gerarOperacoesIniciais() {
        // Gerar 3-7 operações em andamento
        const numOperacoes = Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < numOperacoes; i++) {
            this.criarOperacaoSimulada(true);
        }

        // Gerar histórico de 15-25 operações fechadas
        const numHistorico = Math.floor(Math.random() * 11) + 15;
        
        for (let i = 0; i < numHistorico; i++) {
            const operacao = this.criarOperacaoSimulada(false);
            operacao.fechada_em = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Última semana
            operacao.pnl = (Math.random() - 0.3) * 500; // 70% chance de lucro
            operacao.status = operacao.pnl > 0 ? 'LUCRO' : 'PREJUIZO';
            this.historicoOperacoes.push(operacao);
        }

        this.calcularMetricas();
    }

    criarOperacaoSimulada(aberta = true) {
        const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'LINKUSDT'];
        const types = ['LONG', 'SHORT'];
        const now = new Date();
        
        const operacao = {
            id: Date.now() + Math.random(),
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
            tipo: types[Math.floor(Math.random() * types.length)],
            quantidade: (Math.random() * 10 + 0.1).toFixed(4),
            preco_entrada: (Math.random() * 100000 + 20000).toFixed(2),
            aberta_em: new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000), // Últimas 2 horas
            status: aberta ? 'ABERTA' : 'FECHADA',
            pnl_atual: aberta ? (Math.random() - 0.5) * 200 : 0,
            usuario_id: Math.floor(Math.random() * 5) + 1
        };

        if (aberta) {
            this.operacoesAbertas.push(operacao);
        }

        return operacao;
    }

    atualizarDados() {
        // Atualizar PnL das operações abertas
        this.operacoesAbertas.forEach(operacao => {
            // Simular mudança de preço (-5% a +5%)
            const mudanca = (Math.random() - 0.5) * 0.1;
            operacao.pnl_atual += mudanca * 50;
            operacao.pnl_atual = Math.round(operacao.pnl_atual * 100) / 100;
        });

        this.calcularMetricas();
        this.simulationData.ultimaAtualizacao = new Date();
    }

    simularNovaOperacao() {
        const novaOperacao = this.criarOperacaoSimulada(true);
        console.log(`🆕 Nova operação simulada: ${novaOperacao.symbol} ${novaOperacao.tipo}`);
    }

    fecharOperacaoAleatoria() {
        if (this.operacoesAbertas.length === 0) return;

        const index = Math.floor(Math.random() * this.operacoesAbertas.length);
        const operacao = this.operacoesAbertas.splice(index, 1)[0];
        
        operacao.fechada_em = new Date();
        operacao.pnl = operacao.pnl_atual;
        operacao.status = operacao.pnl > 0 ? 'LUCRO' : 'PREJUIZO';
        
        this.historicoOperacoes.unshift(operacao); // Adicionar no início
        
        // Manter apenas as últimas 50 operações no histórico
        if (this.historicoOperacoes.length > 50) {
            this.historicoOperacoes = this.historicoOperacoes.slice(0, 50);
        }

        console.log(`✅ Operação fechada: ${operacao.symbol} ${operacao.tipo} - PnL: $${operacao.pnl.toFixed(2)}`);
        
        this.calcularMetricas();
    }

    calcularMetricas() {
        // Métricas hoje (últimas 24h)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const operacoesHoje = this.historicoOperacoes.filter(op => 
            op.fechada_em && new Date(op.fechada_em) >= hoje
        );

        const operacoesHojeAbertas = this.operacoesAbertas.filter(op =>
            new Date(op.aberta_em) >= hoje
        ).length;

        const operacoesHojeFechadas = operacoesHoje.length;
        const operacoesHojeLucrativas = operacoesHoje.filter(op => op.pnl > 0).length;
        
        const taxaSucessoHoje = operacoesHojeFechadas > 0 ? 
            (operacoesHojeLucrativas / operacoesHojeFechadas) * 100 : 0;

        // Métricas históricas
        const totalOperacoes = this.historicoOperacoes.length;
        const totalLucrativas = this.historicoOperacoes.filter(op => op.pnl > 0).length;
        const taxaSucessoTotal = totalOperacoes > 0 ? 
            (totalLucrativas / totalOperacoes) * 100 : 0;

        // Calcular PnL total
        const pnlTotal = this.historicoOperacoes.reduce((sum, op) => sum + (op.pnl || 0), 0);
        const pnlAbertas = this.operacoesAbertas.reduce((sum, op) => sum + (op.pnl_atual || 0), 0);

        this.simulationData = {
            operacoesAbertas: this.operacoesAbertas.length,
            operacoesFechadas: totalOperacoes,
            operacoesLucrativas: totalLucrativas,
            operacoesPrejuizo: totalOperacoes - totalLucrativas,
            taxaSucessoReal: taxaSucessoTotal,
            volumeTotal: totalOperacoes + this.operacoesAbertas.length,
            pnlTotal: pnlTotal + pnlAbertas,
            ultimaAtualizacao: new Date(),
            hoje: {
                operacoesAbertas: operacoesHojeAbertas,
                operacoesFechadas: operacoesHojeFechadas,
                taxaSucesso: taxaSucessoHoje
            }
        };
    }

    obterClassificacao(taxaSucesso) {
        if (taxaSucesso >= 80) {
            return { nivel: 'EXCELENTE', cor: '#4caf50', emoji: '🚀' };
        } else if (taxaSucesso >= 60) {
            return { nivel: 'BOM', cor: '#2196f3', emoji: '👍' };
        } else if (taxaSucesso >= 40) {
            return { nivel: 'REGULAR', cor: '#ff9800', emoji: '⚠️' };
        } else {
            return { nivel: 'RUIM', cor: '#f44336', emoji: '🔴' };
        }
    }

    async obterMetricasResumo() {
        const dados = this.simulationData;
        
        return {
            hoje: {
                operacoesAbertas: dados.hoje.operacoesAbertas,
                operacoesFechadas: dados.hoje.operacoesFechadas,
                taxaSucesso: Math.round(dados.hoje.taxaSucesso * 100) / 100,
                classificacao: this.obterClassificacao(dados.hoje.taxaSucesso)
            },
            historico: {
                totalOperacoes: dados.volumeTotal,
                taxaSucesso: Math.round(dados.taxaSucessoReal * 100) / 100,
                pnlTotal: Math.round(dados.pnlTotal * 100) / 100,
                classificacao: this.obterClassificacao(dados.taxaSucessoReal)
            },
            tempo_real: {
                operacoes_abertas: dados.operacoesAbertas,
                pnl_unrealized: Math.round(this.operacoesAbertas.reduce((sum, op) => sum + (op.pnl_atual || 0), 0) * 100) / 100,
                ultima_atualizacao: dados.ultimaAtualizacao
            }
        };
    }

    async obterOperacoesAbertas() {
        return this.operacoesAbertas.map(op => ({
            id: op.id,
            symbol: op.symbol,
            tipo: op.tipo,
            quantidade: op.quantidade,
            preco_entrada: op.preco_entrada,
            aberta_em: op.aberta_em,
            pnl_atual: Math.round(op.pnl_atual * 100) / 100,
            status: op.status,
            tempo_decorrido: this.calcularTempoDecorrido(op.aberta_em)
        }));
    }

    async obterHistoricoOperacoes() {
        return this.historicoOperacoes.slice(0, 30).map(op => ({
            id: op.id,
            symbol: op.symbol,
            tipo: op.tipo,
            quantidade: op.quantidade,
            preco_entrada: op.preco_entrada,
            aberta_em: op.aberta_em,
            fechada_em: op.fechada_em,
            pnl: Math.round(op.pnl * 100) / 100,
            status: op.status,
            duracao: this.calcularDuracao(op.aberta_em, op.fechada_em)
        }));
    }

    calcularTempoDecorrido(inicio) {
        const agora = new Date();
        const diff = agora - new Date(inicio);
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${horas}h ${minutos}m`;
    }

    calcularDuracao(inicio, fim) {
        const diff = new Date(fim) - new Date(inicio);
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${horas}h ${minutos}m`;
    }
}

module.exports = OperationsSimulator;

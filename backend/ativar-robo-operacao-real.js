/**
 * 🚀 ATIVADOR DO ROBÔ PARA OPERAÇÃO REAL
 * Script final para colocar o sistema em produção
 */

const AlimentadorRobusto = require('./alimentador-robusto-informacoes');
const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');
const { executarLimpezaCompleta } = require('./limpeza-dados-teste-completa');

console.log('🚀 ATIVANDO ROBÔ PARA OPERAÇÃO REAL');
console.log('==================================');
console.log('📅 Data:', new Date().toLocaleDateString('pt-BR'));
console.log('⏰ Hora:', new Date().toLocaleTimeString('pt-BR'));
console.log('');

class AtivadorRobo {
    constructor() {
        this.alimentador = new AlimentadorRobusto();
        this.gestorChaves = new GestorChavesAPI();
        this.statusExecucao = {
            etapas_concluidas: [],
            erros: [],
            inicio: new Date(),
            usuarios_configurados: 0,
            chaves_validadas: 0
        };
    }

    async log(nivel, mensagem, dados = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${nivel.toUpperCase()}: ${mensagem}`);
        
        if (dados) {
            console.log('   Dados:', JSON.stringify(dados, null, 2));
        }
    }

    // ========================================
    // 1. PREPARAÇÃO DO AMBIENTE
    // ========================================

    async prepararAmbiente() {
        await this.log('info', '🧹 ETAPA 1: Preparando ambiente');

        try {
            // Limpar dados de teste
            await this.log('info', 'Executando limpeza de dados de teste...');
            await executarLimpezaCompleta();
            this.statusExecucao.etapas_concluidas.push('limpeza_dados');

            // Validar conexões
            await this.log('info', 'Validando conexões do sistema...');
            await this.validarConexoes();
            this.statusExecucao.etapas_concluidas.push('validacao_conexoes');

            await this.log('info', '✅ Ambiente preparado com sucesso');

        } catch (error) {
            await this.log('error', 'Erro na preparação do ambiente', { erro: error.message });
            this.statusExecucao.erros.push(`preparacao_ambiente: ${error.message}`);
            throw error;
        }
    }

    async validarConexoes() {
        // Validar conexão com banco de dados
        try {
            const client = await this.gestorChaves.pool.connect();
            await client.query('SELECT 1');
            client.release();
            await this.log('info', '✅ Conexão com banco de dados OK');
        } catch (error) {
            throw new Error(`Erro na conexão com banco: ${error.message}`);
        }

        // Validar estrutura de diretórios
        const fs = require('fs');
        const diretorios = ['src/exchanges', 'src/services', 'src/trading'];
        
        for (const dir of diretorios) {
            if (!fs.existsSync(dir)) {
                throw new Error(`Diretório ausente: ${dir}`);
            }
        }
        await this.log('info', '✅ Estrutura de diretórios OK');
    }

    // ========================================
    // 2. CONFIGURAÇÃO DE USUÁRIOS
    // ========================================

    async configurarUsuarios() {
        await this.log('info', '👥 ETAPA 2: Configurando usuários');

        try {
            // Buscar usuários ativos que precisam de configuração
            const relatorio = await this.gestorChaves.gerarRelatorioUsuarios();
            await this.log('info', `Encontrados ${relatorio.length} usuários para configuração`);

            for (const usuario of relatorio) {
                await this.processarUsuario(usuario);
            }

            this.statusExecucao.etapas_concluidas.push('configuracao_usuarios');
            await this.log('info', `✅ ${this.statusExecucao.usuarios_configurados} usuários configurados`);

        } catch (error) {
            await this.log('error', 'Erro na configuração de usuários', { erro: error.message });
            this.statusExecucao.erros.push(`configuracao_usuarios: ${error.message}`);
            throw error;
        }
    }

    async processarUsuario(usuario) {
        try {
            await this.log('info', `Processando usuário: ${usuario.email}`);

            // Aplicar parametrizações padrão se não tiver
            if (usuario.tem_parametrizacoes === 'Não') {
                await this.gestorChaves.aplicarParametrizacoesPadrao(usuario.id);
                await this.log('info', `Parametrizações aplicadas para ${usuario.email}`);
            }

            // Validar chaves API se tiver
            if (usuario.exchanges_configuradas > 0) {
                const dadosCompletos = await this.gestorChaves.obterDadosUsuarioParaTrading(usuario.id);
                
                for (const chave of dadosCompletos.chaves) {
                    const validacao = await this.gestorChaves.validarChavesAPI(
                        chave.api_key, 
                        chave.api_secret, 
                        chave.exchange_name, 
                        chave.testnet
                    );

                    if (validacao.valida) {
                        this.statusExecucao.chaves_validadas++;
                        await this.log('info', `Chave ${chave.exchange_name} validada para ${usuario.email}`);
                    } else {
                        await this.log('warning', `Chave ${chave.exchange_name} inválida para ${usuario.email}`, {
                            erro: validacao.erro
                        });
                    }
                }
            }

            this.statusExecucao.usuarios_configurados++;

        } catch (error) {
            await this.log('error', `Erro ao processar usuário ${usuario.email}`, { erro: error.message });
            this.statusExecucao.erros.push(`usuario_${usuario.id}: ${error.message}`);
        }
    }

    // ========================================
    // 3. ALIMENTAÇÃO INICIAL DE DADOS
    // ========================================

    async alimentarDadosIniciais() {
        await this.log('info', '📊 ETAPA 3: Alimentando dados iniciais');

        try {
            // Executar alimentação robusta completa
            const resultado = await this.alimentador.executarAlimentacaoCompleta();
            
            await this.log('info', 'Alimentação de dados concluída', {
                tempo_execucao: resultado.tempoExecucao,
                total_operacoes: resultado.totalOperacoes
            });

            this.statusExecucao.etapas_concluidas.push('alimentacao_dados');

        } catch (error) {
            await this.log('error', 'Erro na alimentação de dados', { erro: error.message });
            this.statusExecucao.erros.push(`alimentacao_dados: ${error.message}`);
            throw error;
        }
    }

    // ========================================
    // 4. ATIVAÇÃO DO SISTEMA DE TRADING
    // ========================================

    async ativarSistemaTrading() {
        await this.log('info', '⚡ ETAPA 4: Ativando sistema de trading');

        try {
            // Verificar se o servidor está rodando
            const axios = require('axios');
            try {
                const response = await axios.get('http://localhost:8080/api/health', { timeout: 5000 });
                await this.log('info', '✅ Servidor backend está rodando');
            } catch (error) {
                throw new Error('Servidor backend não está rodando. Execute: node api-gateway/server.cjs');
            }

            // Testar endpoints de trading
            await this.testarEndpointsTrading();

            // Ativar alimentação contínua
            this.alimentador.iniciarAlimentacaoContinua();
            await this.log('info', '✅ Alimentação contínua ativada');

            this.statusExecucao.etapas_concluidas.push('ativacao_trading');

        } catch (error) {
            await this.log('error', 'Erro na ativação do sistema de trading', { erro: error.message });
            this.statusExecucao.erros.push(`ativacao_trading: ${error.message}`);
            throw error;
        }
    }

    async testarEndpointsTrading() {
        const axios = require('axios');
        const baseURL = 'http://localhost:8080';

        const testes = [
            { method: 'GET', url: '/api/trading/dashboard', expect: 401 },
            { method: 'GET', url: '/api/trading/exchanges/status', expect: 401 },
            { method: 'POST', url: '/api/trading/signal', expect: 200, data: { symbol: 'BTCUSDT', action: 'BUY' } }
        ];

        for (const teste of testes) {
            try {
                const config = {
                    method: teste.method.toLowerCase(),
                    url: `${baseURL}${teste.url}`,
                    timeout: 5000,
                    validateStatus: () => true // Aceitar qualquer status
                };

                if (teste.data) {
                    config.data = teste.data;
                }

                const response = await axios(config);
                
                if (response.status === teste.expect) {
                    await this.log('info', `✅ Endpoint ${teste.url} respondendo corretamente (${response.status})`);
                } else {
                    await this.log('warning', `⚠️ Endpoint ${teste.url} resposta inesperada`, {
                        esperado: teste.expect,
                        recebido: response.status
                    });
                }
            } catch (error) {
                throw new Error(`Endpoint ${teste.url} falhou: ${error.message}`);
            }
        }
    }

    // ========================================
    // 5. MONITORAMENTO E RELATÓRIO FINAL
    // ========================================

    async gerarRelatorioFinal() {
        await this.log('info', '📋 ETAPA 5: Gerando relatório final');

        const tempoTotal = Date.now() - this.statusExecucao.inicio.getTime();
        const porcentagemSucesso = (this.statusExecucao.etapas_concluidas.length / 5) * 100;

        const relatorio = {
            sucesso: this.statusExecucao.erros.length === 0,
            tempo_total_ms: tempoTotal,
            tempo_total_formato: this.formatarTempo(tempoTotal),
            porcentagem_sucesso: porcentagemSucesso,
            etapas_concluidas: this.statusExecucao.etapas_concluidas,
            usuarios_configurados: this.statusExecucao.usuarios_configurados,
            chaves_validadas: this.statusExecucao.chaves_validadas,
            erros: this.statusExecucao.erros,
            status_final: this.statusExecucao.erros.length === 0 ? 'OPERACIONAL' : 'COM_PROBLEMAS'
        };

        console.log('\n🎯 RELATÓRIO FINAL DE ATIVAÇÃO');
        console.log('==============================');
        console.log(`✅ Sucesso: ${relatorio.sucesso ? 'SIM' : 'NÃO'}`);
        console.log(`⏱️ Tempo total: ${relatorio.tempo_total_formato}`);
        console.log(`📊 Porcentagem de sucesso: ${relatorio.porcentagem_sucesso.toFixed(1)}%`);
        console.log(`👥 Usuários configurados: ${relatorio.usuarios_configurados}`);
        console.log(`🔐 Chaves validadas: ${relatorio.chaves_validadas}`);
        console.log(`🚀 Status final: ${relatorio.status_final}`);

        if (relatorio.erros.length > 0) {
            console.log('\n❌ Erros encontrados:');
            relatorio.erros.forEach((erro, index) => {
                console.log(`   ${index + 1}. ${erro}`);
            });
        }

        if (relatorio.sucesso) {
            console.log('\n🎉 ROBÔ ATIVADO COM SUCESSO!');
            console.log('============================');
            console.log('✅ Sistema preparado para operação real');
            console.log('✅ Usuários configurados e validados');
            console.log('✅ Dados alimentados automaticamente');
            console.log('✅ Endpoints de trading operacionais');
            console.log('✅ Monitoramento contínuo ativo');
            console.log('');
            console.log('🚀 O robô está PRONTO para receber sinais do TradingView!');
            console.log('📡 Webhook: POST http://localhost:8080/api/trading/signal');
            console.log('');
            console.log('⚠️ LEMBRETE: Monitore as primeiras operações de perto!');
        }

        return relatorio;
    }

    formatarTempo(milliseconds) {
        const segundos = Math.floor(milliseconds / 1000);
        const minutos = Math.floor(segundos / 60);
        const seg = segundos % 60;
        
        if (minutos > 0) {
            return `${minutos}m ${seg}s`;
        }
        return `${seg}s`;
    }

    // ========================================
    // 6. EXECUÇÃO PRINCIPAL
    // ========================================

    async ativarRoboCompleto() {
        try {
            await this.log('info', '🚀 INICIANDO ATIVAÇÃO COMPLETA DO ROBÔ');

            // Etapa 1: Preparar ambiente
            await this.prepararAmbiente();

            // Etapa 2: Configurar usuários
            await this.configurarUsuarios();

            // Etapa 3: Alimentar dados iniciais
            await this.alimentarDadosIniciais();

            // Etapa 4: Ativar sistema de trading
            await this.ativarSistemaTrading();

            // Etapa 5: Gerar relatório final
            const relatorio = await this.gerarRelatorioFinal();

            return relatorio;

        } catch (error) {
            await this.log('error', '❌ FALHA NA ATIVAÇÃO DO ROBÔ', { erro: error.message });
            
            // Gerar relatório mesmo com erro
            const relatorioErro = await this.gerarRelatorioFinal();
            throw { error, relatorio: relatorioErro };
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const ativador = new AtivadorRobo();
    
    ativador.ativarRoboCompleto()
        .then(relatorio => {
            console.log('\n✅ Ativação concluída com sucesso!');
            process.exit(0);
        })
        .catch(({ error, relatorio }) => {
            console.error('\n❌ Erro na ativação:', error.message);
            console.log('Relatório parcial:', relatorio);
            process.exit(1);
        });
}

module.exports = AtivadorRobo;

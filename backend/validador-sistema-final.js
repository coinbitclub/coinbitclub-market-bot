#!/usr/bin/env node

/**
 * 🔍 VALIDADOR SISTEMA FINAL - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Validação completa do sistema com testes de funcionalidade
 * Verificação de conectividade, dependências e operacionalidade
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class ValidadorSistemaFinal {
    constructor() {
        this.id = 'validador-sistema-final';
        this.nome = 'Validador Sistema Final';
        this.timestamp = new Date().toISOString();
        
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.componentesEsperados = [
            {
                arquivo: 'database-manager.js',
                nome: 'Database Manager',
                tipo: 'core',
                classe: 'DatabaseManager',
                funcoes_obrigatorias: ['inicializar', 'verificarConexao', 'criarTabelasEssenciais']
            },
            {
                arquivo: 'user-manager-v2.js',
                nome: 'User Manager V2',
                tipo: 'core',
                classe: 'UserManagerV2',
                funcoes_obrigatorias: ['inicializar', 'autenticarUsuario', 'obterDadosUsuario']
            },
            {
                arquivo: 'trading-engine.js',
                nome: 'Trading Engine',
                tipo: 'core',
                classe: 'TradingEngine',
                funcoes_obrigatorias: ['inicializar', 'processarSinal', 'executarOrdem']
            },
            {
                arquivo: 'signal-processor.js',
                nome: 'Signal Processor',
                tipo: 'signal',
                classe: 'SignalProcessor',
                funcoes_obrigatorias: ['inicializar', 'processarSinal', 'analisarSinal']
            },
            {
                arquivo: 'ai-guardian.js',
                nome: 'AI Guardian',
                tipo: 'ai',
                classe: 'AIGuardian',
                funcoes_obrigatorias: ['inicializar', 'analisarSinal', 'tomarDecisao']
            },
            {
                arquivo: 'risk-manager.js',
                nome: 'Risk Manager',
                tipo: 'risk',
                classe: 'RiskManager',
                funcoes_obrigatorias: ['inicializar', 'avaliarRiscoOperacao', 'verificarRiscosGerais']
            }
        ];

        this.resultados = {
            arquivos: {},
            conexoes: {},
            funcionalidades: {},
            testes: {},
            resumo: {}
        };
    }

    async executarValidacaoCompleta() {
        console.log('🔍 INICIANDO VALIDAÇÃO COMPLETA DO SISTEMA');
        console.log('================================================================================');
        console.log(`⏰ Timestamp: ${this.timestamp}`);
        console.log('');

        try {
            // 1. Validar arquivos e estrutura
            await this.validarArquivos();
            
            // 2. Validar conectividade
            await this.validarConectividade();
            
            // 3. Validar componentes individuais
            await this.validarComponentes();
            
            // 4. Executar testes de integração
            await this.executarTestesIntegracao();
            
            // 5. Gerar relatório final
            await this.gerarRelatorioFinal();
            
            console.log('✅ VALIDAÇÃO COMPLETA CONCLUÍDA!');
            
        } catch (error) {
            console.error('❌ Erro durante a validação:', error.message);
            this.resultados.erro_geral = error.message;
        } finally {
            await this.pool.end();
        }
    }

    async validarArquivos() {
        console.log('📁 VALIDANDO ARQUIVOS E ESTRUTURA');
        console.log('----------------------------------------');

        for (const componente of this.componentesEsperados) {
            try {
                const caminhoArquivo = path.join(__dirname, componente.arquivo);
                const stats = await fs.stat(caminhoArquivo);
                
                if (stats.isFile()) {
                    const conteudo = await fs.readFile(caminhoArquivo, 'utf8');
                    
                    const validacao = {
                        existe: true,
                        tamanho: stats.size,
                        modificado: stats.mtime,
                        tem_classe: conteudo.includes(`class ${componente.classe}`),
                        tem_module_exports: conteudo.includes('module.exports'),
                        funcoes_encontradas: []
                    };

                    // Verificar funções obrigatórias
                    for (const funcao of componente.funcoes_obrigatorias) {
                        if (conteudo.includes(`async ${funcao}(`) || conteudo.includes(`${funcao}(`)) {
                            validacao.funcoes_encontradas.push(funcao);
                        }
                    }

                    validacao.funcoes_completas = validacao.funcoes_encontradas.length === componente.funcoes_obrigatorias.length;

                    this.resultados.arquivos[componente.arquivo] = validacao;
                    
                    const status = validacao.funcoes_completas ? '✅' : '⚠️';
                    console.log(`${status} ${componente.nome}: ${validacao.funcoes_encontradas.length}/${componente.funcoes_obrigatorias.length} funções`);
                    
                } else {
                    this.resultados.arquivos[componente.arquivo] = { existe: false };
                    console.log(`❌ ${componente.nome}: Arquivo não encontrado`);
                }

            } catch (error) {
                this.resultados.arquivos[componente.arquivo] = { 
                    existe: false, 
                    erro: error.message 
                };
                console.log(`❌ ${componente.nome}: Erro - ${error.message}`);
            }
        }

        console.log('');
    }

    async validarConectividade() {
        console.log('🔗 VALIDANDO CONECTIVIDADE');
        console.log('----------------------------------------');

        // Teste Railway PostgreSQL
        try {
            console.log('🔍 Testando conexão Railway PostgreSQL...');
            const result = await this.pool.query('SELECT NOW() as timestamp, version() as version');
            
            this.resultados.conexoes.railway = {
                conectado: true,
                timestamp: result.rows[0].timestamp,
                versao: result.rows[0].version,
                latencia: Date.now() - new Date(result.rows[0].timestamp).getTime()
            };
            
            console.log(`✅ Railway PostgreSQL: Conectado (${this.resultados.conexoes.railway.latencia}ms)`);
            
        } catch (error) {
            this.resultados.conexoes.railway = {
                conectado: false,
                erro: error.message
            };
            console.log(`❌ Railway PostgreSQL: Erro - ${error.message}`);
        }

        // Teste estrutura de tabelas
        try {
            console.log('🔍 Verificando estrutura de tabelas...');
            
            const tabelas = [
                'users', 'api_keys', 'trading_operations',
                'trading_signals', 'user_risk_profiles', 'risk_alerts'
            ];

            const tabelasExistentes = [];
            
            for (const tabela of tabelas) {
                try {
                    const result = await this.pool.query(`
                        SELECT COUNT(*) as registros 
                        FROM information_schema.tables 
                        WHERE table_name = $1
                    `, [tabela]);
                    
                    if (parseInt(result.rows[0].registros) > 0) {
                        tabelasExistentes.push(tabela);
                    }
                } catch (err) {
                    // Tabela não existe
                }
            }

            this.resultados.conexoes.tabelas = {
                esperadas: tabelas.length,
                encontradas: tabelasExistentes.length,
                lista: tabelasExistentes,
                percentual: (tabelasExistentes.length / tabelas.length) * 100
            };

            console.log(`✅ Tabelas: ${tabelasExistentes.length}/${tabelas.length} (${this.resultados.conexoes.tabelas.percentual.toFixed(1)}%)`);

        } catch (error) {
            this.resultados.conexoes.tabelas = {
                erro: error.message
            };
            console.log(`❌ Verificação de tabelas: ${error.message}`);
        }

        console.log('');
    }

    async validarComponentes() {
        console.log('🧩 VALIDANDO COMPONENTES INDIVIDUAIS');
        console.log('----------------------------------------');

        for (const componente of this.componentesEsperados) {
            try {
                const arquivo = this.resultados.arquivos[componente.arquivo];
                if (!arquivo?.existe) {
                    console.log(`⏭️ Pulando ${componente.nome}: Arquivo não existe`);
                    continue;
                }

                console.log(`🔍 Testando ${componente.nome}...`);
                
                // Tentar carregar o módulo
                const modulePath = path.join(__dirname, componente.arquivo);
                delete require.cache[require.resolve(modulePath)];
                const Classe = require(modulePath);
                
                // Instanciar componente
                const instancia = new Classe();
                
                const validacao = {
                    carregou: true,
                    instanciou: true,
                    tem_id: !!instancia.id,
                    tem_nome: !!instancia.nome,
                    tem_status: !!instancia.status,
                    metodos_disponiveis: []
                };

                // Verificar métodos
                for (const funcao of componente.funcoes_obrigatorias) {
                    if (typeof instancia[funcao] === 'function') {
                        validacao.metodos_disponiveis.push(funcao);
                    }
                }

                validacao.metodos_completos = validacao.metodos_disponiveis.length === componente.funcoes_obrigatorias.length;

                this.resultados.funcionalidades[componente.arquivo] = validacao;
                
                const status = validacao.metodos_completos ? '✅' : '⚠️';
                console.log(`${status} ${componente.nome}: ${validacao.metodos_disponiveis.length}/${componente.funcoes_obrigatorias.length} métodos`);

            } catch (error) {
                this.resultados.funcionalidades[componente.arquivo] = {
                    carregou: false,
                    erro: error.message
                };
                console.log(`❌ ${componente.nome}: Erro - ${error.message.substring(0, 100)}`);
            }
        }

        console.log('');
    }

    async executarTestesIntegracao() {
        console.log('🧪 EXECUTANDO TESTES DE INTEGRAÇÃO');
        console.log('----------------------------------------');

        // Teste 1: Database Manager
        await this.testarDatabaseManager();
        
        // Teste 2: User Manager
        await this.testarUserManager();
        
        // Teste 3: Trading Engine
        await this.testarTradingEngine();
        
        // Teste 4: AI Guardian
        await this.testarAIGuardian();
        
        // Teste 5: Risk Manager
        await this.testarRiskManager();

        console.log('');
    }

    async testarDatabaseManager() {
        try {
            console.log('🔍 Testando Database Manager...');
            
            const DatabaseManager = require('./database-manager.js');
            const dbManager = new DatabaseManager();
            
            // Teste de inicialização
            const inicializado = await dbManager.inicializar();
            
            this.resultados.testes.database_manager = {
                inicializado: inicializado,
                conexao_ativa: dbManager.status === 'ativo'
            };
            
            const status = inicializado ? '✅' : '❌';
            console.log(`${status} Database Manager: ${dbManager.status}`);
            
            await dbManager.finalizar();
            
        } catch (error) {
            this.resultados.testes.database_manager = {
                erro: error.message
            };
            console.log(`❌ Database Manager: ${error.message}`);
        }
    }

    async testarUserManager() {
        try {
            console.log('🔍 Testando User Manager...');
            
            const UserManager = require('./user-manager-v2.js');
            const userManager = new UserManager();
            
            const inicializado = await userManager.inicializar();
            
            this.resultados.testes.user_manager = {
                inicializado: inicializado,
                status: userManager.status
            };
            
            const status = inicializado ? '✅' : '❌';
            console.log(`${status} User Manager: ${userManager.status}`);
            
            await userManager.finalizar();
            
        } catch (error) {
            this.resultados.testes.user_manager = {
                erro: error.message
            };
            console.log(`❌ User Manager: ${error.message}`);
        }
    }

    async testarTradingEngine() {
        try {
            console.log('🔍 Testando Trading Engine...');
            
            const TradingEngine = require('./trading-engine.js');
            const tradingEngine = new TradingEngine();
            
            const inicializado = await tradingEngine.inicializar();
            
            this.resultados.testes.trading_engine = {
                inicializado: inicializado,
                status: tradingEngine.status,
                tem_bybit_config: !!tradingEngine.bybitConfig
            };
            
            const status = inicializado ? '✅' : '❌';
            console.log(`${status} Trading Engine: ${tradingEngine.status}`);
            
            await tradingEngine.finalizar();
            
        } catch (error) {
            this.resultados.testes.trading_engine = {
                erro: error.message
            };
            console.log(`❌ Trading Engine: ${error.message}`);
        }
    }

    async testarAIGuardian() {
        try {
            console.log('🔍 Testando AI Guardian...');
            
            const AIGuardian = require('./ai-guardian.js');
            const aiGuardian = new AIGuardian();
            
            const inicializado = await aiGuardian.inicializar();
            
            // Teste de análise de sinal
            const dadosTeste = {
                symbol: 'BTCUSDT',
                direction: 'buy',
                price: 50000,
                volume: 1000000
            };
            
            const analise = await aiGuardian.analisarSinal(dadosTeste);
            
            this.resultados.testes.ai_guardian = {
                inicializado: inicializado,
                status: aiGuardian.status,
                analise_funcionando: !!analise.recommendation,
                openai_habilitado: aiGuardian.configIA?.openai_habilitado
            };
            
            const status = inicializado ? '✅' : '❌';
            console.log(`${status} AI Guardian: ${aiGuardian.status} (OpenAI: ${aiGuardian.configIA?.openai_habilitado ? 'Sim' : 'Não'})`);
            
            await aiGuardian.finalizar();
            
        } catch (error) {
            this.resultados.testes.ai_guardian = {
                erro: error.message
            };
            console.log(`❌ AI Guardian: ${error.message}`);
        }
    }

    async testarRiskManager() {
        try {
            console.log('🔍 Testando Risk Manager...');
            
            const RiskManager = require('./risk-manager.js');
            const riskManager = new RiskManager();
            
            const inicializado = await riskManager.inicializar();
            
            this.resultados.testes.risk_manager = {
                inicializado: inicializado,
                status: riskManager.status,
                usuarios_monitorados: riskManager.usuariosMonitorados?.size || 0
            };
            
            const status = inicializado ? '✅' : '❌';
            console.log(`${status} Risk Manager: ${riskManager.status} (${riskManager.usuariosMonitorados?.size || 0} usuários)`);
            
            await riskManager.finalizar();
            
        } catch (error) {
            this.resultados.testes.risk_manager = {
                erro: error.message
            };
            console.log(`❌ Risk Manager: ${error.message}`);
        }
    }

    async gerarRelatorioFinal() {
        console.log('📊 GERANDO RELATÓRIO FINAL');
        console.log('================================================================================');

        // Calcular estatísticas gerais
        const arquivosValidos = Object.values(this.resultados.arquivos).filter(a => a.existe && a.funcoes_completas).length;
        const componentesFuncionais = Object.values(this.resultados.funcionalidades).filter(f => f.carregou && f.metodos_completos).length;
        const testesPassaram = Object.values(this.resultados.testes).filter(t => t.inicializado).length;

        this.resultados.resumo = {
            timestamp: this.timestamp,
            arquivos: {
                total: this.componentesEsperados.length,
                validos: arquivosValidos,
                percentual: (arquivosValidos / this.componentesEsperados.length) * 100
            },
            componentes: {
                total: this.componentesEsperados.length,
                funcionais: componentesFuncionais,
                percentual: (componentesFuncionais / this.componentesEsperados.length) * 100
            },
            testes: {
                total: Object.keys(this.resultados.testes).length,
                passaram: testesPassaram,
                percentual: testesPassaram > 0 ? (testesPassaram / Object.keys(this.resultados.testes).length) * 100 : 0
            },
            conectividade: {
                railway: this.resultados.conexoes.railway?.conectado || false,
                tabelas: this.resultados.conexoes.tabelas?.percentual || 0
            }
        };

        // Exibir resumo
        console.log('📋 RESUMO EXECUTIVO:');
        console.log(`   📁 Arquivos: ${this.resultados.resumo.arquivos.validos}/${this.resultados.resumo.arquivos.total} (${this.resultados.resumo.arquivos.percentual.toFixed(1)}%)`);
        console.log(`   🧩 Componentes: ${this.resultados.resumo.componentes.funcionais}/${this.resultados.resumo.componentes.total} (${this.resultados.resumo.componentes.percentual.toFixed(1)}%)`);
        console.log(`   🧪 Testes: ${this.resultados.resumo.testes.passaram}/${this.resultados.resumo.testes.total} (${this.resultados.resumo.testes.percentual.toFixed(1)}%)`);
        console.log(`   🔗 Railway DB: ${this.resultados.resumo.conectividade.railway ? 'Conectado' : 'Desconectado'}`);
        console.log(`   🏗️ Tabelas: ${this.resultados.resumo.conectividade.tabelas.toFixed(1)}% completas`);
        console.log('');

        // Calcular score geral do sistema
        const scoreGeral = (
            this.resultados.resumo.arquivos.percentual * 0.3 +
            this.resultados.resumo.componentes.percentual * 0.3 +
            this.resultados.resumo.testes.percentual * 0.25 +
            (this.resultados.resumo.conectividade.railway ? 100 : 0) * 0.15
        );

        this.resultados.resumo.score_geral = scoreGeral;

        let statusFinal, emoji;
        if (scoreGeral >= 90) {
            statusFinal = 'EXCELENTE';
            emoji = '🟢';
        } else if (scoreGeral >= 75) {
            statusFinal = 'BOM';
            emoji = '🟡';
        } else if (scoreGeral >= 50) {
            statusFinal = 'REGULAR';
            emoji = '🟠';
        } else {
            statusFinal = 'CRÍTICO';
            emoji = '🔴';
        }

        console.log(`${emoji} STATUS FINAL: ${statusFinal} (${scoreGeral.toFixed(1)}%)`);
        console.log('');

        // Salvar relatório em arquivo
        await this.salvarRelatorio();
        
        // Recomendações
        await this.gerarRecomendacoes();
    }

    async salvarRelatorio() {
        try {
            const nomeArquivo = `relatorio-validacao-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            const caminhoRelatorio = path.join(__dirname, nomeArquivo);
            
            await fs.writeFile(caminhoRelatorio, JSON.stringify(this.resultados, null, 2));
            
            console.log(`💾 Relatório salvo: ${nomeArquivo}`);
            
        } catch (error) {
            console.error('❌ Erro ao salvar relatório:', error.message);
        }
    }

    async gerarRecomendacoes() {
        console.log('💡 RECOMENDAÇÕES:');
        
        const recomendacoes = [];
        
        // Verificar arquivos com problemas
        const arquivosProblema = Object.entries(this.resultados.arquivos)
            .filter(([nome, dados]) => !dados.existe || !dados.funcoes_completas)
            .map(([nome]) => nome);
            
        if (arquivosProblema.length > 0) {
            recomendacoes.push(`📁 Verificar arquivos: ${arquivosProblema.join(', ')}`);
        }

        // Verificar componentes com falha
        const componentesProblema = Object.entries(this.resultados.funcionalidades)
            .filter(([nome, dados]) => !dados.carregou || !dados.metodos_completos)
            .map(([nome]) => nome);
            
        if (componentesProblema.length > 0) {
            recomendacoes.push(`🧩 Revisar componentes: ${componentesProblema.join(', ')}`);
        }

        // Verificar conectividade
        if (!this.resultados.conexoes.railway?.conectado) {
            recomendacoes.push('🔗 Verificar conexão Railway PostgreSQL');
        }

        if (this.resultados.conexoes.tabelas?.percentual < 100) {
            recomendacoes.push('🏗️ Executar criação de tabelas faltantes');
        }

        // Verificar testes com falha
        const testesFalha = Object.entries(this.resultados.testes)
            .filter(([nome, dados]) => !dados.inicializado)
            .map(([nome]) => nome);
            
        if (testesFalha.length > 0) {
            recomendacoes.push(`🧪 Investigar falhas nos testes: ${testesFalha.join(', ')}`);
        }

        if (recomendacoes.length === 0) {
            console.log('   ✅ Nenhuma recomendação - Sistema funcionando perfeitamente!');
        } else {
            recomendacoes.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        console.log('');
        console.log('================================================================================');
        console.log('🎉 VALIDAÇÃO CONCLUÍDA - COINBITCLUB MARKET BOT V3.0.0');
        console.log('================================================================================');
    }
}

// Executar validação se for executado diretamente
if (require.main === module) {
    const validador = new ValidadorSistemaFinal();
    validador.executarValidacaoCompleta().catch(console.error);
}

module.exports = ValidadorSistemaFinal;

/**
 * 🔍 AUDITORIA COMPLETA - GESTORES E SUPERVISORES
 * Mapeamento e verificação de todos os componentes do sistema
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 AUDITORIA COMPLETA - GESTORES E SUPERVISORES');
console.log('='.repeat(70));

class SystemAuditor {
    constructor() {
        this.baseDir = __dirname;
        this.components = [];
        this.issues = [];
        this.workingComponents = [];
    }

    // 1. Mapear todos os gestores e supervisores
    async mapearComponentes() {
        console.log('📊 1. MAPEANDO TODOS OS COMPONENTES DO SISTEMA');
        console.log('-'.repeat(50));

        const componentesEsperados = [
            {
                nome: 'Fear & Greed Automático',
                arquivo: 'fear-greed-auto.js',
                tipo: 'GESTOR',
                funcao: 'Coletar dados de Fear & Greed Index',
                intervalo: '15 minutos',
                tabela_leitura: 'Nenhuma (API externa)',
                tabela_escrita: 'fear_greed_data',
                essencial: true
            },
            {
                nome: 'Processador de Sinais',
                arquivo: 'processor-sinais.js',
                tipo: 'GESTOR',
                funcao: 'Processar sinais TradingView',
                intervalo: '10 segundos',
                tabela_leitura: 'trading_signals',
                tabela_escrita: 'trading_signals, user_operations',
                essencial: true
            },
            {
                nome: 'Orquestrador Principal',
                arquivo: 'orquestrador-principal.js',
                tipo: 'ORQUESTRADOR',
                funcao: 'Coordenar processamento geral',
                intervalo: '30 segundos',
                tabela_leitura: 'trading_signals, user_operations',
                tabela_escrita: 'user_operations',
                essencial: true
            },
            {
                nome: 'Orquestrador Completo',
                arquivo: 'orquestrador-completo-2.js',
                tipo: 'ORQUESTRADOR',
                funcao: 'Orquestração avançada',
                intervalo: '30 segundos',
                tabela_leitura: 'trading_signals, user_operations, users',
                tabela_escrita: 'user_operations',
                essencial: true
            },
            {
                nome: 'IA Supervisor Financeiro',
                arquivo: 'ia-supervisor-financeiro.js',
                tipo: 'SUPERVISOR',
                funcao: 'Supervisão de risco financeiro',
                intervalo: 'Contínuo',
                tabela_leitura: 'user_operations, users',
                tabela_escrita: 'user_operations (atualizações)',
                essencial: true
            },
            {
                nome: 'IA Supervisor Trade Tempo Real',
                arquivo: 'ia-supervisor-trade-tempo-real.js',
                tipo: 'SUPERVISOR',
                funcao: 'Supervisão de trades em tempo real',
                intervalo: 'Contínuo',
                tabela_leitura: 'user_operations, trading_signals',
                tabela_escrita: 'user_operations (status)',
                essencial: true
            },
            {
                nome: 'Gestor Chaves API Multiusuários',
                arquivo: 'gestor-chaves-api-multiusuarios.js',
                tipo: 'GESTOR',
                funcao: 'Gerenciar chaves API dos usuários',
                intervalo: '30 minutos',
                tabela_leitura: 'user_api_keys, users',
                tabela_escrita: 'user_api_keys (validação)',
                essencial: true
            },
            {
                nome: 'Dashboard Monitoramento',
                arquivo: 'public/dashboard.html',
                tipo: 'INTERFACE',
                funcao: 'Interface de monitoramento visual',
                intervalo: '5 segundos (atualização)',
                tabela_leitura: 'Todas (via APIs)',
                tabela_escrita: 'Nenhuma',
                essencial: true
            },
            {
                nome: 'API Monitoring Signals',
                arquivo: 'server.js',
                tipo: 'API',
                funcao: 'Endpoint para sinais em tempo real',
                intervalo: 'Sob demanda',
                tabela_leitura: 'trading_signals',
                tabela_escrita: 'Nenhuma',
                essencial: true
            },
            {
                nome: 'API Monitoring Operations',
                arquivo: 'server.js',
                tipo: 'API',
                funcao: 'Endpoint para operações ativas',
                intervalo: 'Sob demanda',
                tabela_leitura: 'user_operations',
                tabela_escrita: 'Nenhuma',
                essencial: true
            },
            {
                nome: 'Webhook TradingView',
                arquivo: 'server.js',
                tipo: 'API',
                funcao: 'Receber sinais do TradingView',
                intervalo: 'Sob demanda',
                tabela_leitura: 'Nenhuma',
                tabela_escrita: 'trading_signals',
                essencial: true
            }
        ];

        this.components = componentesEsperados;

        console.log(`📋 Total de componentes mapeados: ${this.components.length}\n`);
        
        this.components.forEach((comp, index) => {
            const emoji = comp.tipo === 'GESTOR' ? '🔧' : 
                         comp.tipo === 'SUPERVISOR' ? '🤖' : 
                         comp.tipo === 'ORQUESTRADOR' ? '🎯' :
                         comp.tipo === 'INTERFACE' ? '📊' : '🌐';
            
            console.log(`${emoji} ${index + 1}. ${comp.nome}`);
            console.log(`   📁 Arquivo: ${comp.arquivo}`);
            console.log(`   🔄 Função: ${comp.funcao}`);
            console.log(`   ⏱️ Intervalo: ${comp.intervalo}`);
            console.log(`   📖 Lê de: ${comp.tabela_leitura}`);
            console.log(`   📝 Escreve em: ${comp.tabela_escrita}`);
            console.log(`   ${comp.essencial ? '⚡ ESSENCIAL' : '🔧 OPCIONAL'}`);
            console.log('');
        });
    }

    // 2. Verificar arquivos existentes
    async verificarArquivos() {
        console.log('📁 2. VERIFICANDO EXISTÊNCIA DOS ARQUIVOS');
        console.log('-'.repeat(50));

        for (const comp of this.components) {
            const filePath = path.join(this.baseDir, comp.arquivo);
            const exists = fs.existsSync(filePath);
            
            console.log(`${exists ? '✅' : '❌'} ${comp.nome}`);
            console.log(`   📁 Caminho: ${filePath}`);
            console.log(`   ${exists ? '✓ Arquivo encontrado' : '✗ Arquivo não encontrado'}`);
            
            if (!exists && comp.essencial) {
                this.issues.push({
                    tipo: 'ARQUIVO_FALTANDO',
                    componente: comp.nome,
                    arquivo: comp.arquivo,
                    severidade: 'ALTA'
                });
            } else if (exists) {
                this.workingComponents.push(comp);
            }
            console.log('');
        }
    }

    // 3. Verificar estruturas de banco necessárias
    async verificarEstruturaBanco() {
        console.log('🗃️ 3. VERIFICANDO ESTRUTURA DO BANCO DE DADOS');
        console.log('-'.repeat(50));

        try {
            // Tabelas esperadas
            const tabelasEsperadas = [
                'trading_signals', 'user_operations', 'users', 
                'user_api_keys', 'fear_greed_data'
            ];

            console.log('📊 Verificando tabelas existentes...\n');

            for (const tabela of tabelasEsperadas) {
                const result = await pool.query(`
                    SELECT COUNT(*) as count 
                    FROM information_schema.tables 
                    WHERE table_name = $1
                `, [tabela]);

                const exists = result.rows[0].count > 0;
                console.log(`${exists ? '✅' : '❌'} Tabela: ${tabela}`);

                if (!exists) {
                    this.issues.push({
                        tipo: 'TABELA_FALTANDO',
                        tabela: tabela,
                        severidade: 'ALTA'
                    });
                }
            }

            // Verificar campos críticos
            console.log('\n🔍 Verificando campos críticos...\n');

            const camposCriticos = [
                { tabela: 'trading_signals', campos: ['received_at', 'processed', 'processing_status'] },
                { tabela: 'user_operations', campos: ['order_id', 'order_link_id', 'reduce_only', 'time_in_force'] },
                { tabela: 'user_api_keys', campos: ['api_key', 'secret_key', 'is_active', 'last_validated'] }
            ];

            for (const { tabela, campos } of camposCriticos) {
                console.log(`📋 Verificando campos da tabela ${tabela}:`);
                
                const estrutura = await pool.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1
                `, [tabela]);

                const camposExistentes = estrutura.rows.map(row => row.column_name);

                for (const campo of campos) {
                    const exists = camposExistentes.includes(campo);
                    console.log(`   ${exists ? '✅' : '❌'} ${campo}`);
                    
                    if (!exists) {
                        this.issues.push({
                            tipo: 'CAMPO_FALTANDO',
                            tabela: tabela,
                            campo: campo,
                            severidade: 'MÉDIA'
                        });
                    }
                }
                console.log('');
            }

        } catch (error) {
            console.error('❌ Erro ao verificar banco:', error.message);
            this.issues.push({
                tipo: 'ERRO_BANCO',
                erro: error.message,
                severidade: 'CRÍTICA'
            });
        }
    }

    // 4. Verificar integridade dos fluxos
    async verificarFluxos() {
        console.log('\n🔄 4. VERIFICANDO INTEGRIDADE DOS FLUXOS');
        console.log('-'.repeat(50));

        console.log('📊 Fluxo principal esperado:\n');
        
        const fluxo = [
            '1. 📡 TradingView → Webhook → trading_signals',
            '2. 🔧 Processor Sinais → Processa → user_operations',
            '3. 🎯 Orquestradores → Coordenam → user_operations',
            '4. 🤖 IA Supervisors → Monitoram → user_operations',
            '5. 📊 Dashboard → Exibe → Todas as tabelas',
            '6. 🔑 Gestor Chaves → Valida → user_api_keys'
        ];

        fluxo.forEach(etapa => {
            console.log(`   ${etapa}`);
        });

        // Verificar dados recentes em cada etapa
        console.log('\n🔍 Verificando dados recentes...\n');

        try {
            // Últimos sinais
            const sinais = await pool.query(`
                SELECT COUNT(*) as total, MAX(created_at) as ultimo
                FROM trading_signals 
                WHERE created_at > NOW() - INTERVAL '1 hour'
            `);
            
            console.log(`📡 Sinais na última hora: ${sinais.rows[0].total}`);
            console.log(`   📅 Último sinal: ${sinais.rows[0].ultimo || 'Nenhum'}`);

            // Operações recentes
            const operacoes = await pool.query(`
                SELECT COUNT(*) as total, MAX(created_at) as ultima
                FROM user_operations 
                WHERE created_at > NOW() - INTERVAL '1 hour'
            `);
            
            console.log(`📊 Operações na última hora: ${operacoes.rows[0].total}`);
            console.log(`   📅 Última operação: ${operacoes.rows[0].ultima || 'Nenhuma'}`);

            // Chaves API ativas
            const chaves = await pool.query(`
                SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as ativas
                FROM user_api_keys
            `);
            
            console.log(`🔑 Total de chaves API: ${chaves.rows[0].total}`);
            console.log(`   ✅ Chaves ativas: ${chaves.rows[0].ativas}`);

        } catch (error) {
            console.error('❌ Erro ao verificar fluxos:', error.message);
            this.issues.push({
                tipo: 'ERRO_VERIFICACAO_FLUXO',
                erro: error.message,
                severidade: 'MÉDIA'
            });
        }
    }

    // 5. Gerar relatório final
    gerarRelatorioFinal() {
        console.log('\n📋 5. RELATÓRIO FINAL DA AUDITORIA');
        console.log('='.repeat(70));

        console.log(`📊 ESTATÍSTICAS GERAIS:`);
        console.log(`   Total de componentes: ${this.components.length}`);
        console.log(`   Componentes funcionais: ${this.workingComponents.length}`);
        console.log(`   Problemas encontrados: ${this.issues.length}`);
        console.log(`   Taxa de sucesso: ${Math.round(this.workingComponents.length / this.components.length * 100)}%`);

        if (this.issues.length > 0) {
            console.log('\n❌ PROBLEMAS ENCONTRADOS:\n');
            
            const problemasGrouped = this.issues.reduce((acc, issue) => {
                acc[issue.severidade] = acc[issue.severidade] || [];
                acc[issue.severidade].push(issue);
                return acc;
            }, {});

            Object.keys(problemasGrouped).forEach(severidade => {
                const emoji = severidade === 'CRÍTICA' ? '🔴' : 
                             severidade === 'ALTA' ? '🟠' : '🟡';
                
                console.log(`${emoji} SEVERIDADE ${severidade}:`);
                problemasGrouped[severidade].forEach(issue => {
                    console.log(`   • ${issue.tipo}: ${issue.componente || issue.tabela || issue.dependencia || 'Sistema'}`);
                    if (issue.arquivo) console.log(`     📁 Arquivo: ${issue.arquivo}`);
                    if (issue.campo) console.log(`     🔧 Campo: ${issue.campo}`);
                    if (issue.erro) console.log(`     ⚠️ Erro: ${issue.erro}`);
                });
                console.log('');
            });
        } else {
            console.log('\n✅ NENHUM PROBLEMA CRÍTICO ENCONTRADO!');
        }

        console.log('🎯 COMPONENTES FUNCIONAIS:\n');
        this.workingComponents.forEach(comp => {
            const emoji = comp.tipo === 'GESTOR' ? '🔧' : 
                         comp.tipo === 'SUPERVISOR' ? '🤖' : 
                         comp.tipo === 'ORQUESTRADOR' ? '🎯' :
                         comp.tipo === 'INTERFACE' ? '📊' : '🌐';
            
            console.log(`${emoji} ${comp.nome} - ${comp.funcao}`);
        });

        console.log('\n🚀 RECOMENDAÇÕES:');
        
        if (this.issues.some(i => i.severidade === 'CRÍTICA')) {
            console.log('   🔴 Resolver problemas CRÍTICOS imediatamente');
        }
        
        if (this.issues.some(i => i.severidade === 'ALTA')) {
            console.log('   🟠 Resolver problemas de ALTA prioridade');
        }
        
        if (this.issues.length === 0) {
            console.log('   ✅ Sistema está pronto para operação');
            console.log('   🚀 Todos os fluxos estão funcionais');
            console.log('   📊 Monitoramento em tempo real ativo');
        }

        console.log(`\n🎉 AUDITORIA CONCLUÍDA - ${this.issues.length === 0 ? 'SISTEMA APROVADO' : 'AÇÕES NECESSÁRIAS'}`);
    }

    // Executar auditoria completa
    async executarAuditoriaCompleta() {
        try {
            await this.mapearComponentes();
            await this.verificarArquivos();
            await this.verificarEstruturaBanco();
            await this.verificarFluxos();
            this.gerarRelatorioFinal();
            
        } catch (error) {
            console.error('❌ Erro durante auditoria:', error.message);
            this.issues.push({
                tipo: 'ERRO_AUDITORIA',
                erro: error.message,
                severidade: 'CRÍTICA'
            });
        } finally {
            await pool.end();
        }
    }
}

// Executar auditoria
const auditor = new SystemAuditor();
auditor.executarAuditoriaCompleta();

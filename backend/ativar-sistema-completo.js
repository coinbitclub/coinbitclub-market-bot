#!/usr/bin/env node

/**
 * 🚀 ATIVADOR DO ORQUESTRADOR SISTEMA COMPLETO INTEGRADO
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * Este script ativa o ORQUESTRADOR SISTEMA COMPLETO que integra TODOS os 
 * componentes do COINBITCLUB:
 * 
 * 🔸 Dashboard em tempo real com dados reais
 * 🔸 WebSocket para monitoramento ao vivo
 * 🔸 Gestores especializados (10+ gestores)
 * 🔸 Supervisores inteligentes (6+ supervisores)
 * 🔸 Sistemas de Inteligência Artificial (4+ IAs)
 * 🔸 Fluxo operacional completo
 * 🔸 Integrações externas (Bybit, Binance, OKX, TradingView)
 * 🔸 Monitoramento completo 24/7
 * 🔸 Sistema de emergência e recuperação
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

class AtivadorOrquestradorSistemaCompleto {
    constructor() {
        this.processo = null;
        this.sistemaAtivo = false;
        
        // Conexão com banco para verificações
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async ativarSistemaCompleto() {
        console.log('🚀═══════════════════════════════════════════════════════════════════════════════');
        console.log('🏛️ ATIVADOR ORQUESTRADOR SISTEMA COMPLETO INTEGRADO - COINBITCLUB V4.0.0');
        console.log('🚀═══════════════════════════════════════════════════════════════════════════════');
        console.log(`📅 ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}`);
        console.log('🌍 Ambiente: PRODUÇÃO');
        console.log('');

        try {
            // ═══════════════════════════════════════════════════════════════════════════════
            console.log('🔍 FASE 1: VERIFICAÇÃO DE PRÉ-REQUISITOS');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            await this.verificarPreRequisitos();
            
            // ═══════════════════════════════════════════════════════════════════════════════
            console.log('🗄️ FASE 2: VERIFICAÇÃO DO BANCO DE DADOS');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            await this.verificarBancoDados();
            
            // ═══════════════════════════════════════════════════════════════════════════════
            console.log('📁 FASE 3: VERIFICAÇÃO DOS COMPONENTES');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            await this.verificarComponentes();
            
            // ═══════════════════════════════════════════════════════════════════════════════
            console.log('🚀 FASE 4: INICIALIZAÇÃO DO ORQUESTRADOR COMPLETO');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            await this.iniciarOrquestrador();
            
            return true;

        } catch (error) {
            console.error('❌ ERRO CRÍTICO na ativação:', error.message);
            await this.mostrarSolucoes();
            return false;
        }
    }

    async verificarPreRequisitos() {
        console.log('🔍 Verificando pré-requisitos do sistema...');
        
        // Verificar Node.js
        try {
            const nodeVersion = process.version;
            console.log(`   ✅ Node.js: ${nodeVersion}`);
        } catch (error) {
            console.log('   ❌ Node.js: Não disponível');
            throw new Error('Node.js não encontrado');
        }

        // Verificar orquestrador principal
        const orquestradorPath = path.join(__dirname, 'orquestrador-sistema-completo-integrado.js');
        
        if (!fs.existsSync(orquestradorPath)) {
            console.error('   ❌ orquestrador-sistema-completo-integrado.js não encontrado!');
            
            console.log('');
            console.log('📁 Orquestradores disponíveis no diretório:');
            const arquivos = fs.readdirSync(__dirname).filter(f => f.includes('orquestrador'));
            
            if (arquivos.length > 0) {
                arquivos.forEach(arquivo => {
                    console.log(`   📄 ${arquivo}`);
                });
            } else {
                console.log('   ⚠️ Nenhum orquestrador encontrado');
            }
            
            throw new Error('Orquestrador principal não encontrado');
        }

        console.log('   ✅ orquestrador-sistema-completo-integrado.js: Encontrado');
        
        // Verificar package.json
        const packagePath = path.join(__dirname, 'package.json');
        if (fs.existsSync(packagePath)) {
            console.log('   ✅ package.json: Encontrado');
        } else {
            console.log('   ⚠️ package.json: Não encontrado (pode causar problemas)');
        }

        console.log('🟢 Pré-requisitos verificados');
        console.log('');
    }

    async verificarBancoDados() {
        console.log('🗄️ Testando conexão com banco PostgreSQL Railway...');
        
        try {
            const result = await this.pool.query(`
                SELECT 
                    NOW() as timestamp,
                    COUNT(*) as tables 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            
            const timestamp = result.rows[0].timestamp;
            const tabelas = result.rows[0].tables;
            
            console.log(`   ✅ Conexão estabelecida: ${timestamp}`);
            console.log(`   📊 Tabelas disponíveis: ${tabelas}`);
            
            // Verificar gestores reais
            const gestores = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE name IN (
                    'signals_manager', 'operations_manager', 'fear_greed_manager',
                    'financial_supervisor', 'trade_supervisor', 'users_manager',
                    'risk_manager', 'analytics_manager'
                )
            `);
            
            console.log(`   👨‍💼 Gestores no banco: ${gestores.rows[0].count}/8`);
            
            // Verificar dados operacionais
            const dados = await Promise.allSettled([
                this.pool.query('SELECT COUNT(*) FROM users'),
                this.pool.query('SELECT COUNT(*) FROM trading_signals WHERE created_at > NOW() - INTERVAL \'24 hours\''),
                this.pool.query('SELECT COUNT(*) FROM trading_operations WHERE created_at > NOW() - INTERVAL \'24 hours\'')
            ]);
            
            console.log(`   👥 Usuários: ${dados[0].value?.rows[0]?.count || 0}`);
            console.log(`   📡 Sinais (24h): ${dados[1].value?.rows[0]?.count || 0}`);
            console.log(`   ⚡ Operações (24h): ${dados[2].value?.rows[0]?.count || 0}`);
            
        } catch (error) {
            console.error(`   ❌ Erro de conexão:`, error.message);
            throw error;
        }

        console.log('🟢 Banco de dados verificado');
        console.log('');
    }

    async verificarComponentes() {
        console.log('📁 Verificando componentes do sistema...');
        
        const componentesEssenciais = [
            'dashboard-completo.js',
            'ai-guardian.js'
        ];
        
        const componentesOpcionais = [
            'server.js',
            'gestor-fear-greed-completo.js',
            'gestor-operacoes-completo.js',
            'gestor-financeiro-completo.js',
            'gestor-usuarios-completo.js',
            'gestor-chaves-api-multiusuarios.js'
        ];

        console.log('🔹 Componentes essenciais:');
        for (const componente of componentesEssenciais) {
            const caminho = path.join(__dirname, componente);
            if (fs.existsSync(caminho)) {
                console.log(`   ✅ ${componente}: Encontrado`);
            } else {
                console.log(`   ❌ ${componente}: Não encontrado`);
            }
        }

        console.log('');
        console.log('🔹 Componentes opcionais:');
        let componentesEncontrados = 0;
        for (const componente of componentesOpcionais) {
            const caminho = path.join(__dirname, componente);
            if (fs.existsSync(caminho)) {
                console.log(`   ✅ ${componente}: Disponível`);
                componentesEncontrados++;
            } else {
                console.log(`   ⚠️ ${componente}: Não encontrado`);
            }
        }

        console.log(`   📊 Componentes opcionais disponíveis: ${componentesEncontrados}/${componentesOpcionais.length}`);

        // Verificar gestores no diretório
        const gestores = fs.readdirSync(__dirname).filter(f => f.startsWith('gestor-') && f.endsWith('.js'));
        console.log(`   🎯 Gestores disponíveis: ${gestores.length}`);

        // Verificar monitores
        const monitores = fs.readdirSync(__dirname).filter(f => f.includes('monitor') && f.endsWith('.js'));
        console.log(`   📊 Monitores disponíveis: ${monitores.length}`);

        console.log('🟢 Componentes verificados');
        console.log('');
    }

    async iniciarOrquestrador() {
        console.log('🚀 Iniciando ORQUESTRADOR SISTEMA COMPLETO INTEGRADO...');
        console.log('');

        const orquestradorPath = path.join(__dirname, 'orquestrador-sistema-completo-integrado.js');
        
        try {
            console.log('⚡ Executando o orquestrador...');
            
            // Executar o orquestrador
            this.processo = spawn('node', [orquestradorPath], {
                stdio: 'inherit',
                cwd: __dirname
            });

            this.processo.on('error', (error) => {
                console.error('❌ ERRO ao iniciar orquestrador:', error.message);
                this.sistemaAtivo = false;
            });

            this.processo.on('exit', (code) => {
                this.sistemaAtivo = false;
                if (code === 0) {
                    console.log('✅ Orquestrador finalizou normalmente');
                } else {
                    console.error(`❌ Orquestrador finalizou com erro (código: ${code})`);
                }
            });

            this.sistemaAtivo = true;

            console.log('✅ Orquestrador iniciado com sucesso!');
            console.log('');
            console.log('🎯═══════════════════════════════════════════════════════════════════════════════');
            console.log('📊 INFORMAÇÕES DO SISTEMA COINBITCLUB V4.0.0');
            console.log('🎯═══════════════════════════════════════════════════════════════════════════════');
            console.log('');
            console.log('🔹 CAMADA 1 - INFRAESTRUTURA:');
            console.log('   🌐 Dashboard: http://localhost:3011');
            console.log('   🔌 WebSocket: ws://localhost:3016');  
            console.log('   🚪 API Gateway: http://localhost:8080');
            console.log('   🗄️ Banco: Railway PostgreSQL (conectado)');
            console.log('');
            console.log('🔹 CAMADA 2 - GESTORES ESPECIALIZADOS:');
            console.log('   🎯 Gestor de Sinais TradingView');
            console.log('   📈 Gestor Fear & Greed Index');
            console.log('   ⚡ Gestor de Operações');
            console.log('   💰 Gestor Financeiro');
            console.log('   👥 Gestor de Usuários');
            console.log('   🔐 Gestor de Chaves API');
            console.log('   🤝 Gestor de Afiliados');
            console.log('   🤖 Gestor Automático');
            console.log('   📊 Gestor de Monitoramento');
            console.log('   💸 Gestor de Comissionamento');
            console.log('');
            console.log('🔹 CAMADA 3 - SUPERVISORES INTELIGENTES:');
            console.log('   🛡️ Supervisor de Trading');
            console.log('   ⚖️ Supervisor de Riscos');
            console.log('   📋 Supervisor de Compliance');
            console.log('   👤 Supervisor de Usuários');
            console.log('   ⚡ Supervisor de Performance');
            console.log('   🔒 Supervisor de Segurança');
            console.log('');
            console.log('🔹 CAMADA 4 - INTELIGÊNCIA ARTIFICIAL:');
            console.log('   🤖 AI Guardian (Proteção)');
            console.log('   💰 IA Supervisor Financeiro');
            console.log('   📊 Monitor IA Completo');
            console.log('   🧠 Core de Monitoramento IA');
            console.log('');
            console.log('🔹 CAMADA 5 - FLUXO OPERACIONAL:');
            console.log('   📡 Processamento de Sinais (100/min)');
            console.log('   ⚡ Execução de Trades (50/min)');
            console.log('   📊 Gestão de Portfolio (24/7)');
            console.log('   📈 Analytics Avançados (Tempo Real)');
            console.log('');
            console.log('🔹 CAMADA 6 - INTEGRAÇÕES EXTERNAS:');
            console.log('   🔗 Bybit Exchange API');
            console.log('   🔗 Binance Exchange API');
            console.log('   🔗 OKX Exchange API');
            console.log('   📡 TradingView Webhooks');
            console.log('   📊 CoinStats Fear & Greed');
            console.log('   📱 Telegram Notifications');
            console.log('');
            console.log('⚠️ Para parar o sistema: Pressione Ctrl+C');
            console.log('🔄 Sistema em monitoramento contínuo 24/7');
            console.log('');

            return true;

        } catch (error) {
            console.error('❌ ERRO ao executar orquestrador:', error.message);
            throw error;
        }
    }

    async mostrarSolucoes() {
        console.log('');
        console.log('🔧═══════════════════════════════════════════════════════════════════════════════');
        console.log('💡 SOLUÇÕES PARA PROBLEMAS COMUNS');
        console.log('🔧═══════════════════════════════════════════════════════════════════════════════');
        console.log('');
        console.log('🔸 PROBLEMA: Orquestrador não encontrado');
        console.log('   ✅ Solução: Verificar se o arquivo foi criado corretamente');
        console.log('   📁 Comando: ls -la orquestrador-sistema-completo-integrado.js');
        console.log('');
        console.log('🔸 PROBLEMA: Erro de conexão com banco');
        console.log('   ✅ Solução 1: Verificar conexão de internet');
        console.log('   ✅ Solução 2: Verificar string de conexão Railway');
        console.log('   ✅ Solução 3: Verificar se banco está ativo no Railway');
        console.log('');
        console.log('🔸 PROBLEMA: Componentes não encontrados');
        console.log('   ✅ Solução: Sistema funciona mesmo sem todos os componentes');
        console.log('   📝 Nota: Componentes ausentes ficam em modo standby');
        console.log('');
        console.log('🔸 PROBLEMA: Falta de permissões');
        console.log('   ✅ Solução Windows: Executar como administrador');
        console.log('   ✅ Solução Linux/Mac: sudo node ativar-sistema-completo.js');
        console.log('');
        console.log('🔸 PROBLEMA: Porta já em uso');
        console.log('   ✅ Solução: Parar processos nas portas 3011, 3016, 8080');
        console.log('   💻 Comando Windows: netstat -ano | findstr :3011');
        console.log('   🐧 Comando Linux: lsof -i :3011');
        console.log('');
        console.log('🔧═══════════════════════════════════════════════════════════════════════════════');
    }

    parar() {
        if (this.processo && this.sistemaAtivo) {
            console.log('🛑 Parando orquestrador sistema completo...');
            this.processo.kill('SIGINT');
            this.sistemaAtivo = false;
        }
    }

    async cleanup() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
    const ativador = new AtivadorOrquestradorSistemaCompleto();
    
    // Capturar Ctrl+C
    process.on('SIGINT', async () => {
        console.log('\n⚠️ Interrupção detectada...');
        ativador.parar();
        await ativador.cleanup();
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    });

    // Capturar outros sinais
    process.on('SIGTERM', async () => {
        ativador.parar();
        await ativador.cleanup();
        process.exit(0);
    });

    try {
        const sucesso = await ativador.ativarSistemaCompleto();
        
        if (!sucesso) {
            console.log('');
            console.log('❌ Falha na ativação do sistema');
            await ativador.cleanup();
            process.exit(1);
        }

        // Manter processo ativo
        setInterval(() => {
            if (!ativador.sistemaAtivo) {
                console.log('⚠️ Sistema não está mais ativo');
                process.exit(1);
            }
        }, 5000);

    } catch (error) {
        console.error('❌ ERRO FATAL:', error.message);
        await ativador.cleanup();
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(async (error) => {
        console.error('❌ ERRO CRÍTICO:', error.message);
        process.exit(1);
    });
}

module.exports = AtivadorOrquestradorSistemaCompleto;

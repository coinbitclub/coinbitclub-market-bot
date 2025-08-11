/**
 * 🔍 DIAGNÓSTICO COMPLETO DO SISTEMA
 * ==================================
 * 
 * Investiga problemas de:
 * 1. Dashboard sem dados
 * 2. Sinais TradingView não gerando operações
 * 3. Horários em Brasília
 * 4. Fluxo completo do sistema
 * 
 * @author Sistema Automatizado
 * @version 1.0
 * @date 07/08/2025 21:33
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DiagnosticoCompleto {
    constructor() {
        this.pool = new Pool({
            host: 'trolley.proxy.rlwy.net',
            port: 44790,
            database: 'railway',
            user: 'postgres',
            password: 'ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq',
            ssl: {
                rejectUnauthorized: false
            }
        });
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const prefix = {
            'INFO': '[🔍]',
            'WARNING': '[⚠️ ]',
            'SUCCESS': '[✅]',
            'ERROR': '[❌]',
            'DEBUG': '[🐛]'
        }[level] || '[🔍]';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    /**
     * 🕐 VERIFICAR CONFIGURAÇÃO DE TIMEZONE
     */
    async verificarTimezone() {
        this.log('🕐 Verificando configuração de timezone...');
        
        try {
            // Verificar timezone do banco
            const timezone = await this.pool.query(`
                SELECT 
                    NOW() as utc_now,
                    NOW() AT TIME ZONE 'America/Sao_Paulo' as brasilia_now,
                    CURRENT_SETTING('timezone') as db_timezone
            `);

            const result = timezone.rows[0];
            this.log(`🌍 Timezone do DB: ${result.db_timezone}`);
            this.log(`⏰ UTC Now: ${result.utc_now}`);
            this.log(`🇧🇷 Brasília Now: ${result.brasilia_now}`);

            // Verificar timezone do Node.js
            const nodeNow = new Date();
            const brasiliaTime = nodeNow.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            this.log(`💻 Node.js Local: ${nodeNow}`);
            this.log(`🇧🇷 Node.js Brasília: ${brasiliaTime}`);

            return {
                dbTimezone: result.db_timezone,
                utcNow: result.utc_now,
                brasiliaNow: result.brasilia_now,
                nodeLocal: nodeNow,
                nodeBrasilia: brasiliaTime
            };
        } catch (error) {
            this.log(`❌ Erro ao verificar timezone: ${error.message}`, 'ERROR');
            return null;
        }
    }

    /**
     * 📊 VERIFICAR DADOS DO DASHBOARD
     */
    async verificarDadosDashboard() {
        this.log('📊 Investigando dados do dashboard...');
        
        try {
            // 1. Verificar sinais recentes
            const sinais = await this.pool.query(`
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as ultimas_24h,
                       COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as ultima_hora
                FROM trading_signals
            `);

            this.log(`📡 Sinais: Total ${sinais.rows[0].total}, 24h ${sinais.rows[0].ultimas_24h}, 1h ${sinais.rows[0].ultima_hora}`);

            // 2. Verificar orders ativas
            const orders = await this.pool.query(`
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN status IN ('pending', 'open', 'new') THEN 1 END) as ativas
                FROM trading_orders
            `);

            this.log(`📋 Orders: Total ${orders.rows[0].total}, Ativas ${orders.rows[0].ativas}`);

            // 3. Verificar positions
            const positions = await this.pool.query(`
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN is_active = true THEN 1 END) as ativas
                FROM positions
            `);

            this.log(`📈 Positions: Total ${positions.rows[0].total}, Ativas ${positions.rows[0].ativas}`);

            // 4. Verificar usuários ativos
            const usuarios = await this.pool.query(`
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
                       COUNT(CASE WHEN last_login > NOW() - INTERVAL '24 hours' THEN 1 END) as login_24h
                FROM users
            `);

            this.log(`👥 Usuários: Total ${usuarios.rows[0].total}, Ativos ${usuarios.rows[0].ativos}, Login 24h ${usuarios.rows[0].login_24h || 0}`);

            // 5. Verificar logs do sistema
            const logs = await this.pool.query(`
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN level = 'error' THEN 1 END) as errors,
                       COUNT(CASE WHEN timestamp > NOW() - INTERVAL '1 hour' THEN 1 END) as ultima_hora
                FROM system_logs
            `);

            this.log(`📝 Logs: Total ${logs.rows[0].total}, Errors ${logs.rows[0].errors}, 1h ${logs.rows[0].ultima_hora}`);

            return {
                sinais: sinais.rows[0],
                orders: orders.rows[0],
                positions: positions.rows[0],
                usuarios: usuarios.rows[0],
                logs: logs.rows[0]
            };

        } catch (error) {
            this.log(`❌ Erro ao verificar dados dashboard: ${error.message}`, 'ERROR');
            return null;
        }
    }

    /**
     * 🔍 RASTREAR SINAIS DO TRADINGVIEW
     */
    async rastrearSinaisTradingView() {
        this.log('🔍 Rastreando sinais do TradingView...');
        
        try {
            // 1. Últimos sinais recebidos
            const ultimosSinais = await this.pool.query(`
                SELECT 
                    id, symbol, action, price, timestamp, 
                    processed, error_message, created_at
                FROM trading_signals 
                ORDER BY created_at DESC 
                LIMIT 10
            `);

            if (ultimosSinais.rows.length > 0) {
                this.log(`📡 Últimos ${ultimosSinais.rows.length} sinais:`);
                ultimosSinais.rows.forEach((sinal, index) => {
                    this.log(`   ${index + 1}. ${sinal.symbol} ${sinal.action} @ ${sinal.price} - ${sinal.created_at}`);
                    this.log(`      Processado: ${sinal.processed}, Erro: ${sinal.error_message || 'Nenhum'}`);
                });
            } else {
                this.log('❌ NENHUM SINAL ENCONTRADO!', 'ERROR');
            }

            // 2. Verificar sinais não processados
            const naoProcessados = await this.pool.query(`
                SELECT COUNT(*) as total 
                FROM trading_signals 
                WHERE processed = false OR processed IS NULL
            `);

            this.log(`⏳ Sinais não processados: ${naoProcessados.rows[0].total}`);

            // 3. Verificar erros nos sinais
            const comErros = await this.pool.query(`
                SELECT COUNT(*) as total 
                FROM trading_signals 
                WHERE error_message IS NOT NULL AND error_message != ''
            `);

            this.log(`❌ Sinais com erros: ${comErros.rows[0].total}`);

            return {
                ultimosSinais: ultimosSinais.rows,
                naoProcessados: naoProcessados.rows[0].total,
                comErros: comErros.rows[0].total
            };

        } catch (error) {
            this.log(`❌ Erro ao rastrear sinais: ${error.message}`, 'ERROR');
            return null;
        }
    }

    /**
     * 🔧 VERIFICAR ARQUIVOS DE CONFIGURAÇÃO
     */
    async verificarConfiguracoes() {
        this.log('🔧 Verificando arquivos de configuração...');
        
        try {
            const arquivos = [
                'app.js',
                'main.js', 
                'dashboard-completo.js',
                'dashboard-tempo-real.js',
                'sistema-producao-completo.js'
            ];

            const resultados = {};

            for (const arquivo of arquivos) {
                const caminhoArquivo = path.join(__dirname, arquivo);
                try {
                    if (fs.existsSync(caminhoArquivo)) {
                        const stats = fs.statSync(caminhoArquivo);
                        resultados[arquivo] = {
                            existe: true,
                            tamanho: stats.size,
                            modificado: stats.mtime
                        };
                        this.log(`✅ ${arquivo}: ${stats.size} bytes, modificado ${stats.mtime}`);
                    } else {
                        resultados[arquivo] = { existe: false };
                        this.log(`❌ ${arquivo}: NÃO ENCONTRADO`, 'ERROR');
                    }
                } catch (error) {
                    this.log(`❌ Erro ao verificar ${arquivo}: ${error.message}`, 'ERROR');
                    resultados[arquivo] = { existe: false, erro: error.message };
                }
            }

            return resultados;
        } catch (error) {
            this.log(`❌ Erro geral na verificação de arquivos: ${error.message}`, 'ERROR');
            return {};
        }
    }

    /**
     * 🌐 VERIFICAR STATUS DOS SERVIÇOS
     */
    async verificarStatusServicos() {
        this.log('🌐 Verificando status dos serviços...');
        
        try {
            // Esta função pode ser expandida para fazer requests HTTP
            // aos serviços para verificar se estão respondendo
            
            const servicos = {
                'Sistema Principal': 'http://localhost:3000',
                'Dashboard': 'http://localhost:5001',
                'API TradingView': '/webhook/tradingview' 
            };

            this.log('📋 Serviços a verificar:');
            Object.entries(servicos).forEach(([nome, url]) => {
                this.log(`   • ${nome}: ${url}`);
            });

            return servicos;
        } catch (error) {
            this.log(`❌ Erro ao verificar serviços: ${error.message}`, 'ERROR');
            return {};
        }
    }

    /**
     * 📊 GERAR RELATÓRIO COMPLETO
     */
    async gerarRelatorioCompleto() {
        this.log('📊 INICIANDO DIAGNÓSTICO COMPLETO DO SISTEMA', 'SUCCESS');
        console.log('='.repeat(70));
        
        try {
            // 1. Verificar timezone
            const timezone = await this.verificarTimezone();
            console.log('');

            // 2. Verificar dados do dashboard
            const dashboard = await this.verificarDadosDashboard();
            console.log('');

            // 3. Rastrear sinais TradingView
            const sinais = await this.rastrearSinaisTradingView();
            console.log('');

            // 4. Verificar configurações
            const configs = await this.verificarConfiguracoes();
            console.log('');

            // 5. Verificar serviços
            const servicos = await this.verificarStatusServicos();
            console.log('');

            // DIAGNÓSTICO FINAL
            console.log('='.repeat(70));
            this.log('🎯 DIAGNÓSTICO FINAL:', 'SUCCESS');
            
            // Identificar problemas
            const problemas = [];
            
            if (!sinais || sinais.ultimosSinais.length === 0) {
                problemas.push('❌ NENHUM SINAL RECEBIDO DO TRADINGVIEW');
            }
            
            if (sinais && sinais.naoProcessados > 0) {
                problemas.push(`⚠️  ${sinais.naoProcessados} sinais não processados`);
            }
            
            if (sinais && sinais.comErros > 0) {
                problemas.push(`❌ ${sinais.comErros} sinais com erros`);
            }
            
            if (!dashboard || (dashboard.sinais.ultimas_24h === '0')) {
                problemas.push('📊 Dashboard sem dados recentes');
            }

            if (problemas.length > 0) {
                this.log('🚨 PROBLEMAS IDENTIFICADOS:', 'ERROR');
                problemas.forEach(problema => {
                    this.log(`   ${problema}`, 'ERROR');
                });
            } else {
                this.log('✅ Sistema aparenta estar funcionando normalmente', 'SUCCESS');
            }

            return {
                timezone,
                dashboard,
                sinais,
                configs,
                servicos,
                problemas
            };

        } catch (error) {
            this.log(`❌ ERRO CRÍTICO no diagnóstico: ${error.message}`, 'ERROR');
            throw error;
        } finally {
            await this.pool.end();
        }
    }
}

// 🚀 EXECUÇÃO
if (require.main === module) {
    const diagnostico = new DiagnosticoCompleto();
    diagnostico.gerarRelatorioCompleto().then(resultado => {
        console.log('\n🎯 Diagnóstico finalizado!');
        if (resultado.problemas.length > 0) {
            console.log('⚠️  Problemas identificados - revisar logs acima');
        } else {
            console.log('✅ Sistema operacional');
        }
        process.exit(0);
    }).catch(error => {
        console.error('❌ ERRO:', error.message);
        process.exit(1);
    });
}

module.exports = DiagnosticoCompleto;

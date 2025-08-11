#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO COMPLETO DE DEPENDÊNCIAS COM BANCO DE DADOS
 * ========================================================
 * 
 * Verifica TODOS os códigos do sistema e suas dependências com PostgreSQL
 * Data: 08/08/2025
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

class DiagnosticoDependenciasBanco {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.arquivosAnalisados = [];
        this.problemasEncontrados = [];
        this.modulosIntegrados = [];
        this.arquivosSemDependencia = [];
        this.connectionStringsEncontradas = new Set();
    }

    async analisarArquivo(nomeArquivo) {
        const caminhoCompleto = path.join(__dirname, nomeArquivo);
        
        if (!fs.existsSync(caminhoCompleto)) {
            return null;
        }

        try {
            const conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
            const analise = {
                arquivo: nomeArquivo,
                tamanho: conteudo.length,
                linhas: conteudo.split('\n').length,
                temPool: false,
                temDatabaseUrl: false,
                temQuery: false,
                temFinancialManager: false,
                temCommissionSystem: false,
                connectionStrings: [],
                problemas: [],
                status: 'OK'
            };

            // Verificar imports/requires relacionados ao banco
            if (conteudo.includes("require('pg')") || conteudo.includes('Pool')) {
                analise.temPool = true;
            }

            if (conteudo.includes('DATABASE_URL') || conteudo.includes('process.env.DATABASE_URL')) {
                analise.temDatabaseUrl = true;
            }

            if (conteudo.includes('.query(') || conteudo.includes('pool.query') || conteudo.includes('client.query')) {
                analise.temQuery = true;
            }

            if (conteudo.includes('FinancialManager') || conteudo.includes('financial-manager')) {
                analise.temFinancialManager = true;
            }

            if (conteudo.includes('CommissionSystem') || conteudo.includes('commission-system')) {
                analise.temCommissionSystem = true;
            }

            // Extrair connection strings
            const connectionStringPatterns = [
                /postgresql:\/\/[^'"\s]+/g,
                /connectionString:\s*['"][^'"]+['"]/g,
                /DATABASE_URL.*?['"][^'"]+['"]/g
            ];

            connectionStringPatterns.forEach(pattern => {
                const matches = conteudo.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        analise.connectionStrings.push(match);
                        this.connectionStringsEncontradas.add(match);
                    });
                }
            });

            // Verificar problemas comuns
            if (analise.temQuery && !analise.temPool && !conteudo.includes('this.pool')) {
                analise.problemas.push('Arquivo executa queries mas não tem pool configurado');
                analise.status = 'PROBLEMA';
            }

            if (analise.temPool && analise.connectionStrings.length === 0) {
                analise.problemas.push('Pool configurado mas sem connection string clara');
                analise.status = 'AVISO';
            }

            // Verificar padrões hardcoded perigosos
            if (conteudo.includes('ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq') && !conteudo.includes('process.env.DATABASE_URL')) {
                analise.problemas.push('SEGURANÇA: Connection string hardcoded sem fallback de env');
                analise.status = 'CRÍTICO';
            }

            if (conteudo.includes('localhost:5432') && process.env.NODE_ENV === 'production') {
                analise.problemas.push('Connection string de desenvolvimento em produção');
                analise.status = 'PROBLEMA';
            }

            // Verificar se module.exports existe para módulos
            if ((analise.temFinancialManager || analise.temCommissionSystem) && 
                nomeArquivo.endsWith('.js') && 
                !conteudo.includes('module.exports')) {
                analise.problemas.push('Módulo crítico sem module.exports');
                analise.status = 'PROBLEMA';
            }

            return analise;

        } catch (error) {
            return {
                arquivo: nomeArquivo,
                erro: error.message,
                status: 'ERRO'
            };
        }
    }

    async verificarConexaoBanco() {
        try {
            console.log('\n🔍 Testando conexão com banco de dados...');
            
            const result = await this.pool.query('SELECT NOW() as current_time, version() as version');
            
            console.log(`✅ Conexão OK - PostgreSQL ${result.rows[0].version.split(' ')[1]}`);
            console.log(`   Timestamp: ${result.rows[0].current_time}`);
            
            // Verificar tabelas principais
            const tabelas = await this.pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            `);

            console.log(`\n📊 Tabelas encontradas (${tabelas.rows.length}):`);
            tabelas.rows.forEach(tabela => {
                console.log(`   • ${tabela.table_name}`);
            });

            return true;

        } catch (error) {
            console.error(`❌ Erro de conexão: ${error.message}`);
            return false;
        }
    }

    async executarDiagnostico() {
        console.log('🔍 DIAGNÓSTICO COMPLETO DE DEPENDÊNCIAS COM BANCO DE DADOS');
        console.log('=' .repeat(70));
        console.log(`Data: ${new Date().toISOString()}`);
        console.log(`Diretório: ${__dirname}\n`);

        // Testar conexão primeiro
        const conexaoOK = await this.verificarConexaoBanco();
        
        if (!conexaoOK) {
            console.log('\n❌ FALHA NA CONEXÃO - Análise limitada');
        }

        console.log('\n📁 Analisando arquivos...\n');

        // Listar todos os arquivos .js
        const arquivos = fs.readdirSync(__dirname).filter(arquivo => 
            arquivo.endsWith('.js') && 
            arquivo !== 'diagnostico-dependencias-banco.js'
        );

        // Analisar cada arquivo
        for (const arquivo of arquivos) {
            const analise = await this.analisarArquivo(arquivo);
            
            if (analise) {
                this.arquivosAnalisados.push(analise);
                
                // Categorizar
                if (analise.temPool || analise.temQuery || analise.temDatabaseUrl) {
                    this.modulosIntegrados.push(analise);
                } else {
                    this.arquivosSemDependencia.push(analise);
                }

                if (analise.problemas && analise.problemas.length > 0) {
                    this.problemasEncontrados.push(analise);
                }

                // Log em tempo real
                const status = analise.status === 'OK' ? '✅' : 
                              analise.status === 'AVISO' ? '⚠️' : 
                              analise.status === 'PROBLEMA' ? '🔴' : '💥';
                
                console.log(`${status} ${arquivo.padEnd(40)} ${analise.status}`);
                
                if (analise.problemas && analise.problemas.length > 0) {
                    analise.problemas.forEach(problema => {
                        console.log(`     └─ ${problema}`);
                    });
                }
            }
        }

        await this.gerarRelatorio();
        await this.pool.end();
    }

    async gerarRelatorio() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 RELATÓRIO FINAL DE DIAGNÓSTICO');
        console.log('=' .repeat(70));

        console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
        console.log(`   Total de arquivos analisados: ${this.arquivosAnalisados.length}`);
        console.log(`   Módulos com dependência do banco: ${this.modulosIntegrados.length}`);
        console.log(`   Arquivos sem dependência do banco: ${this.arquivosSemDependencia.length}`);
        console.log(`   Problemas encontrados: ${this.problemasEncontrados.length}`);

        console.log(`\n🔗 CONNECTION STRINGS ENCONTRADAS:`);
        if (this.connectionStringsEncontradas.size === 0) {
            console.log('   ❌ Nenhuma connection string encontrada');
        } else {
            this.connectionStringsEncontradas.forEach(conn => {
                if (conn.includes('ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq')) {
                    console.log(`   🔴 ${conn} (HARDCODED - RISCO DE SEGURANÇA)`);
                } else if (conn.includes('DATABASE_URL')) {
                    console.log(`   ✅ ${conn} (Usando variável de ambiente)`);
                } else {
                    console.log(`   ⚠️ ${conn}`);
                }
            });
        }

        console.log(`\n🏗️ MÓDULOS PRINCIPAIS CRÍTICOS:`);
        const modulosCriticos = ['app.js', 'financial-manager.js', 'commission-system.js', 'dashboard-real-final.js'];
        
        modulosCriticos.forEach(modulo => {
            const analise = this.arquivosAnalisados.find(a => a.arquivo === modulo);
            if (analise) {
                const status = analise.status === 'OK' ? '✅' : '❌';
                console.log(`   ${status} ${modulo}`);
                if (analise.problemas && analise.problemas.length > 0) {
                    analise.problemas.forEach(problema => {
                        console.log(`        └─ ${problema}`);
                    });
                }
            } else {
                console.log(`   ❌ ${modulo} - ARQUIVO NÃO ENCONTRADO`);
            }
        });

        if (this.problemasEncontrados.length > 0) {
            console.log(`\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:`);
            this.problemasEncontrados.forEach(analise => {
                if (analise.status === 'CRÍTICO' || analise.status === 'PROBLEMA') {
                    console.log(`\n   📁 ${analise.arquivo}:`);
                    analise.problemas.forEach(problema => {
                        console.log(`      • ${problema}`);
                    });
                }
            });
        }

        console.log(`\n💡 RECOMENDAÇÕES:`);
        
        // Verificar se .env está configurado corretamente
        if (fs.existsSync('.env')) {
            console.log(`   ✅ Arquivo .env encontrado`);
        } else {
            console.log(`   ❌ Arquivo .env não encontrado - criar com DATABASE_URL`);
        }

        // Verificar módulos principais
        const appAnalise = this.arquivosAnalisados.find(a => a.arquivo === 'app.js');
        if (appAnalise && appAnalise.temFinancialManager && appAnalise.temCommissionSystem) {
            console.log(`   ✅ App.js integra módulos financeiros corretamente`);
        } else {
            console.log(`   ❌ App.js precisa integrar FinancialManager e CommissionSystem`);
        }

        // Verificar segurança
        const temHardcoded = Array.from(this.connectionStringsEncontradas).some(conn => 
            conn.includes('ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq') && !conn.includes('process.env')
        );
        
        if (temHardcoded) {
            console.log(`   🔴 URGENTE: Substituir connection strings hardcoded por variáveis de ambiente`);
        } else {
            console.log(`   ✅ Configuração de segurança adequada`);
        }

        console.log(`\n🎯 PRÓXIMOS PASSOS:`);
        console.log(`   1. Corrigir problemas críticos encontrados`);
        console.log(`   2. Padronizar uso de process.env.DATABASE_URL`);
        console.log(`   3. Verificar integração dos módulos financeiros`);
        console.log(`   4. Testar conectividade em ambiente de produção`);
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ DIAGNÓSTICO CONCLUÍDO');
        console.log('=' .repeat(70));
    }
}

// Executar diagnóstico
if (require.main === module) {
    const diagnostico = new DiagnosticoDependenciasBanco();
    diagnostico.executarDiagnostico().catch(console.error);
}

module.exports = DiagnosticoDependenciasBanco;

#!/usr/bin/env node

/**
 * 🔍 REVISOR COMPLETO DO SISTEMA - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Análise completa do código-fonte para verificar conformidade com regras operacionais
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

class RevisorCompleto {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.regrasOperacionais = {
            planos: {
                'Mensal Brasil': { mensalidade: 'R$ 297', comissao: 10, saldo_minimo: null },
                'Mensal Exterior': { mensalidade: 'US$ 60', comissao: 10, saldo_minimo: null },
                'Pré-pago Brasil': { mensalidade: null, comissao: 20, saldo_minimo: 'R$ 60' },
                'Pré-pago Exterior': { mensalidade: null, comissao: 20, saldo_minimo: 'US$ 20' }
            },
            afiliados: {
                normal: 1.5,
                vip: 5.0
            },
            operacao: {
                max_posicoes: 2,
                bloqueio_ticker: 2, // horas
                limpeza_sinais: 2, // horas
                fallback_fg: 50,
                alavancagem_padrao: 5,
                sl_mult: 2,
                tp_mult: 3,
                valor_operacao: 30 // % do saldo
            }
        };

        this.divergencias = [];
        this.relatorio = {
            arquivos_analisados: 0,
            regras_verificadas: 0,
            conformidades: 0,
            divergencias: 0,
            detalhes: []
        };
    }

    async executarRevisao() {
        console.log('🔍 INICIANDO REVISÃO COMPLETA DO SISTEMA');
        console.log('=========================================');
        
        try {
            // 1. Verificar estrutura do banco de dados
            await this.verificarEstruturaBanco();
            
            // 2. Analisar arquivos do sistema
            await this.analisarArquivosSistema();
            
            // 3. Verificar configurações de planos
            await this.verificarConfiguracaoPlanos();
            
            // 4. Verificar regras de comissionamento
            await this.verificarComissionamento();
            
            // 5. Verificar supervisão da IA
            await this.verificarSupervisaoIA();
            
            // 6. Verificar regras operacionais
            await this.verificarRegrasOperacionais();
            
            // 7. Gerar relatório final
            await this.gerarRelatorioFinal();

        } catch (error) {
            console.error('❌ Erro na revisão:', error.message);
        } finally {
            await this.pool.end();
        }
    }

    async verificarEstruturaBanco() {
        console.log('\n📊 VERIFICANDO ESTRUTURA DO BANCO DE DADOS');
        console.log('============================================');

        const tabelasEssenciais = [
            'users', 'user_api_keys', 'trading_operations', 'signals',
            'plans', 'subscriptions', 'commissions', 'affiliate_commissions',
            'user_balances', 'prepaid_transactions', 'ai_analysis',
            'risk_alerts', 'system_configurations', 'bloqueio_ticker'
        ];

        for (const tabela of tabelasEssenciais) {
            try {
                const result = await this.pool.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    );
                `, [tabela]);

                if (result.rows[0].exists) {
                    console.log(`✅ Tabela ${tabela}: encontrada`);
                    this.relatorio.conformidades++;
                } else {
                    console.log(`❌ Tabela ${tabela}: FALTANTE`);
                    this.divergencias.push({
                        tipo: 'Estrutura BD',
                        item: `Tabela ${tabela}`,
                        problema: 'Tabela não encontrada',
                        criticidade: 'ALTA'
                    });
                    this.relatorio.divergencias++;
                }
            } catch (error) {
                console.log(`⚠️ Erro ao verificar ${tabela}: ${error.message}`);
            }
        }

        // Verificar colunas críticas em users
        await this.verificarColunasUsuarios();
    }

    async verificarColunasUsuarios() {
        console.log('\n🔍 Verificando colunas essenciais na tabela users...');

        const colunasEssenciais = [
            'plan_type', 'balance_usd', 'prepaid_balance', 'credit_bonus',
            'stripe_subscription_status', 'vip_status', 'commission_rate',
            'affiliate_level', 'modo_testnet'
        ];

        for (const coluna of colunasEssenciais) {
            try {
                await this.pool.query(`SELECT ${coluna} FROM users LIMIT 1`);
                console.log(`✅ Coluna ${coluna}: encontrada`);
                this.relatorio.conformidades++;
            } catch (error) {
                console.log(`❌ Coluna ${coluna}: FALTANTE`);
                this.divergencias.push({
                    tipo: 'Estrutura BD',
                    item: `Coluna users.${coluna}`,
                    problema: 'Coluna não encontrada',
                    criticidade: 'ALTA'
                });
                this.relatorio.divergencias++;
            }
        }
    }

    async analisarArquivosSistema() {
        console.log('\n📁 ANALISANDO ARQUIVOS DO SISTEMA');
        console.log('==================================');

        const arquivosEssenciais = [
            'user-manager-v2.js',
            'trading-engine.js',
            'signal-processor.js',
            'ai-guardian.js',
            'risk-manager.js',
            'database-manager.js'
        ];

        for (const arquivo of arquivosEssenciais) {
            await this.analisarArquivo(arquivo);
        }
    }

    async analisarArquivo(nomeArquivo) {
        const caminhoArquivo = path.join(__dirname, nomeArquivo);
        
        try {
            if (!fs.existsSync(caminhoArquivo)) {
                console.log(`❌ Arquivo ${nomeArquivo}: NÃO ENCONTRADO`);
                this.divergencias.push({
                    tipo: 'Arquivo',
                    item: nomeArquivo,
                    problema: 'Arquivo não encontrado',
                    criticidade: 'ALTA'
                });
                return;
            }

            const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
            console.log(`📋 Analisando ${nomeArquivo}...`);
            
            this.relatorio.arquivos_analisados++;

            // Verificações específicas por arquivo
            switch (nomeArquivo) {
                case 'user-manager-v2.js':
                    await this.verificarUserManager(conteudo);
                    break;
                case 'trading-engine.js':
                    await this.verificarTradingEngine(conteudo);
                    break;
                case 'ai-guardian.js':
                    await this.verificarAIGuardian(conteudo);
                    break;
                case 'signal-processor.js':
                    await this.verificarSignalProcessor(conteudo);
                    break;
                default:
                    await this.verificarArquivoGenerico(nomeArquivo, conteudo);
            }

        } catch (error) {
            console.log(`⚠️ Erro ao analisar ${nomeArquivo}: ${error.message}`);
        }
    }

    async verificarUserManager(conteudo) {
        console.log('   🔍 Verificando User Manager...');

        // Verificar se os níveis VIP estão corretos
        if (!conteudo.includes("'standard'") || 
            !conteudo.includes("'vip'") || 
            !conteudo.includes("'premium'") || 
            !conteudo.includes("'elite'")) {
            this.divergencias.push({
                tipo: 'User Manager',
                item: 'Níveis VIP',
                problema: 'Níveis VIP incompletos ou incorretos',
                criticidade: 'MÉDIA'
            });
        }

        // Verificar autenticação SHA256
        if (!conteudo.includes('sha256')) {
            this.divergencias.push({
                tipo: 'User Manager',
                item: 'Autenticação',
                problema: 'Hash SHA256 não encontrado',
                criticidade: 'ALTA'
            });
        }

        // Verificar gestão de sessões
        if (!conteudo.includes('user_sessions')) {
            this.divergencias.push({
                tipo: 'User Manager',
                item: 'Sessões',
                problema: 'Gestão de sessões não implementada',
                criticidade: 'MÉDIA'
            });
        }

        console.log('   ✅ User Manager analisado');
    }

    async verificarTradingEngine(conteudo) {
        console.log('   🔍 Verificando Trading Engine...');

        // Verificar máximo de 2 posições
        if (!conteudo.includes('2') || !conteudo.match(/max.*pos.*2|posicoes.*max.*2/i)) {
            this.divergencias.push({
                tipo: 'Trading Engine',
                item: 'Máximo posições',
                problema: 'Limite de 2 posições não encontrado',
                criticidade: 'ALTA'
            });
        }

        // Verificar cálculo de TP/SL
        if (!conteudo.includes('alavancagem') || !conteudo.includes('stop_loss') || !conteudo.includes('take_profit')) {
            this.divergencias.push({
                tipo: 'Trading Engine',
                item: 'TP/SL',
                problema: 'Cálculo de TP/SL não implementado corretamente',
                criticidade: 'ALTA'
            });
        }

        // Verificar modo TESTNET
        if (!conteudo.includes('testnet') && !conteudo.includes('TESTNET')) {
            this.divergencias.push({
                tipo: 'Trading Engine',
                item: 'Modo TESTNET',
                problema: 'Implementação de TESTNET não encontrada',
                criticidade: 'ALTA'
            });
        }

        console.log('   ✅ Trading Engine analisado');
    }

    async verificarAIGuardian(conteudo) {
        console.log('   🔍 Verificando AI Guardian...');

        // Verificar supervisão (não autonomia)
        if (conteudo.includes('autonomous') || conteudo.includes('autonoma')) {
            this.divergencias.push({
                tipo: 'AI Guardian',
                item: 'Autonomia',
                problema: 'IA não deve ter autonomia para abrir/fechar operações',
                criticidade: 'CRÍTICA'
            });
        }

        // Verificar supervisão de todas as etapas
        const etapasCriticas = ['validacao', 'execucao', 'registro', 'comissionamento'];
        for (const etapa of etapasCriticas) {
            if (!conteudo.includes(etapa)) {
                this.divergencias.push({
                    tipo: 'AI Guardian',
                    item: `Supervisão ${etapa}`,
                    problema: `Supervisão de ${etapa} não encontrada`,
                    criticidade: 'ALTA'
                });
            }
        }

        // Verificar configuração OpenAI
        if (conteudo.includes('OpenAI não configurado')) {
            this.divergencias.push({
                tipo: 'AI Guardian',
                item: 'OpenAI',
                problema: 'OpenAI deve estar configurado - somos assinantes',
                criticidade: 'MÉDIA'
            });
        }

        console.log('   ✅ AI Guardian analisado');
    }

    async verificarSignalProcessor(conteudo) {
        console.log('   🔍 Verificando Signal Processor...');

        // Verificar Fear & Greed fallback = 50
        if (!conteudo.includes('50') || !conteudo.match(/fallback.*50|fg.*50|fear.*greed.*50/i)) {
            this.divergencias.push({
                tipo: 'Signal Processor',
                item: 'F&G Fallback',
                problema: 'Fallback F&G = 50 não encontrado',
                criticidade: 'MÉDIA'
            });
        }

        // Verificar janela de 30 segundos
        if (!conteudo.includes('30') || !conteudo.match(/30.*seg|30.*second/i)) {
            this.divergencias.push({
                tipo: 'Signal Processor',
                item: 'Janela validação',
                problema: 'Janela de 30 segundos não encontrada',
                criticidade: 'MÉDIA'
            });
        }

        // Verificar limpeza de sinais
        if (!conteudo.includes('limpeza') && !conteudo.includes('cleanup')) {
            this.divergencias.push({
                tipo: 'Signal Processor',
                item: 'Limpeza sinais',
                problema: 'Limpeza de sinais a cada 2h não encontrada',
                criticidade: 'MÉDIA'
            });
        }

        console.log('   ✅ Signal Processor analisado');
    }

    async verificarArquivoGenerico(nome, conteudo) {
        console.log(`   🔍 Verificando ${nome}...`);
        
        // Verificações gerais
        if (!conteudo.includes('module.exports')) {
            this.divergencias.push({
                tipo: 'Estrutura',
                item: nome,
                problema: 'Module.exports não encontrado',
                criticidade: 'BAIXA'
            });
        }

        console.log(`   ✅ ${nome} analisado`);
    }

    async verificarConfiguracaoPlanos() {
        console.log('\n💳 VERIFICANDO CONFIGURAÇÃO DE PLANOS');
        console.log('======================================');

        try {
            // Verificar se existe tabela de planos
            const result = await this.pool.query(`
                SELECT name, monthly_price, commission_rate, minimum_balance
                FROM plans
            `);

            if (result.rows.length === 0) {
                this.divergencias.push({
                    tipo: 'Planos',
                    item: 'Configuração',
                    problema: 'Nenhum plano configurado no banco',
                    criticidade: 'CRÍTICA'
                });
                return;
            }

            // Verificar cada plano
            for (const plano of result.rows) {
                console.log(`📋 Verificando plano: ${plano.name}`);
                
                const regraPlano = this.regrasOperacionais.planos[plano.name];
                if (!regraPlano) {
                    this.divergencias.push({
                        tipo: 'Planos',
                        item: plano.name,
                        problema: 'Plano não está nas regras operacionais',
                        criticidade: 'ALTA'
                    });
                    continue;
                }

                // Verificar comissão
                if (plano.commission_rate !== regraPlano.comissao) {
                    this.divergencias.push({
                        tipo: 'Planos',
                        item: `${plano.name} - Comissão`,
                        problema: `Comissão ${plano.commission_rate}% != ${regraPlano.comissao}%`,
                        criticidade: 'ALTA'
                    });
                }
            }

        } catch (error) {
            console.log(`⚠️ Erro ao verificar planos: ${error.message}`);
            this.divergencias.push({
                tipo: 'Planos',
                item: 'Verificação',
                problema: `Erro ao acessar tabela plans: ${error.message}`,
                criticidade: 'CRÍTICA'
            });
        }
    }

    async verificarComissionamento() {
        console.log('\n💰 VERIFICANDO SISTEMA DE COMISSIONAMENTO');
        console.log('==========================================');

        try {
            // Verificar estrutura de comissões
            const tabelasComissao = ['commissions', 'affiliate_commissions'];
            
            for (const tabela of tabelasComissao) {
                const exists = await this.pool.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = $1
                    );
                `, [tabela]);

                if (!exists.rows[0].exists) {
                    this.divergencias.push({
                        tipo: 'Comissionamento',
                        item: `Tabela ${tabela}`,
                        problema: 'Tabela de comissões não encontrada',
                        criticidade: 'CRÍTICA'
                    });
                }
            }

            // Verificar configuração de afiliados
            const resultAfiliados = await this.pool.query(`
                SELECT affiliate_level, commission_rate 
                FROM users 
                WHERE affiliate_level IS NOT NULL
            `);

            if (resultAfiliados.rows.length > 0) {
                console.log('✅ Sistema de afiliados configurado');
            } else {
                console.log('⚠️ Nenhum afiliado encontrado');
            }

        } catch (error) {
            console.log(`⚠️ Erro ao verificar comissionamento: ${error.message}`);
        }
    }

    async verificarSupervisaoIA() {
        console.log('\n🤖 VERIFICANDO SUPERVISÃO DA IA');
        console.log('================================');

        // Verificar se AI Guardian existe e está configurado
        const aiGuardianExists = fs.existsSync(path.join(__dirname, 'ai-guardian.js'));
        
        if (!aiGuardianExists) {
            this.divergencias.push({
                tipo: 'IA Supervisão',
                item: 'AI Guardian',
                problema: 'AI Guardian não encontrado',
                criticidade: 'CRÍTICA'
            });
        }

        // Verificar tabela ai_analysis
        try {
            await this.pool.query('SELECT * FROM ai_analysis LIMIT 1');
            console.log('✅ Tabela ai_analysis encontrada');
        } catch (error) {
            this.divergencias.push({
                tipo: 'IA Supervisão',
                item: 'Tabela ai_analysis',
                problema: 'Tabela de análises da IA não encontrada',
                criticidade: 'ALTA'
            });
        }

        // Verificar configuração OpenAI
        try {
            const configOpenAI = await this.pool.query(`
                SELECT config_value 
                FROM system_configurations 
                WHERE config_key = 'openai_api_key'
            `);

            if (configOpenAI.rows.length === 0) {
                this.divergencias.push({
                    tipo: 'IA Supervisão',
                    item: 'OpenAI API Key',
                    problema: 'API Key da OpenAI não configurada - somos assinantes',
                    criticidade: 'MÉDIA'
                });
            }
        } catch (error) {
            console.log(`⚠️ Erro ao verificar OpenAI: ${error.message}`);
        }
    }

    async verificarRegrasOperacionais() {
        console.log('\n⚙️ VERIFICANDO REGRAS OPERACIONAIS');
        console.log('===================================');

        // Verificar tabela de bloqueio de ticker
        try {
            await this.pool.query('SELECT * FROM bloqueio_ticker LIMIT 1');
            console.log('✅ Tabela bloqueio_ticker encontrada');
        } catch (error) {
            this.divergencias.push({
                tipo: 'Regras Operacionais',
                item: 'Bloqueio Ticker',
                problema: 'Tabela bloqueio_ticker não encontrada',
                criticidade: 'ALTA'
            });
        }

        // Verificar configurações do sistema
        const configsEssenciais = [
            { key: 'max_posicoes_usuario', valor_esperado: '2' },
            { key: 'bloqueio_ticker_horas', valor_esperado: '2' },
            { key: 'limpeza_sinais_horas', valor_esperado: '2' },
            { key: 'fallback_fg', valor_esperado: '50' },
            { key: 'alavancagem_padrao', valor_esperado: '5' }
        ];

        for (const config of configsEssenciais) {
            try {
                const result = await this.pool.query(`
                    SELECT config_value 
                    FROM system_configurations 
                    WHERE config_key = $1
                `, [config.key]);

                if (result.rows.length === 0) {
                    this.divergencias.push({
                        tipo: 'Configuração',
                        item: config.key,
                        problema: 'Configuração não encontrada',
                        criticidade: 'MÉDIA'
                    });
                } else if (result.rows[0].config_value !== config.valor_esperado) {
                    this.divergencias.push({
                        tipo: 'Configuração',
                        item: config.key,
                        problema: `Valor ${result.rows[0].config_value} != ${config.valor_esperado}`,
                        criticidade: 'MÉDIA'
                    });
                }
            } catch (error) {
                console.log(`⚠️ Erro ao verificar ${config.key}: ${error.message}`);
            }
        }
    }

    async gerarRelatorioFinal() {
        console.log('\n📊 GERANDO RELATÓRIO FINAL');
        console.log('===========================');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nomeRelatorio = `relatorio-revisao-${timestamp}.json`;

        const relatorioCompleto = {
            ...this.relatorio,
            timestamp: new Date().toISOString(),
            divergencias: this.divergencias,
            resumo: {
                total_verificacoes: this.relatorio.conformidades + this.relatorio.divergencias,
                percentual_conformidade: ((this.relatorio.conformidades / (this.relatorio.conformidades + this.relatorio.divergencias)) * 100).toFixed(2)
            }
        };

        // Salvar relatório
        fs.writeFileSync(nomeRelatorio, JSON.stringify(relatorioCompleto, null, 2));

        // Exibir resumo
        console.log(`\n📋 RESUMO DA REVISÃO:`);
        console.log(`   📁 Arquivos analisados: ${this.relatorio.arquivos_analisados}`);
        console.log(`   ✅ Conformidades: ${this.relatorio.conformidades}`);
        console.log(`   ❌ Divergências: ${this.relatorio.divergencias}`);
        console.log(`   📊 Conformidade: ${relatorioCompleto.resumo.percentual_conformidade}%`);

        // Listar divergências por criticidade
        console.log(`\n🚨 DIVERGÊNCIAS POR CRITICIDADE:`);
        const criticidades = ['CRÍTICA', 'ALTA', 'MÉDIA', 'BAIXA'];
        
        for (const criticidade of criticidades) {
            const divsCriticidade = this.divergencias.filter(d => d.criticidade === criticidade);
            if (divsCriticidade.length > 0) {
                console.log(`\n   🔴 ${criticidade} (${divsCriticidade.length}):`);
                divsCriticidade.forEach(div => {
                    console.log(`      • ${div.tipo} - ${div.item}: ${div.problema}`);
                });
            }
        }

        console.log(`\n💾 Relatório completo salvo em: ${nomeRelatorio}`);

        // Recomendações
        this.gerarRecomendacoes();
    }

    gerarRecomendacoes() {
        console.log(`\n💡 RECOMENDAÇÕES PRIORITÁRIAS:`);

        const criticasAltas = this.divergencias.filter(d => 
            d.criticidade === 'CRÍTICA' || d.criticidade === 'ALTA'
        );

        if (criticasAltas.length === 0) {
            console.log('   🎉 Nenhuma divergência crítica encontrada!');
            return;
        }

        const grupos = {};
        criticasAltas.forEach(div => {
            if (!grupos[div.tipo]) grupos[div.tipo] = [];
            grupos[div.tipo].push(div);
        });

        Object.keys(grupos).forEach((tipo, index) => {
            console.log(`   ${index + 1}. ${tipo}:`);
            grupos[tipo].forEach(div => {
                console.log(`      • Corrigir: ${div.item}`);
            });
        });
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const revisor = new RevisorCompleto();
    revisor.executarRevisao()
        .then(() => {
            console.log('\n🎉 REVISÃO COMPLETA CONCLUÍDA!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Falha na revisão:', error.message);
            process.exit(1);
        });
}

module.exports = RevisorCompleto;

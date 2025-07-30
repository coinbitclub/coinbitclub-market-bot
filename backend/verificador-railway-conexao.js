#!/usr/bin/env node

/**
 * 🚀 VERIFICADOR DE CONEXÃO RAILWAY - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Conecta diretamente com o Railway e verifica:
 * - Variáveis de ambiente disponíveis
 * - Conexões com APIs externas (OpenAI, Bybit, etc.)
 * - Status do banco de dados
 * - Preparação para operação real
 */

const { Pool } = require('pg');

class VerificadorRailwayConexao {
    constructor() {
        // Conexão direta com Railway PostgreSQL
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.resultados = {
            railway_conectado: false,
            variaveis_ambiente: {},
            apis_externas: {},
            banco_dados: {},
            sistema_pronto: false
        };
    }

    async executarVerificacao() {
        try {
            console.log('🚀 VERIFICADOR DE CONEXÃO RAILWAY');
            console.log('================================');
            console.log('📡 Conectando com Railway...\n');

            // 1. Verificar conexão com Railway
            await this.verificarConexaoRailway();

            // 2. Buscar variáveis de ambiente do banco (que vêm do Railway)
            await this.buscarVariaveisAmbiente();

            // 3. Testar conexões com APIs externas
            await this.testarAPIsExternas();

            // 4. Verificar status do banco de dados
            await this.verificarStatusBanco();

            // 5. Verificar sistema de usuários
            await this.verificarSistemaUsuarios();

            // 6. Relatório final de prontidão
            await this.gerarRelatorioFinal();

        } catch (error) {
            console.error('❌ Erro na verificação:', error.message);
            this.resultados.railway_conectado = false;
        } finally {
            await this.pool.end();
        }
    }

    async verificarConexaoRailway() {
        try {
            console.log('🔗 TESTANDO CONEXÃO COM RAILWAY');
            console.log('-------------------------------');

            // Testar conexão básica
            const teste = await this.pool.query('SELECT NOW() as timestamp, version() as postgres_version');
            const { timestamp, postgres_version } = teste.rows[0];

            console.log('✅ Railway PostgreSQL conectado com sucesso!');
            console.log(`📅 Timestamp: ${timestamp}`);
            console.log(`🐘 PostgreSQL: ${postgres_version.split(' ')[1]}`);
            
            this.resultados.railway_conectado = true;
            this.resultados.banco_dados.conectado = true;
            this.resultados.banco_dados.timestamp = timestamp;

        } catch (error) {
            console.log('❌ Falha na conexão com Railway:', error.message);
            this.resultados.railway_conectado = false;
        }
    }

    async buscarVariaveisAmbiente() {
        console.log('\n🔧 BUSCANDO VARIÁVEIS DE AMBIENTE DO RAILWAY');
        console.log('--------------------------------------------');

        try {
            // Buscar configurações do sistema que são espelho das variáveis do Railway
            const configs = await this.pool.query(`
                SELECT config_key, config_value, config_type, description 
                FROM system_configurations 
                WHERE is_active = true 
                ORDER BY config_type, config_key
            `);

            if (configs.rows.length === 0) {
                console.log('⚠️ Nenhuma configuração encontrada no banco');
                console.log('💡 Configurações devem ser sincronizadas do Railway');
                return;
            }

            // Agrupar por tipo
            const grupos = {
                bybit: [],
                openai: [],
                stripe: [],
                twilio: [],
                sistema: [],
                outros: []
            };

            configs.rows.forEach(config => {
                const { config_key, config_value, config_type } = config;
                
                // Mascarar valores sensíveis
                const valorMascarado = this.mascararValor(config_key, config_value);
                
                if (config_key.includes('bybit') || config_key.includes('BYBIT')) {
                    grupos.bybit.push({ key: config_key, value: valorMascarado, type: config_type });
                } else if (config_key.includes('openai') || config_key.includes('OPENAI')) {
                    grupos.openai.push({ key: config_key, value: valorMascarado, type: config_type });
                } else if (config_key.includes('stripe') || config_key.includes('STRIPE')) {
                    grupos.stripe.push({ key: config_key, value: valorMascarado, type: config_type });
                } else if (config_key.includes('twilio') || config_key.includes('TWILIO')) {
                    grupos.twilio.push({ key: config_key, value: valorMascarado, type: config_type });
                } else if (config_type === 'sistema') {
                    grupos.sistema.push({ key: config_key, value: valorMascarado, type: config_type });
                } else {
                    grupos.outros.push({ key: config_key, value: valorMascarado, type: config_type });
                }

                this.resultados.variaveis_ambiente[config_key] = {
                    configurado: !!config_value && config_value !== 'CONFIGURE_YOUR_KEY',
                    tipo: config_type
                };
            });

            // Mostrar resultados por grupo
            this.mostrarGrupoConfiguracoes('🔹 Bybit (Exchange)', grupos.bybit);
            this.mostrarGrupoConfiguracoes('🤖 OpenAI (IA)', grupos.openai);
            this.mostrarGrupoConfiguracoes('💳 Stripe (Pagamentos)', grupos.stripe);
            this.mostrarGrupoConfiguracoes('📱 Twilio (SMS/WhatsApp)', grupos.twilio);
            this.mostrarGrupoConfiguracoes('⚙️ Sistema', grupos.sistema);
            if (grupos.outros.length > 0) {
                this.mostrarGrupoConfiguracoes('📋 Outros', grupos.outros);
            }

        } catch (error) {
            console.log('❌ Erro ao buscar configurações:', error.message);
        }
    }

    mostrarGrupoConfiguracoes(titulo, configs) {
        if (configs.length === 0) return;

        console.log(`\n${titulo}:`);
        configs.forEach(config => {
            const status = config.value.includes('CONFIGURE_') || config.value.includes('***') ? '⚠️' : '✅';
            console.log(`   ${status} ${config.key}: ${config.value}`);
        });
    }

    mascararValor(key, value) {
        if (!value || value.includes('CONFIGURE_')) {
            return '❌ NÃO CONFIGURADO';
        }
        
        // Mascarar chaves sensíveis
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
            if (value.length > 10) {
                return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
            }
            return '****masked****';
        }
        
        return value;
    }

    async testarAPIsExternas() {
        console.log('\n🌐 TESTANDO CONEXÕES COM APIs EXTERNAS');
        console.log('--------------------------------------');

        // Buscar chaves do banco (que vêm do Railway)
        const configs = await this.pool.query(`
            SELECT config_key, config_value 
            FROM system_configurations 
            WHERE config_key IN ('openai_api_key', 'bybit_api_key', 'stripe_secret_key')
            AND is_active = true
        `);

        const chaves = {};
        configs.rows.forEach(row => {
            chaves[row.config_key] = row.config_value;
        });

        // Testar OpenAI
        await this.testarOpenAI(chaves.openai_api_key);
        
        // Testar Bybit
        await this.testarBybit(chaves.bybit_api_key);
        
        // Testar Stripe
        await this.testarStripe(chaves.stripe_secret_key);
    }

    async testarOpenAI(apiKey) {
        console.log('\n🤖 Testando OpenAI...');
        
        if (!apiKey || apiKey.includes('CONFIGURE_')) {
            console.log('   ❌ OpenAI API Key não configurada');
            this.resultados.apis_externas.openai = { status: 'not_configured' };
            return;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ OpenAI conectado (${data.data?.length || 0} modelos disponíveis)`);
                this.resultados.apis_externas.openai = { 
                    status: 'connected', 
                    models: data.data?.length || 0 
                };
            } else {
                console.log(`   ❌ OpenAI erro: ${response.status} - ${response.statusText}`);
                this.resultados.apis_externas.openai = { 
                    status: 'error', 
                    error: `${response.status} ${response.statusText}` 
                };
            }
        } catch (error) {
            console.log(`   ❌ OpenAI falha de conexão: ${error.message}`);
            this.resultados.apis_externas.openai = { status: 'connection_error', error: error.message };
        }
    }

    async testarBybit(apiKey) {
        console.log('\n🔹 Testando Bybit...');
        
        if (!apiKey || apiKey.includes('CONFIGURE_')) {
            console.log('   ❌ Bybit API Key não configurada');
            this.resultados.apis_externas.bybit = { status: 'not_configured' };
            return;
        }

        try {
            // Teste básico do endpoint público do Bybit
            const response = await fetch('https://api.bybit.com/v5/market/time');
            
            if (response.ok) {
                const data = await response.json();
                console.log('   ✅ Bybit endpoint público acessível');
                console.log(`   📅 Server time: ${new Date(parseInt(data.result.timeNano) / 1000000)}`);
                this.resultados.apis_externas.bybit = { status: 'public_ok', server_time: data.result.timeNano };
            } else {
                console.log(`   ❌ Bybit erro: ${response.status}`);
                this.resultados.apis_externas.bybit = { status: 'error', error: response.status };
            }
        } catch (error) {
            console.log(`   ❌ Bybit falha de conexão: ${error.message}`);
            this.resultados.apis_externas.bybit = { status: 'connection_error', error: error.message };
        }
    }

    async testarStripe(secretKey) {
        console.log('\n💳 Testando Stripe...');
        
        if (!secretKey || secretKey.includes('CONFIGURE_')) {
            console.log('   ❌ Stripe Secret Key não configurada');
            this.resultados.apis_externas.stripe = { status: 'not_configured' };
            return;
        }

        // Apenas verificar se a chave tem formato válido
        if (secretKey.startsWith('sk_')) {
            console.log('   ✅ Stripe Secret Key tem formato válido');
            this.resultados.apis_externas.stripe = { status: 'key_format_ok' };
        } else {
            console.log('   ⚠️ Stripe Secret Key formato inválido');
            this.resultados.apis_externas.stripe = { status: 'invalid_format' };
        }
    }

    async verificarStatusBanco() {
        console.log('\n🗄️ VERIFICANDO STATUS DO BANCO DE DADOS');
        console.log('---------------------------------------');

        try {
            // Contar tabelas
            const tabelas = await this.pool.query(`
                SELECT COUNT(*) as total 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);

            // Contar usuários
            const usuarios = await this.pool.query('SELECT COUNT(*) as total FROM users');
            
            // Contar sinais
            const sinais = await this.pool.query('SELECT COUNT(*) as total FROM signals');
            
            // Contar operações
            const operacoes = await this.pool.query('SELECT COUNT(*) as total FROM trading_operations');

            console.log(`📊 Tabelas: ${tabelas.rows[0].total}`);
            console.log(`👥 Usuários: ${usuarios.rows[0].total}`);
            console.log(`📡 Sinais: ${sinais.rows[0].total}`);
            console.log(`💹 Operações: ${operacoes.rows[0].total}`);

            this.resultados.banco_dados = {
                ...this.resultados.banco_dados,
                tabelas: parseInt(tabelas.rows[0].total),
                usuarios: parseInt(usuarios.rows[0].total),
                sinais: parseInt(sinais.rows[0].total),
                operacoes: parseInt(operacoes.rows[0].total)
            };

        } catch (error) {
            console.log('❌ Erro ao verificar banco:', error.message);
        }
    }

    async verificarSistemaUsuarios() {
        console.log('\n👥 VERIFICANDO SISTEMA DE USUÁRIOS');
        console.log('----------------------------------');

        try {
            // Verificar usuários por plano
            const planos = await this.pool.query(`
                SELECT plan_type, COUNT(*) as total 
                FROM users 
                WHERE plan_type IS NOT NULL 
                GROUP BY plan_type 
                ORDER BY total DESC
            `);

            console.log('📋 Usuários por plano:');
            planos.rows.forEach(plano => {
                console.log(`   ${plano.plan_type}: ${plano.total} usuários`);
            });

            // Verificar usuários com chaves API
            const comChaves = await this.pool.query(`
                SELECT COUNT(DISTINCT u.id) as total 
                FROM users u 
                JOIN user_api_keys uak ON u.id = uak.user_id 
                WHERE uak.is_active = true
            `);

            console.log(`🔑 Usuários com chaves API: ${comChaves.rows[0].total}`);

        } catch (error) {
            console.log('❌ Erro ao verificar usuários:', error.message);
        }
    }

    async gerarRelatorioFinal() {
        console.log('\n🎯 RELATÓRIO FINAL DE PRONTIDÃO PARA OPERAÇÃO REAL');
        console.log('================================================');

        // Verificar se sistema está pronto
        const railwayOK = this.resultados.railway_conectado;
        const bancoOK = this.resultados.banco_dados.conectado && this.resultados.banco_dados.usuarios > 0;
        const openaiOK = this.resultados.apis_externas.openai?.status === 'connected';
        const bybitOK = this.resultados.apis_externas.bybit?.status === 'public_ok';

        console.log('\n📊 CHECKLIST DE PRONTIDÃO:');
        console.log(`${railwayOK ? '✅' : '❌'} Railway PostgreSQL conectado`);
        console.log(`${bancoOK ? '✅' : '❌'} Banco com dados (${this.resultados.banco_dados.usuarios || 0} usuários)`);
        console.log(`${openaiOK ? '✅' : '❌'} OpenAI configurado e funcionando`);
        console.log(`${bybitOK ? '✅' : '❌'} Bybit endpoint acessível`);

        const sistemasProntos = [railwayOK, bancoOK, openaiOK, bybitOK].filter(Boolean).length;
        const porcentagem = (sistemasProntos / 4) * 100;

        console.log(`\n🎯 PRONTIDÃO GERAL: ${sistemasProntos}/4 (${porcentagem}%)`);

        if (porcentagem >= 100) {
            console.log('🟢 STATUS: SISTEMA PRONTO PARA OPERAÇÃO REAL!');
            this.resultados.sistema_pronto = true;
        } else if (porcentagem >= 75) {
            console.log('🟡 STATUS: QUASE PRONTO - Pequenos ajustes necessários');
        } else {
            console.log('🔴 STATUS: REQUER CONFIGURAÇÃO - Itens críticos faltando');
        }

        console.log('\n📋 PRÓXIMOS PASSOS:');
        if (!openaiOK) {
            console.log('   1. ✅ Verificar se OPENAI_API_KEY está correta no Railway');
        }
        if (!bybitOK) {
            console.log('   2. ✅ Verificar conectividade com Bybit');
        }
        if (this.resultados.sistema_pronto) {
            console.log('   🚀 SISTEMA PRONTO PARA COMEÇAR OPERAÇÃO REAL!');
        }

        // Salvar resultado final no banco
        await this.salvarResultadoVerificacao();
    }

    async salvarResultadoVerificacao() {
        try {
            await this.pool.query(`
                INSERT INTO system_logs (log_level, component, message, metadata)
                VALUES ('INFO', 'VerificadorRailway', 'Verificação de prontidão concluída', $1)
            `, [JSON.stringify(this.resultados)]);
        } catch (error) {
            console.log('⚠️ Não foi possível salvar log da verificação');
        }
    }
}

// Executar verificação
if (require.main === module) {
    const verificador = new VerificadorRailwayConexao();
    verificador.executarVerificacao()
        .then(() => {
            console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Falha na verificação:', error.message);
            process.exit(1);
        });
}

module.exports = VerificadorRailwayConexao;

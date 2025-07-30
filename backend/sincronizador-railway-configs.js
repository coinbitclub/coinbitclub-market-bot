#!/usr/bin/env node

/**
 * 🔄 SINCRONIZADOR DE CONFIGURAÇÕES RAILWAY - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Sincroniza as variáveis de ambiente do Railway com o banco de dados
 * e prepara o sistema para operação real.
 */

const { Pool } = require('pg');

class SincronizadorRailwayConfigs {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        // Configurações que devem estar no Railway
        this.configsRailway = [
            // OpenAI (CRÍTICO)
            { key: 'OPENAI_API_KEY', type: 'ai', required: true, description: 'Chave API OpenAI - OBRIGATÓRIA para IA avançada' },
            { key: 'OPENAI_ORG_ID', type: 'ai', required: false, description: 'ID da organização OpenAI' },
            
            // Bybit (CRÍTICO)
            { key: 'BYBIT_API_KEY', type: 'exchange', required: true, description: 'Chave API Bybit - OBRIGATÓRIA para trading' },
            { key: 'BYBIT_SECRET_KEY', type: 'exchange', required: true, description: 'Chave secreta Bybit - OBRIGATÓRIA para trading' },
            { key: 'BYBIT_TESTNET', type: 'exchange', required: false, description: 'Usar testnet Bybit (true/false)' },
            
            // Stripe (CRÍTICO)
            { key: 'STRIPE_SECRET_KEY', type: 'payment', required: true, description: 'Chave secreta Stripe - OBRIGATÓRIA para pagamentos' },
            { key: 'STRIPE_PUBLISHABLE_KEY', type: 'payment', required: false, description: 'Chave pública Stripe' },
            { key: 'STRIPE_WEBHOOK_SECRET', type: 'payment', required: false, description: 'Secret para webhooks Stripe' },
            
            // Twilio (OPCIONAL)
            { key: 'TWILIO_ACCOUNT_SID', type: 'communication', required: false, description: 'SID da conta Twilio' },
            { key: 'TWILIO_AUTH_TOKEN', type: 'communication', required: false, description: 'Token de autenticação Twilio' },
            { key: 'TWILIO_PHONE_NUMBER', type: 'communication', required: false, description: 'Número de telefone Twilio' },
            
            // Sistema
            { key: 'NODE_ENV', type: 'system', required: false, description: 'Ambiente (production/development)' },
            { key: 'PORT', type: 'system', required: false, description: 'Porta do servidor' },
            { key: 'DATABASE_URL', type: 'system', required: true, description: 'URL do banco PostgreSQL' }
        ];
    }

    async executarSincronizacao() {
        try {
            console.log('🔄 SINCRONIZADOR DE CONFIGURAÇÕES RAILWAY');
            console.log('=======================================');
            console.log('📡 Conectando com Railway e banco...\n');

            // 1. Verificar conexão
            await this.verificarConexao();

            // 2. Buscar variáveis de ambiente atuais do processo (vindas do Railway)
            await this.buscarVariaveisRailway();

            // 3. Sincronizar com banco de dados
            await this.sincronizarComBanco();

            // 4. Verificar configurações críticas
            await this.verificarConfigsCriticas();

            // 5. Gerar relatório de prontidão
            await this.gerarRelatorioProntidao();

        } catch (error) {
            console.error('❌ Erro na sincronização:', error.message);
        } finally {
            await this.pool.end();
        }
    }

    async verificarConexao() {
        try {
            const teste = await this.pool.query('SELECT NOW() as timestamp');
            console.log(`✅ Conectado ao Railway PostgreSQL: ${teste.rows[0].timestamp}`);
        } catch (error) {
            throw new Error(`Falha na conexão com Railway: ${error.message}`);
        }
    }

    async buscarVariaveisRailway() {
        console.log('\n🔍 VERIFICANDO VARIÁVEIS DO RAILWAY');
        console.log('----------------------------------');

        const encontradas = [];
        const faltantes = [];

        for (const config of this.configsRailway) {
            const valor = process.env[config.key];
            
            if (valor) {
                encontradas.push({
                    ...config,
                    valor: this.mascararValor(config.key, valor),
                    valorReal: valor
                });
                console.log(`✅ ${config.key}: ${this.mascararValor(config.key, valor)}`);
            } else {
                faltantes.push(config);
                const status = config.required ? '❌ CRÍTICA' : '⚠️ OPCIONAL';
                console.log(`${status} ${config.key}: NÃO CONFIGURADA`);
            }
        }

        this.encontradas = encontradas;
        this.faltantes = faltantes;

        console.log(`\n📊 Resumo: ${encontradas.length} encontradas, ${faltantes.length} faltantes`);
    }

    mascararValor(key, valor) {
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
            if (valor.length > 10) {
                return `${valor.substring(0, 8)}...${valor.substring(valor.length - 4)}`;
            }
            return '****masked****';
        }
        return valor;
    }

    async sincronizarComBanco() {
        console.log('\n🔄 SINCRONIZANDO COM BANCO DE DADOS');
        console.log('----------------------------------');

        let sincronizadas = 0;
        let atualizadas = 0;

        for (const config of this.encontradas) {
            try {
                // Verificar se já existe
                const existe = await this.pool.query(
                    'SELECT id FROM system_configurations WHERE config_key = $1',
                    [config.key.toLowerCase()]
                );

                if (existe.rows.length > 0) {
                    // Atualizar
                    await this.pool.query(`
                        UPDATE system_configurations 
                        SET config_value = $1, config_type = $2, description = $3, updated_at = NOW()
                        WHERE config_key = $4
                    `, [config.valorReal, config.type, config.description, config.key.toLowerCase()]);
                    
                    console.log(`🔄 Atualizado: ${config.key}`);
                    atualizadas++;
                } else {
                    // Inserir novo
                    await this.pool.query(`
                        INSERT INTO system_configurations (config_key, config_value, config_type, description)
                        VALUES ($1, $2, $3, $4)
                    `, [config.key.toLowerCase(), config.valorReal, config.type, config.description]);
                    
                    console.log(`✅ Inserido: ${config.key}`);
                    sincronizadas++;
                }
            } catch (error) {
                console.log(`❌ Erro ao sincronizar ${config.key}: ${error.message}`);
            }
        }

        console.log(`\n📊 Sincronização: ${sincronizadas} inseridas, ${atualizadas} atualizadas`);
    }

    async verificarConfigsCriticas() {
        console.log('\n🔍 VERIFICANDO CONFIGURAÇÕES CRÍTICAS');
        console.log('------------------------------------');

        const criticas = this.configsRailway.filter(c => c.required);
        const criticasFaltantes = this.faltantes.filter(c => c.required);

        console.log(`📋 Configurações críticas: ${criticas.length} necessárias`);
        console.log(`❌ Críticas faltantes: ${criticasFaltantes.length}`);

        if (criticasFaltantes.length > 0) {
            console.log('\n🔴 CONFIGURAÇÕES CRÍTICAS FALTANTES:');
            criticasFaltantes.forEach(config => {
                console.log(`   ❌ ${config.key} (${config.type}): ${config.description}`);
            });

            console.log('\n📋 INSTRUÇÕES PARA CONFIGURAR NO RAILWAY:');
            console.log('1. Acesse o dashboard do Railway');
            console.log('2. Vá em Variables no seu projeto');
            console.log('3. Adicione as seguintes variáveis:');
            console.log('');
            
            criticasFaltantes.forEach(config => {
                console.log(`   ${config.key}=SEU_VALOR_AQUI  # ${config.description}`);
            });
        } else {
            console.log('✅ Todas as configurações críticas estão presentes!');
        }
    }

    async gerarRelatorioProntidao() {
        console.log('\n🎯 RELATÓRIO DE PRONTIDÃO PARA OPERAÇÃO REAL');
        console.log('==========================================');

        const totalConfigs = this.configsRailway.length;
        const configuradas = this.encontradas.length;
        const criticasFaltantes = this.faltantes.filter(c => c.required).length;
        const porcentagem = Math.round((configuradas / totalConfigs) * 100);

        console.log(`📊 Configurações: ${configuradas}/${totalConfigs} (${porcentagem}%)`);
        console.log(`🔴 Críticas faltantes: ${criticasFaltantes}`);

        // Testar APIs configuradas
        await this.testarAPIsConfiguradas();

        // Status geral
        let statusGeral;
        if (criticasFaltantes === 0) {
            statusGeral = '🟢 SISTEMA PRONTO PARA OPERAÇÃO REAL!';
        } else if (criticasFaltantes <= 2) {
            statusGeral = '🟡 QUASE PRONTO - Poucas configurações faltando';
        } else {
            statusGeral = '🔴 REQUER CONFIGURAÇÃO - Muitos itens críticos faltando';
        }

        console.log(`\n${statusGeral}`);

        // Próximos passos
        console.log('\n📋 PRÓXIMOS PASSOS:');
        if (criticasFaltantes > 0) {
            console.log('   1. Configure as variáveis críticas no Railway');
            console.log('   2. Execute este script novamente');
            console.log('   3. Verifique conectividade das APIs');
        } else {
            console.log('   1. ✅ Execute: node verificador-railway-conexao.js');
            console.log('   2. ✅ Execute: node ativador-operacao-real.js');
            console.log('   3. 🚀 Inicie o bot: npm start');
        }

        // Salvar relatório no banco
        await this.salvarRelatorio({
            total_configs: totalConfigs,
            configuradas: configuradas,
            criticas_faltantes: criticasFaltantes,
            porcentagem: porcentagem,
            status: statusGeral,
            timestamp: new Date()
        });
    }

    async testarAPIsConfiguradas() {
        console.log('\n🌐 TESTANDO APIs CONFIGURADAS');
        console.log('----------------------------');

        // Testar OpenAI
        const openaiKey = this.encontradas.find(c => c.key === 'OPENAI_API_KEY');
        if (openaiKey) {
            await this.testarOpenAI(openaiKey.valorReal);
        } else {
            console.log('⚠️ OpenAI: Não configurada');
        }

        // Testar Bybit
        const bybitKey = this.encontradas.find(c => c.key === 'BYBIT_API_KEY');
        if (bybitKey) {
            console.log('✅ Bybit: Configurada (teste de auth requer secret)');
        } else {
            console.log('⚠️ Bybit: Não configurada');
        }

        // Testar Stripe
        const stripeKey = this.encontradas.find(c => c.key === 'STRIPE_SECRET_KEY');
        if (stripeKey) {
            console.log('✅ Stripe: Configurada (formato válido)');
        } else {
            console.log('⚠️ Stripe: Não configurada');
        }
    }

    async testarOpenAI(apiKey) {
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
                console.log(`✅ OpenAI: Conectada (${data.data?.length || 0} modelos)`);
            } else {
                console.log(`❌ OpenAI: Erro ${response.status} - Verificar chave`);
            }
        } catch (error) {
            console.log(`❌ OpenAI: Falha de conexão - ${error.message}`);
        }
    }

    async salvarRelatorio(relatorio) {
        try {
            await this.pool.query(`
                INSERT INTO system_logs (log_level, component, message, metadata)
                VALUES ('INFO', 'SincronizadorRailway', 'Relatório de sincronização', $1)
            `, [JSON.stringify(relatorio)]);
        } catch (error) {
            console.log('⚠️ Não foi possível salvar relatório no banco');
        }
    }
}

// Executar sincronização
if (require.main === module) {
    const sincronizador = new SincronizadorRailwayConfigs();
    sincronizador.executarSincronizacao()
        .then(() => {
            console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Falha na sincronização:', error.message);
            process.exit(1);
        });
}

module.exports = SincronizadorRailwayConfigs;

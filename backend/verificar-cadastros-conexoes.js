/**
 * 🔍 VERIFICAÇÃO COMPLETA DOS CADASTROS E CONEXÕES
 * Teste dos usuários Érica e Luiza com validação das operadoras
 */

const { Pool } = require('pg');
const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');

console.log('🔍 VERIFICAÇÃO DOS CADASTROS E CONEXÕES');
console.log('=======================================');

class VerificadorCadastros {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        this.gestor = new GestorChavesAPI();
    }

    async executarVerificacao() {
        const client = await this.pool.connect();
        try {
            console.log('🔍 Iniciando verificação completa...\n');
            
            // 1. Verificar dados dos usuários
            await this.verificarUsuarios(client);
            
            // 2. Verificar chaves API
            await this.verificarChavesAPI(client);
            
            // 3. Verificar parametrizações
            await this.verificarParametrizacoes(client);
            
            // 4. Verificar saldos
            await this.verificarSaldos(client);
            
            // 5. Testar conexões com operadoras
            await this.testarConexoesOperadoras();
            
            // 6. Teste funcional completo
            await this.testeCompletoSistema();
            
        } catch (error) {
            console.error('❌ Erro durante verificação:', error.message);
        } finally {
            client.release();
            await this.pool.end();
        }
    }

    async verificarUsuarios(client) {
        console.log('👤 1. VERIFICAÇÃO DOS USUÁRIOS ÉRICA E LUIZA');
        console.log('============================================');
        
        try {
            // Buscar usuários específicos
            const usuarios = await client.query(`
                SELECT 
                    id, 
                    username, 
                    email, 
                    name,
                    full_name,
                    phone,
                    whatsapp,
                    role, 
                    status, 
                    vip_status,
                    COALESCE(balance_usd, 0) as balance_usd,
                    created_at
                FROM users 
                WHERE username ILIKE '%erica%' OR username ILIKE '%luiza%'
                ORDER BY id;
            `);
            
            console.log(`👥 Usuários encontrados: ${usuarios.rows.length}\n`);
            
            usuarios.rows.forEach(user => {
                console.log(`📋 USUÁRIO: ${user.username} (ID: ${user.id})`);
                console.log(`   📧 Email: ${user.email || 'Não informado'}`);
                console.log(`   👤 Nome: ${user.name || user.full_name || 'Não informado'}`);
                console.log(`   📱 WhatsApp: ${user.whatsapp || user.phone || 'Não informado'}`);
                console.log(`   🎭 Role: ${user.role || 'Não definido'}`);
                console.log(`   📊 Status: ${user.status || 'Não definido'}`);
                console.log(`   🌟 VIP: ${user.vip_status ? 'SIM' : 'NÃO'}`);
                console.log(`   💰 Saldo: $${parseFloat(user.balance_usd).toFixed(2)}`);
                console.log(`   📅 Criado: ${user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}`);
                console.log('');
            });
            
            return usuarios.rows;
            
        } catch (error) {
            console.error(`❌ Erro ao verificar usuários: ${error.message}`);
            return [];
        }
    }

    async verificarChavesAPI(client) {
        console.log('🔑 2. VERIFICAÇÃO DAS CHAVES API');
        console.log('================================');
        
        try {
            const chaves = await client.query(`
                SELECT 
                    uak.id,
                    u.username,
                    uak.user_id,
                    uak.exchange,
                    uak.environment,
                    uak.is_active,
                    uak.validation_status,
                    uak.last_validated_at,
                    uak.created_at,
                    LENGTH(uak.api_key) as api_key_length,
                    LENGTH(uak.secret_key) as secret_key_length
                FROM user_api_keys uak
                JOIN users u ON uak.user_id = u.id
                WHERE u.username ILIKE '%erica%' OR u.username ILIKE '%luiza%'
                ORDER BY u.username, uak.exchange;
            `);
            
            console.log(`🔑 Chaves API encontradas: ${chaves.rows.length}\n`);
            
            if (chaves.rows.length === 0) {
                console.log('⚠️  NENHUMA CHAVE API ENCONTRADA para Érica ou Luiza!');
                console.log('   💡 Recomendação: Configurar chaves API para os usuários\n');
                return [];
            }
            
            chaves.rows.forEach(chave => {
                console.log(`🔑 CHAVE: ${chave.username} - ${chave.exchange}`);
                console.log(`   🆔 ID: ${chave.id}`);
                console.log(`   🌐 Ambiente: ${chave.environment || 'mainnet'}`);
                console.log(`   ✅ Ativa: ${chave.is_active ? 'SIM' : 'NÃO'}`);
                console.log(`   🔍 Validação: ${chave.validation_status || 'pending'}`);
                console.log(`   📅 Última validação: ${chave.last_validated_at ? new Date(chave.last_validated_at).toLocaleString('pt-BR') : 'Nunca'}`);
                console.log(`   🔐 API Key: ${chave.api_key_length} caracteres`);
                console.log(`   🔒 Secret: ${chave.secret_key_length} caracteres`);
                console.log(`   📅 Criada: ${new Date(chave.created_at).toLocaleDateString('pt-BR')}`);
                console.log('');
            });
            
            return chaves.rows;
            
        } catch (error) {
            console.error(`❌ Erro ao verificar chaves API: ${error.message}`);
            return [];
        }
    }

    async verificarParametrizacoes(client) {
        console.log('⚙️  3. VERIFICAÇÃO DAS PARAMETRIZAÇÕES');
        console.log('======================================');
        
        try {
            const params = await client.query(`
                SELECT 
                    utp.id,
                    u.username,
                    utp.user_id,
                    utp.alavancagem,
                    utp.valor_minimo_trade,
                    utp.valor_maximo_trade,
                    utp.percentual_saldo,
                    utp.take_profit_multiplier,
                    utp.stop_loss_multiplier,
                    utp.max_operacoes_diarias,
                    utp.exchanges_ativas,
                    utp.created_at,
                    utp.updated_at
                FROM user_trading_params utp
                JOIN users u ON utp.user_id = u.id
                WHERE u.username ILIKE '%erica%' OR u.username ILIKE '%luiza%'
                ORDER BY u.username;
            `);
            
            console.log(`⚙️  Parametrizações encontradas: ${params.rows.length}\n`);
            
            params.rows.forEach(param => {
                const exchanges = typeof param.exchanges_ativas === 'string' 
                    ? param.exchanges_ativas 
                    : JSON.stringify(param.exchanges_ativas);
                
                console.log(`⚙️  PARÂMETROS: ${param.username} (ID: ${param.user_id})`);
                console.log(`   ⚡ Alavancagem: ${param.alavancagem}x`);
                console.log(`   💵 Valor mínimo: $${parseFloat(param.valor_minimo_trade).toFixed(2)}`);
                console.log(`   💰 Valor máximo: $${parseFloat(param.valor_maximo_trade).toFixed(2)}`);
                console.log(`   📊 Percentual saldo: ${parseFloat(param.percentual_saldo).toFixed(2)}%`);
                console.log(`   🎯 TP Multiplier: ${parseFloat(param.take_profit_multiplier).toFixed(2)}x`);
                console.log(`   🛡️  SL Multiplier: ${parseFloat(param.stop_loss_multiplier).toFixed(2)}x`);
                console.log(`   📅 Max operações/dia: ${param.max_operacoes_diarias}`);
                console.log(`   🔗 Exchanges: ${exchanges}`);
                console.log(`   📅 Criado: ${new Date(param.created_at).toLocaleDateString('pt-BR')}`);
                console.log(`   🔄 Atualizado: ${new Date(param.updated_at).toLocaleDateString('pt-BR')}`);
                console.log('');
            });
            
            return params.rows;
            
        } catch (error) {
            console.error(`❌ Erro ao verificar parametrizações: ${error.message}`);
            return [];
        }
    }

    async verificarSaldos(client) {
        console.log('💰 4. VERIFICAÇÃO DOS SALDOS');
        console.log('============================');
        
        try {
            const saldos = await client.query(`
                SELECT 
                    u.username,
                    ub.user_id,
                    ub.exchange,
                    ub.currency,
                    ub.available_balance,
                    ub.locked_balance,
                    ub.total_balance,
                    ub.last_updated
                FROM user_balances ub
                JOIN users u ON ub.user_id = u.id
                WHERE u.username ILIKE '%erica%' OR u.username ILIKE '%luiza%'
                ORDER BY u.username, ub.currency;
            `);
            
            console.log(`💰 Registros de saldo encontrados: ${saldos.rows.length}\n`);
            
            // Agrupar por usuário
            const saldosPorUsuario = {};
            saldos.rows.forEach(saldo => {
                if (!saldosPorUsuario[saldo.username]) {
                    saldosPorUsuario[saldo.username] = [];
                }
                saldosPorUsuario[saldo.username].push(saldo);
            });
            
            Object.keys(saldosPorUsuario).forEach(username => {
                const userSaldos = saldosPorUsuario[username];
                console.log(`💰 SALDOS: ${username}`);
                
                userSaldos.forEach(saldo => {
                    const disponivel = parseFloat(saldo.available_balance).toFixed(8);
                    const bloqueado = parseFloat(saldo.locked_balance || 0).toFixed(8);
                    const total = parseFloat(saldo.total_balance || saldo.available_balance).toFixed(8);
                    
                    console.log(`   ${saldo.currency === 'USDT' ? '💵' : '🪙'} ${saldo.currency}:`);
                    console.log(`     📍 Exchange: ${saldo.exchange}`);
                    console.log(`     💚 Disponível: ${disponivel}`);
                    console.log(`     🔒 Bloqueado: ${bloqueado}`);
                    console.log(`     📊 Total: ${total}`);
                    console.log(`     🕐 Atualizado: ${saldo.last_updated ? new Date(saldo.last_updated).toLocaleString('pt-BR') : 'N/A'}`);
                });
                console.log('');
            });
            
            return saldos.rows;
            
        } catch (error) {
            console.error(`❌ Erro ao verificar saldos: ${error.message}`);
            return [];
        }
    }

    async testarConexoesOperadoras() {
        console.log('🔗 5. TESTE DE CONEXÕES COM OPERADORAS');
        console.log('======================================');
        
        try {
            // Buscar usuários com chaves configuradas
            const client = await this.pool.connect();
            const usuariosComChaves = await client.query(`
                SELECT DISTINCT u.id, u.username, u.email
                FROM users u
                JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE (u.username ILIKE '%erica%' OR u.username ILIKE '%luiza%')
                AND uak.is_active = true;
            `);
            client.release();
            
            console.log(`👥 Usuários com chaves para testar: ${usuariosComChaves.rows.length}\n`);
            
            if (usuariosComChaves.rows.length === 0) {
                console.log('⚠️  NENHUM USUÁRIO COM CHAVES ATIVAS ENCONTRADO!');
                console.log('   💡 Configure chaves API para Érica e/ou Luiza primeiro\n');
                return false;
            }
            
            for (const usuario of usuariosComChaves.rows) {
                console.log(`🧪 TESTANDO: ${usuario.username} (ID: ${usuario.id})`);
                console.log('======================================');
                
                // Testar cada exchange
                const exchanges = ['binance', 'bybit'];
                
                for (const exchange of exchanges) {
                    try {
                        console.log(`\n🔗 Testando ${exchange.toUpperCase()}...`);
                        
                        // Tentar obter chaves
                        const chaves = await this.gestor.obterChavesParaTrading(usuario.id, exchange);
                        console.log(`   ✅ Chaves obtidas: ${chaves.source}`);
                        
                        // Testar conexão real se for chave do usuário
                        if (chaves.source === 'USER_DATABASE') {
                            console.log(`   🔍 Validando chaves do usuário...`);
                            
                            const validacao = await this.gestor.validarChavesAPI(
                                chaves.apiKey, 
                                chaves.apiSecret, 
                                exchange, 
                                chaves.testnet
                            );
                            
                            if (validacao.valida) {
                                console.log(`   ✅ Chaves válidas!`);
                                console.log(`   📊 Permissões: ${validacao.permissoes.join(', ')}`);
                                console.log(`   💰 Moedas encontradas: ${Object.keys(validacao.saldo).length}`);
                                
                                // Mostrar saldos principais
                                Object.keys(validacao.saldo).slice(0, 3).forEach(moeda => {
                                    const saldo = validacao.saldo[moeda];
                                    console.log(`     ${moeda}: ${saldo.disponivel || saldo.total || 0}`);
                                });
                            } else {
                                console.log(`   ❌ Chaves inválidas: ${validacao.erro}`);
                            }
                        } else {
                            console.log(`   ℹ️  Usando chaves do sistema (Railway)`);
                        }
                        
                    } catch (error) {
                        console.log(`   ❌ Erro ao testar ${exchange}: ${error.message}`);
                    }
                }
                
                console.log('\n');
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao testar conexões: ${error.message}`);
            return false;
        }
    }

    async testeCompletoSistema() {
        console.log('🎯 6. TESTE COMPLETO DO SISTEMA MULTIUSUÁRIO');
        console.log('============================================');
        
        try {
            // Buscar IDs dos usuários
            const client = await this.pool.connect();
            const usuarios = await client.query(`
                SELECT id, username, email 
                FROM users 
                WHERE username ILIKE '%erica%' OR username ILIKE '%luiza%'
                ORDER BY username;
            `);
            client.release();
            
            for (const usuario of usuarios.rows) {
                console.log(`\n🧪 TESTE COMPLETO: ${usuario.username}`);
                console.log('=====================================');
                
                try {
                    // 1. Obter dados completos
                    console.log('📊 1. Obtendo dados completos...');
                    const dadosCompletos = await this.gestor.obterDadosUsuarioParaTrading(usuario.id);
                    
                    console.log(`   ✅ Usuário: ${dadosCompletos.usuario.username}`);
                    console.log(`   📧 Email: ${dadosCompletos.usuario.email}`);
                    console.log(`   🎭 Role: ${dadosCompletos.usuario.role}`);
                    console.log(`   📊 Exchanges disponíveis: ${dadosCompletos.exchangesConfiguradas.join(', ')}`);
                    
                    // 2. Testar parâmetros
                    console.log('\n⚙️  2. Testando parâmetros...');
                    if (dadosCompletos.parametrizacoes && dadosCompletos.parametrizacoes.db_fields) {
                        const params = dadosCompletos.parametrizacoes.db_fields;
                        console.log(`   ⚡ Alavancagem: ${params.alavancagem}x`);
                        console.log(`   💰 Percentual: ${params.percentual_saldo}%`);
                        console.log(`   💵 Min/Max: $${params.valor_minimo_trade} - $${params.valor_maximo_trade}`);
                        console.log(`   📅 Max ops/dia: ${params.max_operacoes_diarias}`);
                    }
                    
                    // 3. Testar cálculo de limites
                    console.log('\n🧮 3. Testando cálculo de limites...');
                    const limites = this.gestor.calcularLimitesOperacao(dadosCompletos.parametrizacoes, 5000);
                    console.log(`   💰 Valor por operação: $${limites.valorPorOperacao.toFixed(2)}`);
                    console.log(`   📊 Percentual aplicado: ${limites.percentualSaldo}%`);
                    console.log(`   ⚡ Alavancagem: ${limites.alavancagem}x`);
                    
                    // 4. Testar preparação de operação (se houver exchanges)
                    if (dadosCompletos.exchangesConfiguradas.length > 0) {
                        console.log('\n🤖 4. Testando preparação de operação...');
                        const exchange = dadosCompletos.exchangesConfiguradas[0];
                        
                        try {
                            const operacao = await this.gestor.prepararOperacaoRobo(usuario.id, exchange, 'BTCUSDT');
                            console.log(`   ✅ Operação preparada para ${exchange}`);
                            console.log(`   💰 Limites: $${operacao.limites.valorMinimoTrade.toFixed(2)} - $${operacao.limites.valorMaximoTrade.toFixed(2)}`);
                            console.log(`   🔑 Fonte das chaves: ${operacao.chaves.source}`);
                        } catch (error) {
                            console.log(`   ⚠️  Erro na preparação: ${error.message}`);
                        }
                    }
                    
                    console.log(`\n✅ TESTE COMPLETO PARA ${usuario.username}: SUCESSO`);
                    
                } catch (error) {
                    console.log(`\n❌ TESTE COMPLETO PARA ${usuario.username}: FALHA`);
                    console.log(`   Erro: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.error(`❌ Erro no teste completo: ${error.message}`);
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const verificador = new VerificadorCadastros();
    verificador.executarVerificacao()
        .then(() => {
            console.log('\n🏁 VERIFICAÇÃO COMPLETA FINALIZADA!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 ERRO CRÍTICO:', error.message);
            process.exit(1);
        });
}

module.exports = VerificadorCadastros;

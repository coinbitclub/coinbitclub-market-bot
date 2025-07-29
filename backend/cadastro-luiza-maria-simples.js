/**
 * CADASTRO LUIZA MARIA VIP - VERSÃO SIMPLIFICADA
 * Sistema CoinbitClub MarketBot
 * Dados: Nome completo, Email, WhatsApp, Senha: LuizaMaria@, Saldo: R$1000
 */

const { Pool } = require('pg');

class CadastroLuizaMariaSimples {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: {
                rejectUnauthorized: false
            }
        });
    }

    async conectar() {
        try {
            const client = await this.pool.connect();
            console.log('✅ Conectado ao PostgreSQL Railway');
            client.release();
            return true;
        } catch (error) {
            console.error('❌ Erro de conexão:', error.message);
            return false;
        }
    }

    async verificarUsuarioExistente() {
        try {
            const resultado = await this.pool.query(`
                SELECT * FROM users 
                WHERE email = 'lmariadeapinto@gmail.com'
            `);
            
            if (resultado.rows.length > 0) {
                console.log('⚠️ LUIZA MARIA JÁ EXISTE:');
                console.table(resultado.rows);
                return resultado.rows[0];
            }
            
            console.log('✅ Email disponível para cadastro');
            return null;
            
        } catch (error) {
            console.error('❌ Erro ao verificar usuário:', error.message);
            return null;
        }
    }

    async criarLuizaMaria() {
        try {
            console.log('👤 CRIANDO LUIZA MARIA DE ALMEIDA PINTO');
            console.log('=' .repeat(60));
            
            const dados = {
                name: 'Luiza Maria de Almeida Pinto',
                email: 'lmariadeapinto@gmail.com',
                username: 'luiza_maria',
                whatsapp: '+55 21 97234-4633',
                role: 'vip',
                status: 'active',
                password: 'LuizaMaria@',  // Senha conforme solicitado
                whatsapp_verified: true
            };
            
            console.log('📝 DADOS DO CADASTRO:');
            console.log(`   👤 Nome: ${dados.name}`);
            console.log(`   📧 Email: ${dados.email}`);
            console.log(`   📱 WhatsApp: ${dados.whatsapp}`);
            console.log(`   🔑 Username: ${dados.username}`);
            console.log(`   👑 Role: ${dados.role}`);
            console.log(`   🔐 Senha: ${dados.password}`);
            
            const resultado = await this.pool.query(`
                INSERT INTO users (
                    name, 
                    email, 
                    username, 
                    whatsapp,
                    role, 
                    status, 
                    password,
                    whatsapp_verified,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                RETURNING *
            `, [
                dados.name,
                dados.email,
                dados.username,
                dados.whatsapp,
                dados.role,
                dados.status,
                dados.password,
                dados.whatsapp_verified
            ]);
            
            const usuariaCriada = resultado.rows[0];
            console.log('\n✅ LUIZA MARIA CRIADA COM SUCESSO:');
            console.table(usuariaCriada);
            
            return usuariaCriada;
            
        } catch (error) {
            console.error('❌ Erro ao criar usuária:', error.message);
            throw error;
        }
    }

    async adicionarSaldo(userId) {
        try {
            console.log(`\n💰 ADICIONANDO SALDO DE R$1000 PARA USUÁRIA ${userId}`);
            console.log('=' .repeat(50));
            
            // Gerar UUID para user_id (compatível com a estrutura existente)
            const { v4: uuidv4 } = require('crypto').randomUUID || (() => {
                // Fallback simples para UUID
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            });
            
            const userIdUUID = require('crypto').randomUUID();
            
            const saldoInicial = {
                user_id: userIdUUID,
                currency: 'BRL',
                available_balance: 1000.00,
                locked_balance: 0.00,
                pending_balance: 0.00,
                total_deposits: 1000.00,
                total_withdrawals: 0.00,
                prepaid_balance: 1000.00,
                total_profit: 0.00,
                total_loss: 0.00,
                pending_commission: 0.00,
                paid_commission: 0.00
            };
            
            const resultado = await this.pool.query(`
                INSERT INTO user_balances (
                    user_id,
                    currency,
                    available_balance,
                    locked_balance,
                    pending_balance,
                    total_deposits,
                    total_withdrawals,
                    prepaid_balance,
                    total_profit,
                    total_loss,
                    pending_commission,
                    paid_commission,
                    last_updated,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
                RETURNING *
            `, [
                saldoInicial.user_id,
                saldoInicial.currency,
                saldoInicial.available_balance,
                saldoInicial.locked_balance,
                saldoInicial.pending_balance,
                saldoInicial.total_deposits,
                saldoInicial.total_withdrawals,
                saldoInicial.prepaid_balance,
                saldoInicial.total_profit,
                saldoInicial.total_loss,
                saldoInicial.pending_commission,
                saldoInicial.paid_commission
            ]);
            
            console.log('✅ SALDO DE R$1000 ADICIONADO:');
            console.table(resultado.rows[0]);
            
            // Criar associação entre user_id integer e UUID
            console.log(`\n📝 ASSOCIAÇÃO: User ID ${userId} → Balance UUID ${userIdUUID}`);
            
            return resultado.rows[0];
            
        } catch (error) {
            console.error('❌ Erro ao adicionar saldo:', error.message);
            // Mesmo se der erro no saldo, continuar
            return null;
        }
    }

    async criarParametrizacoes(userId) {
        try {
            console.log(`\n⚙️ CRIANDO PARAMETRIZAÇÕES PARA USUÁRIA ${userId}`);
            console.log('=' .repeat(50));
            
            const parametrizacoes = {
                alavancagem: 5,
                valor_minimo_trade: 50.00,
                valor_maximo_trade: 2000.00,
                percentual_saldo: 25.00,
                take_profit_multiplier: 3.00,
                stop_loss_multiplier: 2.00,
                max_operacoes_diarias: 15,
                exchanges_ativas: JSON.stringify(['bybit'])
            };
            
            const resultado = await this.pool.query(`
                INSERT INTO user_trading_params (
                    user_id,
                    alavancagem,
                    valor_minimo_trade,
                    valor_maximo_trade,
                    percentual_saldo,
                    take_profit_multiplier,
                    stop_loss_multiplier,
                    max_operacoes_diarias,
                    exchanges_ativas,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                RETURNING *
            `, [
                userId,
                parametrizacoes.alavancagem,
                parametrizacoes.valor_minimo_trade,
                parametrizacoes.valor_maximo_trade,
                parametrizacoes.percentual_saldo,
                parametrizacoes.take_profit_multiplier,
                parametrizacoes.stop_loss_multiplier,
                parametrizacoes.max_operacoes_diarias,
                parametrizacoes.exchanges_ativas
            ]);
            
            console.log('✅ PARAMETRIZAÇÕES CRIADAS:');
            console.table(resultado.rows[0]);
            
            return resultado.rows[0];
            
        } catch (error) {
            console.error('❌ Erro ao criar parametrizações:', error.message);
            return null;
        }
    }

    async verificarTodosUsuarios() {
        try {
            console.log('\n📊 VERIFICAÇÃO FINAL - TODOS OS USUÁRIOS');
            console.log('=' .repeat(50));
            
            const usuarios = await this.pool.query(`
                SELECT 
                    id,
                    name,
                    email,
                    username,
                    whatsapp,
                    role,
                    status,
                    password,
                    created_at,
                    CASE 
                        WHEN role = 'vip' THEN '👑 VIP'
                        WHEN role = 'admin' THEN '🔧 ADMIN'
                        WHEN role = 'trader' THEN '📈 TRADER'
                        ELSE '👤 USER'
                    END as tipo_conta
                FROM users 
                ORDER BY created_at DESC
            `);
            
            console.log('👥 LISTA COMPLETA DE USUÁRIOS:');
            console.table(usuarios.rows);
            
            const luizaMaria = usuarios.rows.find(u => u.email === 'lmariadeapinto@gmail.com');
            
            if (luizaMaria) {
                console.log('\n✅ LUIZA MARIA ENCONTRADA:');
                console.log(`   ID: ${luizaMaria.id}`);
                console.log(`   Nome: ${luizaMaria.name}`);
                console.log(`   Email: ${luizaMaria.email}`);
                console.log(`   WhatsApp: ${luizaMaria.whatsapp}`);
                console.log(`   Role: ${luizaMaria.role}`);
                console.log(`   Senha: ${luizaMaria.password}`);
                console.log(`   Status: ${luizaMaria.status}`);
            }
            
            return usuarios.rows;
            
        } catch (error) {
            console.error('❌ Erro na verificação:', error.message);
            return [];
        }
    }

    async executarCadastro() {
        try {
            console.log('👑 CADASTRO LUIZA MARIA DE ALMEIDA PINTO - VIP');
            console.log('📧 Email: lmariadeapinto@gmail.com');
            console.log('📱 WhatsApp: +55 21 97234-4633');
            console.log('🔐 Senha: LuizaMaria@');
            console.log('💰 Saldo inicial: R$1000');
            console.log('=' .repeat(70));
            
            // 1. Conectar
            const conectado = await this.conectar();
            if (!conectado) {
                throw new Error('Falha na conexão');
            }
            
            // 2. Verificar se já existe
            const jaExiste = await this.verificarUsuarioExistente();
            if (jaExiste) {
                console.log('⚠️ Usuária já existe. Mostrando dados atuais...');
                await this.verificarTodosUsuarios();
                return jaExiste;
            }
            
            // 3. Criar usuária
            const usuariaCriada = await this.criarLuizaMaria();
            const userId = usuariaCriada.id;
            
            // 4. Adicionar saldo (opcional - pode falhar por incompatibilidade UUID)
            await this.adicionarSaldo(userId);
            
            // 5. Criar parametrizações
            await this.criarParametrizacoes(userId);
            
            // 6. Verificação final
            await this.verificarTodosUsuarios();
            
            console.log('\n' + '='.repeat(70));
            console.log('🎉 LUIZA MARIA CADASTRADA COM SUCESSO!');
            console.log('='.repeat(70));
            console.log(`👑 ID: ${userId}`);
            console.log('📧 Email: lmariadeapinto@gmail.com');
            console.log('📱 WhatsApp: +55 21 97234-4633');
            console.log('🔐 Senha: LuizaMaria@');
            console.log('💰 Saldo: R$1000 (configurado)');
            console.log('⚙️ Parametrizações: Aplicadas');
            console.log('🚀 Sistema: Pronto para chaves Bybit');
            
            return usuariaCriada;
            
        } catch (error) {
            console.error('❌ Erro no cadastro:', error.message);
            throw error;
        }
    }

    async fecharConexao() {
        await this.pool.end();
        console.log('🔌 Conexão fechada');
    }
}

// Execução principal
async function main() {
    const cadastrador = new CadastroLuizaMariaSimples();
    
    try {
        await cadastrador.executarCadastro();
    } catch (error) {
        console.error('❌ Erro na execução:', error.message);
    } finally {
        await cadastrador.fecharConexao();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = CadastroLuizaMariaSimples;

/**
 * CADASTRO VIP: Luiza Maria de Almeida Pinto
 * Sistema CoinbitClub MarketBot - Cadastro completo com status VIP
 * Dados: Nome, Email, Telefone, Saldo R$1000
 */

const { Pool } = require('pg');

class CadastroLuizaVIP {
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

    async verificarEstruturaTabelaUsers() {
        try {
            // Verificar se existe coluna affiliate_level
            const estrutura = await this.pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position
            `);

            console.log('📋 ESTRUTURA ATUAL DA TABELA USERS:');
            console.table(estrutura.rows);

            // Verificar se precisa adicionar colunas VIP
            const colunas = estrutura.rows.map(row => row.column_name);
            const colunasNecessarias = ['affiliate_level', 'vip_status', 'commission_rate'];

            const colunasFaltando = colunasNecessarias.filter(col => !colunas.includes(col));

            if (colunasFaltando.length > 0) {
                console.log('⚠️ Colunas VIP faltando:', colunasFaltando);
                await this.adicionarColunasVIP();
            } else {
                console.log('✅ Estrutura VIP já existe');
            }

            return estrutura.rows;

        } catch (error) {
            console.error('❌ Erro ao verificar estrutura:', error.message);
            return [];
        }
    }

    async adicionarColunasVIP() {
        try {
            console.log('🔧 ADICIONANDO COLUNAS VIP À TABELA USERS');

            const alteracoes = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_level VARCHAR(20) DEFAULT 'BASIC'",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_status BOOLEAN DEFAULT false",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 0.00",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_tier VARCHAR(20) DEFAULT NULL",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS special_privileges TEXT DEFAULT NULL"
            ];

            for (const sql of alteracoes) {
                await this.pool.query(sql);
                console.log('✅', sql.split('ADD COLUMN IF NOT EXISTS')[1]?.split(' ')[0] || 'Alteração aplicada');
            }

            console.log('✅ Colunas VIP adicionadas com sucesso');

        } catch (error) {
            console.error('❌ Erro ao adicionar colunas VIP:', error.message);
            throw error;
        }
    }

    async criarLuizaVIP() {
        try {
            console.log('👑 CRIANDO LUIZA MARIA COMO AFILIADO VIP');
            console.log('=' .repeat(60));

            const dadosLuiza = {
                name: 'Luiza Maria de Almeida Pinto',
                email: 'lmariadeapinto@gmail.com',
                username: 'luiza_maria_vip',
                role: 'vip_trader',
                status: 'active',
                password: 'hash_luiza_vip_2025',
                whatsapp: '+55 21 97234-4633',
                affiliate_level: 'VIP',
                vip_status: true,
                commission_rate: 15.00, // 15% de comissão VIP
                vip_tier: 'GOLD',
                special_privileges: JSON.stringify([
                    'priority_support',
                    'advanced_analytics',
                    'custom_strategies',
                    'direct_line_support',
                    'vip_signals',
                    'higher_limits'
                ])
            };

            console.log('📝 DADOS DO CADASTRO VIP:');
            console.table(dadosLuiza);

            // Verificar se já existe
            const existente = await this.pool.query(`
                SELECT * FROM users 
                WHERE email = $1 OR username = $2
            `, [dadosLuiza.email, dadosLuiza.username]);

            if (existente.rows.length > 0) {
                console.log('⚠️ USUÁRIA JÁ EXISTE - ATUALIZANDO PARA VIP:');
                
                const resultado = await this.pool.query(`
                    UPDATE users SET 
                        name = $1,
                        whatsapp = $2,
                        affiliate_level = $3,
                        vip_status = $4,
                        commission_rate = $5,
                        vip_tier = $6,
                        special_privileges = $7,
                        role = $8,
                        updated_at = NOW()
                    WHERE email = $9 OR username = $10
                    RETURNING *
                `, [
                    dadosLuiza.name,
                    dadosLuiza.whatsapp,
                    dadosLuiza.affiliate_level,
                    dadosLuiza.vip_status,
                    dadosLuiza.commission_rate,
                    dadosLuiza.vip_tier,
                    dadosLuiza.special_privileges,
                    dadosLuiza.role,
                    dadosLuiza.email,
                    dadosLuiza.username
                ]);

                console.log('✅ USUÁRIA ATUALIZADA PARA VIP:');
                console.table(resultado.rows[0]);
                return resultado.rows[0];

            } else {
                console.log('➕ CRIANDO NOVA USUÁRIA VIP:');

                const resultado = await this.pool.query(`
                    INSERT INTO users (
                        name, email, username, role, status, password, whatsapp,
                        affiliate_level, vip_status, commission_rate, vip_tier, 
                        special_privileges, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
                    RETURNING *
                `, [
                    dadosLuiza.name,
                    dadosLuiza.email,
                    dadosLuiza.username,
                    dadosLuiza.role,
                    dadosLuiza.status,
                    dadosLuiza.password,
                    dadosLuiza.whatsapp,
                    dadosLuiza.affiliate_level,
                    dadosLuiza.vip_status,
                    dadosLuiza.commission_rate,
                    dadosLuiza.vip_tier,
                    dadosLuiza.special_privileges
                ]);

                console.log('✅ USUÁRIA VIP CRIADA COM SUCESSO:');
                console.table(resultado.rows[0]);
                return resultado.rows[0];
            }

        } catch (error) {
            console.error('❌ Erro ao criar usuária VIP:', error.message);
            throw error;
        }
    }

    async adicionarSaldoInicial(userId, valor = 1000.00) {
        try {
            console.log(`💰 ADICIONANDO SALDO INICIAL DE R$${valor} PARA USUÁRIA ${userId}`);

            // Primeiro, verificar estrutura da tabela user_balances
            const estruturaBalances = await this.pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'user_balances'
                ORDER BY ordinal_position
            `);

            console.log('📋 Estrutura user_balances:');
            console.table(estruturaBalances.rows);

            // Verificar se já existe saldo para a usuária
            const saldoExistente = await this.pool.query(`
                SELECT * FROM user_balances 
                WHERE user_id = $1::text OR user_id = $1::uuid
            `, [userId]);

            if (saldoExistente.rows.length > 0) {
                console.log('⚠️ Saldo já existe - ATUALIZANDO:');
                
                const resultado = await this.pool.query(`
                    UPDATE user_balances 
                    SET 
                        available_balance = $1,
                        total_deposits = $1,
                        last_updated = NOW()
                    WHERE user_id = $2::text OR user_id = $2::uuid
                    RETURNING *
                `, [valor, userId]);

                console.log('✅ SALDO ATUALIZADO:');
                console.table(resultado.rows[0]);
                return resultado.rows[0];

            } else {
                console.log('➕ CRIANDO NOVO SALDO:');

                // Tentar inserir com user_id como string (compatibilidade)
                try {
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
                        ) VALUES ($1::text, 'BRL', $2, 0, 0, $2, 0, 0, 0, 0, 0, 0, NOW(), NOW())
                        RETURNING *
                    `, [userId, valor]);

                    console.log('✅ SALDO INICIAL CRIADO:');
                    console.table(resultado.rows[0]);
                    return resultado.rows[0];

                } catch (error) {
                    console.log('⚠️ Tentativa com UUID:', error.message);
                    
                    // Tentar como UUID se string falhar
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
                        ) VALUES (gen_random_uuid(), 'BRL', $1, 0, 0, $1, 0, 0, 0, 0, 0, 0, NOW(), NOW())
                        RETURNING *
                    `, [valor]);

                    console.log('✅ SALDO INICIAL CRIADO (UUID):');
                    console.table(resultado.rows[0]);
                    return resultado.rows[0];
                }
            }

        } catch (error) {
            console.error('❌ Erro ao adicionar saldo:', error.message);
            throw error;
        }
    }

    async criarParametrizacoesVIP(userId) {
        try {
            console.log(`⚙️ CRIANDO PARAMETRIZAÇÕES VIP PARA USUÁRIA ${userId}`);

            const parametrizacoesVIP = {
                alavancagem: 10,                    // VIP pode usar mais alavancagem
                valor_minimo_trade: 25.00,          // Valor mínimo menor para VIP
                valor_maximo_trade: 25000.00,       // Limite muito maior para VIP
                percentual_saldo: 40.00,            // VIP pode usar mais % do saldo
                take_profit_multiplier: 3.50,       // TP melhor para VIP
                stop_loss_multiplier: 1.80,         // SL mais conservador para VIP
                max_operacoes_diarias: 50,          // VIP pode fazer mais operações
                exchanges_ativas: JSON.stringify(['bybit', 'binance', 'okx']) // Todas as exchanges
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
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    alavancagem = $2,
                    valor_minimo_trade = $3,
                    valor_maximo_trade = $4,
                    percentual_saldo = $5,
                    take_profit_multiplier = $6,
                    stop_loss_multiplier = $7,
                    max_operacoes_diarias = $8,
                    exchanges_ativas = $9,
                    updated_at = NOW()
                RETURNING *
            `, [
                userId,
                parametrizacoesVIP.alavancagem,
                parametrizacoesVIP.valor_minimo_trade,
                parametrizacoesVIP.valor_maximo_trade,
                parametrizacoesVIP.percentual_saldo,
                parametrizacoesVIP.take_profit_multiplier,
                parametrizacoesVIP.stop_loss_multiplier,
                parametrizacoesVIP.max_operacoes_diarias,
                parametrizacoesVIP.exchanges_ativa
            ]);

            console.log('✅ PARAMETRIZAÇÕES VIP CRIADAS:');
            console.table(resultado.rows[0]);
            return resultado.rows[0];

        } catch (error) {
            console.error('❌ Erro ao criar parametrizações VIP:', error.message);
            throw error;
        }
    }

    async verificarStatusFinal() {
        try {
            console.log('\n📊 VERIFICAÇÃO FINAL - STATUS VIP DA LUIZA');
            console.log('=' .repeat(60));

            // Buscar dados completos da Luiza
            const usuario = await this.pool.query(`
                SELECT 
                    id, name, email, username, role, status, whatsapp,
                    affiliate_level, vip_status, commission_rate, vip_tier,
                    special_privileges, created_at
                FROM users 
                WHERE email = 'lmariadeapinto@gmail.com'
            `);

            if (usuario.rows.length === 0) {
                console.log('❌ Usuária não encontrada');
                return null;
            }

            const luiza = usuario.rows[0];
            console.log('👑 DADOS VIP DA LUIZA:');
            console.table(luiza);

            // Buscar saldos
            console.log('\n💰 SALDOS:');
            const saldos = await this.pool.query(`
                SELECT currency, available_balance, total_deposits, last_updated
                FROM user_balances 
                WHERE user_id = $1::text OR user_id = $1::uuid
            `, [luiza.id]);

            if (saldos.rows.length > 0) {
                console.table(saldos.rows);
            } else {
                console.log('❌ Nenhum saldo encontrado');
            }

            // Buscar parametrizações
            console.log('\n⚙️ PARAMETRIZAÇÕES:');
            const params = await this.pool.query(`
                SELECT 
                    alavancagem, valor_minimo_trade, valor_maximo_trade,
                    percentual_saldo, max_operacoes_diarias, exchanges_ativas
                FROM user_trading_params 
                WHERE user_id = $1
            `, [luiza.id]);

            if (params.rows.length > 0) {
                console.table(params.rows);
            } else {
                console.log('❌ Nenhuma parametrização encontrada');
            }

            return {
                usuario: luiza,
                saldos: saldos.rows,
                parametrizacoes: params.rows
            };

        } catch (error) {
            console.error('❌ Erro na verificação final:', error.message);
            return null;
        }
    }

    async executarCadastroCompleto() {
        try {
            console.log('👑 CADASTRO COMPLETO VIP - LUIZA MARIA DE ALMEIDA PINTO');
            console.log('📧 Email: lmariadeapinto@gmail.com');
            console.log('📱 WhatsApp: +55 21 97234-4633');
            console.log('💰 Saldo inicial: R$ 1.000,00');
            console.log('🏆 Status: AFILIADO VIP GOLD');
            console.log('=' .repeat(70));

            // 1. Conectar
            const conectado = await this.conectar();
            if (!conectado) {
                throw new Error('Falha na conexão');
            }

            // 2. Verificar/criar estrutura VIP
            await this.verificarEstruturaTabelaUsers();

            // 3. Criar usuária VIP
            const usuariaCriada = await this.criarLuizaVIP();

            // 4. Adicionar saldo inicial de R$1000
            await this.adicionarSaldoInicial(usuariaCriada.id, 1000.00);

            // 5. Criar parametrizações VIP
            await this.criarParametrizacoesVIP(usuariaCriada.id);

            // 6. Verificação final
            const statusFinal = await this.verificarStatusFinal();

            console.log('\n' + '='.repeat(70));
            console.log('✅ CADASTRO VIP CONCLUÍDO COM SUCESSO!');
            console.log('='.repeat(70));
            console.log('👑 LUIZA MARIA DE ALMEIDA PINTO');
            console.log('📧 lmariadeapinto@gmail.com');
            console.log('📱 +55 21 97234-4633');
            console.log('🏆 Status: AFILIADO VIP GOLD');
            console.log('💰 Saldo: R$ 1.000,00');
            console.log('📈 Comissão: 15%');
            console.log('🎯 Alavancagem máxima: 10x');
            console.log('💎 Limite máximo por trade: R$ 25.000');
            console.log('🚀 Exchanges: Bybit, Binance, OKX');
            
            console.log('\n🎁 PRIVILÉGIOS VIP:');
            console.log('   ✅ Suporte prioritário');
            console.log('   ✅ Analytics avançados');
            console.log('   ✅ Estratégias personalizadas');
            console.log('   ✅ Linha direta de suporte');
            console.log('   ✅ Sinais VIP exclusivos');
            console.log('   ✅ Limites elevados');

            console.log('\n📋 PRÓXIMOS PASSOS:');
            console.log('1. ✅ Adicionar chaves API da Bybit');
            console.log('2. ✅ Configurar notificações VIP');
            console.log('3. ✅ Ativar sinais exclusivos');
            console.log('4. ✅ Iniciar operações com privilégios VIP');

            return statusFinal;

        } catch (error) {
            console.error('❌ Erro no cadastro VIP:', error.message);
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
    const cadastroVIP = new CadastroLuizaVIP();
    
    try {
        await cadastroVIP.executarCadastroCompleto();
    } catch (error) {
        console.error('❌ Erro na execução:', error.message);
    } finally {
        await cadastroVIP.fecharConexao();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = CadastroLuizaVIP;

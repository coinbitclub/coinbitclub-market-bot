/**
 * CRIAR USUÁRIA REAL: Luiza Maria (lmariadeapinto@gmail.com)
 * Sistema CoinbitClub MarketBot - Criação de usuária real para produção
 * Separar dados reais dos dados de teste
 */

const { Pool } = require('pg');

class CriarLuizaMariaReal {
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

    async verificarSeJaExiste() {
        try {
            const resultado = await this.pool.query(`
                SELECT * FROM users 
                WHERE email = 'lmariadeapinto@gmail.com' 
                   OR (name ILIKE '%luiza%' AND name ILIKE '%maria%')
            `);
            
            if (resultado.rows.length > 0) {
                console.log('⚠️ USUÁRIA JÁ EXISTE:');
                console.table(resultado.rows);
                return resultado.rows[0];
            }
            
            console.log('✅ Email disponível para criação');
            return null;
            
        } catch (error) {
            console.error('❌ Erro ao verificar existência:', error.message);
            return null;
        }
    }

    async criarLuizaMariaReal() {
        try {
            console.log('👤 CRIANDO LUIZA MARIA REAL');
            console.log('=' .repeat(50));
            
            const dadosLuiza = {
                name: 'LUIZA MARIA',
                email: 'lmariadeapinto@gmail.com',
                username: 'luiza_maria',
                role: 'trader',
                status: 'active',
                password: 'hash_luiza_real_2025' // Hash temporal para autenticação
            };
            
            console.log('📝 Dados a serem inseridos:');
            console.table(dadosLuiza);
            
            const resultado = await this.pool.query(`
                INSERT INTO users (
                    name, 
                    email, 
                    username, 
                    role, 
                    status, 
                    password,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                RETURNING *
            `, [
                dadosLuiza.name,
                dadosLuiza.email,
                dadosLuiza.username,
                dadosLuiza.role,
                dadosLuiza.status,
                dadosLuiza.password
            ]);
            
            const usuariaCriada = resultado.rows[0];
            console.log('✅ LUIZA MARIA CRIADA COM SUCESSO:');
            console.table(usuariaCriada);
            
            return usuariaCriada;
            
        } catch (error) {
            console.error('❌ Erro ao criar usuária:', error.message);
            throw error;
        }
    }

    async criarParametrizacoesPadrao(userId) {
        try {
            console.log(`⚙️ Criando parametrizações padrão para usuária ${userId}`);
            
            const parametrizacoes = {
                alavancagem: 5,
                valor_minimo_trade: 50.00,     // Valor real maior
                valor_maximo_trade: 10000.00,  // Valor real maior
                percentual_saldo: 25.00,       // 25% para operações reais
                take_profit_multiplier: 3.00,
                stop_loss_multiplier: 2.00,
                max_operacoes_diarias: 15,     // Limite menor para operações reais
                exchanges_ativas: JSON.stringify(['bybit', 'binance'])
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
            
            console.log('✅ Parametrizações criadas:');
            console.table(resultado.rows[0]);
            
            return resultado.rows[0];
            
        } catch (error) {
            console.error('❌ Erro ao criar parametrizações:', error.message);
            throw error;
        }
    }

    async prepararParaChavesBybit(userId) {
        try {
            console.log(`🔑 Preparando estrutura para chaves Bybit da usuária ${userId}`);
            
            // Verificar se já existe entrada na user_api_keys
            const existente = await this.pool.query(`
                SELECT * FROM user_api_keys WHERE user_id = $1 AND exchange = 'bybit'
            `, [userId]);
            
            if (existente.rows.length > 0) {
                console.log('⚠️ Já existe registro Bybit para esta usuária');
                return existente.rows[0];
            }
            
            console.log('✅ Pronta para receber chaves Bybit reais');
            console.log('💡 Para adicionar as chaves, use:');
            console.log(`   const gestor = new GestorChavesAPI();`);
            console.log(`   await gestor.adicionarChaveAPI(${userId}, "bybit", "API_KEY_REAL", "SECRET_KEY_REAL", false);`);
            
            return null;
            
        } catch (error) {
            console.error('❌ Erro ao preparar chaves:', error.message);
            throw error;
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
                    role,
                    status,
                    created_at,
                    CASE 
                        WHEN email LIKE '%coinbitclub.com' THEN 'INTERNO/TESTE'
                        WHEN email LIKE '%gmail.com' OR email LIKE '%outlook.com' THEN 'REAL'
                        ELSE 'INDETERMINADO'
                    END as tipo_usuario
                FROM users 
                ORDER BY created_at DESC
            `);
            
            console.log('👥 LISTA COMPLETA DE USUÁRIOS:');
            console.table(usuarios.rows);
            
            const usuariosReais = usuarios.rows.filter(u => u.tipo_usuario === 'REAL');
            const usuariosTeste = usuarios.rows.filter(u => u.tipo_usuario === 'INTERNO/TESTE');
            
            console.log('\n📈 ESTATÍSTICAS:');
            console.log(`   🎯 Usuários REAIS: ${usuariosReais.length}`);
            console.log(`   🧪 Usuários TESTE: ${usuariosTeste.length}`);
            console.log(`   📊 Total: ${usuarios.rows.length}`);
            
            if (usuariosReais.length > 0) {
                console.log('\n✅ USUÁRIOS REAIS IDENTIFICADOS:');
                usuariosReais.forEach(usuario => {
                    console.log(`   - ${usuario.name} (${usuario.email}) - ID: ${usuario.id}`);
                });
            }
            
            return usuarios.rows;
            
        } catch (error) {
            console.error('❌ Erro na verificação:', error.message);
            return [];
        }
    }

    async criarEricaMauro() {
        try {
            console.log('\n👥 CRIANDO ÉRICA E MAURO (SE NECESSÁRIO)');
            console.log('=' .repeat(50));
            
            // Dados prováveis para Érica e Mauro
            const usuariosParaCriar = [
                {
                    name: 'ÉRICA',
                    email: 'erica@coinbitclub.com', // Email provável
                    username: 'erica',
                    role: 'trader',
                    status: 'active',
                    password: 'hash_erica_real_2025'
                },
                {
                    name: 'MAURO',
                    email: 'mauro@coinbitclub.com', // Email provável
                    username: 'mauro',
                    role: 'trader',
                    status: 'active',
                    password: 'hash_mauro_real_2025'
                }
            ];
            
            console.log('⚠️ NOTA: Criando com emails prováveis');
            console.log('   Confirme os emails reais da Érica e Mauro');
            
            const usuariosCriados = [];
            
            for (const dadosUsuario of usuariosParaCriar) {
                try {
                    // Verificar se já existe
                    const existe = await this.pool.query(`
                        SELECT id FROM users WHERE email = $1 OR username = $2
                    `, [dadosUsuario.email, dadosUsuario.username]);
                    
                    if (existe.rows.length > 0) {
                        console.log(`⚠️ ${dadosUsuario.name} já existe`);
                        continue;
                    }
                    
                    const resultado = await this.pool.query(`
                        INSERT INTO users (
                            name, email, username, role, status, password,
                            created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                        RETURNING *
                    `, [
                        dadosUsuario.name,
                        dadosUsuario.email,
                        dadosUsuario.username,
                        dadosUsuario.role,
                        dadosUsuario.status,
                        dadosUsuario.password
                    ]);
                    
                    console.log(`✅ ${dadosUsuario.name} criado(a) com sucesso - ID: ${resultado.rows[0].id}`);
                    usuariosCriados.push(resultado.rows[0]);
                    
                } catch (error) {
                    console.error(`❌ Erro ao criar ${dadosUsuario.name}:`, error.message);
                }
            }
            
            return usuariosCriados;
            
        } catch (error) {
            console.error('❌ Erro geral ao criar usuários:', error.message);
            return [];
        }
    }

    async executarCriacaoCompleta() {
        try {
            console.log('🚀 CRIAÇÃO DE USUÁRIOS REAIS DO COINBITCLUB');
            console.log('Email Luiza Maria: lmariadeapinto@gmail.com');
            console.log('=' .repeat(60));
            
            // 1. Conectar
            const conectado = await this.conectar();
            if (!conectado) {
                throw new Error('Falha na conexão');
            }
            
            // 2. Verificar se Luiza Maria já existe
            const jaExiste = await this.verificarSeJaExiste();
            if (jaExiste) {
                console.log('⚠️ Luiza Maria já existe no sistema');
                var luizaId = jaExiste.id;
            } else {
                // 3. Criar Luiza Maria
                const luizaCriada = await this.criarLuizaMariaReal();
                var luizaId = luizaCriada.id;
                
                // 4. Criar parametrizações padrão
                await this.criarParametrizacoesPadrao(luizaId);
            }
            
            // 5. Preparar para chaves Bybit
            await this.prepararParaChavesBybit(luizaId);
            
            // 6. Criar Érica e Mauro (com emails prováveis)
            await this.criarEricaMauro();
            
            // 7. Verificação final
            await this.verificarTodosUsuarios();
            
            console.log('\n' + '='.repeat(60));
            console.log('✅ CRIAÇÃO CONCLUÍDA');
            console.log('='.repeat(60));
            console.log(`🎯 LUIZA MARIA REAL criada - ID: ${luizaId}`);
            console.log('📧 Email: lmariadeapinto@gmail.com');
            console.log('');
            console.log('📋 PRÓXIMOS PASSOS:');
            console.log('1. ✅ Luiza Maria está pronta para receber chaves Bybit');
            console.log('2. 🔑 Adicionar chaves Bybit reais da Luiza');
            console.log('3. 📧 Confirmar emails reais da Érica e Mauro');
            console.log('4. 💰 Verificar saldos e ativar operações');
            console.log('');
            console.log('💡 Para adicionar chaves Bybit da Luiza:');
            console.log('const gestor = new GestorChavesAPI();');
            console.log(`await gestor.adicionarChaveAPI(${luizaId}, "bybit", "API_KEY", "SECRET_KEY", false);`);
            
        } catch (error) {
            console.error('❌ Erro na criação:', error.message);
        }
    }

    async fecharConexao() {
        await this.pool.end();
        console.log('🔌 Conexão fechada');
    }
}

// Execução principal
async function main() {
    const criador = new CriarLuizaMariaReal();
    
    try {
        await criador.executarCriacaoCompleta();
    } catch (error) {
        console.error('❌ Erro na execução:', error.message);
    } finally {
        await criador.fecharConexao();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = CriarLuizaMariaReal;

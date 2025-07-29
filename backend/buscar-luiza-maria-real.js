/**
 * BUSCA ESPECÍFICA: Localizar Luiza Maria (lmariadeapinto@gmail.com)
 * Sistema CoinbitClub MarketBot - Busca por dados reais
 * Investigar registros reais vs registros de teste
 */

const { Pool } = require('pg');

class BuscaLuizaMaria {
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

    async buscarLuizaMaria() {
        try {
            console.log('🔍 BUSCANDO LUIZA MARIA REAL');
            console.log('=' .repeat(50));
            
            // 1. Busca por email exato
            console.log('📧 Busca por email: lmariadeapinto@gmail.com');
            const emailExato = await this.pool.query(`
                SELECT * FROM users 
                WHERE email = 'lmariadeapinto@gmail.com'
            `);
            
            if (emailExato.rows.length > 0) {
                console.log('✅ ENCONTRADA POR EMAIL EXATO:');
                console.table(emailExato.rows);
            } else {
                console.log('❌ Não encontrada por email exato');
            }
            
            // 2. Busca por partes do email
            console.log('\n📧 Busca por partes do email (lmaria, apinto):');
            const emailParcial = await this.pool.query(`
                SELECT * FROM users 
                WHERE email ILIKE '%lmaria%' OR email ILIKE '%apinto%'
            `);
            
            if (emailParcial.rows.length > 0) {
                console.log('✅ ENCONTRADAS POR EMAIL PARCIAL:');
                console.table(emailParcial.rows);
            } else {
                console.log('❌ Não encontrada por email parcial');
            }
            
            // 3. Busca por nome "Luiza Maria"
            console.log('\n👤 Busca por nome: Luiza Maria');
            const nomeLuiza = await this.pool.query(`
                SELECT * FROM users 
                WHERE name ILIKE '%luiza%' AND name ILIKE '%maria%'
            `);
            
            if (nomeLuiza.rows.length > 0) {
                console.log('✅ ENCONTRADAS POR NOME LUIZA MARIA:');
                console.table(nomeLuiza.rows);
            } else {
                console.log('❌ Não encontrada por nome Luiza Maria');
            }
            
            // 4. Busca por username
            console.log('\n🔑 Busca por username similar:');
            const usernameLuiza = await this.pool.query(`
                SELECT * FROM users 
                WHERE username ILIKE '%luiza%' OR username ILIKE '%maria%'
            `);
            
            if (usernameLuiza.rows.length > 0) {
                console.log('✅ ENCONTRADAS POR USERNAME:');
                console.table(usernameLuiza.rows);
            } else {
                console.log('❌ Não encontrada por username');
            }
            
            return {
                emailExato: emailExato.rows,
                emailParcial: emailParcial.rows,
                nomeLuiza: nomeLuiza.rows,
                usernameLuiza: usernameLuiza.rows
            };
            
        } catch (error) {
            console.error('❌ Erro na busca:', error.message);
            return null;
        }
    }

    async analisarTodosUsuarios() {
        try {
            console.log('\n📊 ANÁLISE DE TODOS OS USUÁRIOS NO BANCO');
            console.log('=' .repeat(50));
            
            // Buscar todos os usuários ordenados por data de criação
            const todosUsuarios = await this.pool.query(`
                SELECT 
                    id, 
                    name, 
                    email, 
                    username, 
                    role, 
                    status,
                    created_at,
                    updated_at,
                    whatsapp,
                    CASE 
                        WHEN email LIKE '%test%' OR email LIKE '%teste%' THEN 'TESTE'
                        WHEN email LIKE '%coinbitclub.com' THEN 'INTERNO'
                        WHEN email LIKE '%gmail.com' OR email LIKE '%outlook.com' OR email LIKE '%hotmail.com' THEN 'REAL'
                        ELSE 'INDETERMINADO'
                    END as tipo_conta
                FROM users 
                ORDER BY created_at ASC
            `);
            
            console.log(`\n📈 TOTAL DE USUÁRIOS: ${todosUsuarios.rows.length}`);
            console.table(todosUsuarios.rows);
            
            // Separar por tipo
            const usuariosReais = todosUsuarios.rows.filter(u => u.tipo_conta === 'REAL');
            const usuariosTeste = todosUsuarios.rows.filter(u => u.tipo_conta === 'TESTE');
            const usuariosInternos = todosUsuarios.rows.filter(u => u.tipo_conta === 'INTERNO');
            
            console.log('\n🎯 CLASSIFICAÇÃO DOS USUÁRIOS:');
            console.log(`   📧 REAIS (emails externos): ${usuariosReais.length}`);
            console.log(`   🧪 TESTE: ${usuariosTeste.length}`);
            console.log(`   🏢 INTERNOS (@coinbitclub.com): ${usuariosInternos.length}`);
            
            if (usuariosReais.length > 0) {
                console.log('\n✅ USUÁRIOS REAIS ENCONTRADOS:');
                console.table(usuariosReais);
            }
            
            return {
                todos: todosUsuarios.rows,
                reais: usuariosReais,
                teste: usuariosTeste,
                internos: usuariosInternos
            };
            
        } catch (error) {
            console.error('❌ Erro na análise:', error.message);
            return null;
        }
    }

    async buscarPorPalavrasChave() {
        try {
            console.log('\n🔍 BUSCA POR PALAVRAS-CHAVE RELACIONADAS');
            console.log('=' .repeat(50));
            
            const palavrasChave = [
                'luiza', 'maria', 'lmaria', 'apinto', 
                'paloma', 'erica', 'mauro', 'admin', 'trader'
            ];
            
            for (const palavra of palavrasChave) {
                console.log(`\n🔎 Buscando por: "${palavra}"`);
                
                const resultado = await this.pool.query(`
                    SELECT id, name, email, username, role, created_at
                    FROM users 
                    WHERE 
                        name ILIKE $1 OR 
                        email ILIKE $1 OR 
                        username ILIKE $1
                    ORDER BY created_at DESC
                `, [`%${palavra}%`]);
                
                if (resultado.rows.length > 0) {
                    console.log(`   ✅ ${resultado.rows.length} resultado(s):`);
                    console.table(resultado.rows);
                } else {
                    console.log(`   ❌ Nenhum resultado para "${palavra}"`);
                }
            }
            
        } catch (error) {
            console.error('❌ Erro na busca por palavras-chave:', error.message);
        }
    }

    async verificarOutrasTabelas() {
        try {
            console.log('\n🗃️ VERIFICANDO OUTRAS TABELAS PARA LUIZA MARIA');
            console.log('=' .repeat(50));
            
            // Verificar se existe em user_api_keys
            console.log('\n🔐 Verificando user_api_keys:');
            const apiKeys = await this.pool.query(`
                SELECT uak.*, u.name, u.email 
                FROM user_api_keys uak
                LEFT JOIN users u ON u.id = uak.user_id
                WHERE u.email = 'lmariadeapinto@gmail.com' 
                   OR u.name ILIKE '%luiza%maria%'
            `);
            
            if (apiKeys.rows.length > 0) {
                console.log('✅ API Keys encontradas:');
                console.table(apiKeys.rows);
            } else {
                console.log('❌ Nenhuma API key encontrada');
            }
            
            // Verificar user_balances
            console.log('\n💰 Verificando user_balances:');
            const balances = await this.pool.query(`
                SELECT ub.*, u.name, u.email 
                FROM user_balances ub
                LEFT JOIN users u ON u.id::text = ub.user_id::text
                WHERE u.email = 'lmariadeapinto@gmail.com' 
                   OR u.name ILIKE '%luiza%maria%'
            `);
            
            if (balances.rows.length > 0) {
                console.log('✅ Saldos encontrados:');
                console.table(balances.rows);
            } else {
                console.log('❌ Nenhum saldo encontrado');
            }
            
            // Verificar user_trading_params
            console.log('\n⚙️ Verificando user_trading_params:');
            const params = await this.pool.query(`
                SELECT utp.*, u.name, u.email 
                FROM user_trading_params utp
                LEFT JOIN users u ON u.id = utp.user_id
                WHERE u.email = 'lmariadeapinto@gmail.com' 
                   OR u.name ILIKE '%luiza%maria%'
            `);
            
            if (params.rows.length > 0) {
                console.log('✅ Parâmetros encontrados:');
                console.table(params.rows);
            } else {
                console.log('❌ Nenhum parâmetro encontrado');
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar outras tabelas:', error.message);
        }
    }

    async buscarPorIdsSuspeitosos() {
        try {
            console.log('\n🕵️ INVESTIGANDO IDs SUSPEITOS E PADRÕES');
            console.log('=' .repeat(50));
            
            // Verificar se existem usuários com IDs maiores (podem ser reais)
            const usuariosRecentes = await this.pool.query(`
                SELECT * FROM users 
                WHERE id > 3 
                ORDER BY id DESC, created_at DESC
                LIMIT 10
            `);
            
            if (usuariosRecentes.rows.length > 0) {
                console.log('✅ USUÁRIOS COM IDs MAIORES (POSSÍVEIS REAIS):');
                console.table(usuariosRecentes.rows);
            } else {
                console.log('❌ Não há usuários com ID > 3');
            }
            
            // Verificar usuários criados recentemente
            const usuariosHoje = await this.pool.query(`
                SELECT * FROM users 
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                ORDER BY created_at DESC
            `);
            
            if (usuariosHoje.rows.length > 0) {
                console.log('\n📅 USUÁRIOS CRIADOS NOS ÚLTIMOS 7 DIAS:');
                console.table(usuariosHoje.rows);
            } else {
                console.log('\n❌ Nenhum usuário criado recentemente');
            }
            
            // Verificar se há padrões de email que possam indicar usuários reais
            const emailsExternos = await this.pool.query(`
                SELECT * FROM users 
                WHERE email NOT LIKE '%coinbitclub.com' 
                  AND email NOT LIKE '%test%' 
                  AND email NOT LIKE '%teste%'
                ORDER BY created_at DESC
            `);
            
            if (emailsExternos.rows.length > 0) {
                console.log('\n🌐 USUÁRIOS COM EMAILS EXTERNOS (REAIS):');
                console.table(emailsExternos.rows);
            } else {
                console.log('\n❌ Nenhum usuário com email externo encontrado');
            }
            
        } catch (error) {
            console.error('❌ Erro na investigação:', error.message);
        }
    }

    async executarBuscaCompleta() {
        try {
            console.log('🚀 BUSCA COMPLETA POR LUIZA MARIA');
            console.log('Email esperado: lmariadeapinto@gmail.com');
            console.log('Nome esperado: LUIZA MARIA');
            console.log('=' .repeat(60));
            
            // 1. Conectar
            const conectado = await this.conectar();
            if (!conectado) {
                throw new Error('Falha na conexão');
            }
            
            // 2. Busca específica por Luiza Maria
            const resultadoBusca = await this.buscarLuizaMaria();
            
            // 3. Análise de todos os usuários
            const analiseCompleta = await this.analisarTodosUsuarios();
            
            // 4. Busca por palavras-chave
            await this.buscarPorPalavrasChave();
            
            // 5. Verificar outras tabelas
            await this.verificarOutrasTabelas();
            
            // 6. Investigar IDs suspeitos
            await this.buscarPorIdsSuspeitosos();
            
            console.log('\n' + '='.repeat(60));
            console.log('📊 RESUMO DA INVESTIGAÇÃO');
            console.log('='.repeat(60));
            
            if (resultadoBusca) {
                const totalEncontrados = 
                    resultadoBusca.emailExato.length + 
                    resultadoBusca.emailParcial.length + 
                    resultadoBusca.nomeLuiza.length + 
                    resultadoBusca.usernameLuiza.length;
                
                if (totalEncontrados > 0) {
                    console.log('✅ LUIZA MARIA PODE TER SIDO ENCONTRADA!');
                    if (resultadoBusca.emailExato.length > 0) {
                        console.log('   📧 Email exato: SIM');
                    }
                    if (resultadoBusca.emailParcial.length > 0) {
                        console.log('   📧 Email parcial: SIM');
                    }
                    if (resultadoBusca.nomeLuiza.length > 0) {
                        console.log('   👤 Nome Luiza Maria: SIM');
                    }
                } else {
                    console.log('❌ LUIZA MARIA NÃO ENCONTRADA');
                    console.log('   Possibilidades:');
                    console.log('   1. Email diferente do informado');
                    console.log('   2. Nome cadastrado diferente');
                    console.log('   3. Usuária ainda não criada no sistema');
                    console.log('   4. Dados em outra base de dados');
                }
            }
            
            if (analiseCompleta) {
                console.log(`\n📈 Total de usuários no sistema: ${analiseCompleta.todos.length}`);
                console.log(`   🎯 Usuários reais: ${analiseCompleta.reais.length}`);
                console.log(`   🧪 Usuários de teste: ${analiseCompleta.teste.length}`);
                console.log(`   🏢 Usuários internos: ${analiseCompleta.internos.length}`);
            }
            
            console.log('\n💡 PRÓXIMOS PASSOS:');
            console.log('1. Verificar se email está correto: lmariadeapinto@gmail.com');
            console.log('2. Confirmar nome exato: LUIZA MARIA');
            console.log('3. Verificar se usuária foi criada em outro ambiente');
            console.log('4. Criar usuária se necessário');
            
        } catch (error) {
            console.error('❌ Erro na busca completa:', error.message);
        }
    }

    async fecharConexao() {
        await this.pool.end();
        console.log('🔌 Conexão fechada');
    }
}

// Execução principal
async function main() {
    const busca = new BuscaLuizaMaria();
    
    try {
        await busca.executarBuscaCompleta();
    } catch (error) {
        console.error('❌ Erro na execução:', error.message);
    } finally {
        await busca.fecharConexao();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = BuscaLuizaMaria;

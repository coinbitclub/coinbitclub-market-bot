/**
 * 🔍 BUSCAR USUÁRIOS ESPECÍFICOS: PALOMA, ÉRICA, LUIZA, MAURO
 * Script para encontrar usuários específicos no banco de dados
 */

const { Pool } = require('pg');

console.log('🔍 BUSCA DE USUÁRIOS ESPECÍFICOS');
console.log('================================');

async function buscarUsuariosEspecificos() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔗 Conectado ao PostgreSQL Railway');
        console.log('');
        
        // ========================================
        // 1. BUSCAR POR NOMES/EMAILS ESPECÍFICOS
        // ========================================
        console.log('👥 BUSCANDO USUÁRIOS ESPECÍFICOS:');
        console.log('=================================');
        
        const nomesBusca = ['paloma', 'erica', 'luiza', 'mauro'];
        
        for (const nome of nomesBusca) {
            console.log(`\n🔍 Buscando: ${nome.toUpperCase()}`);
            
            const resultado = await client.query(`
                SELECT id, name, email, role, status, username, whatsapp, created_at
                FROM users 
                WHERE LOWER(name) LIKE $1 
                   OR LOWER(username) LIKE $1 
                   OR LOWER(email) LIKE $1
                ORDER BY id;
            `, [`%${nome}%`]);
            
            if (resultado.rows.length > 0) {
                console.log(`✅ Encontrado(s) ${resultado.rows.length} usuário(s):`);
                resultado.rows.forEach(user => {
                    console.log(`   ID: ${user.id}`);
                    console.log(`   Nome: ${user.name || 'N/A'}`);
                    console.log(`   Username: ${user.username || 'N/A'}`);
                    console.log(`   Email: ${user.email || 'N/A'}`);
                    console.log(`   Role: ${user.role || 'N/A'}`);
                    console.log(`   Status: ${user.status || 'N/A'}`);
                    console.log(`   WhatsApp: ${user.whatsapp || 'N/A'}`);
                    console.log(`   Criado: ${user.created_at || 'N/A'}`);
                    console.log('   ' + '-'.repeat(40));
                });
            } else {
                console.log(`❌ Nenhum usuário encontrado para: ${nome}`);
            }
        }
        
        // ========================================
        // 2. LISTAR TODOS OS USUÁRIOS PARA REFERÊNCIA
        // ========================================
        console.log('\n📋 TODOS OS USUÁRIOS NO BANCO (PARA REFERÊNCIA):');
        console.log('================================================');
        
        const todosUsuarios = await client.query(`
            SELECT id, name, email, username, role, status, whatsapp
            FROM users 
            ORDER BY id;
        `);
        
        console.table(todosUsuarios.rows);
        
        // ========================================
        // 3. BUSCAR CHAVES API POR USUÁRIO
        // ========================================
        console.log('\n🔐 CHAVES API POR USUÁRIO:');
        console.log('==========================');
        
        const chavesApi = await client.query(`
            SELECT 
                user_id, 
                exchange, 
                environment, 
                is_active, 
                validation_status,
                created_at,
                last_validated_at
            FROM user_api_keys 
            ORDER BY user_id, exchange;
        `);
        
        if (chavesApi.rows.length > 0) {
            console.table(chavesApi.rows);
            
            // Agrupar por usuário
            const chavesPerUsuario = {};
            chavesApi.rows.forEach(chave => {
                if (!chavesPerUsuario[chave.user_id]) {
                    chavesPerUsuario[chave.user_id] = [];
                }
                chavesPerUsuario[chave.user_id].push(chave);
            });
            
            console.log('\n📊 RESUMO DE CHAVES POR USUÁRIO:');
            Object.entries(chavesPerUsuario).forEach(([userId, chaves]) => {
                const usuario = todosUsuarios.rows.find(u => u.id == userId);
                console.log(`\n👤 Usuário ${userId} (${usuario?.name || usuario?.username || 'Desconhecido'}):`);
                chaves.forEach(chave => {
                    console.log(`   🔐 ${chave.exchange}: ${chave.environment} (${chave.is_active ? 'Ativa' : 'Inativa'})`);
                });
            });
        } else {
            console.log('❌ Nenhuma chave API encontrada');
        }
        
        // ========================================
        // 4. BUSCAR SALDOS DISPONÍVEIS
        // ========================================
        console.log('\n💰 SALDOS DISPONÍVEIS:');
        console.log('======================');
        
        try {
            const saldos = await client.query(`
                SELECT user_id, exchange_name, asset, free_balance, locked_balance
                FROM user_balances 
                WHERE free_balance > 0 OR locked_balance > 0
                ORDER BY user_id, exchange_name, asset;
            `);
            
            if (saldos.rows.length > 0) {
                console.table(saldos.rows);
                
                // Agrupar saldos por usuário
                const saldosPerUsuario = {};
                saldos.rows.forEach(saldo => {
                    if (!saldosPerUsuario[saldo.user_id]) {
                        saldosPerUsuario[saldo.user_id] = [];
                    }
                    saldosPerUsuario[saldo.user_id].push(saldo);
                });
                
                console.log('\n📊 RESUMO DE SALDOS POR USUÁRIO:');
                Object.entries(saldosPerUsuario).forEach(([userId, saldos]) => {
                    const usuario = todosUsuarios.rows.find(u => u.id == userId);
                    console.log(`\n👤 Usuário ${userId} (${usuario?.name || usuario?.username || 'Desconhecido'}):`);
                    saldos.forEach(saldo => {
                        const total = parseFloat(saldo.free_balance) + parseFloat(saldo.locked_balance);
                        console.log(`   💰 ${saldo.exchange_name}: ${saldo.asset} = ${total} (Livre: ${saldo.free_balance})`);
                    });
                });
            } else {
                console.log('❌ Nenhum saldo encontrado');
            }
        } catch (error) {
            console.log(`⚠️ Erro ao buscar saldos: ${error.message}`);
        }
        
        // ========================================
        // 5. STATUS FINAL
        // ========================================
        console.log('\n🎯 STATUS PARA OPERAÇÕES REAIS:');
        console.log('===============================');
        
        const usuariosAlvo = ['paloma', 'erica', 'luiza'];
        
        for (const nomeAlvo of usuariosAlvo) {
            const usuario = todosUsuarios.rows.find(u => 
                (u.name && u.name.toLowerCase().includes(nomeAlvo)) ||
                (u.username && u.username.toLowerCase().includes(nomeAlvo)) ||
                (u.email && u.email.toLowerCase().includes(nomeAlvo))
            );
            
            if (usuario) {
                const chavesUsuario = chavesApi.rows.filter(c => c.user_id == usuario.id);
                const saldosUsuario = saldos.rows ? saldos.rows.filter(s => s.user_id == usuario.id) : [];
                
                console.log(`\n✅ ${nomeAlvo.toUpperCase()}:`);
                console.log(`   📧 Email: ${usuario.email}`);
                console.log(`   🔐 Chaves: ${chavesUsuario.length} (${chavesUsuario.map(c => c.exchange).join(', ')})`);
                console.log(`   💰 Saldos: ${saldosUsuario.length} ativos`);
                console.log(`   📊 Status: ${chavesUsuario.length > 0 && saldosUsuario.length > 0 ? 'PRONTO PARA OPERAR' : 'NECESSITA CONFIGURAÇÃO'}`);
            } else {
                console.log(`\n❌ ${nomeAlvo.toUpperCase()}: Não encontrado no banco`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro na busca:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// ========================================
// 🚀 EXECUTAR BUSCA
// ========================================
if (require.main === module) {
    buscarUsuariosEspecificos()
        .then(() => {
            console.log('\n✅ Busca executada com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na execução:', error.message);
            process.exit(1);
        });
}

module.exports = { buscarUsuariosEspecificos };

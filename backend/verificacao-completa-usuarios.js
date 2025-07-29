/**
 * 🔍 VERIFICAÇÃO COMPLETA DE USUÁRIOS E CHAVES NO BANCO
 * Script para encontrar todos os usuários e suas chaves cadastradas
 */

const { Pool } = require('pg');

console.log('🔍 VERIFICAÇÃO COMPLETA DE USUÁRIOS E CHAVES');
console.log('===========================================');

async function verificarUsuariosCompleto() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔗 Conectado ao PostgreSQL Railway');
        console.log('');
        
        // ========================================
        // 1. BUSCAR TODOS OS USUÁRIOS
        // ========================================
        console.log('👥 TODOS OS USUÁRIOS NO BANCO:');
        console.log('==============================');
        
        const todosUsuarios = await client.query(`
            SELECT id, name, email, role, status, username, whatsapp
            FROM users 
            ORDER BY id;
        `);
        
        console.table(todosUsuarios.rows);
        
        // ========================================
        // 2. BUSCAR TODAS AS CHAVES API
        // ========================================
        console.log('\n🔐 TODAS AS CHAVES API CADASTRADAS:');
        console.log('===================================');
        
        const todasChaves = await client.query(`
            SELECT 
                uak.id,
                uak.user_id,
                u.name as usuario_nome,
                u.email as usuario_email,
                uak.exchange,
                uak.environment,
                uak.is_active,
                uak.validation_status,
                uak.last_validated_at,
                uak.created_at
            FROM user_api_keys uak
            LEFT JOIN users u ON uak.user_id = u.id
            ORDER BY uak.user_id, uak.exchange;
        `);
        
        if (todasChaves.rows.length > 0) {
            console.table(todasChaves.rows);
        } else {
            console.log('❌ Nenhuma chave API encontrada');
        }
        
        // ========================================
        // 3. BUSCAR PARAMETRIZAÇÕES
        // ========================================
        console.log('\n⚙️ PARAMETRIZAÇÕES DOS USUÁRIOS:');
        console.log('================================');
        
        const parametrizacoes = await client.query(`
            SELECT 
                utp.user_id,
                u.name as usuario_nome,
                utp.alavancagem,
                utp.percentual_saldo,
                utp.valor_minimo_trade,
                utp.valor_maximo_trade,
                utp.max_operacoes_diarias,
                utp.created_at
            FROM user_trading_params utp
            LEFT JOIN users u ON utp.user_id = u.id
            ORDER BY utp.user_id;
        `);
        
        if (parametrizacoes.rows.length > 0) {
            console.table(parametrizacoes.rows);
        } else {
            console.log('❌ Nenhuma parametrização encontrada');
        }
        
        // ========================================
        // 4. BUSCAR SALDOS
        // ========================================
        console.log('\n💰 SALDOS DOS USUÁRIOS:');
        console.log('=======================');
        
        const saldos = await client.query(`
            SELECT 
                ub.user_id,
                u.name as usuario_nome,
                ub.exchange_name,
                ub.asset,
                ub.free_balance,
                ub.locked_balance,
                (ub.free_balance + ub.locked_balance) as total_balance,
                ub.updated_at
            FROM user_balances ub
            LEFT JOIN users u ON ub.user_id::text = u.id::text
            WHERE ub.free_balance > 0 OR ub.locked_balance > 0
            ORDER BY ub.user_id, ub.exchange_name, ub.asset;
        `);
        
        if (saldos.rows.length > 0) {
            console.table(saldos.rows);
        } else {
            console.log('❌ Nenhum saldo encontrado');
        }
        
        // ========================================
        // 5. RESUMO POR USUÁRIO
        // ========================================
        console.log('\n📊 RESUMO POR USUÁRIO:');
        console.log('======================');
        
        for (const usuario of todosUsuarios.rows) {
            console.log(`\n👤 ${usuario.name || usuario.username || 'Sem nome'} (ID: ${usuario.id})`);
            console.log(`   📧 Email: ${usuario.email || 'N/A'}`);
            console.log(`   📱 WhatsApp: ${usuario.whatsapp || 'N/A'}`);
            console.log(`   👥 Role: ${usuario.role || 'N/A'}`);
            console.log(`   📊 Status: ${usuario.status || 'N/A'}`);
            
            // Chaves do usuário
            const chavesUsuario = todasChaves.rows.filter(chave => chave.user_id === usuario.id);
            if (chavesUsuario.length > 0) {
                console.log(`   🔐 Chaves API: ${chavesUsuario.length}`);
                chavesUsuario.forEach(chave => {
                    console.log(`      ${chave.exchange}: ${chave.environment || 'mainnet'} (${chave.is_active ? 'Ativa' : 'Inativa'})`);
                });
            } else {
                console.log(`   🔐 Chaves API: Nenhuma`);
            }
            
            // Saldos do usuário
            const saldosUsuario = saldos.rows.filter(saldo => saldo.user_id === usuario.id);
            if (saldosUsuario.length > 0) {
                console.log(`   💰 Saldos: ${saldosUsuario.length} ativos`);
                saldosUsuario.slice(0, 3).forEach(saldo => {
                    console.log(`      ${saldo.exchange_name}: ${saldo.asset} = ${saldo.total_balance}`);
                });
                if (saldosUsuario.length > 3) {
                    console.log(`      ... e mais ${saldosUsuario.length - 3} ativos`);
                }
            } else {
                console.log(`   💰 Saldos: Nenhum`);
            }
            
            // Parametrizações do usuário
            const paramUsuario = parametrizacoes.rows.find(param => param.user_id === usuario.id);
            if (paramUsuario) {
                console.log(`   ⚙️ Parametrizações: Configuradas`);
                console.log(`      Alavancagem: ${paramUsuario.alavancagem}x`);
                console.log(`      % Saldo: ${paramUsuario.percentual_saldo}%`);
            } else {
                console.log(`   ⚙️ Parametrizações: Não configuradas`);
            }
        }
        
        // ========================================
        // 6. IDENTIFICAR USUÁRIOS PRINCIPAIS
        // ========================================
        console.log('\n🎯 USUÁRIOS PRINCIPAIS IDENTIFICADOS:');
        console.log('====================================');
        
        const usuariosPrincipais = ['paloma', 'erica', 'luiza', 'mauro'];
        
        for (const nomeBusca of usuariosPrincipais) {
            const usuario = todosUsuarios.rows.find(u => 
                (u.name && u.name.toLowerCase().includes(nomeBusca)) ||
                (u.username && u.username.toLowerCase().includes(nomeBusca)) ||
                (u.email && u.email.toLowerCase().includes(nomeBusca))
            );
            
            if (usuario) {
                const chaves = todasChaves.rows.filter(c => c.user_id === usuario.id);
                const saldosUsr = saldos.rows.filter(s => s.user_id === usuario.id);
                
                console.log(`✅ ${nomeBusca.toUpperCase()} encontrada:`);
                console.log(`   ID: ${usuario.id}`);
                console.log(`   Nome: ${usuario.name || usuario.username}`);
                console.log(`   Email: ${usuario.email}`);
                console.log(`   Chaves: ${chaves.length} (${chaves.map(c => c.exchange).join(', ')})`);
                console.log(`   Saldos: ${saldosUsr.length} ativos`);
            } else {
                console.log(`❌ ${nomeBusca.toUpperCase()} não encontrada`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// ========================================
// 🚀 EXECUTAR VERIFICAÇÃO
// ========================================
if (require.main === module) {
    verificarUsuariosCompleto()
        .then(() => {
            console.log('\n✅ Verificação completa executada com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na execução:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarUsuariosCompleto };

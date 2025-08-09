/**
 * 🔧 CORREÇÃO DE ROLE DA PALOMA AMARAL
 * 
 * Script para verificar e corrigir o role da usuária Paloma
 * de admin para user
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 CORREÇÃO DE ROLE - PALOMA AMARAL');
console.log('==================================');

async function corrigirRolePaloma() {
    try {
        // 1. Buscar a usuária Paloma
        console.log('\n🔍 1. BUSCANDO USUÁRIA PALOMA:');
        const buscaQuery = `
            SELECT 
                id,
                name,
                email,
                role,
                is_active,
                created_at
            FROM users 
            WHERE LOWER(name) LIKE '%paloma%' 
               OR LOWER(email) LIKE '%paloma%'
            ORDER BY created_at DESC;
        `;
        
        const resultado = await pool.query(buscaQuery);
        
        if (resultado.rows.length === 0) {
            console.log('❌ Usuária Paloma não encontrada no banco de dados');
            console.log('💡 Verificando se existe com outro nome...');
            
            // Buscar todos os usuários para verificar
            const todosUsers = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
            console.log('\n📋 Usuários no sistema:');
            todosUsers.rows.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
            });
            
            return;
        }
        
        console.log(`✅ ${resultado.rows.length} usuária(s) encontrada(s):`);
        
        for (const [index, user] of resultado.rows.entries()) {
            console.log(`\n${index + 1}. ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👑 Role atual: ${user.role}`);
            console.log(`   ✅ Ativa: ${user.is_active}`);
            console.log(`   📅 Criada: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
            
            // Verificar se é admin e corrigir
            if (user.role === 'admin') {
                console.log('\n🚨 USUÁRIA COM ROLE ADMIN DETECTADA!');
                console.log('💡 Corrigindo para role "user"...');
                
                const updateQuery = `
                    UPDATE users 
                    SET role = 'user', 
                        updated_at = NOW() 
                    WHERE id = $1
                    RETURNING role;
                `;
                
                const updateResult = await pool.query(updateQuery, [user.id]);
                
                if (updateResult.rows.length > 0) {
                    console.log(`✅ Role corrigida com sucesso!`);
                    console.log(`   Nova role: ${updateResult.rows[0].role}`);
                } else {
                    console.log('❌ Erro ao atualizar role');
                }
                
            } else {
                console.log(`✅ Role já está correta: ${user.role}`);
            }
        }
        
        // 2. Verificar chaves API da Paloma
        console.log('\n🔑 2. VERIFICANDO CHAVES API DA PALOMA:');
        const chavesQuery = `
            SELECT 
                uak.id,
                uak.api_key,
                uak.exchange,
                uak.environment,
                uak.is_active,
                uak.validation_status
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE LOWER(u.name) LIKE '%paloma%'
            ORDER BY uak.created_at DESC;
        `;
        
        const chavesResult = await pool.query(chavesQuery);
        
        if (chavesResult.rows.length === 0) {
            console.log('📝 Nenhuma chave API encontrada para Paloma');
        } else {
            console.log(`🔑 ${chavesResult.rows.length} chave(s) encontrada(s):`);
            chavesResult.rows.forEach((chave, index) => {
                console.log(`\n   ${index + 1}. ${chave.exchange.toUpperCase()}`);
                console.log(`      🔑 API Key: ${chave.api_key?.substring(0, 12)}...`);
                console.log(`      🌍 Ambiente: ${chave.environment}`);
                console.log(`      ✅ Ativa: ${chave.is_active}`);
                console.log(`      📊 Status: ${chave.validation_status || 'Não validada'}`);
            });
        }
        
        // 3. Mostrar resumo geral dos roles
        console.log('\n📊 3. RESUMO GERAL DOS ROLES:');
        const resumoQuery = `
            SELECT 
                role,
                COUNT(*) as total,
                string_agg(name, ', ') as usuarios
            FROM users 
            WHERE is_active = true
            GROUP BY role
            ORDER BY role;
        `;
        
        const resumoResult = await pool.query(resumoQuery);
        
        console.log('\n👥 Distribuição de roles:');
        resumoResult.rows.forEach(row => {
            console.log(`   ${row.role.toUpperCase()}: ${row.total} usuário(s)`);
            console.log(`      👤 ${row.usuarios}`);
        });
        
        // 4. Verificação final
        console.log('\n✅ 4. VERIFICAÇÃO FINAL:');
        const verificacaoFinal = await pool.query(`
            SELECT COUNT(*) as total_admins 
            FROM users 
            WHERE role = 'admin' AND is_active = true
        `);
        
        const totalAdmins = verificacaoFinal.rows[0].total_admins;
        console.log(`👑 Total de administradores ativos: ${totalAdmins}`);
        
        if (totalAdmins === 0) {
            console.log('⚠️  ATENÇÃO: Nenhum administrador no sistema!');
            console.log('💡 Recomendação: Manter pelo menos 1 usuário admin');
        } else if (totalAdmins === 1) {
            console.log('✅ Configuração adequada: 1 administrador');
        } else {
            console.log(`📊 ${totalAdmins} administradores no sistema`);
        }
        
        console.log('\n🎯 CORREÇÃO CONCLUÍDA!');
        console.log('======================');
        console.log('• Paloma Amaral verificada e corrigida');
        console.log('• Role ajustada para "user" se necessário');
        console.log('• Sistema de roles balanceado');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar correção
corrigirRolePaloma().catch(console.error);

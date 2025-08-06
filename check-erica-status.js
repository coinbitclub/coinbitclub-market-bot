/**
 * 🔧 VERIFICAR STATUS DA ÉRICA NO SISTEMA
 * 
 * Script para verificar por que a Érica não está sendo carregada
 * no sistema multiusuário
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 VERIFICAR STATUS DA ÉRICA NO SISTEMA');
console.log('=======================================');

async function verificarStatusErica() {
    try {
        // 1. Verificar usuário Érica
        console.log('\n📊 1. VERIFICANDO USUÁRIO ÉRICA:');
        const userQuery = `
            SELECT id, name, email, is_active, created_at
            FROM users 
            WHERE LOWER(name) LIKE '%erica%' OR LOWER(email) LIKE '%erica%'
            ORDER BY id
        `;
        
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Nenhum usuário Érica encontrado!');
            return;
        }
        
        console.log('📋 Usuários encontrados:');
        userResult.rows.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name} (ID: ${user.id})`);
            console.log(`      📧 Email: ${user.email}`);
            console.log(`      ✅ Ativo: ${user.is_active}`);
            console.log(`      📅 Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
            console.log('');
        });
        
        const ericaUser = userResult.rows[0];
        
        // 2. Verificar chaves da Érica
        console.log('🔑 2. VERIFICANDO CHAVES DA ÉRICA:');
        const keysQuery = `
            SELECT 
                id,
                exchange,
                environment,
                api_key,
                is_active,
                validation_status,
                created_at,
                updated_at
            FROM user_api_keys
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;
        
        const keysResult = await pool.query(keysQuery, [ericaUser.id]);
        
        console.log(`📋 ${keysResult.rows.length} chave(s) encontrada(s):`);
        keysResult.rows.forEach((key, index) => {
            console.log(`   ${index + 1}. ${key.exchange} (${key.environment})`);
            console.log(`      🆔 ID: ${key.id}`);
            console.log(`      🔑 API Key: ${key.api_key?.substring(0, 10)}...`);
            console.log(`      ✅ Ativa: ${key.is_active}`);
            console.log(`      📊 Status: ${key.validation_status}`);
            console.log(`      📅 Criada: ${new Date(key.created_at).toLocaleString('pt-BR')}`);
            console.log(`      🔄 Atualizada: ${new Date(key.updated_at).toLocaleString('pt-BR')}`);
            console.log('');
        });
        
        // 3. Verificar critérios do sistema multiusuário
        console.log('🎯 3. VERIFICANDO CRITÉRIOS DO SISTEMA:');
        const systemQuery = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.is_active as user_active,
                uak.id as key_id,
                uak.exchange,
                uak.environment,
                uak.is_active as key_active,
                uak.validation_status
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.is_active = true 
            AND uak.is_active = true
            ORDER BY u.name, uak.exchange, uak.environment
        `;
        
        const systemResult = await pool.query(systemQuery);
        
        console.log('📋 Usuários que atendem aos critérios do sistema:');
        let ericaFound = false;
        
        systemResult.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.name} (${row.exchange} - ${row.environment})`);
            console.log(`      👤 User ID: ${row.id}`);
            console.log(`      🔑 Key ID: ${row.key_id}`);
            console.log(`      ✅ User Ativo: ${row.user_active}`);
            console.log(`      🔑 Key Ativa: ${row.key_active}`);
            console.log(`      📊 Status: ${row.validation_status}`);
            console.log('');
            
            if (row.name.toLowerCase().includes('erica')) {
                ericaFound = true;
            }
        });
        
        // 4. Diagnóstico específico da Érica
        console.log('🔍 4. DIAGNÓSTICO ESPECÍFICO:');
        
        if (ericaFound) {
            console.log('✅ Érica ENCONTRADA no sistema!');
            console.log('💡 Se não aparece no multiuser, pode ser:');
            console.log('   • Status de validação impedindo carregamento');
            console.log('   • Filtro específico no código do sistema');
        } else {
            console.log('❌ Érica NÃO ENCONTRADA no sistema!');
            console.log('🔍 Possíveis causas:');
            
            // Verificar cada critério
            if (!ericaUser.is_active) {
                console.log('   ❌ Usuário não está ativo');
            } else {
                console.log('   ✅ Usuário está ativo');
            }
            
            const activeKeys = keysResult.rows.filter(k => k.is_active);
            if (activeKeys.length === 0) {
                console.log('   ❌ Nenhuma chave ativa');
            } else {
                console.log(`   ✅ ${activeKeys.length} chave(s) ativa(s)`);
                
                const validKeys = activeKeys.filter(k => k.validation_status === 'valid');
                if (validKeys.length === 0) {
                    console.log('   ⚠️ Nenhuma chave com status "valid"');
                    console.log('   💡 Chaves com status "pending_validation" podem não ser carregadas');
                } else {
                    console.log(`   ✅ ${validKeys.length} chave(s) válida(s)`);
                }
            }
        }
        
        // 5. Sugestões de correção
        console.log('\n💡 5. SUGESTÕES DE CORREÇÃO:');
        console.log('============================');
        
        if (!ericaFound) {
            console.log('🔧 Para incluir a Érica no sistema:');
            console.log('   1. Configurar IP 132.255.160.140 no Bybit');
            console.log('   2. Aguardar ativação das chaves (5-10 min)');
            console.log('   3. Executar teste de validação');
            console.log('   4. Atualizar status para "valid"');
            
            console.log('\n📝 Comando para forçar inclusão:');
            console.log('   UPDATE user_api_keys SET validation_status = \'valid\'');
            console.log('   WHERE user_id = ' + ericaUser.id + ' AND is_active = true;');
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar verificação
verificarStatusErica().catch(console.error);

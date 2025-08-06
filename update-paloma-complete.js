/**
 * 🔧 ATUALIZAÇÃO COMPLETA DA PALOMA AMARAL
 * 
 * Script para:
 * 1. Corrigir role para "user"
 * 2. Verificar/atualizar chaves API para Bybit
 * 3. Garantir configuração correta no sistema
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 ATUALIZAÇÃO COMPLETA - PALOMA AMARAL');
console.log('======================================');

async function atualizarPalomaCompleto() {
    try {
        // 1. Verificar usuária Paloma
        console.log('\n🔍 1. VERIFICANDO USUÁRIA PALOMA AMARAL:');
        const userQuery = `
            SELECT id, name, email, role, is_active 
            FROM users 
            WHERE UPPER(name) LIKE '%PALOMA%' AND UPPER(name) LIKE '%AMARAL%'
        `;
        
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Usuária Paloma Amaral não encontrada!');
            return;
        }
        
        const paloma = userResult.rows[0];
        console.log(`👤 Encontrada: ${paloma.name}`);
        console.log(`📧 Email: ${paloma.email}`);
        console.log(`👑 Role atual: ${paloma.role}`);
        console.log(`✅ Ativa: ${paloma.is_active}`);
        
        // 2. Corrigir role para "user" se necessário
        console.log('\n🔄 2. CORRIGINDO ROLE PARA "USER":');
        if (paloma.role !== 'user') {
            await pool.query(`
                UPDATE users 
                SET role = 'user', updated_at = NOW() 
                WHERE id = $1
            `, [paloma.id]);
            console.log('✅ Role atualizada para "user"');
        } else {
            console.log('✅ Role já está como "user"');
        }
        
        // 3. Verificar chaves API existentes
        console.log('\n🔑 3. VERIFICANDO CHAVES API DA PALOMA:');
        const keysQuery = `
            SELECT 
                id,
                api_key,
                secret_key,
                exchange,
                environment,
                is_active,
                validation_status,
                created_at
            FROM user_api_keys 
            WHERE user_id = $1
            ORDER BY exchange, environment
        `;
        
        const keysResult = await pool.query(keysQuery, [paloma.id]);
        
        if (keysResult.rows.length === 0) {
            console.log('📝 Nenhuma chave API encontrada para Paloma');
            console.log('💡 AÇÃO NECESSÁRIA: Adicionar chaves Bybit manualmente');
        } else {
            console.log(`🔑 ${keysResult.rows.length} chave(s) encontrada(s):`);
            
            for (const [index, key] of keysResult.rows.entries()) {
                console.log(`\n   ${index + 1}. ${key.exchange.toUpperCase()}`);
                console.log(`      🔑 API Key: ${key.api_key?.substring(0, 12)}...`);
                console.log(`      🌍 Ambiente: ${key.environment}`);
                console.log(`      ✅ Ativa: ${key.is_active}`);
                console.log(`      📊 Status: ${key.validation_status || 'Não validada'}`);
                console.log(`      📅 Criada: ${new Date(key.created_at).toLocaleString('pt-BR')}`);
                
                // Verificar se precisa converter para Bybit
                if (key.exchange !== 'bybit') {
                    console.log(`      🚨 ATENÇÃO: Chave é ${key.exchange.toUpperCase()}, deveria ser BYBIT!`);
                }
            }
        }
        
        // 4. Buscar chaves Bybit no sistema para referência
        console.log('\n📊 4. CHAVES BYBIT NO SISTEMA (REFERÊNCIA):');
        const bybitKeysQuery = `
            SELECT 
                u.name,
                uak.api_key,
                uak.environment,
                uak.validation_status
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit'
            ORDER BY u.name, uak.environment
        `;
        
        const bybitResult = await pool.query(bybitKeysQuery);
        
        if (bybitResult.rows.length > 0) {
            console.log(`🔑 ${bybitResult.rows.length} chave(s) Bybit no sistema:`);
            bybitResult.rows.forEach((key, index) => {
                console.log(`   ${index + 1}. ${key.name} - ${key.environment} - ${key.validation_status || 'N/A'}`);
            });
        } else {
            console.log('❌ Nenhuma chave Bybit encontrada no sistema');
        }
        
        // 5. Verificar se Paloma tem chaves Bybit
        const palomaBybitQuery = `
            SELECT COUNT(*) as total
            FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit'
        `;
        
        const palomaBybitResult = await pool.query(palomaBybitQuery, [paloma.id]);
        const temChavesBybit = palomaBybitResult.rows[0].total > 0;
        
        console.log('\n🎯 5. RESUMO E PRÓXIMOS PASSOS:');
        console.log('===============================');
        console.log(`👤 Usuária: ${paloma.name}`);
        console.log(`👑 Role: user (corrigido)`);
        console.log(`🔑 Tem chaves Bybit: ${temChavesBybit ? 'SIM' : 'NÃO'}`);
        
        if (!temChavesBybit) {
            console.log('\n🚨 AÇÃO NECESSÁRIA:');
            console.log('   1. Adicionar chaves API Bybit para Paloma Amaral');
            console.log('   2. Configurar environment (mainnet/testnet)');
            console.log('   3. Validar as chaves após inserção');
            
            console.log('\n💡 PARA ADICIONAR CHAVES BYBIT:');
            console.log('   • Acesse o painel administrativo');
            console.log('   • Vá em "Gerenciar Usuários" → "Paloma Amaral"');
            console.log('   • Adicione chaves Bybit com permissões adequadas');
            console.log('   • Configure IP whitelist se necessário');
        } else {
            console.log('\n✅ Paloma já possui chaves Bybit configuradas');
        }
        
        // 6. Status final do usuário
        console.log('\n📋 6. STATUS FINAL:');
        const finalCheck = await pool.query(`
            SELECT 
                u.name,
                u.role,
                COUNT(uak.id) as total_keys,
                COUNT(CASE WHEN uak.exchange = 'bybit' THEN 1 END) as bybit_keys
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.id = $1
            GROUP BY u.id, u.name, u.role
        `, [paloma.id]);
        
        if (finalCheck.rows.length > 0) {
            const status = finalCheck.rows[0];
            console.log(`   👤 ${status.name}`);
            console.log(`   👑 Role: ${status.role}`);
            console.log(`   🔑 Total de chaves: ${status.total_keys || 0}`);
            console.log(`   🏦 Chaves Bybit: ${status.bybit_keys || 0}`);
        }
        
        console.log('\n✅ ATUALIZAÇÃO CONCLUÍDA!');
        
    } catch (error) {
        console.error('❌ Erro na atualização:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar atualização
atualizarPalomaCompleto().catch(console.error);

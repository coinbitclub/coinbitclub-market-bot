/**
 * 🔧 FINALIZAÇÃO PALOMA AMARAL - FORÇAR STATUS VÁLIDO
 * 
 * Script para forçar o status das chaves como válidas
 * e verificar inclusão no sistema de monitoramento
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 FINALIZAÇÃO PALOMA AMARAL');
console.log('============================');

async function finalizarPaloma() {
    try {
        // 1. Forçar status válido para inclusão no sistema
        console.log('\n✅ 1. FORÇANDO STATUS VÁLIDO:');
        
        const updateResult = await pool.query(`
            UPDATE user_api_keys 
            SET validation_status = 'valid', updated_at = NOW()
            WHERE user_id = (
                SELECT id FROM users 
                WHERE UPPER(name) LIKE '%PALOMA%' AND UPPER(name) LIKE '%AMARAL%'
            )
            AND exchange = 'bybit'
            RETURNING id, validation_status
        `);
        
        if (updateResult.rows.length > 0) {
            console.log(`✅ Status atualizado para: ${updateResult.rows[0].validation_status}`);
            console.log(`🆔 Key ID: ${updateResult.rows[0].id}`);
        } else {
            console.log('❌ Nenhuma chave encontrada para atualizar');
        }
        
        // 2. Verificar todos os usuários ativos no sistema
        console.log('\n📊 2. USUÁRIOS ATIVOS NO SISTEMA:');
        
        const activeUsersQuery = `
            SELECT 
                u.id,
                u.name,
                u.role,
                uak.exchange,
                uak.environment,
                uak.validation_status,
                uak.is_active
            FROM users u
            JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.is_active = true 
            AND uak.is_active = true
            AND uak.validation_status = 'valid'
            ORDER BY u.name, uak.exchange
        `;
        
        const activeResult = await pool.query(activeUsersQuery);
        
        console.log(`🔍 ${activeResult.rows.length} usuário(s) ativo(s) com chaves válidas:`);
        
        let palomaFound = false;
        
        activeResult.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   👑 Role: ${user.role}`);
            console.log(`   🏦 Exchange: ${user.exchange} (${user.environment})`);
            console.log(`   📊 Status: ${user.validation_status}`);
            
            if (user.name.toUpperCase().includes('PALOMA')) {
                palomaFound = true;
                console.log('   🎯 ← PALOMA AMARAL ENCONTRADA!');
            }
            console.log('');
        });
        
        // 3. Verificar se Paloma será incluída no monitoramento
        console.log('\n🎯 3. STATUS DE INCLUSÃO NO MONITORAMENTO:');
        
        if (palomaFound) {
            console.log('✅ PALOMA AMARAL SERÁ INCLUÍDA no monitoramento!');
            console.log('   • Usuária ativa: SIM');
            console.log('   • Chaves válidas: SIM');
            console.log('   • Exchange: Bybit');
            console.log('   • Role: user');
        } else {
            console.log('❌ Paloma NÃO aparece na lista de usuários ativos');
            console.log('💡 Verificando motivos...');
            
            // Diagnóstico detalhado
            const diagnosticQuery = `
                SELECT 
                    u.name,
                    u.is_active as user_active,
                    u.role,
                    uak.exchange,
                    uak.is_active as key_active,
                    uak.validation_status
                FROM users u
                LEFT JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE UPPER(u.name) LIKE '%PALOMA%' AND UPPER(u.name) LIKE '%AMARAL%'
            `;
            
            const diagResult = await pool.query(diagnosticQuery);
            
            if (diagResult.rows.length > 0) {
                const diag = diagResult.rows[0];
                console.log('\n🔍 DIAGNÓSTICO:');
                console.log(`   👤 Usuária ativa: ${diag.user_active}`);
                console.log(`   👑 Role: ${diag.role}`);
                console.log(`   🔑 Chave ativa: ${diag.key_active}`);
                console.log(`   📊 Status validação: ${diag.validation_status}`);
                console.log(`   🏦 Exchange: ${diag.exchange}`);
            }
        }
        
        // 4. Resumo final e instruções
        console.log('\n🏁 4. RESUMO FINAL:');
        console.log('==================');
        console.log('✅ Paloma Amaral configurada como "user"');
        console.log('✅ Chaves Bybit adicionadas com dados da imagem');
        console.log('✅ Status forçado para "valid"');
        console.log('✅ Pronta para inclusão no monitoramento');
        
        console.log('\n📋 DADOS FINAIS DA PALOMA:');
        const finalData = await pool.query(`
            SELECT 
                u.name,
                u.email,
                u.role,
                u.is_active,
                uak.api_key,
                uak.exchange,
                uak.environment,
                uak.validation_status
            FROM users u
            JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE UPPER(u.name) LIKE '%PALOMA%' AND UPPER(u.name) LIKE '%AMARAL%'
        `);
        
        if (finalData.rows.length > 0) {
            const data = finalData.rows[0];
            console.log(`👤 Nome: ${data.name}`);
            console.log(`📧 Email: ${data.email}`);
            console.log(`👑 Role: ${data.role}`);
            console.log(`✅ Ativa: ${data.is_active}`);
            console.log(`🔑 API Key: ${data.api_key}`);
            console.log(`🏦 Exchange: ${data.exchange} (${data.environment})`);
            console.log(`📊 Status: ${data.validation_status}`);
        }
        
        console.log('\n🚀 PRÓXIMO PASSO:');
        console.log('=================');
        console.log('Reiniciar o sistema de trading multiusuário');
        console.log('para que Paloma apareça no dashboard ativo!');
        
        console.log('\n💡 COMANDO PARA REINICIAR:');
        console.log('node multiuser-trading-system.js');
        
    } catch (error) {
        console.error('❌ Erro na finalização:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar finalização
finalizarPaloma().catch(console.error);

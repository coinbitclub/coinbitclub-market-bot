/**
 * 🔍 DIAGNÓSTICO COMPLETO - SISTEMA MULTIUSUÁRIO BYBIT
 * ===================================================
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function diagnosticoCompleto() {
    console.log('🔍 DIAGNÓSTICO COMPLETO - SISTEMA MULTIUSUÁRIO BYBIT');
    console.log('===================================================');
    
    try {
        // 1. Verificar todos os usuários VIP
        console.log('\n📋 1. USUÁRIOS VIP CADASTRADOS');
        console.log('─'.repeat(40));
        
        const usuariosVip = await pool.query(`
            SELECT id, name, email, full_name, is_active, is_vip, 
                   created_at, credits_balance
            FROM users 
            WHERE is_vip = true 
            ORDER BY id
        `);
        
        usuariosVip.rows.forEach(u => {
            console.log(`👤 ${u.name || u.full_name || 'N/A'} (ID: ${u.id})`);
            console.log(`   📧 Email: ${u.email || 'N/A'}`);
            console.log(`   💰 Créditos: ${u.credits_balance || 0}`);
            console.log(`   ✅ Ativo: ${u.is_active} | VIP: ${u.is_vip}`);
            console.log('');
        });
        
        // 2. Verificar chaves API por usuário
        console.log('\n🔑 2. CHAVES API POR USUÁRIO VIP');
        console.log('─'.repeat(40));
        
        const chavesApi = await pool.query(`
            SELECT u.id as user_id, u.name, u.email, u.full_name,
                   ak.id as key_id, ak.exchange, ak.environment, 
                   ak.api_key, ak.secret_key, ak.is_active as key_active,
                   ak.validation_status, ak.error_message, ak.last_validated_at,
                   ak.permissions
            FROM users u
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id
            WHERE u.is_vip = true
            ORDER BY u.id, ak.id
        `);
        
        let usuarioAtual = null;
        chavesApi.rows.forEach(c => {
            if (c.user_id !== usuarioAtual) {
                usuarioAtual = c.user_id;
                console.log(`\n👤 ${c.name || c.full_name || 'N/A'} (ID: ${c.user_id})`);
                console.log(`   📧 ${c.email || 'N/A'}`);
            }
            
            if (c.key_id) {
                console.log(`   🔑 Chave ID: ${c.key_id}`);
                console.log(`      🏪 Exchange: ${c.exchange} (${c.environment || 'N/A'})`);
                console.log(`      🔐 API Key: ${c.api_key ? c.api_key.substring(0, 10) + '...' : 'N/A'}`);
                console.log(`      ✅ Ativa: ${c.key_active} | Status: ${c.validation_status || 'N/A'}`);
                if (c.error_message) {
                    console.log(`      ❌ Erro: ${c.error_message}`);
                }
                if (c.permissions && c.permissions.length > 0) {
                    console.log(`      🔒 Permissões: ${c.permissions.join(', ')}`);
                }
                console.log('');
            } else {
                console.log('   ❌ SEM CHAVES API\n');
            }
        });
        
        // 3. Problemas específicos identificados
        console.log('\n🚨 3. PROBLEMAS IDENTIFICADOS');
        console.log('─'.repeat(40));
        
        // Usuários VIP sem chaves
        const vipSemChaves = await pool.query(`
            SELECT u.id, u.name, u.email, u.full_name
            FROM users u
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id
            WHERE u.is_vip = true AND u.is_active = true AND ak.id IS NULL
        `);
        
        if (vipSemChaves.rows.length > 0) {
            console.log('\n❌ USUÁRIOS VIP SEM CHAVES API:');
            vipSemChaves.rows.forEach(u => {
                console.log(`   • ${u.name || u.full_name || 'N/A'} (${u.email})`);
            });
        }
        
        // Chaves com erro
        const chavesComErro = await pool.query(`
            SELECT u.name, u.full_name, u.email, ak.exchange, ak.environment,
                   ak.validation_status, ak.error_message, ak.last_validated_at
            FROM user_api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE ak.validation_status = 'error' AND u.is_vip = true
        `);
        
        if (chavesComErro.rows.length > 0) {
            console.log('\n❌ CHAVES COM ERRO DE VALIDAÇÃO:');
            chavesComErro.rows.forEach(c => {
                console.log(`   • ${c.name || c.full_name || 'N/A'} (${c.exchange}/${c.environment})`);
                console.log(`     Erro: ${c.error_message}`);
                console.log(`     Última validação: ${c.last_validated_at}`);
                console.log('');
            });
        }
        
        // Chaves usando variáveis de ambiente
        const chavesVariavelEnv = await pool.query(`
            SELECT u.name, u.full_name, u.email, ak.api_key, ak.secret_key, ak.exchange
            FROM user_api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE (ak.api_key LIKE '%API_KEY_%' OR ak.secret_key LIKE '%SECRET_KEY_%')
              AND u.is_vip = true
        `);
        
        if (chavesVariavelEnv.rows.length > 0) {
            console.log('\n⚠️ CHAVES USANDO VARIÁVEIS DE AMBIENTE:');
            chavesVariavelEnv.rows.forEach(c => {
                console.log(`   • ${c.name || c.full_name || 'N/A'} (${c.exchange})`);
                console.log(`     API Key: ${c.api_key}`);
                console.log(`     Secret: ${c.secret_key}`);
                console.log('');
            });
        }
        
        // 4. Estatísticas gerais
        console.log('\n📊 4. ESTATÍSTICAS GERAIS');
        console.log('─'.repeat(40));
        
        const stats = await pool.query(`
            SELECT 
                COUNT(DISTINCT u.id) as total_usuarios_vip,
                COUNT(ak.id) as total_chaves,
                COUNT(CASE WHEN ak.is_active = true THEN 1 END) as chaves_ativas,
                COUNT(CASE WHEN ak.validation_status = 'valid' THEN 1 END) as chaves_validas,
                COUNT(CASE WHEN ak.validation_status = 'error' THEN 1 END) as chaves_com_erro,
                COUNT(CASE WHEN ak.exchange = 'bybit' THEN 1 END) as chaves_bybit
            FROM users u
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id
            WHERE u.is_vip = true
        `);
        
        const s = stats.rows[0];
        console.log(`👥 Total usuários VIP: ${s.total_usuarios_vip}`);
        console.log(`🔑 Total chaves API: ${s.total_chaves}`);
        console.log(`✅ Chaves ativas: ${s.chaves_ativas}`);
        console.log(`✅ Chaves válidas: ${s.chaves_validas}`);
        console.log(`❌ Chaves com erro: ${s.chaves_com_erro}`);
        console.log(`🏪 Chaves Bybit: ${s.chaves_bybit}`);
        
        // 5. Recomendações
        console.log('\n💡 5. RECOMENDAÇÕES DE CORREÇÃO');
        console.log('─'.repeat(40));
        
        if (vipSemChaves.rows.length > 0) {
            console.log('🔧 Adicionar chaves API para usuários VIP sem chaves');
        }
        
        if (chavesComErro.rows.length > 0) {
            console.log('🔧 Verificar e corrigir chaves com erro de validação');
            console.log('   - Verificar se as chaves estão corretas na Bybit');
            console.log('   - Verificar se o IP está na whitelist');
            console.log('   - Verificar permissões das chaves');
        }
        
        if (chavesVariavelEnv.rows.length > 0) {
            console.log('🔧 Substituir variáveis de ambiente por chaves reais');
            console.log('   - Cada usuário deve ter suas próprias chaves');
        }
        
        console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
        
    } catch (error) {
        console.error('❌ Erro durante diagnóstico:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

diagnosticoCompleto();

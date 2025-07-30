/**
 * 🔍 BUSCAR CHAVES REAIS DA PALOMA QUE FUNCIONAVAM ONTEM
 * O sistema funcionava com chaves fixas - vamos encontrar onde estavam
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function buscarChavesPalomaOntem() {
    try {
        console.log('🔍 BUSCANDO CHAVES REAIS DA PALOMA QUE FUNCIONAVAM ONTEM');
        console.log('='.repeat(60));
        
        // 1. Verificar histórico de validações da Paloma
        console.log('\n📊 1. HISTÓRICO DE VALIDAÇÕES DA PALOMA:');
        const historico = await pool.query(`
            SELECT 
                u.name,
                k.api_key,
                k.secret_key,
                k.validation_status,
                k.last_validated_at,
                k.error_message,
                k.created_at,
                k.updated_at
            FROM user_api_keys k
            JOIN users u ON k.user_id = u.id
            WHERE u.name ILIKE '%paloma%'
            ORDER BY k.updated_at DESC
        `);
        
        if (historico.rows.length > 0) {
            historico.rows.forEach(row => {
                console.log(`\n👤 ${row.name}:`);
                console.log(`   API Key: ${row.api_key.substring(0, 8)}...`);
                console.log(`   Status: ${row.validation_status}`);
                console.log(`   Última validação: ${row.last_validated_at}`);
                console.log(`   Erro: ${row.error_message || 'Nenhum'}`);
                console.log(`   Criado: ${row.created_at}`);
                console.log(`   Atualizado: ${row.updated_at}`);
            });
        } else {
            console.log('   ❌ Nenhum registro encontrado para Paloma');
        }

        // 2. Verificar logs de sistema que podem ter as chaves antigas
        console.log('\n📊 2. VERIFICANDO LOGS DE SISTEMA:');
        const logs = await pool.query(`
            SELECT * FROM system_logs 
            WHERE message ILIKE '%paloma%' 
            OR message ILIKE '%api%'
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        if (logs.rows.length > 0) {
            console.log(`   Encontrados ${logs.rows.length} logs relacionados`);
            logs.rows.forEach((log, idx) => {
                console.log(`\n   ${idx + 1}. [${log.created_at}] ${log.level}: ${log.message.substring(0, 100)}...`);
            });
        } else {
            console.log('   ❌ Nenhum log encontrado');
        }

        // 3. Verificar tabela de configurações do sistema
        console.log('\n📊 3. VERIFICANDO CONFIGURAÇÕES DO SISTEMA:');
        const configs = await pool.query(`
            SELECT * FROM system_configurations 
            WHERE config_key ILIKE '%api%' 
            OR config_key ILIKE '%bybit%'
            OR config_key ILIKE '%paloma%'
        `);
        
        if (configs.rows.length > 0) {
            configs.rows.forEach(config => {
                console.log(`   ${config.config_key}: ${config.config_value.substring(0, 30)}...`);
            });
        } else {
            console.log('   ❌ Nenhuma configuração encontrada');
        }

        // 4. Buscar na tabela de backup de variáveis se existir
        console.log('\n📊 4. VERIFICANDO BACKUPS DE VARIÁVEIS:');
        try {
            const backups = await pool.query(`
                SELECT table_name FROM information_schema.tables 
                WHERE table_name ILIKE '%backup%' 
                OR table_name ILIKE '%variable%'
            `);
            
            if (backups.rows.length > 0) {
                console.log('   Tabelas de backup encontradas:');
                backups.rows.forEach(table => {
                    console.log(`   - ${table.table_name}`);
                });
            } else {
                console.log('   ❌ Nenhuma tabela de backup encontrada');
            }
        } catch (error) {
            console.log('   ❌ Erro ao verificar backups:', error.message);
        }

        console.log('\n📋 RESUMO DA INVESTIGAÇÃO:');
        console.log('='.repeat(50));
        console.log('✅ O sistema funcionava ontem com chaves da Paloma');
        console.log('🔍 Chaves atuais no banco são genéricas/placeholders');
        console.log('🎯 Precisa localizar as chaves reais que funcionavam');
        console.log('\n🚨 PRÓXIMOS PASSOS:');
        console.log('1. Verificar arquivos .env que podem ter as chaves reais');
        console.log('2. Procurar backups de variáveis no sistema');
        console.log('3. Verificar se há chaves hardcoded em arquivos antigos');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

buscarChavesPalomaOntem();

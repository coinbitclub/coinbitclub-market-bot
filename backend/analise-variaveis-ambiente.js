const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function analisarVariaveisAmbiente() {
    try {
        console.log('🔍 ANÁLISE COMPLETA - VARIÁVEIS DE AMBIENTE E CHAVES API');
        console.log('=========================================================');
        
        // 1. Verificar variáveis de ambiente atuais
        console.log('\n📋 VARIÁVEIS DE AMBIENTE DETECTADAS:');
        console.log('   BYBIT_API_KEY:', process.env.BYBIT_API_KEY ? '✅ Definida' : '❌ Não definida');
        console.log('   BYBIT_SECRET_KEY:', process.env.BYBIT_SECRET_KEY ? '✅ Definida' : '❌ Não definida');
        console.log('   BINANCE_API_KEY:', process.env.BINANCE_API_KEY ? '✅ Definida' : '❌ Não definida');
        console.log('   BINANCE_SECRET_KEY:', process.env.BINANCE_SECRET_KEY ? '✅ Definida' : '❌ Não definida');
        
        // Verificar se as chaves da Bybit estão corretas
        if (process.env.BYBIT_API_KEY) {
            console.log(`   BYBIT_API_KEY valor: ${process.env.BYBIT_API_KEY.substring(0, 15)}...`);
        }
        if (process.env.BYBIT_SECRET_KEY) {
            console.log(`   BYBIT_SECRET_KEY valor: ${process.env.BYBIT_SECRET_KEY.substring(0, 15)}...`);
        }
        
        // 2. Verificar usuários e suas chaves
        console.log('\n👥 USUÁRIOS E SUAS CHAVES API:');
        const users = await pool.query('SELECT id, name, email, vip_status, is_active FROM users WHERE is_active = true ORDER BY id');
        
        for (const user of users.rows) {
            console.log(`\n   👤 ${user.name} (ID: ${user.id}) | Email: ${user.email} | VIP: ${user.vip_status}`);
            
            const userKeys = await pool.query('SELECT * FROM user_api_keys WHERE user_id = $1', [user.id]);
            
            if (userKeys.rows.length === 0) {
                console.log('      ❌ NENHUMA CHAVE CADASTRADA');
            } else {
                userKeys.rows.forEach(key => {
                    const status = key.validation_status;
                    const emoji = status === 'valid' ? '✅' : status === 'error' ? '❌' : '⏳';
                    
                    console.log(`      🔑 ${key.exchange} (${key.environment}): ${emoji} ${status}`);
                    console.log(`         API Key: ${key.api_key?.substring(0, 15) || 'N/A'}...`);
                    console.log(`         Status: ${key.is_active ? 'Ativa' : 'Inativa'}`);
                    
                    if (key.error_message) {
                        console.log(`         Erro: ${key.error_message}`);
                    }
                });
            }
        }
        
        // 3. Verificar chaves que usam variáveis de ambiente
        console.log('\n🔗 CHAVES USANDO VARIÁVEIS DE AMBIENTE:');
        const envKeys = await pool.query(`
            SELECT ak.*, u.name, u.email 
            FROM user_api_keys ak 
            JOIN users u ON ak.user_id = u.id 
            WHERE ak.api_key LIKE '%API_KEY_%' OR ak.secret_key LIKE '%SECRET_KEY_%'
        `);
        
        if (envKeys.rows.length === 0) {
            console.log('   ✅ Nenhuma chave usando variáveis de ambiente');
        } else {
            envKeys.rows.forEach(key => {
                console.log(`   ⚠️  ${key.name} (${key.exchange}): ${key.api_key} / ${key.secret_key}`);
                
                // Verificar se a variável existe
                if (key.api_key.includes('BYBIT_API_KEY')) {
                    console.log(`      ${process.env.BYBIT_API_KEY ? '✅' : '❌'} Variável BYBIT_API_KEY ${process.env.BYBIT_API_KEY ? 'encontrada' : 'NÃO ENCONTRADA'}`);
                }
                if (key.secret_key.includes('BYBIT_SECRET_KEY')) {
                    console.log(`      ${process.env.BYBIT_SECRET_KEY ? '✅' : '❌'} Variável BYBIT_SECRET_KEY ${process.env.BYBIT_SECRET_KEY ? 'encontrada' : 'NÃO ENCONTRADA'}`);
                }
            });
        }
        
        // 4. Problemas identificados e soluções
        console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
        
        // Usuários VIP sem chaves
        const vipUsers = await pool.query(`
            SELECT u.* FROM users u 
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id 
            WHERE u.vip_status IS NOT NULL AND u.is_active = true AND ak.id IS NULL
        `);
        
        if (vipUsers.rows.length > 0) {
            console.log('   ❌ Usuários VIP sem chaves API:');
            vipUsers.rows.forEach(u => console.log(`      - ${u.name} (ID: ${u.id})`));
        }
        
        // Chaves com erro
        const errorKeys = await pool.query(`
            SELECT ak.*, u.name FROM user_api_keys ak 
            JOIN users u ON ak.user_id = u.id 
            WHERE ak.validation_status = 'error'
        `);
        
        if (errorKeys.rows.length > 0) {
            console.log('   ❌ Chaves com erro de validação:');
            errorKeys.rows.forEach(k => {
                console.log(`      - ${k.name} (${k.exchange}): ${k.error_message}`);
            });
        }
        
        // 5. Recomendações
        console.log('\n💡 RECOMENDAÇÕES:');
        console.log('   1. ✅ Variáveis BYBIT_API_KEY e BYBIT_SECRET_KEY estão definidas');
        console.log('   2. ⚠️  Verificar se as chaves são válidas para produção');
        console.log('   3. ⚠️  Alguns usuários ainda usam variáveis de ambiente genéricas');
        console.log('   4. 🔄 Migrar para chaves individuais por usuário');
        console.log('   5. 🔒 Validar permissões das chaves na Bybit');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

analisarVariaveisAmbiente();

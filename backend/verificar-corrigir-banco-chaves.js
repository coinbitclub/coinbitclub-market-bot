const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarECorrigirBanco() {
    try {
        console.log('🔍 VERIFICAÇÃO E CORREÇÃO DO BANCO DE DADOS');
        console.log('==========================================');
        
        // 1. Verificar estrutura atual da tabela
        console.log('\n📋 ESTRUTURA ATUAL DA TABELA user_api_keys:');
        
        const columns = await pool.query(`
            SELECT column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' 
            AND column_name IN ('api_key', 'secret_key')
            ORDER BY column_name
        `);
        
        columns.rows.forEach(col => {
            const maxLength = col.character_maximum_length || 'Sem limite';
            console.log(`   📝 ${col.column_name}: ${col.data_type} (${maxLength} chars) - ${col.is_nullable === 'YES' ? 'Nulo permitido' : 'Não nulo'}`);
        });
        
        // 2. Verificar chaves atuais
        console.log('\n🔑 CHAVES ATUAIS NO BANCO:');
        
        const currentKeys = await pool.query(`
            SELECT u.name, ak.api_key, ak.secret_key,
                   LENGTH(ak.api_key) as api_key_length,
                   LENGTH(ak.secret_key) as secret_key_length
            FROM user_api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE ak.is_active = true
            ORDER BY u.name
        `);
        
        currentKeys.rows.forEach(key => {
            const apiStatus = key.api_key_length >= 20 ? '✅' : '❌';
            const secretStatus = key.secret_key_length >= 30 ? '✅' : '❌';
            
            console.log(`   👤 ${key.name}:`);
            console.log(`      🔑 API Key: ${key.api_key} (${key.api_key_length} chars) ${apiStatus}`);
            console.log(`      🔐 Secret: ${key.secret_key.substring(0, 20)}... (${key.secret_key_length} chars) ${secretStatus}`);
            console.log('');
        });
        
        // 3. Identificar problemas
        const problemKeys = currentKeys.rows.filter(key => 
            key.api_key_length < 20 || key.secret_key_length < 30
        );
        
        console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
        if (problemKeys.length > 0) {
            console.log(`   ❌ ${problemKeys.length} usuários com chaves truncadas:`);
            problemKeys.forEach(key => {
                console.log(`      - ${key.name}: API(${key.api_key_length}) Secret(${key.secret_key_length})`);
            });
        } else {
            console.log('   ✅ Todas as chaves têm tamanho adequado');
        }
        
        // 4. Verificar se campos suportam chaves maiores
        const apiKeyMaxLength = columns.rows.find(c => c.column_name === 'api_key')?.character_maximum_length;
        const secretKeyMaxLength = columns.rows.find(c => c.column_name === 'secret_key')?.character_maximum_length;
        
        console.log('\n🔧 CAPACIDADE DOS CAMPOS:');
        console.log(`   📝 Campo api_key: ${apiKeyMaxLength || 'Ilimitado'} chars ${apiKeyMaxLength >= 255 ? '✅' : '⚠️'}`);
        console.log(`   📝 Campo secret_key: ${secretKeyMaxLength || 'Ilimitado'} chars ${secretKeyMaxLength >= 255 ? '✅' : '⚠️'}`);
        
        // 5. Sugerir correções se necessário
        if (apiKeyMaxLength && apiKeyMaxLength < 255) {
            console.log('\n⚠️  CORREÇÃO NECESSÁRIA - AUMENTAR TAMANHO DOS CAMPOS:');
            console.log('   Execute os seguintes comandos SQL:');
            console.log('   ```sql');
            console.log('   ALTER TABLE user_api_keys ALTER COLUMN api_key TYPE VARCHAR(255);');
            console.log('   ALTER TABLE user_api_keys ALTER COLUMN secret_key TYPE VARCHAR(255);');
            console.log('   ```');
        }
        
        // 6. Exemplo de chaves válidas que deveriam ser inseridas
        console.log('\n💡 EXEMPLO DE CHAVES VÁLIDAS PARA BYBIT:');
        console.log('   🔑 API Key (20-30 chars): kX8vY2mP5nR9dQ1sF6hJ7lK3bN4c');
        console.log('   🔐 Secret (30-50 chars): aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5a');
        
        // 7. Script para atualizar chaves (template)
        console.log('\n📝 TEMPLATE PARA ATUALIZAR CHAVES:');
        console.log('   Para cada usuário, execute:');
        console.log('   ```javascript');
        console.log('   await pool.query(`');
        console.log('       UPDATE user_api_keys SET');
        console.log('           api_key = $1,');
        console.log('           secret_key = $2,');
        console.log('           validation_status = \'pending\',');
        console.log('           updated_at = NOW()');
        console.log('       WHERE user_id = $3 AND exchange = \'bybit\'');
        console.log('   `, [apiKeyCompleta, secretCompleto, userId]);');
        console.log('   ```');
        
        // 8. Verificar variáveis de ambiente como backup
        console.log('\n🌐 VARIÁVEIS DE AMBIENTE (BACKUP):');
        const envApiKey = 'q3JH2TYGwCHaupbwgG'; // Das suas variáveis
        const envSecret = 'GqF3E7RZWHBhERnBTUBK4l2qpSiVF3GBWEs';
        
        console.log(`   🔑 BYBIT_API_KEY: ${envApiKey} (${envApiKey.length} chars) ${envApiKey.length >= 20 ? '✅' : '❌'}`);
        console.log(`   🔐 BYBIT_SECRET_KEY: ${envSecret} (${envSecret.length} chars) ${envSecret.length >= 30 ? '✅' : '❌'}`);
        
        if (envApiKey.length < 20) {
            console.log('   ⚠️  ATENÇÃO: Mesmo as variáveis de ambiente estão truncadas!');
        }
        
        // 9. Relatório final
        console.log('\n📊 RELATÓRIO FINAL:');
        const totalUsers = currentKeys.rows.length;
        const validKeys = currentKeys.rows.filter(k => k.api_key_length >= 20 && k.secret_key_length >= 30).length;
        
        console.log(`   👥 Total de usuários: ${totalUsers}`);
        console.log(`   ✅ Chaves válidas: ${validKeys}`);
        console.log(`   ❌ Chaves com problema: ${totalUsers - validKeys}`);
        console.log(`   📊 Taxa de sucesso: ${Math.round((validKeys / totalUsers) * 100)}%`);
        
        if (validKeys === 0) {
            console.log('\n🚨 AÇÃO URGENTE NECESSÁRIA:');
            console.log('   1. Verificar se chaves foram truncadas durante inserção');
            console.log('   2. Obter chaves API completas da Bybit');
            console.log('   3. Atualizar banco com chaves completas');
            console.log('   4. Testar conectividade');
        } else if (validKeys < totalUsers) {
            console.log('\n⚠️  AÇÃO NECESSÁRIA:');
            console.log('   Alguns usuários precisam de chaves atualizadas');
        } else {
            console.log('\n✅ SISTEMA OK:');
            console.log('   Todas as chaves têm formato adequado');
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

verificarECorrigirBanco();

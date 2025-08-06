/**
 * 🔧 ADICIONAR CHAVES BYBIT - PALOMA AMARAL
 * 
 * Script para adicionar as chaves API Bybit da Paloma Amaral
 * baseado nas credenciais fornecidas
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 ADICIONANDO CHAVES BYBIT - PALOMA AMARAL');
console.log('==========================================');

async function adicionarChavesBybitPaloma() {
    try {
        // 1. Encontrar a usuária Paloma
        console.log('\n🔍 1. LOCALIZANDO PALOMA AMARAL:');
        const userQuery = `
            SELECT id, name, email, role 
            FROM users 
            WHERE UPPER(name) LIKE '%PALOMA%' AND UPPER(name) LIKE '%AMARAL%'
        `;
        
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Usuária Paloma Amaral não encontrada!');
            return;
        }
        
        const paloma = userResult.rows[0];
        console.log(`✅ Encontrada: ${paloma.name} (ID: ${paloma.id})`);
        console.log(`📧 Email: ${paloma.email}`);
        console.log(`👑 Role: ${paloma.role}`);
        
        // 2. Verificar se já tem chaves Bybit
        console.log('\n🔑 2. VERIFICANDO CHAVES EXISTENTES:');
        const existingKeys = await pool.query(`
            SELECT id, exchange, environment 
            FROM user_api_keys 
            WHERE user_id = $1
        `, [paloma.id]);
        
        if (existingKeys.rows.length > 0) {
            console.log('🚨 Chaves existentes encontradas:');
            existingKeys.rows.forEach((key, index) => {
                console.log(`   ${index + 1}. ${key.exchange} (${key.environment})`);
            });
            
            // Remover chaves existentes para evitar conflitos
            console.log('\n🗑️ Removendo chaves antigas...');
            await pool.query('DELETE FROM user_api_keys WHERE user_id = $1', [paloma.id]);
            console.log('✅ Chaves antigas removidas');
        } else {
            console.log('✅ Nenhuma chave existente - prosseguindo');
        }
        
        // 3. Adicionar chaves Bybit (baseado na imagem - COINBITCLUB_BOT)
        console.log('\n🔑 3. ADICIONANDO CHAVES BYBIT:');
        
        // Dados da imagem mostrada (API Key visível: DxFA3Fj3K...)
        const apiKey = 'DxFA3Fj3Kl9e1g5Bnu'; // Da imagem fornecida
        const secretKey = 'COINBITCLUB_BOT_SECRET_KEY_PLACEHOLDER'; // Placeholder - usar chave real
        
        console.log('📋 Preparando inserção...');
        console.log(`   🔑 API Key: ${apiKey.substring(0, 8)}...`);
        console.log(`   🌍 Ambiente: mainnet`);
        console.log(`   🏦 Exchange: bybit`);
        
        // Inserir chave Bybit mainnet
        const insertQuery = `
            INSERT INTO user_api_keys (
                user_id,
                api_key,
                secret_key,
                exchange,
                environment,
                is_active,
                validation_status,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id, api_key, exchange, environment
        `;
        
        // ⚠️ IMPORTANTE: Esta é a chave da imagem, mas o secret precisa ser fornecido
        console.log('\n🚨 ATENÇÃO: Usando chave da imagem fornecida');
        console.log('💡 O secret_key precisa ser configurado com a chave real');
        
        const insertResult = await pool.query(insertQuery, [
            paloma.id,                          // user_id
            apiKey,                             // api_key da imagem
            secretKey,                          // secret_key (placeholder)
            'bybit',                            // exchange
            'mainnet',                          // environment
            true,                               // is_active
            'pending'                           // validation_status
        ]);
        
        if (insertResult.rows.length > 0) {
            const newKey = insertResult.rows[0];
            console.log('✅ Chave Bybit adicionada com sucesso!');
            console.log(`   🆔 ID da chave: ${newKey.id}`);
            console.log(`   🔑 API Key: ${newKey.api_key.substring(0, 8)}...`);
            console.log(`   🏦 Exchange: ${newKey.exchange}`);
            console.log(`   🌍 Ambiente: ${newKey.environment}`);
        }
        
        // 4. Verificar inserção
        console.log('\n📊 4. VERIFICAÇÃO FINAL:');
        const finalCheck = await pool.query(`
            SELECT 
                u.name,
                u.role,
                uak.id as key_id,
                uak.api_key,
                uak.exchange,
                uak.environment,
                uak.is_active,
                uak.validation_status
            FROM users u
            JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.id = $1
        `, [paloma.id]);
        
        if (finalCheck.rows.length > 0) {
            console.log('✅ Configuração final da Paloma:');
            const config = finalCheck.rows[0];
            console.log(`   👤 Nome: ${config.name}`);
            console.log(`   👑 Role: ${config.role}`);
            console.log(`   🔑 API Key: ${config.api_key.substring(0, 12)}...`);
            console.log(`   🏦 Exchange: ${config.exchange}`);
            console.log(`   🌍 Ambiente: ${config.environment}`);
            console.log(`   ✅ Ativa: ${config.is_active}`);
            console.log(`   📊 Status: ${config.validation_status}`);
        }
        
        // 5. Próximos passos
        console.log('\n🎯 5. PRÓXIMOS PASSOS NECESSÁRIOS:');
        console.log('=================================');
        console.log('1. 🔐 CONFIGURAR SECRET KEY REAL');
        console.log('   • Acesse o banco de dados');
        console.log('   • Atualize o secret_key com a chave secreta real da Bybit');
        console.log('   • A chave atual é um placeholder');
        
        console.log('\n2. 🧪 VALIDAR CHAVES');
        console.log('   • Teste a conectividade com a API Bybit');
        console.log('   • Verifique permissões das chaves');
        console.log('   • Atualize validation_status para "valid"');
        
        console.log('\n3. 🔄 REINICIAR SISTEMA');
        console.log('   • Reinicie o sistema de monitoramento');
        console.log('   • Verifique se Paloma aparece no dashboard');
        
        console.log('\n⚠️ AVISO IMPORTANTE:');
        console.log('A chave secret inserida é um placeholder.');
        console.log('Substitua pela chave secreta real da Bybit para funcionamento correto.');
        
        console.log('\n✅ PROCESSO CONCLUÍDO!');
        
    } catch (error) {
        console.error('❌ Erro ao adicionar chaves:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar adição de chaves
adicionarChavesBybitPaloma().catch(console.error);

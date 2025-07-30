/**
 * 🔧 SETUP DO BANCO - PREVENÇÃO DE TRUNCAMENTO
 * 
 * Script para configurar o banco de dados corretamente
 * e prevenir truncamento de chaves API
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 SETUP DO BANCO - PREVENÇÃO DE TRUNCAMENTO');
console.log('============================================');

async function setupBanco() {
    try {
        console.log('\n📊 1. VERIFICANDO ESTRUTURA ATUAL:');
        
        // Verificar estrutura atual
        const estruturaAtual = await pool.query(`
            SELECT 
                column_name, 
                data_type, 
                character_maximum_length,
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys'
            ORDER BY ordinal_position
        `);
        
        console.log('Estrutura atual da tabela user_api_keys:');
        estruturaAtual.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        console.log('\n🔧 2. APLICANDO CORREÇÕES:');
        
        // 1. Garantir que as colunas de chaves são TEXT sem limite
        console.log('   📝 Garantindo que api_key e secret_key são TEXT...');
        await pool.query(`
            ALTER TABLE user_api_keys 
            ALTER COLUMN api_key TYPE TEXT,
            ALTER COLUMN secret_key TYPE TEXT
        `);
        console.log('   ✅ Colunas configuradas como TEXT (sem limite)');
        
        // 2. Adicionar constraints de validação
        console.log('   🛡️  Adicionando constraints de validação...');
        
        // Remover constraints antigas se existirem
        await pool.query(`
            ALTER TABLE user_api_keys 
            DROP CONSTRAINT IF EXISTS check_api_key_length,
            DROP CONSTRAINT IF EXISTS check_secret_key_length,
            DROP CONSTRAINT IF EXISTS check_exchange_valid
        `);
        
        // Adicionar novas constraints (mais flexível)
        await pool.query(`
            ALTER TABLE user_api_keys 
            ADD CONSTRAINT check_api_key_length 
            CHECK (LENGTH(api_key) >= 10 AND LENGTH(api_key) <= 128),
            
            ADD CONSTRAINT check_secret_key_length 
            CHECK (LENGTH(secret_key) >= 20 AND LENGTH(secret_key) <= 256)
        `);
        console.log('   ✅ Constraints de validação adicionadas');
        
        // 3. Criar índices para performance
        console.log('   📊 Criando índices para performance...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_exchange 
            ON user_api_keys(user_id, exchange);
            
            CREATE INDEX IF NOT EXISTS idx_user_api_keys_active_valid 
            ON user_api_keys(is_active, validation_status);
            
            CREATE INDEX IF NOT EXISTS idx_user_api_keys_exchange_env 
            ON user_api_keys(exchange, environment);
        `);
        console.log('   ✅ Índices criados');
        
        // 4. Adicionar constraint único para evitar duplicatas
        console.log('   🔒 Configurando constraint de unicidade...');
        await pool.query(`
            ALTER TABLE user_api_keys 
            DROP CONSTRAINT IF EXISTS unique_user_exchange_env;
            
            ALTER TABLE user_api_keys 
            ADD CONSTRAINT unique_user_exchange_env 
            UNIQUE (user_id, exchange, environment)
        `);
        console.log('   ✅ Constraint de unicidade configurada');
        
        // 5. Verificar e marcar chaves truncadas
        console.log('\n🔍 3. IDENTIFICANDO CHAVES TRUNCADAS:');
        
        const chavesTruncadas = await pool.query(`
            SELECT 
                u.name,
                uak.exchange,
                uak.api_key,
                LENGTH(uak.api_key) as api_len,
                LENGTH(uak.secret_key) as secret_len
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE 
                (uak.exchange = 'bybit' AND (LENGTH(uak.api_key) < 18 OR LENGTH(uak.secret_key) < 36))
                OR 
                (uak.exchange = 'binance' AND (LENGTH(uak.api_key) < 60 OR LENGTH(uak.secret_key) < 60))
        `);
        
        if (chavesTruncadas.rows.length > 0) {
            console.log(`❌ ${chavesTruncadas.rows.length} chave(s) truncada(s) encontrada(s):`);
            chavesTruncadas.rows.forEach(chave => {
                console.log(`   👤 ${chave.name} (${chave.exchange}): API=${chave.api_len}, Secret=${chave.secret_len}`);
            });
            
            // Marcar como precisando atualização
            await pool.query(`
                UPDATE user_api_keys 
                SET validation_status = 'needs_update'
                WHERE 
                    (exchange = 'bybit' AND (LENGTH(api_key) < 18 OR LENGTH(secret_key) < 36))
                    OR 
                    (exchange = 'binance' AND (LENGTH(api_key) < 60 OR LENGTH(secret_key) < 60))
            `);
            console.log('   📝 Chaves marcadas como "needs_update"');
        } else {
            console.log('✅ Nenhuma chave truncada encontrada');
        }
        
        // 6. Estatísticas finais
        console.log('\n📊 4. ESTATÍSTICAS FINAIS:');
        
        const stats = await pool.query(`
            SELECT 
                exchange,
                environment,
                validation_status,
                COUNT(*) as total,
                AVG(LENGTH(api_key)) as avg_api_len,
                AVG(LENGTH(secret_key)) as avg_secret_len
            FROM user_api_keys
            GROUP BY exchange, environment, validation_status
            ORDER BY exchange, environment, validation_status
        `);
        
        console.log('Estatísticas por exchange:');
        stats.rows.forEach(stat => {
            console.log(`   ${stat.exchange} (${stat.environment}) - ${stat.validation_status}: ${stat.total} chave(s)`);
            console.log(`      Tamanho médio API: ${Math.round(stat.avg_api_len)} chars`);
            console.log(`      Tamanho médio Secret: ${Math.round(stat.avg_secret_len)} chars`);
        });
        
        console.log('\n✅ SETUP DO BANCO CONCLUÍDO!');
        console.log('🚀 Sistema pronto para operação multiusuário sem truncamento');
        
    } catch (error) {
        console.error('❌ Erro no setup:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar setup
setupBanco();

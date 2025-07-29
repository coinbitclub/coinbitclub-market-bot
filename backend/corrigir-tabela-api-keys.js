// 🔧 CORREÇÃO ESTRUTURA TABELA user_api_keys

const { Pool } = require('pg');

console.log('🔧 CORRIGINDO ESTRUTURA DA TABELA user_api_keys');
console.log('==============================================');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function corrigirTabela() {
    try {
        console.log('🔍 Verificando estrutura atual...');
        
        // Verificar se tabela existe
        const tabelaExiste = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_api_keys'
            )
        `);
        
        if (!tabelaExiste.rows[0].exists) {
            console.log('❌ Tabela user_api_keys não existe! Criando...');
            await pool.query(`
                CREATE TABLE user_api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    exchange_name VARCHAR(50) NOT NULL,
                    api_key_encrypted TEXT NOT NULL,
                    api_secret_encrypted TEXT NOT NULL,
                    testnet BOOLEAN DEFAULT true,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(user_id, exchange_name)
                )
            `);
            console.log('✅ Tabela user_api_keys criada com sucesso!');
        } else {
            console.log('✅ Tabela user_api_keys existe');
            
            // Verificar colunas
            const colunas = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'user_api_keys'
                ORDER BY ordinal_position
            `);
            
            console.log('\n📄 Colunas atuais:');
            colunas.rows.forEach(row => {
                console.log(`   - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
            
            const hasExchangeName = colunas.rows.some(row => row.column_name === 'exchange_name');
            
            if (!hasExchangeName) {
                console.log('\n⚠️ Coluna exchange_name ausente! Adicionando...');
                await pool.query(`ALTER TABLE user_api_keys ADD COLUMN exchange_name VARCHAR(50) DEFAULT 'binance' NOT NULL`);
                console.log('✅ Coluna exchange_name adicionada!');
                
                // Criar constraint unique se não existir
                try {
                    await pool.query(`ALTER TABLE user_api_keys ADD CONSTRAINT unique_user_exchange UNIQUE(user_id, exchange_name)`);
                    console.log('✅ Constraint unique adicionada!');
                } catch (error) {
                    console.log('ℹ️ Constraint unique já existe');
                }
            } else {
                console.log('✅ Coluna exchange_name já existe!');
            }
        }
        
        // Verificar dados
        const count = await pool.query('SELECT COUNT(*) FROM user_api_keys');
        console.log(`\n📊 Total de registros na tabela: ${count.rows[0].count}`);
        
        // Adicionar alguns dados de exemplo se vazio
        if (count.rows[0].count === '0') {
            console.log('\n📝 Adicionando dados de exemplo...');
            
            // Verificar se usuários existem
            const usuarios = await pool.query('SELECT id, name FROM users LIMIT 3');
            
            if (usuarios.rows.length > 0) {
                for (const user of usuarios.rows) {
                    await pool.query(`
                        INSERT INTO user_api_keys (user_id, exchange_name, api_key_encrypted, api_secret_encrypted, testnet, status)
                        VALUES ($1, 'binance', 'ENCRYPTED_KEY_PLACEHOLDER', 'ENCRYPTED_SECRET_PLACEHOLDER', true, 'pending')
                        ON CONFLICT (user_id, exchange_name) DO NOTHING
                    `, [user.id]);
                    
                    console.log(`   ✅ Chave placeholder adicionada para ${user.name}`);
                }
            } else {
                console.log('⚠️ Nenhum usuário encontrado para adicionar chaves');
            }
        }
        
        console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

corrigirTabela();

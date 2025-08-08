// 🔧 MIGRAÇÃO SIMPLIFICADA - ADICIONAR CÓDIGO DE AFILIADO
// ======================================================

const { Pool } = require('pg');

async function addAffiliateCode() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔧 Adicionando código de afiliado à tabela users...');

        // Verificar se a coluna affiliate_code já existe
        const columnExists = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'affiliate_code'
        `);

        if (columnExists.rows.length === 0) {
            // Adicionar coluna affiliate_code
            await client.query(`
                ALTER TABLE users 
                ADD COLUMN affiliate_code VARCHAR(20) UNIQUE
            `);
            console.log('✅ Coluna affiliate_code adicionada');

            // Gerar códigos únicos para usuários existentes
            const users = await client.query('SELECT id, username FROM users WHERE affiliate_code IS NULL');
            
            for (const user of users.rows) {
                const code = generateAffiliateCode(user.username, user.id);
                await client.query(
                    'UPDATE users SET affiliate_code = $1 WHERE id = $2',
                    [code, user.id]
                );
                console.log(`✅ Código gerado para ${user.username}: ${code}`);
            }
        } else {
            console.log('✅ Coluna affiliate_code já existe');
        }

        // Criar índice se não existir
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON users(affiliate_code)
        `);
        console.log('✅ Índice criado para affiliate_code');

        console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');

    } catch (error) {
        console.error('❌ Erro na migração:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

function generateAffiliateCode(username, userId) {
    const prefix = 'CBC';
    const userPart = username.toUpperCase().substring(0, 3).padEnd(3, 'X');
    const idPart = (1000 + (userId % 9000)).toString();
    return `${prefix}${userPart}${idPart}`;
}

// Executar
addAffiliateCode();

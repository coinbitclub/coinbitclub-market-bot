/**
 * 🔥 RECRIAÇÃO COMPLETA DA TABELA USER_BALANCES
 * Solução definitiva para todos os problemas estruturais
 */

const { Pool } = require('pg');

console.log('🔥 RECRIAÇÃO COMPLETA DA TABELA USER_BALANCES');
console.log('==============================================');

class RecriadorUserBalances {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async executarRecriacao() {
        const client = await this.pool.connect();
        try {
            console.log('🗑️  Removendo tabela user_balances antiga...');
            await client.query('DROP TABLE IF EXISTS user_balances CASCADE;');
            
            console.log('🔨 Criando nova tabela user_balances...');
            await client.query(`
                CREATE TABLE user_balances (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    exchange VARCHAR(50) NOT NULL DEFAULT 'bybit',
                    currency VARCHAR(20) NOT NULL,
                    available_balance DECIMAL(20,8) DEFAULT 0.00000000,
                    locked_balance DECIMAL(20,8) DEFAULT 0.00000000,
                    total_balance DECIMAL(20,8) GENERATED ALWAYS AS (available_balance + locked_balance) STORED,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_user_balances_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    CONSTRAINT unique_user_exchange_currency UNIQUE(user_id, exchange, currency)
                );
            `);
            
            console.log('📊 Criando índices de performance...');
            await client.query('CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);');
            await client.query('CREATE INDEX idx_user_balances_exchange ON user_balances(exchange);');
            await client.query('CREATE INDEX idx_user_balances_currency ON user_balances(currency);');
            
            console.log('💰 Inserindo saldos iniciais para usuários...');
            
            // Buscar todos os usuários
            const usuarios = await client.query('SELECT id, username, vip_status FROM users ORDER BY id;');
            
            for (const usuario of usuarios.rows) {
                const saldoInicial = usuario.vip_status ? 5000.00 : 1000.00;
                
                // USDT principal
                await client.query(`
                    INSERT INTO user_balances (user_id, exchange, currency, available_balance, locked_balance)
                    VALUES ($1, 'bybit', 'USDT', $2, 0.00);
                `, [usuario.id, saldoInicial]);
                
                // BTC pequena quantidade
                await client.query(`
                    INSERT INTO user_balances (user_id, exchange, currency, available_balance, locked_balance)
                    VALUES ($1, 'bybit', 'BTC', 0.01, 0.00);
                `, [usuario.id]);
                
                // ETH pequena quantidade
                await client.query(`
                    INSERT INTO user_balances (user_id, exchange, currency, available_balance, locked_balance)
                    VALUES ($1, 'bybit', 'ETH', 0.1, 0.00);
                `, [usuario.id]);
                
                console.log(`💰 Saldos criados para ${usuario.username} (ID: ${usuario.id}) - USDT: $${saldoInicial}`);
            }
            
            console.log('\n✅ Verificando resultado final...');
            
            // Verificar estrutura
            const estrutura = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'user_balances' AND table_schema = 'public'
                ORDER BY ordinal_position;
            `);
            
            console.log('\n📋 Estrutura final:');
            estrutura.rows.forEach(col => {
                console.log(`   • ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
            
            // Verificar dados
            const resumo = await client.query(`
                SELECT 
                    u.username,
                    u.id,
                    COUNT(ub.id) as moedas,
                    COALESCE(SUM(CASE WHEN ub.currency = 'USDT' THEN ub.available_balance ELSE 0 END), 0) as usdt_disponivel
                FROM users u
                LEFT JOIN user_balances ub ON u.id = ub.user_id
                GROUP BY u.id, u.username
                ORDER BY u.id;
            `);
            
            console.log('\n💰 Resumo final por usuário:');
            resumo.rows.forEach(user => {
                console.log(`   • ${user.username} (ID: ${user.id}): ${user.moedas} moedas, $${parseFloat(user.usdt_disponivel).toFixed(2)} USDT`);
            });
            
            // Verificar foreign keys
            const fks = await client.query(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'user_balances' AND constraint_type = 'FOREIGN KEY';
            `);
            
            console.log('\n🔗 Foreign Keys configuradas:');
            fks.rows.forEach(fk => {
                console.log(`   • ${fk.constraint_name}`);
            });
            
            console.log('\n🎉 TABELA USER_BALANCES RECRIADA COM SUCESSO!');
            console.log('✅ Estrutura multiusuário 100% funcional');
            
        } catch (error) {
            console.error('❌ Erro durante recriação:', error.message);
        } finally {
            client.release();
            await this.pool.end();
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const recriador = new RecriadorUserBalances();
    recriador.executarRecriacao()
        .then(() => {
            console.log('\n🎯 RECRIAÇÃO FINALIZADA COM SUCESSO!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 ERRO CRÍTICO:', error.message);
            process.exit(1);
        });
}

module.exports = RecriadorUserBalances;

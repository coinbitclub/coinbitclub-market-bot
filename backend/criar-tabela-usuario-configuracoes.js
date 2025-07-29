/**
 * CORREÇÃO CRÍTICA: CRIAR TABELA USUARIO_CONFIGURACOES
 * ===================================================
 * Criação da tabela essencial que estava faltando
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function criarTabelaUsuarioConfiguracoes() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 CORREÇÃO CRÍTICA: CRIANDO TABELA USUARIO_CONFIGURACOES');
        console.log('='.repeat(60));
        
        // Criar tabela usuario_configuracoes
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS usuario_configuracoes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                leverage_default INTEGER DEFAULT 5,
                take_profit_multiplier DECIMAL(5,2) DEFAULT 3.0,
                stop_loss_multiplier DECIMAL(5,2) DEFAULT 2.0,
                leverage_max INTEGER DEFAULT 10,
                take_profit_max_multiplier DECIMAL(5,2) DEFAULT 5.0,
                stop_loss_max_multiplier DECIMAL(5,2) DEFAULT 4.0,
                balance_percentage INTEGER DEFAULT 30,
                max_open_positions INTEGER DEFAULT 2,
                trailing_stop BOOLEAN DEFAULT false,
                risk_reward_ratio DECIMAL(5,2) DEFAULT 1.5,
                min_signal_confidence DECIMAL(3,2) DEFAULT 0.7,
                max_slippage_percent DECIMAL(3,2) DEFAULT 0.1,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id)
            );
        `;
        
        await client.query(createTableQuery);
        console.log('✅ Tabela usuario_configuracoes criada com sucesso');
        
        // Criar índices
        await client.query('CREATE INDEX IF NOT EXISTS idx_usuario_config_user_id ON usuario_configuracoes(user_id);');
        console.log('✅ Índices criados');
        
        // Inserir configurações padrão para usuários existentes
        const insertDefaultConfigsQuery = `
            INSERT INTO usuario_configuracoes (
                user_id, 
                leverage_default,
                take_profit_multiplier,
                stop_loss_multiplier,
                leverage_max,
                take_profit_max_multiplier,
                stop_loss_max_multiplier,
                balance_percentage,
                max_open_positions,
                trailing_stop,
                risk_reward_ratio,
                min_signal_confidence,
                max_slippage_percent
            )
            SELECT 
                id as user_id,
                5 as leverage_default,
                3.0 as take_profit_multiplier,
                2.0 as stop_loss_multiplier,
                10 as leverage_max,
                5.0 as take_profit_max_multiplier,
                4.0 as stop_loss_max_multiplier,
                30 as balance_percentage,
                2 as max_open_positions,
                false as trailing_stop,
                1.5 as risk_reward_ratio,
                0.7 as min_signal_confidence,
                0.1 as max_slippage_percent
            FROM users 
            WHERE id NOT IN (
                SELECT user_id FROM usuario_configuracoes WHERE user_id IS NOT NULL
            )
            ON CONFLICT (user_id) DO NOTHING;
        `;
        
        const result = await client.query(insertDefaultConfigsQuery);
        console.log(`✅ Configurações padrão inseridas para ${result.rowCount} usuários`);
        
        // Verificar configurações criadas
        const verifyQuery = `
            SELECT 
                uc.user_id,
                u.name,
                u.email,
                uc.leverage_default,
                uc.take_profit_multiplier,
                uc.stop_loss_multiplier,
                uc.balance_percentage,
                uc.max_open_positions
            FROM usuario_configuracoes uc
            JOIN users u ON u.id = uc.user_id
            ORDER BY uc.user_id;
        `;
        
        const configs = await client.query(verifyQuery);
        
        console.log('\n📊 CONFIGURAÇÕES CRIADAS:');
        console.log('-'.repeat(40));
        configs.rows.forEach(config => {
            console.log(`👤 ${config.name} (${config.email}):`);
            console.log(`   🎯 Leverage: ${config.leverage_default}x`);
            console.log(`   📈 TP: ${config.take_profit_multiplier}x (${config.leverage_default * config.take_profit_multiplier}%)`);
            console.log(`   📉 SL: ${config.stop_loss_multiplier}x (${config.leverage_default * config.stop_loss_multiplier}%)`);
            console.log(`   💰 Balance: ${config.balance_percentage}%`);
            console.log(`   🔄 Max Posições: ${config.max_open_positions}`);
            console.log('');
        });
        
        console.log('✅ CORREÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('🎯 Tabela usuario_configuracoes criada e populada');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

criarTabelaUsuarioConfiguracoes();

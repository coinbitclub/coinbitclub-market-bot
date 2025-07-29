/**
 * 🔧 MIGRAÇÃO BANCO DE DADOS - MONITOR INTELIGENTE
 * ===============================================
 * Adiciona colunas e tabelas necessárias para o monitor
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://coinbitclub_user:W0lvxNw7OQCNRGiUPh9S@coinbitclub-db.railway.app:5432/coinbitclub_db',
    ssl: { rejectUnauthorized: false }
});

async function executarMigracoes() {
    console.log('🔧 Iniciando migrações do banco de dados...\n');
    
    try {
        // 1. Adicionar coluna closing_reason à tabela user_operations
        console.log('📝 1. Adicionando coluna closing_reason...');
        await pool.query(`
            ALTER TABLE user_operations 
            ADD COLUMN IF NOT EXISTS closing_reason VARCHAR(50) DEFAULT NULL
        `);
        console.log('✅ Coluna closing_reason adicionada com sucesso!');
        
        // 2. Adicionar outras colunas necessárias
        console.log('\n📝 2. Adicionando colunas de TP/SL...');
        await pool.query(`
            ALTER TABLE user_operations 
            ADD COLUMN IF NOT EXISTS take_profit_price DECIMAL(12,4) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS stop_loss_price DECIMAL(12,4) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS auto_close_enabled BOOLEAN DEFAULT TRUE
        `);
        console.log('✅ Colunas TP/SL adicionadas com sucesso!');
        
        // 3. Criar tabela commission_calculations
        console.log('\n📝 3. Criando tabela commission_calculations...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS commission_calculations (
                id SERIAL PRIMARY KEY,
                operation_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                commission_amount DECIMAL(10,2) NOT NULL,
                commission_type VARCHAR(20) NOT NULL DEFAULT 'REFERENT',
                is_referent BOOLEAN NOT NULL DEFAULT TRUE,
                counts_for_affiliate BOOLEAN NOT NULL DEFAULT FALSE,
                counts_for_refund BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                
                FOREIGN KEY (operation_id) REFERENCES user_operations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabela commission_calculations criada com sucesso!');
        
        // 4. Criar índices para performance
        console.log('\n📝 4. Criando índices de performance...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_user_operations_status_active 
            ON user_operations(status) WHERE status = 'active';
            
            CREATE INDEX IF NOT EXISTS idx_user_operations_closing_reason 
            ON user_operations(closing_reason);
            
            CREATE INDEX IF NOT EXISTS idx_commission_calculations_operation 
            ON commission_calculations(operation_id);
            
            CREATE INDEX IF NOT EXISTS idx_commission_calculations_user 
            ON commission_calculations(user_id);
        `);
        console.log('✅ Índices criados com sucesso!');
        
        // 5. Adicionar comentários para documentação
        console.log('\n📝 5. Adicionando comentários nas tabelas...');
        await pool.query(`
            COMMENT ON COLUMN user_operations.closing_reason IS 'Motivo do fechamento: TAKE_PROFIT, STOP_LOSS, MANUAL, TIMEOUT';
            COMMENT ON COLUMN user_operations.take_profit_price IS 'Preço de take profit configurado';
            COMMENT ON COLUMN user_operations.stop_loss_price IS 'Preço de stop loss configurado';
            COMMENT ON COLUMN user_operations.auto_close_enabled IS 'Se o fechamento automático está habilitado';
            
            COMMENT ON TABLE commission_calculations IS 'Cálculos de comissões do sistema';
            COMMENT ON COLUMN commission_calculations.commission_type IS 'REAL (Stripe) ou REFERENT (referência)';
            COMMENT ON COLUMN commission_calculations.is_referent IS 'Se é comissão de referência (não real)';
            COMMENT ON COLUMN commission_calculations.counts_for_affiliate IS 'Se conta para afiliado';
            COMMENT ON COLUMN commission_calculations.counts_for_refund IS 'Se conta para reembolso';
        `);
        console.log('✅ Comentários adicionados com sucesso!');
        
        // 6. Verificar estrutura final
        console.log('\n📊 6. Verificando estrutura final...');
        const result = await pool.query(`
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name IN ('user_operations', 'commission_calculations')
            AND table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `);
        
        console.log('\n📋 Estrutura das tabelas:');
        let currentTable = '';
        result.rows.forEach(row => {
            if (row.table_name !== currentTable) {
                currentTable = row.table_name;
                console.log(`\n🗂️ ${currentTable.toUpperCase()}:`);
            }
            console.log(`  📎 ${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        console.log('\n✅ MIGRAÇÃO COMPLETADA COM SUCESSO!');
        console.log('🎯 Sistema monitor inteligente pronto para uso!');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar migrações se arquivo for executado diretamente
if (require.main === module) {
    executarMigracoes().then(() => {
        console.log('\n🏁 Migração finalizada com sucesso.');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Erro fatal na migração:', error);
        process.exit(1);
    });
}

module.exports = { executarMigracoes };

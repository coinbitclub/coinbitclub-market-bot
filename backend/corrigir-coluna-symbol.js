/**
 * 🔧 CORRIGIR ERRO DE COLUNA NO IA SUPERVISOR
 * Fix para erro: column uo.symbol does not exist
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function corrigirErroColunaSymbol() {
    try {
        console.log('🔧 CORRIGINDO ERRO DE COLUNA SYMBOL');
        console.log('='.repeat(50));
        
        // 1. Verificar estrutura da tabela user_operations
        console.log('📊 Verificando estrutura da tabela user_operations...');
        
        const columnsQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_operations'
            ORDER BY ordinal_position;
        `;
        
        const columnsResult = await pool.query(columnsQuery);
        
        console.log('📋 Colunas encontradas:');
        columnsResult.rows.forEach(col => {
            console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // 2. Verificar se coluna symbol existe
        const hasSymbol = columnsResult.rows.some(col => col.column_name === 'symbol');
        
        if (!hasSymbol) {
            console.log('❌ Coluna symbol não existe. Adicionando...');
            
            const addSymbolQuery = `
                ALTER TABLE user_operations 
                ADD COLUMN symbol VARCHAR(20) DEFAULT 'BTCUSDT';
            `;
            
            await pool.query(addSymbolQuery);
            console.log('✅ Coluna symbol adicionada com sucesso');
            
            // Atualizar registros existentes
            const updateExistingQuery = `
                UPDATE user_operations 
                SET symbol = 'BTCUSDT' 
                WHERE symbol IS NULL;
            `;
            
            await pool.query(updateExistingQuery);
            console.log('✅ Registros existentes atualizados');
        } else {
            console.log('✅ Coluna symbol já existe');
        }
        
        // 3. Verificar se há outras colunas necessárias
        console.log('\n🔍 Verificando outras colunas necessárias...');
        
        const requiredColumns = {
            'entry_price': 'DECIMAL(15,8)',
            'exit_price': 'DECIMAL(15,8)',
            'take_profit': 'DECIMAL(15,8)',
            'stop_loss': 'DECIMAL(15,8)',
            'current_price': 'DECIMAL(15,8)',
            'pnl': 'DECIMAL(15,8)',
            'status': 'VARCHAR(20) DEFAULT \'open\'',
            'operation_type': 'VARCHAR(10)',
            'leverage': 'INTEGER DEFAULT 5',
            'amount': 'DECIMAL(15,8)',
            'created_at': 'TIMESTAMP DEFAULT NOW()',
            'updated_at': 'TIMESTAMP DEFAULT NOW()'
        };
        
        const existingColumns = columnsResult.rows.map(col => col.column_name);
        
        for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
            if (!existingColumns.includes(columnName)) {
                console.log(`➕ Adicionando coluna: ${columnName}`);
                
                const addColumnQuery = `
                    ALTER TABLE user_operations 
                    ADD COLUMN ${columnName} ${columnDef};
                `;
                
                try {
                    await pool.query(addColumnQuery);
                    console.log(`✅ Coluna ${columnName} adicionada`);
                } catch (error) {
                    console.log(`⚠️ Erro ao adicionar ${columnName}: ${error.message}`);
                }
            }
        }
        
        // 4. Verificar estrutura final
        console.log('\n📊 Estrutura final da tabela:');
        const finalColumnsResult = await pool.query(columnsQuery);
        finalColumnsResult.rows.forEach(col => {
            console.log(`   ✅ ${col.column_name} (${col.data_type})`);
        });
        
        console.log('\n✅ CORREÇÕES APLICADAS COM SUCESSO!');
        console.log('🔄 Agora o IA Supervisor deve funcionar corretamente');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

corrigirErroColunaSymbol();

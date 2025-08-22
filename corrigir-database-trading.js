// ========================================
// CORREÇÃO - TRADING POSITIONS TABLE
// Adicionar coluna notes e verificar estrutura
// ========================================

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function corrigirTabelaTradingPositions() {
  try {
    console.log('🔧 Iniciando correção da tabela trading_positions...');
    
    // 1. Verificar estrutura atual da tabela
    console.log('\n📊 Verificando estrutura atual...');
    const checkStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'trading_positions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas atuais:');
    checkStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 2. Verificar se coluna notes existe
    const notesExists = checkStructure.rows.some(col => col.column_name === 'notes');
    
    if (!notesExists) {
      console.log('\n🔧 Adicionando coluna notes...');
      await pool.query(`
        ALTER TABLE trading_positions 
        ADD COLUMN notes TEXT
      `);
      console.log('✅ Coluna notes adicionada com sucesso');
    } else {
      console.log('✅ Coluna notes já existe');
    }
    
    // 3. Verificar outras colunas importantes
    const requiredColumns = [
      'id', 'user_id', 'exchange_account_id', 'signal_id', 'symbol', 
      'side', 'size', 'entry_price', 'current_price', 'leverage',
      'stop_loss', 'take_profit', 'status', 'opened_at', 'closed_at',
      'unrealized_pnl_usd', 'realized_pnl_usd', 'fees_paid_usd',
      'exchange_position_id', 'exchange_order_ids', 'notes',
      'created_at', 'updated_at'
    ];
    
    const missingColumns = requiredColumns.filter(col => 
      !checkStructure.rows.some(dbCol => dbCol.column_name === col)
    );
    
    if (missingColumns.length > 0) {
      console.log('\n⚠️ Colunas faltantes detectadas:', missingColumns);
      
      for (const colName of missingColumns) {
        try {
          let columnDef = '';
          switch(colName) {
            case 'current_price':
              columnDef = 'DECIMAL(20,8)';
              break;
            case 'stop_loss':
            case 'take_profit':
              columnDef = 'DECIMAL(20,8)';
              break;
            case 'unrealized_pnl_usd':
            case 'realized_pnl_usd':
            case 'fees_paid_usd':
              columnDef = 'DECIMAL(20,8) DEFAULT 0';
              break;
            case 'exchange_position_id':
              columnDef = 'VARCHAR(255)';
              break;
            case 'exchange_order_ids':
              columnDef = 'TEXT[]';
              break;
            case 'opened_at':
            case 'closed_at':
              columnDef = 'TIMESTAMP WITH TIME ZONE';
              break;
            case 'created_at':
            case 'updated_at':
              columnDef = 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
              break;
            default:
              columnDef = 'TEXT';
          }
          
          await pool.query(`
            ALTER TABLE trading_positions 
            ADD COLUMN ${colName} ${columnDef}
          `);
          console.log(`✅ Adicionada coluna: ${colName}`);
        } catch (error) {
          console.log(`⚠️ Erro ao adicionar ${colName}:`, error.message);
        }
      }
    }
    
    // 4. Verificar ENUMs válidos
    console.log('\n📋 Verificando ENUMs de status...');
    const enumQuery = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'position_status'
      )
    `);
    
    console.log('Status válidos:');
    enumQuery.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });
    
    // 5. Verificar índices importantes
    console.log('\n🔍 Verificando índices...');
    const indexQuery = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'trading_positions'
    `);
    
    console.log('Índices atuais:');
    indexQuery.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
    // 6. Criar índices se não existirem
    const requiredIndexes = [
      {
        name: 'idx_trading_positions_user_status',
        definition: 'CREATE INDEX IF NOT EXISTS idx_trading_positions_user_status ON trading_positions(user_id, status)'
      },
      {
        name: 'idx_trading_positions_symbol_status',
        definition: 'CREATE INDEX IF NOT EXISTS idx_trading_positions_symbol_status ON trading_positions(symbol, status)'
      },
      {
        name: 'idx_trading_positions_created_at',
        definition: 'CREATE INDEX IF NOT EXISTS idx_trading_positions_created_at ON trading_positions(created_at DESC)'
      }
    ];
    
    for (const index of requiredIndexes) {
      try {
        await pool.query(index.definition);
        console.log(`✅ Índice verificado: ${index.name}`);
      } catch (error) {
        console.log(`⚠️ Erro no índice ${index.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Correção da tabela trading_positions concluída!');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  } finally {
    await pool.end();
  }
}

// Executar correção
corrigirTabelaTradingPositions();

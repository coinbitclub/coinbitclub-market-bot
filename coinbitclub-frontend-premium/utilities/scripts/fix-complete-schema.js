const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixCompleteSchema() {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway";
  
  console.log('🔗 Conectando ao banco:', databaseUrl.replace(/:[^:@]*@/, ':****@'));
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // 1. Remover constraint NOT NULL da coluna password (para usar apenas password_hash)
    console.log('\n🔧 1. Ajustando coluna password...');
    try {
      await client.query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`);
      console.log('✅ Constraint NOT NULL removida da coluna password');
    } catch (error) {
      console.log('⚠️ Constraint já removida ou não existe:', error.message);
    }

    // 2. Adicionar coluna plan_type na tabela subscriptions
    console.log('\n🔧 2. Adicionando coluna plan_type na tabela subscriptions...');
    try {
      await client.query(`
        ALTER TABLE subscriptions 
        ADD COLUMN plan_type VARCHAR(50) DEFAULT 'basic'
      `);
      console.log('✅ Coluna plan_type adicionada à tabela subscriptions');
    } catch (error) {
      console.log('⚠️ Coluna plan_type já existe:', error.message);
    }

    // 3. Adicionar coluna affiliate_code na tabela affiliates
    console.log('\n🔧 3. Ajustando tabela affiliates...');
    try {
      await client.query(`
        ALTER TABLE affiliates 
        ADD COLUMN affiliate_code VARCHAR(20) UNIQUE
      `);
      console.log('✅ Coluna affiliate_code adicionada à tabela affiliates');
    } catch (error) {
      console.log('⚠️ Coluna affiliate_code já existe:', error.message);
    }

    // Copiar valores de code para affiliate_code se existirem
    try {
      await client.query(`
        UPDATE affiliates 
        SET affiliate_code = code 
        WHERE affiliate_code IS NULL AND code IS NOT NULL
      `);
      console.log('✅ Dados copiados de code para affiliate_code');
    } catch (error) {
      console.log('⚠️ Erro ao copiar dados:', error.message);
    }

    // 4. Adicionar coluna commission_rate na tabela affiliates
    try {
      await client.query(`
        ALTER TABLE affiliates 
        ADD COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.10
      `);
      console.log('✅ Coluna commission_rate adicionada à tabela affiliates');
    } catch (error) {
      console.log('⚠️ Coluna commission_rate já existe:', error.message);
    }

    // 5. Ajustar colunas da tabela user_balances
    console.log('\n🔧 5. Ajustando tabela user_balances...');
    
    const columnsToAdd = [
      { name: 'prepaid_balance', type: 'DECIMAL(15,8)', default: '0' },
      { name: 'total_profit', type: 'DECIMAL(15,8)', default: '0' },
      { name: 'total_loss', type: 'DECIMAL(15,8)', default: '0' },
      { name: 'pending_commission', type: 'DECIMAL(15,8)', default: '0' },
      { name: 'paid_commission', type: 'DECIMAL(15,8)', default: '0' }
    ];

    for (const column of columnsToAdd) {
      try {
        await client.query(`
          ALTER TABLE user_balances 
          ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}
        `);
        console.log(`✅ Coluna ${column.name} adicionada à tabela user_balances`);
      } catch (error) {
        console.log(`⚠️ Coluna ${column.name} já existe:`, error.message);
      }
    }

    // 6. Verificar estruturas finais
    console.log('\n📋 Verificando estruturas finais...');
    
    // Users
    const usersCheck = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('password', 'password_hash', 'is_email_verified')
      ORDER BY column_name
    `);
    console.log('Users - colunas críticas:', usersCheck.rows);

    // Subscriptions
    const subscriptionsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'plan_type'
    `);
    console.log('Subscriptions - plan_type existe:', subscriptionsCheck.rows.length > 0);

    // Affiliates
    const affiliatesCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'affiliates' AND column_name IN ('affiliate_code', 'commission_rate')
      ORDER BY column_name
    `);
    console.log('Affiliates - colunas necessárias:', affiliatesCheck.rows);

    // User_balances
    const balancesCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_balances' AND column_name IN ('prepaid_balance', 'total_profit', 'total_loss')
      ORDER BY column_name
    `);
    console.log('User_balances - colunas necessárias:', balancesCheck.rows);

    console.log('\n✅ Correção do schema concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  fixCompleteSchema()
    .then(() => {
      console.log('🎉 Script finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { fixCompleteSchema };

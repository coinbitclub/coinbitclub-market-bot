/**
 * SCRIPT: Cadastrar Usuários Reais com Chaves API Bybit
 * Data: 21/08/2025
 * 
 * Este script cadastra usuários reais no sistema MarketBot com suas 
 * respectivas chaves de API da Bybit para execução real de trades.
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuração do banco PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/marketbot'
});

/**
 * Dados dos usuários reais fornecidos
 */
const usuarios = [
  {
    nome: 'Luiza Maria de Almeida Pinto',
    email: 'lmariadeapinto@gmail.com',
    senha: 'Apelido22@',
    pais: 'BRASIL',
    credito: 1000.00, // R$ 1.000
    telefone: '+5521972344633',
    afiliado: 'VIP',
    bybit_api_key: '9HZy9BiUW95iXprVRl',
    bybit_api_secret: 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO'
  },
  {
    nome: 'Paloma Amaral',
    email: 'Pamaral15@hotmail.com',
    senha: 'Diogo1520',
    pais: 'BRASIL',
    credito: 500.00, // R$ 500
    telefone: '+5521982218182',
    afiliado: 'FLEX_BRASIL',
    bybit_api_key: '21k7qWUkZKOBDXBuoT',
    bybit_api_secret: 'JxoniuBKRaBbQY5KanFSMM2najL3KLjbmEpz'
  },
  {
    nome: 'Erica dos Santos Andrade',
    email: 'erica.andrade.santos@hotmail.com',
    senha: 'Apelido22@',
    pais: 'BRASIL',
    credito: 5000.00, // R$ 5.000
    telefone: '+5521987386645',
    afiliado: 'VIP',
    bybit_api_key: '2iNeNZQepHJS0lWBkf',
    bybit_api_secret: '1KkVFTExPQKzZwHsXaUKwzGVSCxCRW6izgbn'
  },
  {
    nome: 'Mauro Alves',
    email: 'mauro.alves@hotmail.com', // Correção: email estava duplicado
    senha: 'Modelim25@',
    pais: 'BRASIL',
    credito: 5000.00, // R$ 5.000
    telefone: '+553291399571',
    afiliado: 'VIP',
    bybit_api_key: 'JQVNADoCqNqPLvo25',
    bybit_api_secret: 'rQ1Qle81XBkEL5NrvSIOlqPT6OrbZ7wA0dYk'
  }
];

/**
 * Função para hash da senha
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Função para cadastrar um usuário completo
 */
async function cadastrarUsuario(userData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log(`\n🔧 Cadastrando usuário: ${userData.nome} (${userData.email})`);
    
    // 1. Hash da senha
    const passwordHash = await hashPassword(userData.senha);
    console.log('   ✅ Senha criptografada');
    
    // 2. Separar nome e sobrenome
    const nomeCompleto = userData.nome.split(' ');
    const firstName = nomeCompleto[0];
    const lastName = nomeCompleto.slice(1).join(' ');
    
    // 3. Determinar plan_type baseado no afiliado
    let planType = 'NONE';
    if (userData.afiliado === 'VIP') {
      planType = 'VIP';
    } else if (userData.afiliado === 'FLEX_BRASIL') {
      planType = 'FLEX';
    }
    
    // 4. Inserir usuário na tabela users
    const userInsertQuery = `
      INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        phone,
        phone_number,
        user_type, 
        user_status, 
        plan_type,
        account_balance_usd, 
        commission_balance_brl,
        prepaid_credits,
        enable_trading,
        is_email_verified,
        is_phone_verified,
        phone_verified
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'OPERADOR', 'ACTIVE', $7, 
        $8, $9, $10, true, true, true, true
      ) RETURNING id, email, first_name, last_name;
    `;
    
    const userValues = [
      userData.email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      userData.telefone,
      userData.telefone,
      planType,
      0.00, // account_balance_usd (será usado para trading)
      userData.credito, // commission_balance_brl (crédito administrativo)
      userData.credito, // prepaid_credits
    ];
    
    const userResult = await client.query(userInsertQuery, userValues);
    const userId = userResult.rows[0].id;
    
    console.log(`   ✅ Usuário criado: ID ${userId}`);
    console.log(`   💰 Crédito administrativo: R$ ${userData.credito}`);
    
    // 5. Inserir chaves API da Bybit - MAINNET (produção)
    const exchangeInsertQuery = `
      INSERT INTO user_exchange_accounts (
        user_id,
        exchange,
        account_name,
        api_key,
        api_secret,
        is_testnet,
        is_active,
        is_verified,
        can_read,
        can_trade,
        can_withdraw,
        max_position_size_usd,
        daily_loss_limit_usd,
        max_drawdown_percent
      ) VALUES (
        $1, 'BYBIT', $2, $3, $4, false, true, true, true, true, false, 
        $5, $6, 15.00
      ) RETURNING id, account_name, exchange;
    `;
    
    // Definir limites baseados no crédito
    const maxPositionSize = Math.min(userData.credito * 0.3, 2000); // 30% do crédito, máx R$ 2.000
    const dailyLossLimit = Math.min(userData.credito * 0.1, 500);   // 10% do crédito, máx R$ 500
    
    const exchangeValues = [
      userId,
      `Bybit ${userData.nome.split(' ')[0]}`, // Nome da conta
      userData.bybit_api_key,
      userData.bybit_api_secret,
      maxPositionSize,
      dailyLossLimit
    ];
    
    const exchangeResult = await client.query(exchangeInsertQuery, exchangeValues);
    
    console.log(`   🔑 Chaves Bybit MAINNET configuradas`);
    console.log(`   📊 Limite posição: $${maxPositionSize} | Perda diária: $${dailyLossLimit}`);
    
    // 6. Também criar conta TESTNET para testes
    const testnetValues = [
      userId,
      `Bybit ${userData.nome.split(' ')[0]} - TESTNET`,
      'TESTNET_' + userData.bybit_api_key, // Prefixo para identificar
      'TESTNET_' + userData.bybit_api_secret,
      1000.00, // Valores padrão para testnet
      100.00
    ];
    
    const testnetQuery = exchangeInsertQuery.replace('false, true', 'true, true');
    await client.query(testnetQuery, testnetValues);
    
    console.log(`   🧪 Conta TESTNET também criada para testes`);
    
    // 7. Configurar trading settings com valores seguros
    const tradingSettingsQuery = `
      INSERT INTO trading_settings (
        user_id,
        auto_trading_enabled,
        preferred_exchange,
        use_testnet,
        max_concurrent_positions,
        max_daily_trades,
        daily_loss_limit_usd,
        max_position_size_percent,
        default_stop_loss_percent,
        default_take_profit_percent,
        default_leverage,
        max_allowed_leverage,
        min_risk_reward_ratio,
        trading_start_hour,
        trading_end_hour,
        trade_on_weekends,
        notify_on_signal,
        notify_on_fill,
        notify_on_stop_loss,
        notify_on_take_profit
      ) VALUES (
        $1, true, 'BYBIT', false, 3, 8, $2, 25.00, 2.50, 5.00, 
        3, 10, 2.00, 0, 24, true, true, true, true, true
      );
    `;
    
    await client.query(tradingSettingsQuery, [userId, dailyLossLimit]);
    
    console.log(`   ⚙️  Trading settings configurados (conservador)`);
    
    await client.query('COMMIT');
    
    console.log(`\n✅ USUÁRIO ${userData.nome.toUpperCase()} CADASTRADO COM SUCESSO!`);
    console.log(`   📧 Email: ${userData.email}`);
    console.log(`   📱 Telefone: ${userData.telefone}`);
    console.log(`   💳 Plano: ${planType}`);
    console.log(`   💰 Crédito: R$ ${userData.credito}`);
    console.log(`   🔑 Bybit API: ${userData.bybit_api_key.substring(0, 10)}...`);
    console.log(`   🚀 Trading: HABILITADO (MAINNET)`);
    
    return {
      success: true,
      userId: userId,
      email: userData.email,
      name: userData.nome
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Erro ao cadastrar ${userData.nome}:`, error.message);
    return {
      success: false,
      error: error.message,
      email: userData.email
    };
  } finally {
    client.release();
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 INICIANDO CADASTRO DE USUÁRIOS REAIS - MARKETBOT');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('🎯 Total de usuários para cadastrar:', usuarios.length);
  console.log('\n' + '='.repeat(60));
  
  const resultados = [];
  
  // Cadastrar cada usuário
  for (const usuario of usuarios) {
    const resultado = await cadastrarUsuario(usuario);
    resultados.push(resultado);
    
    // Pausa entre cadastros
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL DE CADASTROS');
  console.log('='.repeat(60));
  
  const sucessos = resultados.filter(r => r.success);
  const erros = resultados.filter(r => !r.success);
  
  console.log(`✅ Usuários cadastrados com sucesso: ${sucessos.length}`);
  if (sucessos.length > 0) {
    sucessos.forEach(s => {
      console.log(`   • ${s.name} (${s.email})`);
    });
  }
  
  if (erros.length > 0) {
    console.log(`\n❌ Erros encontrados: ${erros.length}`);
    erros.forEach(e => {
      console.log(`   • ${e.email}: ${e.error}`);
    });
  }
  
  // Verificação final no banco
  console.log('\n🔍 VERIFICAÇÃO FINAL NO BANCO...');
  
  try {
    const client = await pool.connect();
    
    // Contar usuários criados
    const countQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN plan_type = 'VIP' THEN 1 END) as vip_users,
        COUNT(CASE WHEN enable_trading = true THEN 1 END) as trading_enabled,
        SUM(commission_balance_brl) as total_credits
      FROM users 
      WHERE email IN ($1, $2, $3, $4);
    `;
    
    const emails = usuarios.map(u => u.email.toLowerCase());
    const countResult = await client.query(countQuery, emails);
    const stats = countResult.rows[0];
    
    console.log(`📊 Usuários no banco: ${stats.total_users}`);
    console.log(`👑 Usuários VIP: ${stats.vip_users}`);
    console.log(`🚀 Trading habilitado: ${stats.trading_enabled}`);
    console.log(`💰 Total créditos: R$ ${parseFloat(stats.total_credits).toFixed(2)}`);
    
    // Verificar chaves API
    const apiQuery = `
      SELECT 
        u.email,
        u.first_name,
        uea.exchange,
        uea.account_name,
        uea.is_testnet,
        uea.can_trade,
        uea.max_position_size_usd
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE u.email IN ($1, $2, $3, $4)
      ORDER BY u.email, uea.is_testnet;
    `;
    
    const apiResult = await client.query(apiQuery, emails);
    
    console.log('\n🔑 CHAVES API CONFIGURADAS:');
    apiResult.rows.forEach(row => {
      const tipo = row.is_testnet ? 'TESTNET' : 'MAINNET';
      const trade = row.can_trade ? '✅' : '❌';
      console.log(`   ${row.first_name} (${row.email}): ${row.exchange} ${tipo} ${trade} $${row.max_position_size_usd}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro na verificação final:', error.message);
  }
  
  console.log('\n✨ CADASTRO CONCLUÍDO! Usuários prontos para trading real.');
  console.log('🎯 Próximo passo: Testar conexão com APIs da Bybit');
  
  await pool.end();
}

// Executar script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { cadastrarUsuario, usuarios };

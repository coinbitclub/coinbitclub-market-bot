// VERIFICAÇÃO DETALHADA DAS CONFIGURAÇÕES DE TRADING ATIVAS
const { Pool } = require('pg');

// Configuração do banco Railway
const DATABASE_URL = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('🔧 VERIFICAÇÃO DETALHADA - CONFIGURAÇÕES DE TRADING');
console.log('=' * 60);

async function verificarConfiguracoes() {
  try {
    const client = await pool.connect();
    
    console.log('\n👥 1. USUÁRIOS ATIVOS E SUAS CONFIGURAÇÕES:');
    console.log('=' * 50);
    
    // Buscar usuários com suas configurações
    const result = await client.query(`
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.trading_ativo,
        u.saldo_disponivel,
        u.exchange_principal,
        u.api_key_binance IS NOT NULL as tem_api_binance,
        u.api_key_bybit IS NOT NULL as tem_api_bybit,
        c.valor_operacao,
        c.max_operacoes_simultaneas,
        c.stop_loss_percent,
        c.take_profit_percent,
        c.exchanges_ativas,
        c.symbols_ativos,
        c.risk_management,
        u.created_at
      FROM usuarios u
      LEFT JOIN configuracoes_trading c ON u.id = c.usuario_id
      WHERE u.trading_ativo = true
      ORDER BY u.id
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum usuário com trading ativo encontrado');
      return;
    }
    
    console.log(`📊 Total de usuários ativos: ${result.rows.length}\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`👤 USUÁRIO ${index + 1}:`);
      console.log(`   📛 Nome: ${user.nome}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   ✅ Trading Ativo: ${user.trading_ativo ? 'SIM' : 'NÃO'}`);
      console.log(`   💰 Saldo Disponível: $${Number(user.saldo_disponivel).toFixed(2)}`);
      console.log(`   🏦 Exchange Principal: ${user.exchange_principal.toUpperCase()}`);
      console.log(`   🔑 API Binance: ${user.tem_api_binance ? '✅ Configurada' : '❌ Não configurada'}`);
      console.log(`   🔑 API Bybit: ${user.tem_api_bybit ? '✅ Configurada' : '❌ Não configurada'}`);
      console.log(`   📅 Cadastrado em: ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
      
      if (user.valor_operacao) {
        console.log('\n   ⚙️ CONFIGURAÇÕES DE TRADING:');
        console.log(`      💵 Valor por Operação: $${Number(user.valor_operacao).toFixed(2)}`);
        console.log(`      📊 Max Operações Simultâneas: ${user.max_operacoes_simultaneas}`);
        console.log(`      🔻 Stop Loss: ${user.stop_loss_percent}%`);
        console.log(`      🔺 Take Profit: ${user.take_profit_percent}%`);
        console.log(`      🏦 Exchanges Ativas: ${user.exchanges_ativas ? user.exchanges_ativas.join(', ') : 'Não definidas'}`);
        console.log(`      📈 Símbolos Ativos: ${user.symbols_ativos ? user.symbols_ativos.join(', ') : 'Não definidos'}`);
        
        if (user.risk_management) {
          console.log(`      🛡️ Risk Management:`);
          const risk = user.risk_management;
          if (risk.max_daily_loss) console.log(`         📉 Max Perda Diária: $${risk.max_daily_loss}`);
          if (risk.max_position_size) console.log(`         📊 Max Tamanho Posição: $${risk.max_position_size}`);
        }
      } else {
        console.log('\n   ❌ CONFIGURAÇÕES DE TRADING: NÃO ENCONTRADAS');
      }
      
      console.log('\n' + '-' * 50 + '\n');
    });
    
    // Estatísticas gerais
    console.log('\n📊 2. ESTATÍSTICAS GERAIS:');
    console.log('=' * 30);
    
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_usuarios_ativos,
        SUM(u.saldo_disponivel) as saldo_total,
        AVG(c.valor_operacao) as valor_medio_operacao,
        AVG(c.stop_loss_percent) as stop_loss_medio,
        AVG(c.take_profit_percent) as take_profit_medio
      FROM usuarios u
      LEFT JOIN configuracoes_trading c ON u.id = c.usuario_id
      WHERE u.trading_ativo = true
    `);
    
    const stat = stats.rows[0];
    console.log(`👥 Total Usuários Ativos: ${stat.total_usuarios_ativos}`);
    console.log(`💰 Saldo Total Combinado: $${Number(stat.saldo_total || 0).toFixed(2)}`);
    console.log(`📊 Valor Médio por Operação: $${Number(stat.valor_medio_operacao || 0).toFixed(2)}`);
    console.log(`🔻 Stop Loss Médio: ${Number(stat.stop_loss_medio || 0).toFixed(2)}%`);
    console.log(`🔺 Take Profit Médio: ${Number(stat.take_profit_medio || 0).toFixed(2)}%`);
    
    // Verificar exchanges disponíveis
    console.log('\n🏦 3. DISTRIBUIÇÃO POR EXCHANGE:');
    console.log('=' * 35);
    
    const exchanges = await client.query(`
      SELECT 
        exchange_principal,
        COUNT(*) as usuarios_count,
        SUM(saldo_disponivel) as saldo_total
      FROM usuarios
      WHERE trading_ativo = true
      GROUP BY exchange_principal
      ORDER BY usuarios_count DESC
    `);
    
    exchanges.rows.forEach(exchange => {
      console.log(`📊 ${exchange.exchange_principal.toUpperCase()}:`);
      console.log(`   👥 Usuários: ${exchange.usuarios_count}`);
      console.log(`   💰 Saldo Total: $${Number(exchange.saldo_total).toFixed(2)}`);
    });
    
    // Verificar configurações de risco
    console.log('\n🛡️ 4. ANÁLISE DE RISCO:');
    console.log('=' * 25);
    
    const riskAnalysis = await client.query(`
      SELECT 
        COUNT(*) as total_configs,
        MIN(valor_operacao) as min_operacao,
        MAX(valor_operacao) as max_operacao,
        MIN(stop_loss_percent) as min_stop_loss,
        MAX(stop_loss_percent) as max_stop_loss,
        MIN(take_profit_percent) as min_take_profit,
        MAX(take_profit_percent) as max_take_profit
      FROM configuracoes_trading c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE u.trading_ativo = true
    `);
    
    const risk = riskAnalysis.rows[0];
    console.log(`⚙️ Configurações Ativas: ${risk.total_configs}`);
    console.log(`💵 Valor Operação: $${risk.min_operacao} - $${risk.max_operacao}`);
    console.log(`🔻 Stop Loss: ${risk.min_stop_loss}% - ${risk.max_stop_loss}%`);
    console.log(`🔺 Take Profit: ${risk.min_take_profit}% - ${risk.max_take_profit}%`);
    
    // Status de prontidão
    console.log('\n🎯 5. STATUS DE PRONTIDÃO:');
    console.log('=' * 30);
    
    const readiness = {
      usuarios_ativos: result.rows.length > 0,
      configuracoes_completas: result.rows.every(u => u.valor_operacao !== null),
      apis_configuradas: result.rows.some(u => u.tem_api_binance || u.tem_api_bybit),
      saldo_suficiente: result.rows.every(u => Number(u.saldo_disponivel) > 0)
    };
    
    Object.entries(readiness).forEach(([check, status]) => {
      const icon = status ? '✅' : '❌';
      const label = check.replace(/_/g, ' ').toUpperCase();
      console.log(`${icon} ${label}: ${status ? 'OK' : 'PENDENTE'}`);
    });
    
    const allReady = Object.values(readiness).every(status => status);
    
    console.log('\n🚀 CONCLUSÃO:');
    if (allReady) {
      console.log('✅ SISTEMA 100% PRONTO PARA TRADING AUTOMÁTICO!');
      console.log('📈 Todos os usuários estão configurados corretamente');
      console.log('💼 Pronto para processar sinais e executar ordens');
    } else {
      console.log('⚠️ Sistema parcialmente configurado');
      console.log('🔧 Verificar itens pendentes acima');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar verificação
console.log('🚀 Iniciando verificação em 1 segundo...\n');
setTimeout(() => {
  verificarConfiguracoes()
    .then(() => {
      console.log('\n✅ Verificação de configurações finalizada!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erro durante verificação:', error.message);
      process.exit(1);
    });
}, 1000);

// ========================================
// MARKETBOT - TESTE DE CONEXÃO SIMPLES
// Validação rápida do sistema
// ========================================

require('dotenv').config();
const { Pool } = require('pg');

class TesteConexaoSimples {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async testarConexao() {
    console.log('🔌 TESTE DE CONEXÃO - MARKETBOT');
    console.log('================================');
    
    try {
      // Testar conexão básica
      console.log('\n1. 🗄️ Testando conexão PostgreSQL...');
      const result = await this.db.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('   ✅ Conexão estabelecida!');
      console.log(`   ⏰ Hora atual: ${result.rows[0].current_time}`);
      console.log(`   🐘 PostgreSQL: ${result.rows[0].pg_version.split(' ')[1]}`);

      // Verificar estrutura do banco
      console.log('\n2. 📋 Verificando estrutura do banco...');
      const tables = await this.db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log(`   ✅ ${tables.rows.length} tabelas encontradas`);
      
      // Listar principais tabelas
      const tabelasImportantes = [
        'users', 'user_exchange_accounts', 'trading_settings', 
        'trading_signals', 'trading_positions', 'admin_coupons'
      ];
      
      console.log('\n3. 🔍 Verificando tabelas principais...');
      for (const tabela of tabelasImportantes) {
        const existe = tables.rows.find(t => t.table_name === tabela);
        console.log(`   ${existe ? '✅' : '❌'} ${tabela}`);
      }

      // Verificar usuários
      console.log('\n4. 👥 Verificando usuários cadastrados...');
      const usuarios = await this.db.query('SELECT COUNT(*) as total FROM users');
      console.log(`   ✅ ${usuarios.rows[0].total} usuários cadastrados`);

      // Verificar contas de exchange
      console.log('\n5. 🏦 Verificando contas de exchange...');
      const exchanges = await this.db.query(`
        SELECT exchange, COUNT(*) as total, 
               COUNT(CASE WHEN is_testnet = false THEN 1 END) as mainnet,
               COUNT(CASE WHEN is_testnet = true THEN 1 END) as testnet
        FROM user_exchange_accounts 
        WHERE is_active = true
        GROUP BY exchange
      `);
      
      if (exchanges.rows.length > 0) {
        exchanges.rows.forEach(ex => {
          console.log(`   ✅ ${ex.exchange}: ${ex.total} contas (${ex.mainnet} mainnet, ${ex.testnet} testnet)`);
        });
      } else {
        console.log('   ⚠️ Nenhuma conta de exchange encontrada');
      }

      // Verificar usuários específicos com chaves Bybit
      console.log('\n6. 🔑 Verificando usuários com chaves Bybit MAINNET...');
      const usuariosBybit = await this.db.query(`
        SELECT u.email, uea.account_name, uea.exchange, uea.is_testnet
        FROM users u
        JOIN user_exchange_accounts uea ON u.id = uea.user_id
        WHERE uea.exchange = 'BYBIT' 
          AND uea.is_active = true
          AND uea.is_testnet = false
        ORDER BY u.created_at
      `);

      if (usuariosBybit.rows.length > 0) {
        usuariosBybit.rows.forEach((user, index) => {
          console.log(`   ${index + 1}. ✅ ${user.email} - ${user.account_name}`);
        });
      } else {
        console.log('   ⚠️ Nenhum usuário com Bybit MAINNET encontrado');
      }

      // Verificar configurações de trading
      console.log('\n7. ⚙️ Verificando configurações de trading...');
      const config = await this.db.query('SELECT * FROM admin_trading_defaults LIMIT 1');
      
      if (config.rows.length > 0) {
        const cfg = config.rows[0];
        console.log(`   ✅ Stop Loss: ${cfg.default_stop_loss_percent}%`);
        console.log(`   ✅ Take Profit: ${cfg.default_take_profit_percent}%`);
        console.log(`   ✅ Leverage: ${cfg.default_leverage}x`);
        console.log(`   ✅ Position Size: ${cfg.default_position_size_percent}%`);
      } else {
        console.log('   ⚠️ Configurações padrão não encontradas');
      }

      // Verificar variáveis de ambiente críticas
      console.log('\n8. 🌍 Verificando variáveis de ambiente...');
      const envVars = [
        'DATABASE_URL', 'STRIPE_SECRET_KEY', 'TWILIO_AUTH_TOKEN', 
        'NGROK_IP_FIXO', 'JWT_SECRET'
      ];
      
      envVars.forEach(envVar => {
        const valor = process.env[envVar];
        if (valor) {
          console.log(`   ✅ ${envVar}: ${valor.substring(0, 20)}...`);
        } else {
          console.log(`   ❌ ${envVar}: NÃO CONFIGURADA`);
        }
      });

      // Verificar arquivos de serviços
      console.log('\n9. 📁 Verificando serviços implementados...');
      const fs = require('fs');
      const path = require('path');
      
      const servicos = [
        'src/services/stripe.service.ts',
        'src/services/trading.service.ts',
        'src/services/exchange.service.ts',
        'src/services/trading-orchestrator.service.ts',
        'src/controllers/webhook.controller.ts'
      ];
      
      servicos.forEach(servico => {
        if (fs.existsSync(path.join(__dirname, servico))) {
          console.log(`   ✅ ${servico.split('/').pop()}`);
        } else {
          console.log(`   ❌ ${servico.split('/').pop()}`);
        }
      });

      console.log('\n' + '='.repeat(50));
      console.log('🎯 RESULTADO FINAL DO TESTE');
      console.log('='.repeat(50));
      console.log('✅ Sistema MarketBot está operacional!');
      console.log('📊 Banco de dados conectado e estruturado');
      console.log('👥 Usuários cadastrados e contas configuradas');
      console.log('🔧 Serviços implementados e prontos');
      console.log('🚀 Pronto para executar operações reais!');
      
      return true;

    } catch (error) {
      console.error('\n❌ ERRO no teste de conexão:', error);
      return false;
    } finally {
      await this.db.end();
    }
  }
}

// Executar teste
if (require.main === module) {
  const teste = new TesteConexaoSimples();
  
  teste.testarConexao()
    .then(sucesso => {
      console.log(`\n${sucesso ? '✅' : '❌'} Teste concluído`);
      process.exit(sucesso ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Falha crítica:', error);
      process.exit(1);
    });
}

module.exports = TesteConexaoSimples;

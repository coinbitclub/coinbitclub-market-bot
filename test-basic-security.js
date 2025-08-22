// ========================================
// MARKETBOT - BASIC SECURITY TEST
// Teste básico do sistema de segurança implementado
// ========================================

const { Pool } = require('pg');
const assert = require('assert');

const testDb = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

class BasicSecurityTest {
  constructor() {
    this.testResults = {
      total_tests: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTest(testName, testFunction) {
    this.testResults.total_tests++;
    console.log(`\n🧪 ${testName}`);
    
    try {
      await testFunction();
      this.testResults.passed++;
      console.log(`✅ PASSOU`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ test: testName, error: error.message });
      console.log(`❌ FALHOU: ${error.message}`);
    }
  }

  async cleanup() {
    try {
      await testDb.query("DELETE FROM user_2fa WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')");
      await testDb.query("DELETE FROM blocked_ips WHERE ip_address = '192.168.1.100'");
      await testDb.query("DELETE FROM system_settings WHERE key LIKE 'test_%'");
      await testDb.query("DELETE FROM users WHERE email LIKE '%test%'");
    } catch (error) {
      // Ignorar erros de limpeza
    }
  }

  async testBasicTables() {
    const requiredTables = ['users', 'user_2fa', 'blocked_ips', 'system_settings'];
    
    for (const table of requiredTables) {
      const result = await testDb.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      
      assert(result.rows[0].exists, `Tabela ${table} não existe`);
    }
  }

  async test2FATable() {
    // Inserir usuário de teste
    const user = await testDb.query(`
      INSERT INTO users (email, password_hash, user_type, is_email_verified, user_status, first_name, last_name)
      VALUES ('test2fa@test.com', 'hash', 'AFFILIATE', true, 'ACTIVE', 'Test', 'User')
      RETURNING id
    `);
    
    const userId = user.rows[0].id;
    
    // Inserir configuração 2FA
    await testDb.query(`
      INSERT INTO user_2fa (user_id, secret, backup_codes, is_enabled)
      VALUES ($1, 'TESTSECRET123', '["code1", "code2"]', true)
    `, [userId]);
    
    // Verificar inserção
    const result = await testDb.query(`
      SELECT * FROM user_2fa WHERE user_id = $1
    `, [userId]);
    
    assert(result.rows.length === 1, 'Configuração 2FA deve existir');
    assert(result.rows[0].is_enabled === true, '2FA deve estar habilitado');
  }

  async testBlockedIPs() {
    const testIP = '192.168.1.100';
    
    // Inserir IP bloqueado
    await testDb.query(`
      INSERT INTO blocked_ips (ip_address, reason, severity, blocked_until, auto_blocked)
      VALUES ($1, 'Teste de bloqueio', 'HIGH', NOW() + INTERVAL '1 hour', true)
    `, [testIP]);
    
    // Verificar bloqueio
    const result = await testDb.query(`
      SELECT * FROM blocked_ips WHERE ip_address = $1
    `, [testIP]);
    
    assert(result.rows.length === 1, 'IP deve estar bloqueado');
    assert(result.rows[0].severity === 'HIGH', 'Severidade deve ser HIGH');
  }

  async testSystemSettings() {
    // Inserir configuração de teste
    await testDb.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ('test_setting', 'test_value', 'Configuração de teste')
    `);
    
    // Verificar inserção
    const result = await testDb.query(`
      SELECT * FROM system_settings WHERE key = 'test_setting'
    `);
    
    assert(result.rows.length === 1, 'Configuração deve existir');
    assert(result.rows[0].value === 'test_value', 'Valor deve estar correto');
  }

  async testSecurityDashboardData() {
    // Verificar se conseguimos buscar dados básicos para dashboard
    const queries = [
      'SELECT COUNT(*) as total_users FROM users',
      'SELECT COUNT(*) as total_2fa FROM user_2fa WHERE is_enabled = true',
      'SELECT COUNT(*) as blocked_ips FROM blocked_ips WHERE blocked_until > NOW()'
    ];
    
    for (const query of queries) {
      const result = await testDb.query(query);
      assert(result.rows.length === 1, `Query deve retornar resultado: ${query}`);
      assert(typeof result.rows[0] === 'object', 'Resultado deve ser objeto');
    }
  }

  async runAllTests() {
    console.log('🚀 INICIANDO TESTES BÁSICOS DE SEGURANÇA\n');
    console.log('=' * 50);

    try {
      await this.cleanup();
      
      await this.runTest('Verificação de Tabelas Básicas', () => this.testBasicTables());
      await this.runTest('Teste da Tabela 2FA', () => this.test2FATable());
      await this.runTest('Teste de IPs Bloqueados', () => this.testBlockedIPs());
      await this.runTest('Teste de Configurações do Sistema', () => this.testSystemSettings());
      await this.runTest('Teste de Dados do Dashboard', () => this.testSecurityDashboardData());
      
      await this.cleanup();
      
    } catch (error) {
      console.error('❌ Erro crítico:', error.message);
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '=' * 50);
    console.log('📋 RESUMO DOS TESTES BÁSICOS');
    console.log('=' * 50);
    console.log(`📊 Total: ${this.testResults.total_tests}`);
    console.log(`✅ Passou: ${this.testResults.passed}`);
    console.log(`❌ Falhou: ${this.testResults.failed}`);
    console.log(`📈 Taxa de sucesso: ${((this.testResults.passed / this.testResults.total_tests) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ ERROS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }

    console.log('\n' + '=' * 50);
    
    if (this.testResults.failed === 0) {
      console.log('🎉 TODOS OS TESTES BÁSICOS PASSARAM!');
      console.log('✨ Sistema de segurança funcionando corretamente.');
    } else {
      console.log('⚠️  ALGUNS TESTES FALHARAM. Verifique os erros.');
    }
    
    console.log('=' * 50);
  }
}

async function main() {
  const test = new BasicSecurityTest();
  
  try {
    await test.runAllTests();
    process.exit(test.testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  } finally {
    await testDb.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = BasicSecurityTest;

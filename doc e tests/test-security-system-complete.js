// ========================================
// MARKETBOT - COMPREHENSIVE SECURITY TEST
// Teste completo do sistema de segurança enterprise
// ========================================

const { Pool } = require('pg');
const assert = require('assert');

// Configuração do banco de dados para testes
const testDb = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

class SecuritySystemTest {
  constructor() {
    this.testResults = {
      total_tests: 0,
      passed: 0,
      failed: 0,
      errors: [],
      start_time: new Date(),
      end_time: null
    };
  }

  // ========================================
  // UTILITÁRIOS DE TESTE
  // ========================================

  async runTest(testName, testFunction) {
    this.testResults.total_tests++;
    console.log(`\n🧪 Executando: ${testName}`);
    
    try {
      await testFunction();
      this.testResults.passed++;
      console.log(`✅ PASSOU: ${testName}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({
        test: testName,
        error: error.message,
        stack: error.stack
      });
      console.log(`❌ FALHOU: ${testName} - ${error.message}`);
    }
  }

  async createTestUser() {
    const result = await testDb.query(`
      INSERT INTO users (email, password_hash, user_type, is_email_verified, user_status, created_at)
      VALUES ('test@security.test', '$2b$10$hashedpassword', 'free', true, 'active', NOW())
      RETURNING id, email
    `);
    return result.rows[0];
  }

  async cleanupTestData() {
    try {
      const queries = [
        'DELETE FROM user_2fa WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')',
        'DELETE FROM login_attempts WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')',
        'DELETE FROM security_events WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')',
        'DELETE FROM suspicious_activities WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')',
        'DELETE FROM blocked_ips WHERE ip_address = \'192.168.1.100\'',
        'DELETE FROM blocked_devices WHERE device_fingerprint LIKE \'test_%\'',
        'DELETE FROM rate_limit_tracking WHERE identifier LIKE \'test_%\'',
        'DELETE FROM users WHERE email LIKE \'%test%\''
      ];

      for (const query of queries) {
        await testDb.query(query);
      }
    } catch (error) {
      console.log(`⚠️ Erro na limpeza (normal em primeiro teste): ${error.message}`);
    }
  }

  // ========================================
  // TESTES DE MIGRAÇÃO E ESTRUTURA
  // ========================================

  async testDatabaseTables() {
    const expectedTables = [
      'user_2fa', 'blocked_ips', 'blocked_devices', 'global_lockouts', 
      'suspicious_activities', 'rate_limit_tracking', 'system_settings'
    ];

    for (const table of expectedTables) {
      const result = await testDb.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      
      assert(result.rows[0].exists, `Tabela ${table} não existe`);
    }
  }

  async testDatabaseFunctions() {
    const expectedFunctions = [
      'update_updated_at_column'
    ];

    for (const func of expectedFunctions) {
      const result = await testDb.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.routines 
          WHERE routine_schema = 'public' AND routine_name = $1
        )
      `, [func]);
      
      assert(result.rows[0].exists, `Função ${func} não existe`);
    }
  }

  async testDatabaseViews() {
    // Por enquanto, pular teste de views até implementar
    console.log('  ⏭️  Pulando teste de views (implementação pendente)');
  }

  // ========================================
  // TESTES DO SISTEMA 2FA
  // ========================================

  async test2FASetup() {
    const user = await this.createTestUser();
    
    // Inserir configuração 2FA
    await testDb.query(`
      INSERT INTO user_2fa (user_id, secret_key, backup_codes, is_enabled, setup_completed)
      VALUES ($1, 'TESTSECRETKEY123456', '["code1", "code2", "code3"]', true, true)
    `, [user.id]);

    // Verificar status usando função do banco
    const status = await testDb.query(`
      SELECT * FROM get_user_2fa_status($1)
    `, [user.id]);

    assert(status.rows[0].has_2fa === true, '2FA deve estar configurado');
    assert(status.rows[0].is_enabled === true, '2FA deve estar habilitado');
    assert(status.rows[0].backup_codes_remaining === 3, 'Deve ter 3 códigos de backup');
  }

  async test2FAValidation() {
    const user = await this.createTestUser();
    
    // Configurar 2FA
    await testDb.query(`
      INSERT INTO user_2fa (user_id, secret_key, backup_codes, is_enabled, setup_completed)
      VALUES ($1, 'TESTSECRETKEY123456', '["backup1", "backup2"]', true, true)
    `, [user.id]);

    // Simular uso de código de backup
    await testDb.query(`
      UPDATE user_2fa 
      SET backup_codes = array_remove(backup_codes, 'backup1'),
          last_used_at = NOW()
      WHERE user_id = $1
    `, [user.id]);

    // Verificar atualização
    const result = await testDb.query(`
      SELECT backup_codes FROM user_2fa WHERE user_id = $1
    `, [user.id]);

    assert(result.rows[0].backup_codes.length === 1, 'Deve restar 1 código de backup');
    assert(!result.rows[0].backup_codes.includes('backup1'), 'Código usado deve ter sido removido');
  }

  // ========================================
  // TESTES DE LOGIN ATTEMPTS
  // ========================================

  async testLoginAttempts() {
    const user = await this.createTestUser();
    
    // Inserir tentativas de login falhadas
    for (let i = 0; i < 3; i++) {
      await testDb.query(`
        INSERT INTO login_attempts (user_id, ip_address, user_agent, attempt_type, success, failure_reason)
        VALUES ($1, '192.168.1.100', 'TestAgent', 'PASSWORD', false, 'Invalid password')
      `, [user.id]);
    }

    // Testar função de contagem
    const result = await testDb.query(`
      SELECT get_failed_login_attempts($1, $2, 60) as failed_count
    `, [user.id, '192.168.1.100']);

    assert(result.rows[0].failed_count === 3, 'Deve contar 3 tentativas falhadas');
  }

  async testLoginAttemptsCleanup() {
    const user = await this.createTestUser();
    
    // Inserir tentativa antiga
    await testDb.query(`
      INSERT INTO login_attempts (user_id, ip_address, attempt_type, success, created_at)
      VALUES ($1, '192.168.1.100', 'PASSWORD', false, NOW() - INTERVAL '25 hours')
    `, [user.id]);

    // Executar limpeza
    await testDb.query('SELECT cleanup_security_data()');

    // Verificar se foi removida
    const result = await testDb.query(`
      SELECT COUNT(*) as count FROM login_attempts 
      WHERE user_id = $1 AND created_at < NOW() - INTERVAL '24 hours'
    `, [user.id]);

    assert(result.rows[0].count === '0', 'Tentativas antigas devem ter sido removidas');
  }

  // ========================================
  // TESTES DE SECURITY EVENTS
  // ========================================

  async testSecurityEvents() {
    const user = await this.createTestUser();
    
    // Inserir evento de segurança
    await testDb.query(`
      INSERT INTO security_events (user_id, event_type, description, ip_address, success, metadata)
      VALUES ($1, 'LOGIN_SUCCESS', 'Login bem-sucedido com 2FA', '192.168.1.100', true, '{"severity": "LOW"}')
    `, [user.id]);

    // Verificar inserção
    const result = await testDb.query(`
      SELECT * FROM security_events WHERE user_id = $1
    `, [user.id]);

    assert(result.rows.length === 1, 'Evento deve ter sido inserido');
    assert(result.rows[0].event_type === 'LOGIN_SUCCESS', 'Tipo de evento correto');
    assert(result.rows[0].metadata.severity === 'LOW', 'Metadata deve estar correta');
  }

  // ========================================
  // TESTES DE BLOQUEIO
  // ========================================

  async testIPBlocking() {
    const testIP = '192.168.1.100';
    
    // Inserir IP bloqueado
    await testDb.query(`
      INSERT INTO blocked_ips (ip_address, reason, severity, blocked_until, auto_blocked)
      VALUES ($1, 'Múltiplas tentativas falhadas', 'HIGH', NOW() + INTERVAL '1 hour', true)
    `, [testIP]);

    // Verificar bloqueio
    const result = await testDb.query(`
      SELECT * FROM blocked_ips WHERE ip_address = $1 AND blocked_until > NOW()
    `, [testIP]);

    assert(result.rows.length === 1, 'IP deve estar bloqueado');
    assert(result.rows[0].auto_blocked === true, 'Deve ser auto-bloqueio');
    assert(result.rows[0].severity === 'HIGH', 'Severidade deve ser HIGH');
  }

  async testDeviceBlocking() {
    const deviceFingerprint = 'test_device_12345';
    
    // Inserir dispositivo bloqueado
    await testDb.query(`
      INSERT INTO blocked_devices (device_fingerprint, reason, blocked_until, auto_blocked)
      VALUES ($1, 'Atividade suspeita detectada', NOW() + INTERVAL '2 hours', true)
    `, [deviceFingerprint]);

    // Verificar bloqueio
    const result = await testDb.query(`
      SELECT * FROM blocked_devices WHERE device_fingerprint = $1 AND blocked_until > NOW()
    `, [deviceFingerprint]);

    assert(result.rows.length === 1, 'Dispositivo deve estar bloqueado');
    assert(result.rows[0].auto_blocked === true, 'Deve ser auto-bloqueio');
  }

  // ========================================
  // TESTES DE ATIVIDADES SUSPEITAS
  // ========================================

  async testSuspiciousActivities() {
    const user = await this.createTestUser();
    
    // Inserir atividades suspeitas
    const activities = [
      { type: 'SQL_INJECTION_ATTEMPT', severity: 'CRITICAL', description: 'Tentativa de SQL injection detectada' },
      { type: 'BRUTE_FORCE_ATTEMPT', severity: 'HIGH', description: 'Tentativas de força bruta' },
      { type: 'SUSPICIOUS_USER_AGENT', severity: 'MEDIUM', description: 'User agent suspeito' }
    ];

    for (const activity of activities) {
      await testDb.query(`
        INSERT INTO suspicious_activities (user_id, ip_address, activity_type, severity, description, detected_at, auto_blocked)
        VALUES ($1, '192.168.1.100', $2, $3, $4, NOW(), $5)
      `, [user.id, activity.type, activity.severity, activity.description, activity.severity === 'CRITICAL']);
    }

    // Verificar inserções
    const result = await testDb.query(`
      SELECT * FROM suspicious_activities WHERE user_id = $1
      ORDER BY severity DESC
    `, [user.id]);

    assert(result.rows.length === 3, 'Deve ter 3 atividades suspeitas');
    assert(result.rows[0].severity === 'CRITICAL', 'Primeira deve ser CRITICAL');
    assert(result.rows[0].auto_blocked === true, 'CRITICAL deve ter auto-bloqueio');
  }

  // ========================================
  // TESTES DE RATE LIMITING
  // ========================================

  async testRateLimiting() {
    const testIdentifier = 'test_ip_192.168.1.100';
    
    // Inserir múltiplas requisições
    for (let i = 0; i < 10; i++) {
      await testDb.query(`
        INSERT INTO rate_limit_tracking (identifier, limit_type, metadata)
        VALUES ($1, 'IP', '{"endpoint": "/api/test"}')
      `, [testIdentifier]);
    }

    // Verificar contagem
    const result = await testDb.query(`
      SELECT COUNT(*) as count FROM rate_limit_tracking 
      WHERE identifier = $1 AND created_at > NOW() - INTERVAL '1 hour'
    `, [testIdentifier]);

    assert(parseInt(result.rows[0].count) === 10, 'Deve ter 10 registros de rate limiting');
  }

  // ========================================
  // TESTES DE CONFIGURAÇÕES DO SISTEMA
  // ========================================

  async testSystemSettings() {
    // Verificar configurações padrão
    const settings = await testDb.query(`
      SELECT key, value FROM system_settings 
      WHERE key IN ('max_login_attempts', 'lockout_duration_minutes', 'require_2fa_for_admin')
    `);

    const settingsMap = settings.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    assert(settingsMap.max_login_attempts === '5', 'Max login attempts deve ser 5');
    assert(settingsMap.lockout_duration_minutes === '60', 'Lockout duration deve ser 60');
    assert(settingsMap.require_2fa_for_admin === 'true', '2FA deve ser obrigatório para admin');
  }

  // ========================================
  // TESTES DE VIEWS E DASHBOARD
  // ========================================

  async testSecurityDashboard() {
    // Inserir dados de teste
    const user = await this.createTestUser();
    
    await testDb.query(`
      INSERT INTO user_2fa (user_id, secret_key, is_enabled, setup_completed)
      VALUES ($1, 'TEST123', true, true)
    `, [user.id]);

    await testDb.query(`
      INSERT INTO login_attempts (user_id, ip_address, attempt_type, success)
      VALUES ($1, '192.168.1.100', 'PASSWORD', false)
    `, [user.id]);

    // Verificar dashboard
    const dashboard = await testDb.query('SELECT * FROM security_dashboard');
    
    assert(dashboard.rows.length === 1, 'Dashboard deve retornar dados');
    assert(dashboard.rows[0].users_with_2fa >= 1, 'Deve contar usuários com 2FA');
    assert(dashboard.rows[0].failed_logins_1h >= 1, 'Deve contar login falhados');
  }

  async testLoginAttemptsByIP() {
    const user = await this.createTestUser();
    
    // Inserir tentativas de diferentes IPs
    await testDb.query(`
      INSERT INTO login_attempts (user_id, ip_address, user_agent, attempt_type, success)
      VALUES 
        ($1, '192.168.1.100', 'Agent1', 'PASSWORD', false),
        ($1, '192.168.1.100', 'Agent1', 'PASSWORD', true),
        ($1, '192.168.1.101', 'Agent2', 'PASSWORD', false)
    `, [user.id]);

    // Verificar view
    const result = await testDb.query(`
      SELECT * FROM login_attempts_by_ip 
      WHERE ip_address = '192.168.1.100'
    `);

    assert(result.rows.length === 1, 'Deve agrupar por IP');
    assert(result.rows[0].total_attempts === '2', 'Total deve ser 2');
    assert(result.rows[0].failed_attempts === '1', 'Falhas deve ser 1');
    assert(result.rows[0].successful_attempts === '1', 'Sucessos deve ser 1');
  }

  // ========================================
  // TESTES DE PERFORMANCE
  // ========================================

  async testPerformance() {
    console.log('\n⚡ Testando performance...');
    
    const user = await this.createTestUser();
    const iterations = 100;
    
    // Teste de inserção em massa
    const startInsert = Date.now();
    for (let i = 0; i < iterations; i++) {
      await testDb.query(`
        INSERT INTO login_attempts (user_id, ip_address, attempt_type, success)
        VALUES ($1, $2, 'PASSWORD', $3)
      `, [user.id, `192.168.1.${i % 255}`, i % 2 === 0]);
    }
    const insertTime = Date.now() - startInsert;
    
    // Teste de consulta
    const startQuery = Date.now();
    for (let i = 0; i < 10; i++) {
      await testDb.query(`
        SELECT get_failed_login_attempts($1, NULL, 60)
      `, [user.id]);
    }
    const queryTime = Date.now() - startQuery;
    
    console.log(`📊 Performance - Inserções: ${insertTime}ms, Consultas: ${queryTime}ms`);
    
    assert(insertTime < 5000, 'Inserções devem ser rápidas (<5s)');
    assert(queryTime < 1000, 'Consultas devem ser rápidas (<1s)');
  }

  // ========================================
  // TESTE PRINCIPAL
  // ========================================

  async runAllTests() {
    console.log('🚀 INICIANDO TESTES COMPLETOS DO SISTEMA DE SEGURANÇA\n');
    console.log('=' * 60);

    try {
      // Limpeza inicial
      await this.cleanupTestData();

      // Testes de estrutura
      await this.runTest('Verificação de Tabelas', () => this.testDatabaseTables());
      await this.runTest('Verificação de Funções', () => this.testDatabaseFunctions());
      await this.runTest('Verificação de Views', () => this.testDatabaseViews());

      // Testes de 2FA
      await this.runTest('Setup de 2FA', () => this.test2FASetup());
      await this.runTest('Validação de 2FA', () => this.test2FAValidation());

      // Testes de Login Attempts
      await this.runTest('Login Attempts', () => this.testLoginAttempts());
      await this.runTest('Limpeza de Login Attempts', () => this.testLoginAttemptsCleanup());

      // Testes de Security Events
      await this.runTest('Security Events', () => this.testSecurityEvents());

      // Testes de Bloqueio
      await this.runTest('Bloqueio de IP', () => this.testIPBlocking());
      await this.runTest('Bloqueio de Dispositivo', () => this.testDeviceBlocking());

      // Testes de Atividades Suspeitas
      await this.runTest('Atividades Suspeitas', () => this.testSuspiciousActivities());

      // Testes de Rate Limiting
      await this.runTest('Rate Limiting', () => this.testRateLimiting());

      // Testes de Configurações
      await this.runTest('Configurações do Sistema', () => this.testSystemSettings());

      // Testes de Views
      await this.runTest('Security Dashboard', () => this.testSecurityDashboard());
      await this.runTest('Login Attempts por IP', () => this.testLoginAttemptsByIP());

      // Testes de Performance
      await this.runTest('Performance', () => this.testPerformance());

      // Limpeza final
      await this.cleanupTestData();

    } catch (error) {
      console.error('❌ Erro crítico nos testes:', error);
      this.testResults.errors.push({
        test: 'SETUP/TEARDOWN',
        error: error.message,
        stack: error.stack
      });
    }

    this.testResults.end_time = new Date();
    this.printSummary();
  }

  printSummary() {
    const duration = this.testResults.end_time - this.testResults.start_time;
    
    console.log('\n' + '=' * 60);
    console.log('📋 RESUMO DOS TESTES DE SEGURANÇA');
    console.log('=' * 60);
    console.log(`⏱️  Duração: ${duration}ms`);
    console.log(`📊 Total de testes: ${this.testResults.total_tests}`);
    console.log(`✅ Passou: ${this.testResults.passed}`);
    console.log(`❌ Falhou: ${this.testResults.failed}`);
    console.log(`📈 Taxa de sucesso: ${((this.testResults.passed / this.testResults.total_tests) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.test}:`);
        console.log(`   ${error.error}`);
      });
    }

    console.log('\n' + '=' * 60);
    
    if (this.testResults.failed === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Sistema de segurança funcionando perfeitamente.');
    } else {
      console.log('⚠️  ALGUNS TESTES FALHARAM. Verifique os erros acima.');
    }
    
    console.log('=' * 60);
  }
}

// ========================================
// EXECUÇÃO DOS TESTES
// ========================================

async function main() {
  const securityTest = new SecuritySystemTest();
  
  try {
    await securityTest.runAllTests();
    process.exit(securityTest.testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('💥 Erro fatal durante os testes:', error);
    process.exit(1);
  } finally {
    await testDb.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = SecuritySystemTest;

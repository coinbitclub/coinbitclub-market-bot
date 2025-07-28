#!/usr/bin/env node

/**
 * Script de Testes Avançados - CoinBitClub
 * Valida todos os cenários de autenticação e funcionalidades
 */

require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Configurações
const BASE_URL = 'http://localhost:3000';

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(type, message) {
  const timestamp = new Date().toISOString();
  const color = colors[type] || colors.reset;
  console.log(`${color}${colors.bold}[${timestamp}] ${message}${colors.reset}`);
}

// Cenários de teste
const testScenarios = {
  // Dados de teste para diferentes tipos de usuário
  testUsers: {
    user: {
      fullName: 'João Silva Teste',
      email: 'joao.teste@coinbitclub.com',
      phone: '(11) 99999-1234',
      password: 'senha123',
      userType: 'user'
    },
    affiliate: {
      fullName: 'Maria Santos Afiliada',
      email: 'maria.affiliate@coinbitclub.com',
      phone: '(11) 99999-5678',
      password: 'senha123',
      userType: 'affiliate'
    },
    admin: {
      fullName: 'Admin Sistema',
      email: 'admin.teste@coinbitclub.com',
      phone: '(11) 99999-9999',
      password: 'senha123',
      userType: 'admin'
    }
  },

  // Cenários de login existentes
  existingUsers: [
    { email: 'test@coinbitclub.com', password: 'password123', expectedType: 'user' },
    { email: 'affiliate@coinbitclub.com', password: 'password123', expectedType: 'affiliate' }
  ]
};

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(testName, testFunction) {
    log('blue', `🧪 Executando teste: ${testName}`);
    try {
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
      log('green', `✅ PASSOU: ${testName}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
      log('red', `❌ FALHOU: ${testName} - ${error.message}`);
    }
  }

  async testDatabaseConnection() {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    if (!result.rows[0].current_time) {
      throw new Error('Conexão com banco falhou');
    }
  }

  async testUserRegistration(userType) {
    const userData = testScenarios.testUsers[userType];
    
    // Limpar usuário se já existir
    await this.cleanupUser(userData.email);
    
    const response = await fetch(`${BASE_URL}/api/auth/register-real`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Registro falhou: ${data.message}`);
    }

    if (data.user.type !== userType) {
      throw new Error(`Tipo de usuário incorreto: esperado ${userType}, recebido ${data.user.type}`);
    }

    if (!data.token) {
      throw new Error('Token JWT não retornado');
    }

    // Verificar se foi criado no banco
    await this.verifyUserInDatabase(userData.email, userType);
    
    return data;
  }

  async testUserLogin(email, password, expectedType) {
    const response = await fetch(`${BASE_URL}/api/auth/login-real`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Login falhou: ${data.message}`);
    }

    if (data.user.type !== expectedType) {
      throw new Error(`Tipo de usuário incorreto no login: esperado ${expectedType}, recebido ${data.user.type}`);
    }

    if (!data.token) {
      throw new Error('Token JWT não retornado no login');
    }

    return data;
  }

  async testForgotPassword(email) {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password-real`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Esqueci senha falhou: ${data.message}`);
    }

    if (!data.success) {
      throw new Error('Forgot password não retornou sucesso');
    }

    // Verificar se token foi salvo no banco
    const client = await pool.connect();
    const result = await client.query(
      'SELECT password_reset_token FROM users WHERE email = $1',
      [email]
    );
    client.release();

    if (!result.rows[0]?.password_reset_token) {
      throw new Error('Token de reset não foi salvo no banco');
    }

    return { ...data, resetToken: result.rows[0].password_reset_token };
  }

  async testResetPassword(token, newPassword) {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password-real`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Reset senha falhou: ${data.message}`);
    }

    if (!data.success) {
      throw new Error('Reset password não retornou sucesso');
    }

    return data;
  }

  async verifyUserInDatabase(email, expectedType) {
    const client = await pool.connect();
    
    try {
      // Verificar usuário principal
      const userResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Usuário não encontrado no banco');
      }

      const user = userResult.rows[0];
      
      if (user.user_type !== expectedType) {
        throw new Error(`Tipo no banco incorreto: esperado ${expectedType}, encontrado ${user.user_type}`);
      }

      // Verificar balances
      const balanceResult = await client.query(
        'SELECT * FROM user_balances WHERE user_id = $1',
        [user.id]
      );

      if (balanceResult.rows.length === 0) {
        throw new Error('Balance do usuário não criado');
      }

      // Verificar se balances foram criados
      const userBalanceResult = await client.query(
        'SELECT * FROM user_balances WHERE user_id = $1',
        [user.id]
      );

      if (userBalanceResult.rows.length === 0) {
        throw new Error('Balance do usuário não criado');
      }

      // Se for afiliado, verificar tabela de afiliados
      if (expectedType === 'affiliate') {
        const affiliateResult = await client.query(
          'SELECT * FROM affiliates WHERE user_id = $1',
          [user.id]
        );

        if (affiliateResult.rows.length === 0) {
          throw new Error('Registro de afiliado não criado');
        }

        if (!affiliateResult.rows[0].affiliate_code) {
          throw new Error('Código de afiliado não gerado');
        }
      }

      // Verificar subscription trial
      const subscriptionResult = await client.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 AND plan_type = $2',
        [user.id, 'trial']
      );

      if (subscriptionResult.rows.length === 0) {
        throw new Error('Trial subscription não criada');
      }

    } finally {
      client.release();
    }
  }

  async cleanupUser(email) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Buscar ID do usuário
      const userResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        // Deletar em ordem correta (foreign keys)
        await client.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM affiliates WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM user_balances WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async testCompleteUserFlow(userType) {
    const userData = testScenarios.testUsers[userType];
    
    // 1. Registro
    const registrationData = await this.testUserRegistration(userType);
    
    // 2. Login
    const loginData = await this.testUserLogin(userData.email, userData.password, userType);
    
    // 3. Forgot Password
    const forgotData = await this.testForgotPassword(userData.email);
    
    // 4. Reset Password
    const newPassword = 'novaSenha123';
    await this.testResetPassword(forgotData.resetToken, newPassword);
    
    // 5. Login com nova senha
    await this.testUserLogin(userData.email, newPassword, userType);
    
    log('green', `✅ Fluxo completo do ${userType} funcionando perfeitamente!`);
  }

  async runAllTests() {
    log('yellow', '🚀 Iniciando Testes Avançados do CoinBitClub');
    log('yellow', '='.repeat(50));

    // Teste de conexão com banco
    await this.runTest('Conexão com Banco de Dados', () => this.testDatabaseConnection());

    // Testes de registro por tipo
    await this.runTest('Registro de Usuário', () => this.testUserRegistration('user'));
    await this.runTest('Registro de Afiliado', () => this.testUserRegistration('affiliate'));
    await this.runTest('Registro de Admin', () => this.testUserRegistration('admin'));

    // Testes de login com usuários existentes
    for (const user of testScenarios.existingUsers) {
      await this.runTest(
        `Login usuário ${user.expectedType} (${user.email})`,
        () => this.testUserLogin(user.email, user.password, user.expectedType)
      );
    }

    // Testes de fluxo completo
    await this.runTest('Fluxo Completo - Usuário', () => this.testCompleteUserFlow('user'));
    await this.runTest('Fluxo Completo - Afiliado', () => this.testCompleteUserFlow('affiliate'));
    await this.runTest('Fluxo Completo - Admin', () => this.testCompleteUserFlow('admin'));

    // Testes de cenários específicos
    await this.runTest('Login com credenciais inválidas', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login-real`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'inexistente@test.com', password: 'senhaerrada' })
      });

      if (response.ok) {
        throw new Error('Login com credenciais inválidas deveria falhar');
      }
    });

    await this.runTest('Registro com email duplicado', async () => {
      const userData = testScenarios.testUsers.user;
      
      // Primeiro registro
      await this.cleanupUser(userData.email);
      await this.testUserRegistration('user');
      
      // Segundo registro (deve falhar)
      const response = await fetch(`${BASE_URL}/api/auth/register-real`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        throw new Error('Registro com email duplicado deveria falhar');
      }
    });

    // Cleanup final
    for (const userType of Object.keys(testScenarios.testUsers)) {
      const userData = testScenarios.testUsers[userType];
      await this.cleanupUser(userData.email);
    }

    this.printResults();
  }

  printResults() {
    log('yellow', '='.repeat(50));
    log('yellow', '📊 RESULTADOS DOS TESTES');
    log('yellow', '='.repeat(50));
    
    log('green', `✅ Testes Aprovados: ${this.results.passed}`);
    log('red', `❌ Testes Falharam: ${this.results.failed}`);
    
    const total = this.results.passed + this.results.failed;
    const successRate = ((this.results.passed / total) * 100).toFixed(1);
    
    log('blue', `📈 Taxa de Sucesso: ${successRate}%`);
    
    if (this.results.failed > 0) {
      log('red', '❌ Testes que falharam:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          log('red', `   - ${test.name}: ${test.error}`);
        });
    }

    if (this.results.failed === 0) {
      log('green', '🎉 TODOS OS TESTES PASSARAM! Sistema 100% funcional!');
      log('green', '✅ Autenticação completa validada');
      log('green', '✅ Todos os tipos de usuário funcionando');
      log('green', '✅ Recuperação de senha implementada');
      log('green', '✅ Banco de dados integrado');
      log('green', '✅ Sistema pronto para produção!');
    } else {
      log('red', '⚠️ Alguns testes falharam. Verifique os erros acima.');
    }
  }
}

async function main() {
  const testRunner = new TestRunner();
  
  try {
    await testRunner.runAllTests();
  } catch (error) {
    log('red', `❌ Erro crítico nos testes: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

# 🎯 PLANO DE TRABALHO - FINALIZAR BACKEND COINBITCLUB
## Sistema de Crédito de Teste - Implementação Final

---

## 📊 **STATUS ATUAL DETALHADO**

### **✅ O QUE JÁ ESTÁ PRONTO (85%)**
1. **🗄️ Database Structure**: 100% completo
   - Tabela `test_credits` criada
   - Colunas em `user_balances` adicionadas
   - Índices de performance implementados
   - Funções PostgreSQL funcionando

2. **🔧 Business Logic**: 100% implementado
   - `check_test_credit_eligibility(user_id)`
   - `grant_test_credit(user_id)`
   - `admin_grant_test_credit(user_id, admin_id, amount, currency, notes)`

3. **🏗️ Infrastructure**: 100% operacional
   - Servidor Express rodando
   - Railway deployment ativo
   - Autenticação admin funcionando
   - Pool de conexões configurado

### **⚠️ O QUE FALTA (15%)**
1. **🔌 REST APIs**: Não expostas no server.js principal
2. **🧪 Testes**: APIs não testadas
3. **📋 Validações**: Algumas validações faltando
4. **📊 Logs**: Sistema de auditoria incompleto

---

## 🚀 **PLANO DE TRABALHO - 3 FASES**

### **FASE 1: INTEGRAÇÃO DAS APIs (Prioridade Máxima)**
**⏱️ Tempo Estimado: 4-6 horas**
**👤 Responsável: Developer Backend**

#### **Tarefa 1.1: Adicionar Pool PostgreSQL ao server.js**
```javascript
// Adicionar no topo do server.js, após os imports
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Testar conexão na inicialização
pool.connect()
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch(err => console.error('❌ Erro PostgreSQL:', err));
```

#### **Tarefa 1.2: Adicionar Middleware Admin Melhorado**
```javascript
// Middleware de autenticação admin melhorado
function authenticateAdmin(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token de autorização necessário' 
      });
    }
    
    // Verificar tokens válidos
    const validTokens = [
      process.env.ADMIN_TOKEN,
      'admin-emergency-token',
      process.env.ADMIN_EMERGENCY_TOKEN
    ].filter(Boolean);
    
    if (validTokens.includes(token)) {
      req.user = { id: 'admin', role: 'admin', token };
      req.timestamp = new Date().toISOString();
      next();
    } else {
      return res.status(401).json({ 
        success: false, 
        error: 'Token admin inválido' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Erro de autenticação' 
    });
  }
}
```

#### **Tarefa 1.3: Implementar Endpoints de Crédito Teste**
**Localização: Adicionar antes da linha `// ===== ROTAS DE TESTE =====` no server.js**

```javascript
// ===== SISTEMA DE CRÉDITO DE TESTE =====

// 📊 Estatísticas do Dashboard
app.get('/api/admin/test-credits/stats', authenticateAdmin, async (req, res) => {
  try {
    console.log(`📊 [${req.timestamp}] Admin consultando estatísticas de crédito teste`);
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN currency = 'BRL' THEN amount ELSE 0 END) as total_brl,
        SUM(CASE WHEN currency = 'USD' THEN amount ELSE 0 END) as total_usd,
        COUNT(CASE WHEN granted_type = 'user_request' THEN 1 END) as user_requests,
        COUNT(CASE WHEN granted_type = 'admin_grant' THEN 1 END) as admin_grants
      FROM test_credits
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    // Consulta para estatísticas de uso
    const usageQuery = `
      SELECT 
        COUNT(CASE WHEN ub.test_credit_used > 0 THEN 1 END) as used_count,
        COUNT(CASE WHEN ub.test_credit_balance > 0 THEN 1 END) as available_count
      FROM user_balances ub
      WHERE ub.test_credit_balance > 0 OR ub.test_credit_used > 0
    `;
    
    const usageResult = await pool.query(usageQuery);
    const usage = usageResult.rows[0];
    
    const response = {
      success: true,
      stats: {
        total_credits_granted: {
          count: parseInt(stats.total_count || 0),
          amount_brl: parseFloat(stats.total_brl || 0),
          amount_usd: parseFloat(stats.total_usd || 0)
        },
        user_requests: {
          count: parseInt(stats.user_requests || 0)
        },
        admin_grants: {
          count: parseInt(stats.admin_grants || 0)
        },
        usage_stats: {
          used_count: parseInt(usage.used_count || 0),
          available_count: parseInt(usage.available_count || 0),
          usage_rate: stats.total_count > 0 ? 
            ((usage.used_count || 0) / stats.total_count * 100) : 0
        }
      },
      timestamp: req.timestamp
    };
    
    res.json(response);
    console.log(`✅ Estatísticas enviadas: ${stats.total_count} créditos total`);
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno ao buscar estatísticas',
      timestamp: req.timestamp 
    });
  }
});

// 📋 Listar créditos com filtros e paginação
app.get('/api/admin/test-credits', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      type = 'all', 
      status = 'all',
      date_from,
      date_to
    } = req.query;
    
    console.log(`📋 [${req.timestamp}] Listando créditos - Página: ${page}, Filtros: type=${type}, status=${status}`);
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = '1=1';
    const params = [];
    
    // Filtro de busca por nome/email
    if (search) {
      whereClause += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    // Filtro por tipo
    if (type !== 'all') {
      whereClause += ` AND tc.granted_type = $${params.length + 1}`;
      params.push(type);
    }
    
    // Filtro por data
    if (date_from) {
      whereClause += ` AND tc.created_at >= $${params.length + 1}`;
      params.push(date_from);
    }
    
    if (date_to) {
      whereClause += ` AND tc.created_at <= $${params.length + 1}`;
      params.push(date_to);
    }
    
    // Query principal
    const query = `
      SELECT 
        tc.id,
        tc.user_id,
        tc.amount,
        tc.currency,
        tc.granted_type,
        tc.notes,
        tc.created_at,
        u.name as user_name,
        u.email as user_email,
        admin_u.name as granted_by_name,
        COALESCE(ub.test_credit_used, 0) > 0 as is_used,
        ub.test_credit_balance
      FROM test_credits tc
      JOIN users u ON tc.user_id = u.id
      LEFT JOIN users admin_u ON tc.granted_by = admin_u.id
      LEFT JOIN user_balances ub ON tc.user_id = ub.user_id
      WHERE ${whereClause}
      ORDER BY tc.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) 
      FROM test_credits tc
      JOIN users u ON tc.user_id = u.id
      WHERE ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalItems = parseInt(countResult.rows[0].count);
    
    const response = {
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email
        },
        amount: parseFloat(row.amount),
        currency: row.currency,
        granted_type: row.granted_type,
        granted_by: row.granted_by_name || null,
        granted_at: row.created_at,
        is_used: row.is_used,
        available_balance: parseFloat(row.test_credit_balance || 0),
        notes: row.notes
      })),
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalItems / parseInt(limit)),
        total_items: totalItems,
        has_next: (parseInt(page) * parseInt(limit)) < totalItems,
        has_prev: parseInt(page) > 1
      },
      filters: { page, limit, search, type, status, date_from, date_to },
      timestamp: req.timestamp
    };
    
    res.json(response);
    console.log(`✅ Listagem enviada: ${result.rows.length} créditos de ${totalItems} total`);
    
  } catch (error) {
    console.error('❌ Erro ao listar créditos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno ao listar créditos',
      timestamp: req.timestamp 
    });
  }
});

// 👥 Buscar usuários para seleção
app.get('/api/admin/users/search', authenticateAdmin, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ 
        success: true, 
        users: [],
        message: 'Digite pelo menos 2 caracteres para buscar' 
      });
    }
    
    console.log(`👥 [${req.timestamp}] Buscando usuários: "${q}"`);
    
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.country_code,
        u.status,
        COUNT(tc.id) as test_credit_count,
        MAX(tc.created_at) as last_test_credit,
        COALESCE(ub.test_credit_balance, 0) as current_balance
      FROM users u
      LEFT JOIN test_credits tc ON u.id = tc.user_id
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      WHERE (u.name ILIKE $1 OR u.email ILIKE $1) AND u.is_active = true
      GROUP BY u.id, u.name, u.email, u.country_code, u.status, ub.test_credit_balance
      ORDER BY u.name
      LIMIT $2
    `;
    
    const result = await pool.query(query, [`%${q}%`, parseInt(limit)]);
    
    const response = {
      success: true,
      users: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        country_code: row.country_code,
        status: row.status,
        has_test_credit: parseInt(row.test_credit_count) > 0,
        test_credit_count: parseInt(row.test_credit_count),
        current_balance: parseFloat(row.current_balance),
        last_test_credit: row.last_test_credit,
        display_text: `${row.name} (${row.email})`
      })),
      query: q,
      timestamp: req.timestamp
    };
    
    res.json(response);
    console.log(`✅ Encontrados ${result.rows.length} usuários para "${q}"`);
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno ao buscar usuários',
      timestamp: req.timestamp 
    });
  }
});

// 🎁 Liberar crédito administrativo
app.post('/api/admin/test-credits/grant', authenticateAdmin, async (req, res) => {
  try {
    const { user_id, amount, currency = 'BRL', notes } = req.body;
    
    console.log(`🎁 [${req.timestamp}] Admin liberando crédito: ${currency} ${amount} para ${user_id}`);
    
    // Validações de entrada
    const errors = [];
    
    if (!user_id) errors.push('ID do usuário é obrigatório');
    if (!amount) errors.push('Valor é obrigatório');
    if (!notes || notes.trim().length < 5) errors.push('Observação é obrigatória (mínimo 5 caracteres)');
    if (amount <= 0) errors.push('Valor deve ser maior que zero');
    if (amount > 1000) errors.push('Valor máximo é R$ 1.000,00');
    if (!['BRL', 'USD'].includes(currency)) errors.push('Moeda deve ser BRL ou USD');
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors,
        timestamp: req.timestamp
      });
    }
    
    // Verificar se usuário existe e está ativo
    const userCheck = await pool.query(
      'SELECT id, name, email, is_active FROM users WHERE id = $1',
      [user_id]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
        timestamp: req.timestamp
      });
    }
    
    const user = userCheck.rows[0];
    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Usuário está inativo',
        timestamp: req.timestamp
      });
    }
    
    // Verificar se as funções PostgreSQL existem
    try {
      await pool.query('SELECT admin_grant_test_credit($1, $2, $3, $4, $5)', 
        [user_id, 'admin', 0.01, 'BRL', 'test']);
    } catch (funcError) {
      if (funcError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Funções do sistema de crédito não encontradas. Execute as migrações primeiro.',
          timestamp: req.timestamp
        });
      }
    }
    
    // Liberar crédito usando função PostgreSQL
    const creditResult = await pool.query(
      'SELECT admin_grant_test_credit($1, $2, $3, $4, $5) as result',
      [user_id, 'admin', parseFloat(amount), currency, notes.trim()]
    );
    
    const result = creditResult.rows[0].result;
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Erro ao liberar crédito',
        timestamp: req.timestamp
      });
    }
    
    // Buscar saldo atualizado
    const balanceResult = await pool.query(
      'SELECT test_credit_balance, prepaid_balance FROM user_balances WHERE user_id = $1',
      [user_id]
    );
    
    const balance = balanceResult.rows[0] || { test_credit_balance: 0, prepaid_balance: 0 };
    
    const response = {
      success: true,
      message: `Crédito de ${currency} ${parseFloat(amount).toFixed(2)} liberado com sucesso para ${user.name}`,
      credit: {
        id: result.credit_id,
        amount: parseFloat(amount),
        currency: currency,
        granted_at: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      new_balance: {
        test_credit_balance: parseFloat(balance.test_credit_balance || 0),
        prepaid_balance: parseFloat(balance.prepaid_balance || 0),
        total_balance: parseFloat(balance.test_credit_balance || 0) + parseFloat(balance.prepaid_balance || 0)
      },
      timestamp: req.timestamp
    };
    
    res.json(response);
    console.log(`✅ Crédito liberado com sucesso: ID ${result.credit_id}`);
    
    // Log de auditoria
    console.log(`📋 AUDITORIA: Admin liberou ${currency} ${amount} para ${user.name} (${user.email}) - Motivo: ${notes}`);
    
  } catch (error) {
    console.error('❌ Erro ao liberar crédito:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno ao liberar crédito',
      details: error.message,
      timestamp: req.timestamp 
    });
  }
});

// 🔍 Verificar elegibilidade (para usuário final)
app.post('/api/test-credits/check-eligibility', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário é obrigatório'
      });
    }
    
    console.log(`🔍 Verificando elegibilidade para usuário: ${user_id}`);
    
    const result = await pool.query(
      'SELECT check_test_credit_eligibility($1) as result',
      [user_id]
    );
    
    const eligibility = result.rows[0].result;
    
    res.json({
      success: true,
      ...eligibility,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar elegibilidade:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno ao verificar elegibilidade' 
    });
  }
});

// 🎯 Solicitar crédito (para usuário final)
app.post('/api/test-credits/request', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário é obrigatório'
      });
    }
    
    console.log(`🎯 Usuário solicitando crédito: ${user_id}`);
    
    const result = await pool.query(
      'SELECT grant_test_credit($1) as result',
      [user_id]
    );
    
    const response = result.rows[0].result;
    
    if (response.success) {
      res.json(response);
      console.log(`✅ Crédito automático liberado para ${user_id}: ${response.currency} ${response.amount}`);
    } else {
      res.status(400).json(response);
      console.log(`❌ Crédito negado para ${user_id}: ${response.error}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao solicitar crédito:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno ao processar solicitação' 
    });
  }
});
```

#### **Tarefa 1.4: Atualizar Lista de Endpoints no /api/test/endpoints**
```javascript
// Na rota app.get('/api/test/endpoints'), adicionar:
test_credits: [
  'GET /api/admin/test-credits/stats',
  'GET /api/admin/test-credits',
  'GET /api/admin/users/search',
  'POST /api/admin/test-credits/grant',
  'POST /api/test-credits/check-eligibility',
  'POST /api/test-credits/request'
]
```

---

### **FASE 2: VALIDAÇÃO E TESTES (Prioridade Alta)**
**⏱️ Tempo Estimado: 3-4 horas**
**👤 Responsável: Developer Backend + QA**

#### **Tarefa 2.1: Criar Script de Teste das APIs**
```javascript
// Criar arquivo: test-admin-credit-apis.js
const axios = require('axios');

class AdminCreditAPITester {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
    this.adminToken = 'admin-emergency-token';
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 INICIANDO TESTES DAS APIs DE CRÉDITO TESTE...\n');
    
    await this.testStatsEndpoint();
    await this.testUserSearchEndpoint();
    await this.testGrantCreditEndpoint();
    await this.testListCreditsEndpoint();
    
    this.printResults();
  }

  async testStatsEndpoint() {
    try {
      const response = await axios.get(`${this.baseURL}/api/admin/test-credits/stats`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      this.log('Stats Endpoint', true, `Status: ${response.status}`, response.data);
    } catch (error) {
      this.log('Stats Endpoint', false, error.message, error.response?.data);
    }
  }

  async testUserSearchEndpoint() {
    try {
      const response = await axios.get(`${this.baseURL}/api/admin/users/search?q=test`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      this.log('User Search', true, `Found ${response.data.users?.length || 0} users`);
    } catch (error) {
      this.log('User Search', false, error.message);
    }
  }

  async testGrantCreditEndpoint() {
    // Este teste só funcionará se houver um usuário test no banco
    try {
      const response = await axios.post(`${this.baseURL}/api/admin/test-credits/grant`, {
        user_id: 'test-user-id',
        amount: 50,
        currency: 'BRL',
        notes: 'Teste automatizado da API'
      }, {
        headers: { 
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      this.log('Grant Credit', true, response.data.message);
    } catch (error) {
      // Erro esperado se usuário não existir
      this.log('Grant Credit', error.response?.status === 404, 
        error.response?.status === 404 ? 'Validação OK (usuário não encontrado)' : error.message);
    }
  }

  async testListCreditsEndpoint() {
    try {
      const response = await axios.get(`${this.baseURL}/api/admin/test-credits?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      this.log('List Credits', true, `Found ${response.data.data?.length || 0} credits`);
    } catch (error) {
      this.log('List Credits', false, error.message);
    }
  }

  log(test, success, message, data = null) {
    const result = { test, success, message, data };
    this.testResults.push(result);
    
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
  }

  printResults() {
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`\n📊 RESULTADO DOS TESTES: ${passed}/${total} passaram`);
    
    if (passed === total) {
      console.log('🎉 Todas as APIs estão funcionando!');
    } else {
      console.log('⚠️ Algumas APIs precisam de correção.');
    }
  }
}

// Executar testes
if (require.main === module) {
  const tester = new AdminCreditAPITester();
  tester.runAllTests().catch(console.error);
}

module.exports = AdminCreditAPITester;
```

#### **Tarefa 2.2: Testar Manualmente com cURL**
```bash
# Criar arquivo: test-apis-manual.sh

#!/bin/bash
echo "🧪 TESTANDO APIs MANUALMENTE..."

BASE_URL="http://localhost:3000"
TOKEN="admin-emergency-token"

echo "1. Testando Stats..."
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/admin/test-credits/stats"

echo -e "\n\n2. Testando User Search..."
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/admin/users/search?q=test"

echo -e "\n\n3. Testando List Credits..."
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/admin/test-credits?page=1&limit=5"

echo -e "\n\n✅ Testes manuais concluídos!"
```

#### **Tarefa 2.3: Verificar Funções PostgreSQL**
```javascript
// Criar arquivo: verify-database-functions.js
const { Pool } = require('pg');

async function verifyDatabaseFunctions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Verificando funções do banco de dados...\n');

    // Verificar se funções existem
    const functions = [
      'check_test_credit_eligibility',
      'grant_test_credit',
      'admin_grant_test_credit'
    ];

    for (const func of functions) {
      try {
        const result = await pool.query(
          `SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = $1)`,
          [func]
        );
        
        if (result.rows[0].exists) {
          console.log(`✅ Função ${func} existe`);
        } else {
          console.log(`❌ Função ${func} NÃO encontrada`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar ${func}: ${error.message}`);
      }
    }

    // Verificar estrutura das tabelas
    console.log('\n🗄️ Verificando estrutura das tabelas...');
    
    const tables = ['test_credits', 'user_balances', 'users'];
    for (const table of tables) {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`\n📋 Tabela ${table}:`);
      result.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verifyDatabaseFunctions();
```

---

### **FASE 3: MELHORIAS E LOGS (Prioridade Média)**
**⏱️ Tempo Estimado: 2-3 horas**
**👤 Responsável: Developer Backend**

#### **Tarefa 3.1: Sistema de Logs Melhorado**
```javascript
// Criar arquivo: utils/logger.js
const fs = require('fs');
const path = require('path');

class CreditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, action, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      action,
      data,
      session_id: data.session_id || 'unknown'
    };

    // Log no console
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${action}`, data);

    // Log em arquivo
    const logFile = path.join(this.logDir, `credit-system-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  auditLog(admin_id, action, target_user_id, details) {
    this.log('AUDIT', 'ADMIN_ACTION', {
      admin_id,
      action,
      target_user_id,
      details,
      timestamp: new Date().toISOString()
    });
  }

  errorLog(error, context) {
    this.log('ERROR', 'SYSTEM_ERROR', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new CreditLogger();
```

#### **Tarefa 3.2: Middleware de Rate Limiting Específico**
```javascript
// Adicionar middleware específico para admin
const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 100, // máximo 100 requests por 5 min para admin
  message: {
    success: false,
    error: 'Muitas requisições admin. Tente novamente em 5 minutos.',
    retry_after: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar apenas nas rotas admin de crédito
app.use('/api/admin/test-credits', adminRateLimit);
```

#### **Tarefa 3.3: Validações Avançadas**
```javascript
// Criar arquivo: validators/credit-validators.js
const { body, query, param } = require('express-validator');

const grantCreditValidation = [
  body('user_id')
    .isUUID()
    .withMessage('ID do usuário deve ser um UUID válido'),
  
  body('amount')
    .isFloat({ min: 0.01, max: 1000 })
    .withMessage('Valor deve ser entre R$ 0,01 e R$ 1.000,00'),
  
  body('currency')
    .isIn(['BRL', 'USD'])
    .withMessage('Moeda deve ser BRL ou USD'),
  
  body('notes')
    .isString()
    .isLength({ min: 5, max: 500 })
    .withMessage('Observações devem ter entre 5 e 500 caracteres')
    .customSanitizer(value => value.trim())
];

const listCreditsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  
  query('type')
    .optional()
    .isIn(['all', 'user_request', 'admin_grant'])
    .withMessage('Tipo inválido'),
  
  query('status')
    .optional()
    .isIn(['all', 'used', 'available'])
    .withMessage('Status inválido')
];

module.exports = {
  grantCreditValidation,
  listCreditsValidation
};
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **✅ Fase 1: Integração APIs (Crítico)**
- [ ] Adicionar Pool PostgreSQL ao server.js
- [ ] Implementar middleware authenticateAdmin melhorado
- [ ] Adicionar endpoint GET /api/admin/test-credits/stats
- [ ] Adicionar endpoint GET /api/admin/test-credits
- [ ] Adicionar endpoint GET /api/admin/users/search
- [ ] Adicionar endpoint POST /api/admin/test-credits/grant
- [ ] Adicionar endpoints para usuários (check-eligibility, request)
- [ ] Atualizar lista de endpoints em /api/test/endpoints
- [ ] Testar todas as rotas manualmente

### **✅ Fase 2: Validação e Testes (Importante)**
- [ ] Criar script de teste automatizado
- [ ] Executar testes com cURL
- [ ] Verificar funções PostgreSQL
- [ ] Validar estrutura do banco
- [ ] Testar cenários de erro
- [ ] Documentar resultados dos testes

### **✅ Fase 3: Melhorias (Opcional)**
- [ ] Implementar sistema de logs avançado
- [ ] Adicionar rate limiting específico
- [ ] Criar validações avançadas
- [ ] Implementar monitoramento
- [ ] Otimizar queries do banco
- [ ] Adicionar cache para estatísticas

---

## ⏰ **CRONOGRAMA DETALHADO**

### **Dia 1 - Manhã (4 horas)**
- **09:00-10:30**: Implementar Fase 1 - Tarefas 1.1 e 1.2
- **10:30-10:45**: Coffee break
- **10:45-12:00**: Implementar Fase 1 - Tarefas 1.3 (estatísticas e listagem)
- **12:00-13:00**: Almoço

### **Dia 1 - Tarde (4 horas)**
- **13:00-14:30**: Implementar Fase 1 - Tarefas 1.3 (grant e search)
- **14:30-15:00**: Implementar Fase 1 - Tarefa 1.4
- **15:00-15:15**: Coffee break
- **15:15-17:00**: Executar Fase 2 - Testes e validações

### **Dia 2 - Manhã (2-3 horas - opcional)**
- **09:00-10:30**: Implementar Fase 3 - Melhorias
- **10:30-11:00**: Documentação final
- **11:00-12:00**: Testes finais e deploy

---

## 🎯 **CRITÉRIOS DE SUCESSO**

### **Obrigatórios (Fase 1)**
1. ✅ Todas as 6 APIs funcionando
2. ✅ Autenticação admin operacional
3. ✅ Validações básicas implementadas
4. ✅ Logs básicos funcionando
5. ✅ Testes manuais passando

### **Desejáveis (Fase 2)**
1. ✅ Testes automatizados criados
2. ✅ Tratamento de erros robusto
3. ✅ Performance adequada
4. ✅ Documentação atualizada

### **Opcionais (Fase 3)**
1. ✅ Sistema de logs avançado
2. ✅ Rate limiting específico
3. ✅ Monitoramento implementado
4. ✅ Cache de estatísticas

---

## 🚨 **RISCOS E MITIGAÇÕES**

### **Risco Alto: Funções PostgreSQL não existem**
- **Mitigação**: Executar scripts de migração primeiro
- **Tempo**: +2 horas se necessário recriar

### **Risco Médio: Conflitos no server.js**
- **Mitigação**: Fazer backup antes das modificações
- **Tempo**: +1 hora para resolver conflitos

### **Risco Baixo: Performance das queries**
- **Mitigação**: Índices já criados, otimizar se necessário
- **Tempo**: +30 min para otimizações

---

## 📞 **PONTOS DE CONTATO**

### **Antes de Começar**
1. Confirmar que o servidor está rodando
2. Testar acesso ao banco de dados
3. Verificar se as funções PostgreSQL existem
4. Fazer backup do server.js atual

### **Durante a Implementação**
1. Testar cada endpoint após implementar
2. Verificar logs no console
3. Validar responses com Postman/cURL
4. Monitorar performance do banco

### **Após Conclusão**
1. Executar suite completa de testes
2. Documentar endpoints para frontend
3. Atualizar variáveis de ambiente se necessário
4. Deploy em staging para validação

---

## 🎉 **RESULTADO ESPERADO**

Após a conclusão deste plano:

✅ **Backend 100% Funcional**
- 6 APIs REST operacionais
- Autenticação robusta
- Validações completas
- Logs de auditoria

✅ **Pronto para Frontend**
- Endpoints documentados
- Responses padronizados
- Tratamento de erros
- Performance otimizada

✅ **Sistema Completo**
- Dashboard de estatísticas
- Gestão de usuários
- Liberação de créditos
- Histórico completo

**Tempo Total: 6-8 horas de desenvolvimento**
**Status Final: Sistema de Crédito Teste 100% operacional** 🚀

# 🧪 SCRIPTS DE MIGRAÇÃO E TESTES

## 📦 **SCRIPTS DE MIGRAÇÃO SQL**

### **Migration 001: Criação das Tabelas Base**
```sql
-- ============================================================================
-- MIGRATION: 001_create_credits_system
-- Description: Criação do sistema completo de créditos e cupons
-- Author: CoinBitClub Team
-- Date: 2024-07-26
-- ============================================================================

-- Verificar se as tabelas já existem
SET @exist_adjustments = (
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'user_balance_adjustments'
);

SET @exist_coupons = (
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'credit_coupons'
);

SET @exist_usage = (
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'coupon_usage_history'
);

-- Criar tabela de ajustes de saldo
SET @sql = IF(@exist_adjustments = 0, 
    'CREATE TABLE user_balance_adjustments (
        id                  VARCHAR(50) PRIMARY KEY,
        user_id            VARCHAR(50) NOT NULL,
        amount             DECIMAL(18, 8) NOT NULL,
        type               ENUM(''manual_credit'', ''manual_debit'', ''coupon_credit'') NOT NULL,
        description        TEXT NOT NULL,
        is_withdrawable    BOOLEAN DEFAULT FALSE,
        status             ENUM(''pending'', ''approved'', ''rejected'') DEFAULT ''approved'',
        reference_id       VARCHAR(100),
        processed_by       VARCHAR(50) NOT NULL,
        processed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_type (type),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_processed_by (processed_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT "Table user_balance_adjustments already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar tabela de cupons
SET @sql = IF(@exist_coupons = 0, 
    'CREATE TABLE credit_coupons (
        id                 VARCHAR(50) PRIMARY KEY,
        code               VARCHAR(20) UNIQUE NOT NULL,
        amount             DECIMAL(18, 8) NOT NULL,
        currency           VARCHAR(10) DEFAULT ''USD'',
        description        TEXT NOT NULL,
        type               ENUM(''single_use'', ''multi_use'', ''unlimited'') DEFAULT ''single_use'',
        usage_limit        INT NULL,
        usage_count        INT DEFAULT 0,
        is_active          BOOLEAN DEFAULT TRUE,
        is_withdrawable    BOOLEAN DEFAULT FALSE,
        expires_at         TIMESTAMP NULL,
        created_by         VARCHAR(50) NOT NULL,
        created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_code (code),
        INDEX idx_is_active (is_active),
        INDEX idx_expires_at (expires_at),
        INDEX idx_created_by (created_by),
        INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT "Table credit_coupons already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar tabela de histórico de uso
SET @sql = IF(@exist_usage = 0, 
    'CREATE TABLE coupon_usage_history (
        id                 VARCHAR(50) PRIMARY KEY,
        coupon_id          VARCHAR(50) NOT NULL,
        coupon_code        VARCHAR(20) NOT NULL,
        user_id            VARCHAR(50) NOT NULL,
        amount             DECIMAL(18, 8) NOT NULL,
        currency           VARCHAR(10) DEFAULT ''USD'',
        is_withdrawable    BOOLEAN DEFAULT FALSE,
        adjustment_id      VARCHAR(50),
        used_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_coupon_id (coupon_id),
        INDEX idx_user_id (user_id),
        INDEX idx_used_at (used_at),
        INDEX idx_coupon_code (coupon_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT "Table coupon_usage_history already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

### **Migration 002: Atualização da Tabela Users**
```sql
-- ============================================================================
-- MIGRATION: 002_update_users_balance_columns
-- Description: Adiciona colunas de saldo sacável/não-sacável
-- ============================================================================

-- Verificar se as colunas já existem
SET @withdrawable_exists = (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'users' 
    AND column_name = 'withdrawable_balance'
);

SET @non_withdrawable_exists = (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'users' 
    AND column_name = 'non_withdrawable_balance'
);

-- Adicionar coluna withdrawable_balance
SET @sql = IF(@withdrawable_exists = 0, 
    'ALTER TABLE users ADD COLUMN withdrawable_balance DECIMAL(18, 8) DEFAULT 0',
    'SELECT "Column withdrawable_balance already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar coluna non_withdrawable_balance
SET @sql = IF(@non_withdrawable_exists = 0, 
    'ALTER TABLE users ADD COLUMN non_withdrawable_balance DECIMAL(18, 8) DEFAULT 0',
    'SELECT "Column non_withdrawable_balance already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar saldos existentes para withdrawable_balance
UPDATE users 
SET withdrawable_balance = COALESCE(balance, 0), 
    non_withdrawable_balance = 0 
WHERE withdrawable_balance = 0 AND balance IS NOT NULL;

-- Adicionar índices
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_withdrawable_balance (withdrawable_balance);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_non_withdrawable_balance (non_withdrawable_balance);
```

### **Migration 003: Foreign Keys e Constraints**
```sql
-- ============================================================================
-- MIGRATION: 003_add_foreign_keys_constraints
-- Description: Adiciona foreign keys e constraints de segurança
-- ============================================================================

-- Verificar se users existe antes de criar foreign keys
SET @users_exists = (
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'users'
);

-- Adicionar foreign keys apenas se a tabela users existir
SET @sql = IF(@users_exists > 0, 
    'ALTER TABLE user_balance_adjustments 
     ADD CONSTRAINT fk_adjustments_user_id 
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
    'SELECT "Users table not found, skipping foreign key" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@users_exists > 0, 
    'ALTER TABLE coupon_usage_history 
     ADD CONSTRAINT fk_usage_user_id 
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
    'SELECT "Users table not found, skipping foreign key" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Foreign key entre usage e coupons
ALTER TABLE coupon_usage_history 
ADD CONSTRAINT fk_usage_coupon_id 
FOREIGN KEY (coupon_id) REFERENCES credit_coupons(id) ON DELETE CASCADE;

-- Foreign key entre usage e adjustments
ALTER TABLE coupon_usage_history 
ADD CONSTRAINT fk_usage_adjustment_id 
FOREIGN KEY (adjustment_id) REFERENCES user_balance_adjustments(id) ON DELETE SET NULL;

-- Constraints de validação
ALTER TABLE user_balance_adjustments 
ADD CONSTRAINT chk_amount_not_zero CHECK (amount != 0);

ALTER TABLE credit_coupons 
ADD CONSTRAINT chk_coupon_amount_positive CHECK (amount > 0);

ALTER TABLE credit_coupons 
ADD CONSTRAINT chk_usage_limit_positive CHECK (usage_limit IS NULL OR usage_limit > 0);

ALTER TABLE credit_coupons 
ADD CONSTRAINT chk_usage_count_non_negative CHECK (usage_count >= 0);
```

---

## 🧪 **SCRIPTS DE TESTE E DADOS MOCK**

### **Script: Dados de Teste**
```sql
-- ============================================================================
-- TEST DATA: Dados para desenvolvimento e testes
-- ============================================================================

-- Limpar dados de teste existentes
DELETE FROM coupon_usage_history WHERE coupon_code LIKE 'TEST%';
DELETE FROM credit_coupons WHERE code LIKE 'TEST%';
DELETE FROM user_balance_adjustments WHERE description LIKE '%TESTE%';

-- Criar cupons de teste
INSERT INTO credit_coupons (
    id, code, amount, currency, description, type, usage_limit, created_by
) VALUES 
('cpn_test_001', 'TEST50USD', 50.00, 'USD', 'Cupom de teste - $50 USD', 'single_use', 1, 'admin_test'),
('cpn_test_002', 'TEST100BRL', 100.00, 'BRL', 'Cupom de teste - R$100 BRL', 'multi_use', 5, 'admin_test'),
('cpn_test_003', 'TESTUNLIMITED', 25.00, 'USD', 'Cupom ilimitado - $25 USD', 'unlimited', NULL, 'admin_test'),
('cpn_test_004', 'TESTEXPIRED', 75.00, 'USD', 'Cupom expirado - teste', 'single_use', 1, 'admin_test');

-- Definir cupom como expirado
UPDATE credit_coupons 
SET expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY) 
WHERE code = 'TESTEXPIRED';

-- Criar ajustes de teste (assumindo que existe um usuário de teste)
INSERT INTO user_balance_adjustments (
    id, user_id, amount, type, description, processed_by
) VALUES 
('adj_test_001', 'user_test_001', 100.00, 'manual_credit', 'Crédito manual de TESTE', 'admin_test'),
('adj_test_002', 'user_test_001', -25.00, 'manual_debit', 'Débito manual de TESTE', 'admin_test'),
('adj_test_003', 'user_test_002', 50.00, 'coupon_credit', 'Crédito via cupom TESTE', 'system');

-- Mostrar dados criados
SELECT 'CUPONS CRIADOS:' as info;
SELECT code, amount, currency, description, type, usage_limit, is_active 
FROM credit_coupons 
WHERE code LIKE 'TEST%';

SELECT 'AJUSTES CRIADOS:' as info;
SELECT id, user_id, amount, type, description 
FROM user_balance_adjustments 
WHERE description LIKE '%TESTE%';
```

---

## 🔍 **SCRIPTS DE VALIDAÇÃO**

### **Validação da Integridade dos Dados**
```sql
-- ============================================================================
-- VALIDATION: Scripts para validar integridade do sistema
-- ============================================================================

-- 1. Verificar inconsistências entre usage_count e histórico real
SELECT 
    c.code,
    c.usage_count as recorded_count,
    COUNT(h.id) as actual_count,
    (c.usage_count - COUNT(h.id)) as difference
FROM credit_coupons c
LEFT JOIN coupon_usage_history h ON c.id = h.coupon_id
GROUP BY c.id, c.code, c.usage_count
HAVING difference != 0;

-- 2. Verificar cupons expirados ainda ativos
SELECT code, expires_at, is_active
FROM credit_coupons 
WHERE expires_at < NOW() AND is_active = TRUE;

-- 3. Verificar cupons esgotados ainda ativos
SELECT code, usage_limit, usage_count, is_active
FROM credit_coupons 
WHERE usage_limit IS NOT NULL 
AND usage_count >= usage_limit 
AND is_active = TRUE;

-- 4. Verificar saldos negativos (não deveria acontecer)
SELECT id, withdrawable_balance, non_withdrawable_balance
FROM users 
WHERE withdrawable_balance < 0 OR non_withdrawable_balance < 0;

-- 5. Verificar ajustes órfãos (sem usuário válido)
SELECT a.id, a.user_id, a.amount, a.type
FROM user_balance_adjustments a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL;

-- 6. Verificar uso de cupons órfãos
SELECT h.id, h.coupon_code, h.user_id
FROM coupon_usage_history h
LEFT JOIN credit_coupons c ON h.coupon_id = c.id
WHERE c.id IS NULL;
```

### **Script de Correção Automática**
```sql
-- ============================================================================
-- AUTO-FIX: Scripts para corrigir problemas comuns
-- ============================================================================

-- Corrigir cupons expirados
UPDATE credit_coupons 
SET is_active = FALSE 
WHERE expires_at < NOW() AND is_active = TRUE;

-- Corrigir cupons esgotados
UPDATE credit_coupons 
SET is_active = FALSE 
WHERE usage_limit IS NOT NULL 
AND usage_count >= usage_limit 
AND is_active = TRUE;

-- Corrigir usage_count inconsistente
UPDATE credit_coupons c
SET usage_count = (
    SELECT COUNT(*) 
    FROM coupon_usage_history h 
    WHERE h.coupon_id = c.id
);

-- Mostrar correções aplicadas
SELECT 
    'Cupons desativados por expiração' as action,
    COUNT(*) as count
FROM credit_coupons 
WHERE expires_at < NOW() AND is_active = FALSE
UNION ALL
SELECT 
    'Cupons desativados por esgotamento' as action,
    COUNT(*) as count
FROM credit_coupons 
WHERE usage_limit IS NOT NULL 
AND usage_count >= usage_limit 
AND is_active = FALSE;
```

---

## 🎯 **TESTES FUNCIONAIS**

### **Teste 1: Fluxo Completo de Cupom**
```javascript
// test/coupon-flow.test.js
const request = require('supertest');
const app = require('../app');

describe('Fluxo Completo de Cupons', () => {
    let adminToken, userToken, couponCode;

    beforeAll(async () => {
        // Setup: obter tokens de autenticação
        adminToken = await getAdminToken();
        userToken = await getUserToken();
    });

    test('1. Admin cria cupom', async () => {
        const response = await request(app)
            .post('/api/admin/create-coupon')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                code: 'TESTFLOW123',
                amount: 25.00,
                currency: 'USD',
                description: 'Teste de fluxo completo',
                type: 'single_use'
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.coupon.code).toBe('TESTFLOW123');
        couponCode = response.body.coupon.code;
    });

    test('2. Usuário valida cupom', async () => {
        const response = await request(app)
            .post('/api/coupons/validate')
            .send({ code: couponCode });

        expect(response.status).toBe(200);
        expect(response.body.valid).toBe(true);
        expect(response.body.coupon.amount).toBe(25.00);
    });

    test('3. Usuário aplica cupom', async () => {
        const response = await request(app)
            .put('/api/coupons/validate')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ 
                code: couponCode,
                userId: 'user_test_001'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.credit_added).toBe(25.00);
        expect(response.body.is_withdrawable).toBe(false);
    });

    test('4. Usuário tenta usar cupom novamente (deve falhar)', async () => {
        const response = await request(app)
            .put('/api/coupons/validate')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ 
                code: couponCode,
                userId: 'user_test_001'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('já foi utilizado');
    });
});
```

### **Teste 2: Validações de Saldo**
```javascript
// test/balance-validations.test.js
describe('Validações de Saldo', () => {
    test('Saque deve respeitar apenas withdrawable_balance', async () => {
        // Usuário com $100 withdrawable + $50 non-withdrawable
        const userId = 'user_balance_test';
        
        // Tentar sacar $120 (deve falhar)
        const response = await request(app)
            .post('/api/user/withdraw')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                amount: 120.00,
                method: 'bank_transfer'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Saldo insuficiente');
        expect(response.body.available_for_withdrawal).toBe(100.00);
    });

    test('Operação deve usar total_balance', async () => {
        // Tentar operação de $140 (deve funcionar com $150 total)
        const response = await request(app)
            .post('/api/user/trading/create-operation')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                amount: 140.00,
                symbol: 'BTCUSDT',
                side: 'LONG'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
```

---

## 📊 **RELATÓRIOS E MONITORAMENTO**

### **Script: Relatório Diário**
```sql
-- ============================================================================
-- DAILY REPORT: Relatório diário do sistema de créditos
-- ============================================================================

SELECT 
    DATE(created_at) as date,
    'CUPONS CRIADOS' as metric,
    COUNT(*) as value,
    CONCAT('$', FORMAT(SUM(amount), 2)) as total_value
FROM credit_coupons 
WHERE DATE(created_at) = CURDATE()
GROUP BY DATE(created_at)

UNION ALL

SELECT 
    DATE(used_at) as date,
    'CUPONS UTILIZADOS' as metric,
    COUNT(*) as value,
    CONCAT('$', FORMAT(SUM(amount), 2)) as total_value
FROM coupon_usage_history 
WHERE DATE(used_at) = CURDATE()
GROUP BY DATE(used_at)

UNION ALL

SELECT 
    DATE(created_at) as date,
    'AJUSTES MANUAIS' as metric,
    COUNT(*) as value,
    CONCAT('$', FORMAT(SUM(ABS(amount)), 2)) as total_value
FROM user_balance_adjustments 
WHERE DATE(created_at) = CURDATE()
AND type IN ('manual_credit', 'manual_debit')
GROUP BY DATE(created_at);
```

### **Script: Top Usuários com Créditos**
```sql
-- Top 10 usuários com mais créditos não sacáveis
SELECT 
    u.id,
    u.email,
    u.non_withdrawable_balance,
    COUNT(DISTINCT a.id) as manual_adjustments,
    COUNT(DISTINCT h.id) as coupon_uses,
    u.created_at as user_since
FROM users u
LEFT JOIN user_balance_adjustments a ON u.id = a.user_id AND a.type LIKE 'manual%'
LEFT JOIN coupon_usage_history h ON u.id = h.user_id
WHERE u.non_withdrawable_balance > 0
GROUP BY u.id, u.email, u.non_withdrawable_balance, u.created_at
ORDER BY u.non_withdrawable_balance DESC
LIMIT 10;
```

---

**✅ Todos os scripts estão prontos para implementação e teste!**

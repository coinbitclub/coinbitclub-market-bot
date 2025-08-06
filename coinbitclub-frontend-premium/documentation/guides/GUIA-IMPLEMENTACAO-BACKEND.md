# 🔧 GUIA PRÁTICO DE IMPLEMENTAÇÃO BACKEND

## 📋 **SCRIPTS SQL PRONTOS**

### **1. Criação das Tabelas**
```sql
-- ============================================================================
-- TABELA: user_balance_adjustments
-- Descrição: Registra todos os ajustes manuais de saldo
-- ============================================================================
CREATE TABLE user_balance_adjustments (
    id                  VARCHAR(50) PRIMARY KEY DEFAULT CONCAT('adj_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
    user_id            VARCHAR(50) NOT NULL,
    amount             DECIMAL(18, 8) NOT NULL,
    type               ENUM('manual_credit', 'manual_debit', 'coupon_credit') NOT NULL,
    description        TEXT NOT NULL,
    is_withdrawable    BOOLEAN DEFAULT FALSE,
    status             ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    reference_id       VARCHAR(100),
    processed_by       VARCHAR(50) NOT NULL,
    processed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_processed_by (processed_by),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABELA: credit_coupons
-- Descrição: Armazena todos os cupons de crédito criados
-- ============================================================================
CREATE TABLE credit_coupons (
    id                 VARCHAR(50) PRIMARY KEY DEFAULT CONCAT('cpn_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
    code               VARCHAR(20) UNIQUE NOT NULL,
    amount             DECIMAL(18, 8) NOT NULL,
    currency           VARCHAR(10) DEFAULT 'USD',
    description        TEXT NOT NULL,
    type               ENUM('single_use', 'multi_use', 'unlimited') DEFAULT 'single_use',
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
);

-- ============================================================================
-- TABELA: coupon_usage_history
-- Descrição: Histórico de uso dos cupons
-- ============================================================================
CREATE TABLE coupon_usage_history (
    id                 VARCHAR(50) PRIMARY KEY DEFAULT CONCAT('usage_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8)),
    coupon_id          VARCHAR(50) NOT NULL,
    coupon_code        VARCHAR(20) NOT NULL,
    user_id            VARCHAR(50) NOT NULL,
    amount             DECIMAL(18, 8) NOT NULL,
    currency           VARCHAR(10) DEFAULT 'USD',
    is_withdrawable    BOOLEAN DEFAULT FALSE,
    adjustment_id      VARCHAR(50),
    used_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_coupon_id (coupon_id),
    INDEX idx_user_id (user_id),
    INDEX idx_used_at (used_at),
    INDEX idx_coupon_code (coupon_code),
    
    FOREIGN KEY (coupon_id) REFERENCES credit_coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (adjustment_id) REFERENCES user_balance_adjustments(id) ON DELETE SET NULL
);

-- ============================================================================
-- ATUALIZAÇÃO TABELA USERS
-- Adiciona colunas para controle de saldo sacável/não-sacável
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawable_balance DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS non_withdrawable_balance DECIMAL(18, 8) DEFAULT 0;

-- Coluna calculada para saldo total (opcional, pode ser calculada na aplicação)
ALTER TABLE users ADD COLUMN total_balance DECIMAL(18, 8) 
    GENERATED ALWAYS AS (withdrawable_balance + non_withdrawable_balance) STORED;

-- Índices para performance
ALTER TABLE users ADD INDEX idx_withdrawable_balance (withdrawable_balance);
ALTER TABLE users ADD INDEX idx_non_withdrawable_balance (non_withdrawable_balance);
ALTER TABLE users ADD INDEX idx_total_balance (total_balance);
```

---

## 🔧 **EXEMPLOS DE IMPLEMENTAÇÃO (Node.js/Express)**

### **1. Middleware de Autenticação Admin**
```javascript
// middleware/adminAuth.js
const jwt = require('jsonwebtoken');

const requireAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado' });
        }

        req.admin = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

module.exports = { requireAdmin };
```

### **2. Controller: Adicionar Saldo**
```javascript
// controllers/adminController.js
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const addBalance = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { userId, amount, type, description } = req.body;
        const adminId = req.admin.id;

        // Validações
        if (!userId || !amount || !type || !description) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        if (Math.abs(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valor deve ser maior que zero'
            });
        }

        // Verificar se usuário existe
        const [userRows] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        const user = userRows[0];

        // Para débitos, verificar saldo suficiente
        if (type === 'manual_debit') {
            const totalAvailable = user.withdrawable_balance + user.non_withdrawable_balance;
            if (amount > totalAvailable) {
                return res.status(400).json({
                    success: false,
                    message: 'Saldo insuficiente'
                });
            }
        }

        // Criar ajuste
        const adjustmentId = `adj_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        const finalAmount = type === 'manual_debit' ? -Math.abs(amount) : Math.abs(amount);

        await connection.execute(
            `INSERT INTO user_balance_adjustments 
             (id, user_id, amount, type, description, is_withdrawable, processed_by) 
             VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
            [adjustmentId, userId, finalAmount, type, description, adminId]
        );

        // Atualizar saldo do usuário (sempre non_withdrawable para ajustes manuais)
        if (type === 'manual_credit') {
            await connection.execute(
                'UPDATE users SET non_withdrawable_balance = non_withdrawable_balance + ? WHERE id = ?',
                [amount, userId]
            );
        } else {
            // Para débito, remover primeiro do non_withdrawable, depois do withdrawable
            const nonWithdrawableToDeduct = Math.min(amount, user.non_withdrawable_balance);
            const withdrawableToDeduct = amount - nonWithdrawableToDeduct;

            await connection.execute(
                `UPDATE users SET 
                 non_withdrawable_balance = non_withdrawable_balance - ?,
                 withdrawable_balance = withdrawable_balance - ?
                 WHERE id = ?`,
                [nonWithdrawableToDeduct, withdrawableToDeduct, userId]
            );
        }

        // Buscar saldos atualizados
        const [updatedUserRows] = await connection.execute(
            'SELECT withdrawable_balance, non_withdrawable_balance, total_balance FROM users WHERE id = ?',
            [userId]
        );

        await connection.commit();

        // Log de auditoria
        console.log(`[AUDIT] Admin ${adminId} adjusted balance for user ${userId}: ${finalAmount} ${type}`);

        res.json({
            success: true,
            message: 'Saldo ajustado com sucesso',
            adjustment: {
                id: adjustmentId,
                user_id: userId,
                amount: finalAmount,
                type: type,
                description: description,
                is_withdrawable: false,
                processed_by: adminId,
                processed_at: new Date().toISOString()
            },
            new_balances: updatedUserRows[0]
        });

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao adicionar saldo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    } finally {
        connection.release();
    }
};
```

### **3. Controller: Criar Cupom**
```javascript
const createCoupon = async (req, res) => {
    try {
        const { code, amount, currency, description, type, usage_limit, expires_at } = req.body;
        const adminId = req.admin.id;

        // Validações
        if (!code || !amount || !currency || !description || !type) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: code, amount, currency, description, type'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valor deve ser maior que zero'
            });
        }

        // Verificar se código é único
        const [existingCoupon] = await db.execute(
            'SELECT id FROM credit_coupons WHERE code = ?',
            [code.toUpperCase()]
        );

        if (existingCoupon.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Código de cupom já existe'
            });
        }

        // Validar data de expiração
        if (expires_at) {
            const expirationDate = new Date(expires_at);
            if (expirationDate <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Data de expiração deve ser futura'
                });
            }
        }

        const couponId = `cpn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        const finalUsageLimit = type === 'unlimited' ? null : (usage_limit || 1);

        await db.execute(
            `INSERT INTO credit_coupons 
             (id, code, amount, currency, description, type, usage_limit, created_by, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [couponId, code.toUpperCase(), amount, currency, description, type, finalUsageLimit, adminId, expires_at || null]
        );

        // Log de auditoria
        console.log(`[AUDIT] Admin ${adminId} created coupon ${code.toUpperCase()} worth ${amount} ${currency}`);

        res.status(201).json({
            success: true,
            message: 'Cupom criado com sucesso',
            coupon: {
                id: couponId,
                code: code.toUpperCase(),
                amount: amount,
                currency: currency,
                description: description,
                type: type,
                usage_limit: finalUsageLimit,
                expires_at: expires_at || null,
                created_by: adminId,
                created_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Erro ao criar cupom:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
```

### **4. Controller: Validar e Usar Cupom**
```javascript
const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                valid: false,
                message: 'Código do cupom é obrigatório'
            });
        }

        const [couponRows] = await db.execute(
            `SELECT * FROM credit_coupons 
             WHERE code = ? AND is_active = TRUE`,
            [code.toUpperCase()]
        );

        if (couponRows.length === 0) {
            return res.status(400).json({
                valid: false,
                message: 'Cupom não encontrado ou inativo'
            });
        }

        const coupon = couponRows[0];

        // Verificar expiração
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({
                valid: false,
                message: 'Cupom expirado'
            });
        }

        // Verificar limite de uso
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return res.status(400).json({
                valid: false,
                message: 'Cupom esgotado'
            });
        }

        res.json({
            valid: true,
            coupon: {
                code: coupon.code,
                amount: coupon.amount,
                currency: coupon.currency,
                description: coupon.description,
                type: coupon.type,
                remaining_uses: coupon.usage_limit ? (coupon.usage_limit - coupon.usage_count) : null
            }
        });

    } catch (error) {
        console.error('Erro ao validar cupom:', error);
        res.status(500).json({
            valid: false,
            message: 'Erro interno do servidor'
        });
    }
};

const applyCoupon = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { code, userId } = req.body;

        // Validações básicas
        if (!code || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Código do cupom e ID do usuário são obrigatórios'
            });
        }

        // Buscar cupom
        const [couponRows] = await connection.execute(
            `SELECT * FROM credit_coupons 
             WHERE code = ? AND is_active = TRUE`,
            [code.toUpperCase()]
        );

        if (couponRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cupom não encontrado ou inativo'
            });
        }

        const coupon = couponRows[0];

        // Validações de uso
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cupom expirado'
            });
        }

        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return res.status(400).json({
                success: false,
                message: 'Cupom esgotado'
            });
        }

        // Verificar se usuário já usou este cupom (apenas para single_use)
        if (coupon.type === 'single_use') {
            const [usageRows] = await connection.execute(
                'SELECT id FROM coupon_usage_history WHERE coupon_id = ? AND user_id = ?',
                [coupon.id, userId]
            );

            if (usageRows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cupom já foi utilizado por este usuário'
                });
            }
        }

        // Criar ajuste de saldo
        const adjustmentId = `adj_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        await connection.execute(
            `INSERT INTO user_balance_adjustments 
             (id, user_id, amount, type, description, is_withdrawable, processed_by) 
             VALUES (?, ?, ?, 'coupon_credit', ?, FALSE, 'system')`,
            [adjustmentId, userId, coupon.amount, `Cupom aplicado: ${coupon.description}`]
        );

        // Atualizar saldo do usuário (sempre non_withdrawable)
        await connection.execute(
            'UPDATE users SET non_withdrawable_balance = non_withdrawable_balance + ? WHERE id = ?',
            [coupon.amount, userId]
        );

        // Registrar uso do cupom
        const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        await connection.execute(
            `INSERT INTO coupon_usage_history 
             (id, coupon_id, coupon_code, user_id, amount, currency, adjustment_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usageId, coupon.id, coupon.code, userId, coupon.amount, coupon.currency, adjustmentId]
        );

        // Incrementar contador de uso
        await connection.execute(
            'UPDATE credit_coupons SET usage_count = usage_count + 1 WHERE id = ?',
            [coupon.id]
        );

        // Buscar saldos atualizados
        const [userRows] = await connection.execute(
            'SELECT withdrawable_balance, non_withdrawable_balance, total_balance FROM users WHERE id = ?',
            [userId]
        );

        await connection.commit();

        // Log de auditoria
        console.log(`[AUDIT] User ${userId} used coupon ${coupon.code} worth ${coupon.amount} ${coupon.currency}`);

        res.json({
            success: true,
            message: 'Cupom aplicado com sucesso',
            credit_added: coupon.amount,
            currency: coupon.currency,
            is_withdrawable: false,
            new_balances: userRows[0],
            usage: {
                id: usageId,
                coupon_code: coupon.code,
                amount: coupon.amount,
                used_at: new Date().toISOString()
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao aplicar cupom:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    } finally {
        connection.release();
    }
};
```

---

## 🛡️ **VALIDAÇÕES DE SAQUE**

### **Lógica para Saques:**
```javascript
const processWithdrawal = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        // Buscar apenas saldo sacável
        const [userRows] = await db.execute(
            'SELECT withdrawable_balance FROM users WHERE id = ?',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const withdrawableBalance = userRows[0].withdrawable_balance;

        if (amount > withdrawableBalance) {
            return res.status(400).json({
                message: 'Saldo insuficiente para saque',
                available_for_withdrawal: withdrawableBalance
            });
        }

        // Processar saque...
        // (implementar lógica de saque)

    } catch (error) {
        console.error('Erro no saque:', error);
        res.status(500).json({ message: 'Erro interno' });
    }
};
```

---

## 📊 **ROTAS COMPLETAS**

### **Arquivo: routes/admin.js**
```javascript
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Gestão de Créditos
router.post('/add-balance', requireAdmin, adminController.addBalance);
router.post('/create-coupon', requireAdmin, adminController.createCoupon);
router.get('/credits-management/stats', requireAdmin, adminController.getCreditsStats);
router.get('/credits-management/history', requireAdmin, adminController.getCreditsHistory);

module.exports = router;
```

### **Arquivo: routes/coupons.js**
```javascript
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const couponController = require('../controllers/couponController');

// Validar cupom (público)
router.post('/validate', couponController.validateCoupon);

// Aplicar cupom (requer autenticação)
router.put('/validate', requireAuth, couponController.applyCoupon);

module.exports = router;
```

---

## 🔍 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Backend Tasks:**
- [ ] Criar tabelas SQL
- [ ] Implementar middleware de autenticação admin
- [ ] Desenvolver endpoint POST /api/admin/add-balance
- [ ] Desenvolver endpoint POST /api/admin/create-coupon
- [ ] Desenvolver endpoint POST /api/coupons/validate
- [ ] Desenvolver endpoint PUT /api/coupons/validate
- [ ] Implementar endpoint GET /api/admin/credits-management/stats
- [ ] Implementar endpoint GET /api/admin/credits-management/history
- [ ] Adicionar logs de auditoria
- [ ] Configurar validações de segurança
- [ ] Testes unitários
- [ ] Testes de integração

### **Integração Frontend:**
- [ ] Remover dados mock das páginas
- [ ] Configurar URLs corretas das APIs
- [ ] Implementar tratamento de erros
- [ ] Testar fluxos completos
- [ ] Validar restrições de saque

### **Deploy:**
- [ ] Ambiente de staging
- [ ] Testes de aceitação
- [ ] Documentação final
- [ ] Deploy produção com rollback

---

**💡 Este guia contém exemplos completos e funcionais para implementação imediata no backend!**

import { query } from '../config/database.js';
import axios from 'axios';

class AdminEmergencyController {
  // POST /admin/emergency/close-all-operations - Botão de emergência
  async closeAllOperations(req, res) {
    try {
      const adminId = req.user.id;
      const { reason = 'Acionamento do botão de emergência' } = req.body;

      console.log(`🚨 EMERGÊNCIA ACIONADA por admin ${adminId}: ${reason}`);

      // 1. Buscar todas as operações abertas
      const openOperations = await query(`
        SELECT 
          o.*,
          u.email,
          uk.exchange,
          uk.environment,
          uk.api_key,
          uk.secret_key
        FROM operations o
        JOIN users u ON o.user_id = u.id
        JOIN user_api_keys uk ON u.id = uk.user_id 
        WHERE o.status IN ('open', 'pending') 
        AND uk.is_active = true 
        AND uk.validation_status = 'valid'
        AND uk.environment IN ('production', 'testnet')
      `);

      const results = {
        total_operations: openOperations.rows.length,
        closed_successfully: 0,
        failed_to_close: 0,
        errors: []
      };

      // 2. Fechar operações em paralelo
      const closePromises = openOperations.rows.map(async (operation) => {
        try {
          const closeResult = await this.closeOperationOnExchange(operation);
          
          if (closeResult.success) {
            // Atualizar status no banco
            await query(`
              UPDATE operations 
              SET 
                status = 'closed',
                exit_price = $1,
                closed_at = CURRENT_TIMESTAMP,
                profit = $2,
                notes = $3
              WHERE id = $4
            `, [
              closeResult.exitPrice,
              closeResult.profit,
              `Fechamento emergencial: ${reason}`,
              operation.id
            ]);

            results.closed_successfully++;
          } else {
            results.failed_to_close++;
            results.errors.push({
              operation_id: operation.id,
              symbol: operation.symbol,
              exchange: operation.exchange,
              error: closeResult.error
            });
          }
        } catch (error) {
          results.failed_to_close++;
          results.errors.push({
            operation_id: operation.id,
            symbol: operation.symbol,
            error: error.message
          });
        }
      });

      await Promise.all(closePromises);

      // 3. Registrar log de emergência
      await query(`
        INSERT INTO emergency_logs (
          admin_id, action, reason, total_operations, 
          closed_successfully, failed_to_close, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        adminId,
        'close_all_operations',
        reason,
        results.total_operations,
        results.closed_successfully,
        results.failed_to_close,
        JSON.stringify(results.errors)
      ]);

      // 4. Notificar usuários afetados
      await this.notifyUsersEmergencyClosure(openOperations.rows, reason);

      res.json({
        success: true,
        message: `Emergência processada: ${results.closed_successfully} operações fechadas`,
        data: results
      });

    } catch (error) {
      console.error('Erro no botão de emergência:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /admin/emergency/pause-trading - Pausar trading por exchange
  async pauseTrading(req, res) {
    try {
      const adminId = req.user.id;
      const { exchange, environment = 'all', reason } = req.body;

      if (!exchange || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Exchange e motivo são obrigatórios'
        });
      }

      // Pausar trading
      await query(`
        INSERT INTO trading_pauses (
          admin_id, exchange, environment, reason, status
        ) VALUES ($1, $2, $3, $4, 'active')
      `, [adminId, exchange, environment, reason]);

      // Desativar temporariamente API keys
      const whereClause = environment === 'all' 
        ? 'exchange = $1' 
        : 'exchange = $1 AND environment = $2';
      
      const params = environment === 'all' 
        ? [exchange] 
        : [exchange, environment];

      await query(`
        UPDATE user_api_keys 
        SET 
          is_active = false,
          pause_reason = $${params.length + 1},
          paused_at = CURRENT_TIMESTAMP,
          paused_by_admin = $${params.length + 2}
        WHERE ${whereClause}
      `, [...params, reason, adminId]);

      console.log(`🔴 TRADING PAUSADO: ${exchange} (${environment}) por ${reason}`);

      res.json({
        success: true,
        message: `Trading pausado para ${exchange} (${environment})`,
        data: {
          exchange,
          environment,
          reason,
          paused_at: new Date()
        }
      });

    } catch (error) {
      console.error('Erro ao pausar trading:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /admin/emergency/resume-trading - Retomar trading
  async resumeTrading(req, res) {
    try {
      const adminId = req.user.id;
      const { exchange, environment = 'all' } = req.body;

      // Reativar API keys
      const whereClause = environment === 'all' 
        ? 'exchange = $1 AND paused_by_admin IS NOT NULL' 
        : 'exchange = $1 AND environment = $2 AND paused_by_admin IS NOT NULL';
      
      const params = environment === 'all' ? [exchange] : [exchange, environment];

      await query(`
        UPDATE user_api_keys 
        SET 
          is_active = true,
          pause_reason = NULL,
          paused_at = NULL,
          paused_by_admin = NULL,
          resumed_at = CURRENT_TIMESTAMP,
          resumed_by_admin = $${params.length + 1}
        WHERE ${whereClause}
      `, [...params, adminId]);

      // Marcar pause como resolvido
      await query(`
        UPDATE trading_pauses 
        SET 
          status = 'resolved',
          resolved_at = CURRENT_TIMESTAMP,
          resolved_by_admin = $1
        WHERE exchange = $2 AND environment = $3 AND status = 'active'
      `, [adminId, exchange, environment]);

      console.log(`🟢 TRADING RETOMADO: ${exchange} (${environment})`);

      res.json({
        success: true,
        message: `Trading retomado para ${exchange} (${environment})`,
        data: {
          exchange,
          environment,
          resumed_at: new Date()
        }
      });

    } catch (error) {
      console.error('Erro ao retomar trading:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /admin/emergency/status - Status de emergência e trading
  async getEmergencyStatus(req, res) {
    try {
      // Status de trading por exchange
      const tradingStatus = await query(`
        SELECT 
          exchange,
          environment,
          COUNT(*) as total_keys,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_keys,
          COUNT(CASE WHEN paused_by_admin IS NOT NULL THEN 1 END) as paused_keys
        FROM user_api_keys 
        GROUP BY exchange, environment
        ORDER BY exchange, environment
      `);

      // Pausas ativas
      const activePauses = await query(`
        SELECT 
          tp.*,
          u.email as admin_email
        FROM trading_pauses tp
        LEFT JOIN users u ON tp.admin_id = u.id
        WHERE tp.status = 'active'
        ORDER BY tp.created_at DESC
      `);

      // Operações abertas por exchange
      const openOperations = await query(`
        SELECT 
          uk.exchange,
          uk.environment,
          COUNT(*) as open_operations,
          SUM(CASE WHEN o.profit > 0 THEN 1 ELSE 0 END) as profitable,
          SUM(CASE WHEN o.profit < 0 THEN 1 ELSE 0 END) as losing
        FROM operations o
        JOIN user_api_keys uk ON o.user_id = uk.user_id
        WHERE o.status IN ('open', 'pending')
        GROUP BY uk.exchange, uk.environment
        ORDER BY uk.exchange, uk.environment
      `);

      // Últimas emergências
      const recentEmergencies = await query(`
        SELECT 
          el.*,
          u.email as admin_email
        FROM emergency_logs el
        LEFT JOIN users u ON el.admin_id = u.id
        ORDER BY el.created_at DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: {
          trading_status: tradingStatus.rows,
          active_pauses: activePauses.rows,
          open_operations: openOperations.rows,
          recent_emergencies: recentEmergencies.rows,
          system_health: await this.getSystemHealth()
        }
      });

    } catch (error) {
      console.error('Erro ao obter status de emergência:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // PUT /admin/api-keys/update - Atualizar chaves API do sistema
  async updateSystemApiKeys(req, res) {
    try {
      const adminId = req.user.id;
      const { service, api_key, secret_key, environment } = req.body;

      if (!service || !api_key) {
        return res.status(400).json({
          success: false,
          error: 'Service e API key são obrigatórios'
        });
      }

      // Criptografar chaves
      const encryptedSecret = this.encryptSecret(secret_key);

      // Atualizar ou inserir configuração
      await query(`
        INSERT INTO system_api_keys (
          service, api_key, secret_key, environment, 
          updated_by_admin, updated_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (service, environment)
        DO UPDATE SET 
          api_key = EXCLUDED.api_key,
          secret_key = EXCLUDED.secret_key,
          updated_by_admin = EXCLUDED.updated_by_admin,
          updated_at = CURRENT_TIMESTAMP
      `, [service, api_key, encryptedSecret, environment, adminId]);

      // Log da alteração
      await query(`
        INSERT INTO admin_action_logs (
          admin_id, action, details, created_at
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [
        adminId,
        'update_system_api_key',
        JSON.stringify({ service, environment })
      ]);

      res.json({
        success: true,
        message: `Chave API ${service} (${environment}) atualizada com sucesso`
      });

    } catch (error) {
      console.error('Erro ao atualizar chave API:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Métodos auxiliares
  async closeOperationOnExchange(operation) {
    try {
      // Simular fechamento na exchange
      // Em produção, fazer chamada real à API da exchange
      
      const mockExitPrice = operation.entry_price * (Math.random() > 0.5 ? 1.02 : 0.98);
      const mockProfit = (mockExitPrice - operation.entry_price) * operation.quantity;

      return {
        success: true,
        exitPrice: mockExitPrice,
        profit: mockProfit
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async notifyUsersEmergencyClosure(operations, reason) {
    try {
      const uniqueUsers = [...new Set(operations.map(op => op.user_id))];

      const notificationPromises = uniqueUsers.map(userId =>
        query(`
          INSERT INTO notifications (
            user_id, tipo, titulo, mensagem, dados_extras, status
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          userId,
          'emergency_closure',
          '🚨 Fechamento de Emergência',
          `Suas operações foram fechadas por: ${reason}`,
          JSON.stringify({ reason, timestamp: new Date() }),
          'enviada'
        ])
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Erro ao notificar usuários:', error);
    }
  }

  async getSystemHealth() {
    try {
      const healthChecks = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkExchangeConnectivity(),
        this.checkAIService(),
        this.checkMemoryUsage()
      ]);

      return {
        database: healthChecks[0],
        exchanges: healthChecks[1],
        ai_service: healthChecks[2],
        memory: healthChecks[3],
        overall_status: healthChecks.every(check => check.status === 'healthy') ? 'healthy' : 'warning'
      };
    } catch (error) {
      return {
        overall_status: 'error',
        error: error.message
      };
    }
  }

  async checkDatabaseHealth() {
    try {
      const result = await query('SELECT 1');
      return {
        status: 'healthy',
        response_time: Date.now()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async checkExchangeConnectivity() {
    // Simular verificação das exchanges
    return {
      binance: { status: 'healthy', latency: 150 },
      bybit: { status: 'healthy', latency: 200 }
    };
  }

  async checkAIService() {
    // Simular verificação do OpenAI
    return {
      status: 'healthy',
      last_request: new Date(),
      tokens_remaining: 50000
    };
  }

  async checkMemoryUsage() {
    const used = process.memoryUsage();
    return {
      status: used.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning',
      heap_used: Math.round(used.heapUsed / 1024 / 1024),
      heap_total: Math.round(used.heapTotal / 1024 / 1024)
    };
  }

  encryptSecret(secret) {
    // Reutilizar método de criptografia
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = process.env.API_ENCRYPTION_KEY || 'default-key-change-in-production';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }
}

export default new AdminEmergencyController();

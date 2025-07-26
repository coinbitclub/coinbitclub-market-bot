import { query } from '../config/database.js';
import crypto from 'crypto';

class ApiKeysController {
  // GET /user/api-keys - Listar chaves do usuário
  async getUserApiKeys(req, res) {
    try {
      const userId = req.user.id;

      const result = await query(`
        SELECT 
          id,
          exchange,
          environment,
          api_key,
          -- Não retornar secret_key por segurança
          is_active,
          validation_status,
          error_message,
          last_validated,
          created_at
        FROM user_api_keys 
        WHERE user_id = $1
        ORDER BY exchange, environment
      `, [userId]);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao listar API keys:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /user/api-keys - Criar/atualizar chave API
  async createOrUpdateApiKey(req, res) {
    try {
      const userId = req.user.id;
      const { exchange, environment, api_key, secret_key, passphrase } = req.body;

      // Validações conforme especificação
      if (!exchange || !environment || !api_key || !secret_key) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: exchange, environment, api_key, secret_key'
        });
      }

      // Verificar se é ambiente de produção
      if (environment === 'production') {
        // Conforme especificação: apenas com saldo ou assinatura
        const hasActiveSubscription = await this.checkActiveSubscription(userId);
        const hasBalance = await this.checkUserBalance(userId);

        if (!hasActiveSubscription && !hasBalance) {
          return res.status(403).json({
            success: false,
            error: 'Chaves de produção requerem assinatura ativa ou saldo disponível'
          });
        }
      }

      // Criptografar secret_key
      const encryptedSecret = this.encryptSecret(secret_key);

      // Inserir ou atualizar
      const result = await query(`
        INSERT INTO user_api_keys (
          user_id, exchange, environment, api_key, 
          secret_key, passphrase, validation_status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        ON CONFLICT (user_id, exchange, environment) 
        DO UPDATE SET 
          api_key = EXCLUDED.api_key,
          secret_key = EXCLUDED.secret_key,
          passphrase = EXCLUDED.passphrase,
          validation_status = 'pending',
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, exchange, environment, validation_status
      `, [userId, exchange, environment, api_key, encryptedSecret, passphrase]);

      // Validar chaves assíncronamente
      this.validateApiKeysAsync(result.rows[0].id);

      res.json({
        success: true,
        data: {
          id: result.rows[0].id,
          exchange,
          environment,
          status: 'pending_validation'
        }
      });

    } catch (error) {
      console.error('Erro ao criar/atualizar API key:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // DELETE /user/api-keys/:id - Remover chave API
  async deleteApiKey(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await query(`
        DELETE FROM user_api_keys 
        WHERE id = $1 AND user_id = $2
        RETURNING exchange, environment
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Chave API não encontrada'
        });
      }

      res.json({
        success: true,
        message: `Chave ${result.rows[0].exchange} ${result.rows[0].environment} removida`
      });

    } catch (error) {
      console.error('Erro ao remover API key:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // PUT /user/api-keys/:id/toggle - Ativar/desativar chave
  async toggleApiKey(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await query(`
        UPDATE user_api_keys 
        SET 
          is_active = NOT is_active,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING exchange, environment, is_active
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Chave API não encontrada'
        });
      }

      res.json({
        success: true,
        data: {
          exchange: result.rows[0].exchange,
          environment: result.rows[0].environment,
          is_active: result.rows[0].is_active
        }
      });

    } catch (error) {
      console.error('Erro ao alterar status da API key:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /user/api-keys/validate/:id - Validar chave específica
  async validateApiKey(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Buscar chave
      const keyResult = await query(`
        SELECT * FROM user_api_keys 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (keyResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Chave API não encontrada'
        });
      }

      const apiKey = keyResult.rows[0];
      
      // Validar chave
      const validationResult = await this.performApiValidation(apiKey);

      // Atualizar status
      await query(`
        UPDATE user_api_keys 
        SET 
          validation_status = $1,
          error_message = $2,
          last_validated = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [
        validationResult.isValid ? 'valid' : 'invalid',
        validationResult.error || null,
        id
      ]);

      res.json({
        success: true,
        data: {
          is_valid: validationResult.isValid,
          error: validationResult.error,
          last_validated: new Date()
        }
      });

    } catch (error) {
      console.error('Erro ao validar API key:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Métodos auxiliares
  async checkActiveSubscription(userId) {
    try {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM user_subscriptions us
        JOIN plans p ON us.plan_id = p.id
        WHERE us.user_id = $1 
        AND us.status = 'ativa'
        AND us.data_fim > CURRENT_DATE
      `, [userId]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      return false;
    }
  }

  async checkUserBalance(userId) {
    try {
      const result = await query(`
        SELECT COALESCE(SUM(balance), 0) as total_balance
        FROM prepaid_balances 
        WHERE user_id = $1
      `, [userId]);

      return parseFloat(result.rows[0].total_balance) > 0;
    } catch (error) {
      return false;
    }
  }

  encryptSecret(secret) {
    // Implementar criptografia segura
    const algorithm = 'aes-256-gcm';
    const key = process.env.API_ENCRYPTION_KEY || 'default-key-change-in-production';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decryptSecret(encryptedSecret) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = process.env.API_ENCRYPTION_KEY || 'default-key-change-in-production';
      
      const [ivHex, encrypted] = encryptedSecret.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Erro ao descriptografar chave');
    }
  }

  async validateApiKeysAsync(keyId) {
    // Implementar validação assíncrona
    setTimeout(async () => {
      try {
        const keyResult = await query(`
          SELECT * FROM user_api_keys WHERE id = $1
        `, [keyId]);

        if (keyResult.rows.length > 0) {
          const apiKey = keyResult.rows[0];
          const validationResult = await this.performApiValidation(apiKey);

          await query(`
            UPDATE user_api_keys 
            SET 
              validation_status = $1,
              error_message = $2,
              last_validated = CURRENT_TIMESTAMP
            WHERE id = $3
          `, [
            validationResult.isValid ? 'valid' : 'invalid',
            validationResult.error || null,
            keyId
          ]);
        }
      } catch (error) {
        console.error('Erro na validação assíncrona:', error);
      }
    }, 5000); // 5 segundos
  }

  async performApiValidation(apiKey) {
    try {
      // Simular validação - em produção, fazer chamada real à API
      // Retornar resultado da validação
      
      return {
        isValid: true,
        error: null
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }
}

export default new ApiKeysController();

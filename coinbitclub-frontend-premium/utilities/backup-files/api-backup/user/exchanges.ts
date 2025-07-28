import { NextApiRequest, NextApiResponse } from 'next';
import { createExchangeAPI, validateExchangeConfig, ExchangeConfig } from '../../../src/lib/exchanges';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Função para criptografar dados sensíveis
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc';
  const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.update(text, 'utf8', 'hex');
  const encrypted = cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// Função para descriptografar dados sensíveis
function decrypt(encryptedData: string): string {
  const algorithm = 'aes-256-cbc';
  const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.update(encrypted, 'hex', 'utf8');
  return decipher.final('utf8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Obter configurações das exchanges do usuário
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;

      // Aqui você conectaria com o banco de dados para obter as configurações
      // Por enquanto, retorno um exemplo
      const userExchanges = [
        {
          id: '1',
          exchange: 'binance',
          name: 'Binance Principal',
          testnet: false,
          isActive: true,
          hasApiKey: true,
          lastConnection: new Date().toISOString()
        },
        {
          id: '2',
          exchange: 'bybit',
          name: 'Bybit Testnet',
          testnet: true,
          isActive: false,
          hasApiKey: true,
          lastConnection: null
        }
      ];

      return res.status(200).json({
        success: true,
        exchanges: userExchanges
      });
    } catch (error) {
      console.error('Erro ao obter exchanges:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'POST') {
    // Adicionar/atualizar configuração de exchange
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;

      const { 
        exchange, 
        name, 
        apiKey, 
        secretKey, 
        testnet = false,
        isActive = true 
      } = req.body;

      // Validar dados
      const exchangeConfig: ExchangeConfig = {
        exchange,
        apiKey,
        secretKey,
        testnet,
        userId
      };

      const validationErrors = validateExchangeConfig(exchangeConfig);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validationErrors
        });
      }

      // Testar conexão com a exchange
      const exchangeAPI = createExchangeAPI(exchangeConfig);
      const connectionTest = await exchangeAPI.testConnection();

      if (!connectionTest.success) {
        return res.status(400).json({
          error: 'Falha na conexão com a exchange',
          details: connectionTest.error
        });
      }

      // Criptografar chaves sensíveis
      const encryptedApiKey = encrypt(apiKey);
      const encryptedSecretKey = encrypt(secretKey);

      // Aqui você salvaria no banco de dados
      const newExchangeConfig = {
        id: Date.now().toString(), // Usar ID real do banco
        userId,
        exchange,
        name: name || `${exchange.charAt(0).toUpperCase() + exchange.slice(1)} ${testnet ? 'Testnet' : 'Mainnet'}`,
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
        testnet,
        isActive,
        createdAt: new Date(),
        lastConnection: new Date(),
        status: 'connected'
      };

      return res.status(201).json({
        success: true,
        message: 'Exchange configurada com sucesso',
        exchange: {
          id: newExchangeConfig.id,
          exchange: newExchangeConfig.exchange,
          name: newExchangeConfig.name,
          testnet: newExchangeConfig.testnet,
          isActive: newExchangeConfig.isActive,
          lastConnection: newExchangeConfig.lastConnection,
          hasApiKey: true
        }
      });
    } catch (error) {
      console.error('Erro ao configurar exchange:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'PUT') {
    // Atualizar configuração existente
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;

      const { 
        exchangeId,
        name,
        apiKey,
        secretKey,
        isActive
      } = req.body;

      if (!exchangeId) {
        return res.status(400).json({ error: 'ID da exchange é obrigatório' });
      }

      // Aqui você atualizaria no banco de dados
      // Implementar lógica de atualização

      return res.status(200).json({
        success: true,
        message: 'Exchange atualizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar exchange:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'DELETE') {
    // Remover configuração de exchange
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;

      const { exchangeId } = req.query;

      if (!exchangeId) {
        return res.status(400).json({ error: 'ID da exchange é obrigatório' });
      }

      // Aqui você removeria do banco de dados
      // Implementar lógica de remoção

      return res.status(200).json({
        success: true,
        message: 'Exchange removida com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover exchange:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

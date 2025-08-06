import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import crypto from 'crypto';

// Mock database - em produção usar PostgreSQL
const userCredentials: any[] = [];

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here-123456';
const ALGORITHM = 'aes-256-gcm';

// Função para criptografar dados sensíveis
function encrypt(text: string): { encrypted: string; authTag: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Para simplificar, vamos usar uma implementação básica
  // Em produção, usar crypto.createCipherGCM com authTag
  return {
    encrypted,
    authTag: '',
    iv: iv.toString('hex')
  };
}

// Função para descriptografar dados sensíveis
function decrypt(encryptedData: { encrypted: string; authTag: string; iv: string }): string {
  try {
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '***ENCRYPTED***';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar autenticação
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    switch (req.method) {
      case 'GET':
        return handleGetCredentials(req, res, user);
      case 'POST':
        return handleCreateCredential(req, res, user);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleGetCredentials(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Buscar credenciais do usuário
    const credentials = userCredentials
      .filter(cred => cred.userId === user.id)
      .map(cred => ({
        id: cred.id,
        exchange: cred.exchange,
        label: cred.label,
        apiKey: maskApiKey(cred.apiKey),
        apiSecret: '•••••••••••••••••••••••••••••••••••••••••',
        isTestnet: cred.isTestnet,
        isActive: cred.isActive,
        createdAt: cred.createdAt,
        lastUsed: cred.lastUsed
      }));

    return res.status(200).json(credentials);
  } catch (error) {
    console.error('Get credentials error:', error);
    return res.status(500).json({ error: 'Erro ao buscar credenciais' });
  }
}

async function handleCreateCredential(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { exchange, label, apiKey, apiSecret, isTestnet } = req.body;

    // Validação
    if (!exchange || !apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Exchange, API Key e API Secret são obrigatórios' });
    }

    // Validar se a exchange é suportada
    const supportedExchanges = ['bybit', 'binance', 'okx', 'gate'];
    if (!supportedExchanges.includes(exchange)) {
      return res.status(400).json({ error: 'Exchange não suportada' });
    }

    // Verificar se já existe uma credencial ativa para esta exchange
    const existingCredential = userCredentials.find(
      cred => cred.userId === user.id && 
              cred.exchange === exchange && 
              cred.isTestnet === isTestnet &&
              cred.isActive
    );

    if (existingCredential) {
      return res.status(400).json({ 
        error: `Já existe uma credencial ativa para ${exchange} ${isTestnet ? '(testnet)' : '(produção)'}` 
      });
    }

    // Validar formato das chaves (básico)
    if (apiKey.length < 10 || apiSecret.length < 10) {
      return res.status(400).json({ error: 'API Key e Secret devem ter pelo menos 10 caracteres' });
    }

    // Testar conectividade com a exchange (simulado)
    const isValid = await validateExchangeCredentials(exchange, apiKey, apiSecret, isTestnet);
    if (!isValid) {
      return res.status(400).json({ error: 'Credenciais inválidas ou sem permissões adequadas' });
    }

    // Criptografar dados sensíveis
    const encryptedApiSecret = encrypt(apiSecret);

    // Criar nova credencial
    const newCredential = {
      id: Date.now().toString(),
      userId: user.id,
      exchange,
      label: label || `${exchange.charAt(0).toUpperCase() + exchange.slice(1)} ${isTestnet ? 'Testnet' : 'Principal'}`,
      apiKey,
      apiSecret: encryptedApiSecret,
      isTestnet: Boolean(isTestnet),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };

    userCredentials.push(newCredential);

    // Log de auditoria
    console.log(`🔐 Nova credencial adicionada - User: ${user.email}, Exchange: ${exchange}, Testnet: ${isTestnet}`);

    // Retornar resposta (sem dados sensíveis)
    const responseCredential = {
      id: newCredential.id,
      exchange: newCredential.exchange,
      label: newCredential.label,
      apiKey: maskApiKey(newCredential.apiKey),
      apiSecret: '•••••••••••••••••••••••••••••••••••••••••',
      isTestnet: newCredential.isTestnet,
      isActive: newCredential.isActive,
      createdAt: newCredential.createdAt,
      lastUsed: newCredential.lastUsed
    };

    return res.status(201).json(responseCredential);
  } catch (error) {
    console.error('Create credential error:', error);
    return res.status(500).json({ error: 'Erro ao criar credencial' });
  }
}

// Função para mascarar API Key
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '***';
  
  const start = apiKey.substring(0, 6);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}...${end}`;
}

// Função para validar credenciais da exchange (simulado)
async function validateExchangeCredentials(
  exchange: string, 
  apiKey: string, 
  apiSecret: string, 
  isTestnet: boolean
): Promise<boolean> {
  try {
    // Simulação de validação
    // Em produção, fazer uma chamada real para a API da exchange
    
    console.log(`🔍 Validando credenciais ${exchange} (testnet: ${isTestnet})`);
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validações básicas
    if (exchange === 'bybit') {
      // Bybit API keys geralmente começam com certas letras
      if (!apiKey.match(/^[A-Za-z0-9]{20,}$/)) {
        return false;
      }
    } else if (exchange === 'binance') {
      // Binance API keys têm formato específico
      if (!apiKey.match(/^[A-Za-z0-9]{64}$/)) {
        return false;
      }
    }
    
    // Se chegou até aqui, considerar válido (em produção fazer teste real)
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

// Função auxiliar para obter credenciais descriptografadas (uso interno)
export function getDecryptedCredentials(userId: string, exchange?: string) {
  const credentials = userCredentials
    .filter(cred => cred.userId === userId && cred.isActive)
    .filter(cred => !exchange || cred.exchange === exchange)
    .map(cred => ({
      ...cred,
      apiSecret: decrypt(cred.apiSecret)
    }));
  
  return credentials;
}

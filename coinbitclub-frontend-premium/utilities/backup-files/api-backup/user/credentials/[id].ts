import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../lib/auth';

// Mock database - em produção usar PostgreSQL
// Importado do arquivo principal de credenciais
const userCredentials: any[] = [];

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

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID da credencial é obrigatório' });
    }

    switch (req.method) {
      case 'DELETE':
        return handleDeleteCredential(req, res, user, id);
      case 'PUT':
        return handleUpdateCredential(req, res, user, id);
      case 'GET':
        return handleGetCredential(req, res, user, id);
      default:
        res.setHeader('Allow', ['DELETE', 'PUT', 'GET']);
        return res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function handleDeleteCredential(req: NextApiRequest, res: NextApiResponse, user: any, credentialId: string) {
  try {
    // Buscar credencial
    const credentialIndex = userCredentials.findIndex(
      cred => cred.id === credentialId && cred.userId === user.id
    );

    if (credentialIndex === -1) {
      return res.status(404).json({ error: 'Credencial não encontrada' });
    }

    const credential = userCredentials[credentialIndex];

    // Verificar se há operações ativas com esta credencial
    const hasActiveOperations = await checkActiveOperations(credentialId);
    if (hasActiveOperations) {
      return res.status(400).json({ 
        error: 'Não é possível deletar credencial com operações ativas. Aguarde a finalização ou cancele as operações primeiro.' 
      });
    }

    // Remover credencial
    userCredentials.splice(credentialIndex, 1);

    // Log de auditoria
    console.log(`🗑️ Credencial removida - User: ${user.email}, Exchange: ${credential.exchange}, ID: ${credentialId}`);

    return res.status(200).json({ 
      message: 'Credencial removida com sucesso',
      deletedCredential: {
        id: credential.id,
        exchange: credential.exchange,
        label: credential.label
      }
    });
  } catch (error) {
    console.error('Delete credential error:', error);
    return res.status(500).json({ error: 'Erro ao deletar credencial' });
  }
}

async function handleUpdateCredential(req: NextApiRequest, res: NextApiResponse, user: any, credentialId: string) {
  try {
    const { label, isActive } = req.body;

    // Buscar credencial
    const credentialIndex = userCredentials.findIndex(
      cred => cred.id === credentialId && cred.userId === user.id
    );

    if (credentialIndex === -1) {
      return res.status(404).json({ error: 'Credencial não encontrada' });
    }

    const credential = userCredentials[credentialIndex];

    // Se desativando credencial, verificar operações ativas
    if (isActive === false && credential.isActive) {
      const hasActiveOperations = await checkActiveOperations(credentialId);
      if (hasActiveOperations) {
        return res.status(400).json({ 
          error: 'Não é possível desativar credencial com operações ativas. Aguarde a finalização ou cancele as operações primeiro.' 
        });
      }
    }

    // Atualizar campos permitidos
    if (label !== undefined) {
      credential.label = label;
    }
    if (isActive !== undefined) {
      credential.isActive = isActive;
    }

    credential.updatedAt = new Date().toISOString();

    // Log de auditoria
    console.log(`📝 Credencial atualizada - User: ${user.email}, Exchange: ${credential.exchange}, ID: ${credentialId}`);

    // Retornar credencial atualizada (sem dados sensíveis)
    const responseCredential = {
      id: credential.id,
      exchange: credential.exchange,
      label: credential.label,
      apiKey: maskApiKey(credential.apiKey),
      apiSecret: '•••••••••••••••••••••••••••••••••••••••••',
      isTestnet: credential.isTestnet,
      isActive: credential.isActive,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      lastUsed: credential.lastUsed
    };

    return res.status(200).json(responseCredential);
  } catch (error) {
    console.error('Update credential error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar credencial' });
  }
}

async function handleGetCredential(req: NextApiRequest, res: NextApiResponse, user: any, credentialId: string) {
  try {
    // Buscar credencial específica
    const credential = userCredentials.find(
      cred => cred.id === credentialId && cred.userId === user.id
    );

    if (!credential) {
      return res.status(404).json({ error: 'Credencial não encontrada' });
    }

    // Retornar credencial (sem dados sensíveis)
    const responseCredential = {
      id: credential.id,
      exchange: credential.exchange,
      label: credential.label,
      apiKey: maskApiKey(credential.apiKey),
      apiSecret: '•••••••••••••••••••••••••••••••••••••••••',
      isTestnet: credential.isTestnet,
      isActive: credential.isActive,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      lastUsed: credential.lastUsed
    };

    return res.status(200).json(responseCredential);
  } catch (error) {
    console.error('Get credential error:', error);
    return res.status(500).json({ error: 'Erro ao buscar credencial' });
  }
}

// Função para verificar se há operações ativas com a credencial
async function checkActiveOperations(credentialId: string): Promise<boolean> {
  try {
    // Simulação - em produção verificar base de dados de operações
    // Verificar:
    // - Ordens abertas
    // - Bots ativos
    // - Operações pendentes
    
    console.log(`🔍 Verificando operações ativas para credencial ${credentialId}`);
    
    // Simular verificação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Para demo, retornar false (sem operações ativas)
    return false;
  } catch (error) {
    console.error('Check active operations error:', error);
    return true; // Em caso de erro, assumir que há operações ativas por segurança
  }
}

// Função para mascarar API Key
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '***';
  
  const start = apiKey.substring(0, 6);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}...${end}`;
}

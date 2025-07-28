import { NextApiRequest, NextApiResponse } from 'next';

// Simulando dados do usuário
const userSettings = {
  profile: {
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '+55 11 99999-9999',
    country: 'Brasil',
    timezone: 'America/Sao_Paulo'
  },
  security: {
    twoFactor: true,
    emailNotifications: true,
    smsAlerts: false,
    apiAccess: true
  },
  trading: {
    defaultRisk: 'moderate',
    autoRebalance: true,
    pauseOnDrawdown: true,
    maxDailyLoss: 5000
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de acesso necessário' });
  }

  if (req.method === 'GET') {
    // Retornar configurações atuais
    res.status(200).json(userSettings);
  } 
  else if (req.method === 'PUT') {
    // Atualizar configurações
    try {
      const updates = req.body;
      
      // Validações básicas
      if (updates.profile) {
        if (updates.profile.email && !/\S+@\S+\.\S+/.test(updates.profile.email)) {
          return res.status(400).json({ message: 'Email inválido' });
        }
      }

      if (updates.trading) {
        if (updates.trading.defaultRisk && !['conservative', 'moderate', 'aggressive'].includes(updates.trading.defaultRisk)) {
          return res.status(400).json({ message: 'Nível de risco inválido' });
        }
        
        if (updates.trading.maxDailyLoss && (updates.trading.maxDailyLoss < 100 || updates.trading.maxDailyLoss > 100000)) {
          return res.status(400).json({ message: 'Limite diário deve estar entre R$ 100 e R$ 100.000' });
        }
      }

      // Atualizar configurações (merge deep)
      if (updates.profile) {
        Object.assign(userSettings.profile, updates.profile);
      }
      if (updates.security) {
        Object.assign(userSettings.security, updates.security);
      }
      if (updates.trading) {
        Object.assign(userSettings.trading, updates.trading);
      }

      res.status(200).json({
        message: 'Configurações atualizadas com sucesso',
        settings: userSettings
      });

    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

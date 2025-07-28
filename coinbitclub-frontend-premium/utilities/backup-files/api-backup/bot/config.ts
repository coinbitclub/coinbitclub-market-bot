import { NextApiRequest, NextApiResponse } from 'next';

// Simulando dados do bot
const botData = {
  config: {
    riskLevel: 'moderate',
    maxTrade: 5,
    dailyLimit: 50000,
    stopLoss: 2,
    takeProfit: 5,
    activeStrategies: ['scalping', 'swing'],
    tradingPairs: ['BTC/USDT', 'ETH/USDT', 'ADA/USDT'],
    notifications: {
      email: true,
      sms: false,
      telegram: true
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação (simplificado)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de acesso necessário' });
  }

  if (req.method === 'GET') {
    // Retornar configurações atuais
    res.status(200).json(botData.config);
  } 
  else if (req.method === 'PUT') {
    // Atualizar configurações
    try {
      const updates = req.body;
      
      // Validações básicas
      if (updates.riskLevel && !['conservative', 'moderate', 'aggressive'].includes(updates.riskLevel)) {
        return res.status(400).json({ message: 'Nível de risco inválido' });
      }

      if (updates.maxTrade && (updates.maxTrade < 1 || updates.maxTrade > 10)) {
        return res.status(400).json({ message: 'Percentual por trade deve estar entre 1% e 10%' });
      }

      // Atualizar configurações
      Object.assign(botData.config, updates);

      res.status(200).json({
        message: 'Configurações atualizadas com sucesso',
        config: botData.config
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

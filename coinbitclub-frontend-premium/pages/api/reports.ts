import { NextApiRequest, NextApiResponse } from 'next';

// Simulando dados de relatórios
const reportsData = {
  '7d': {
    performance: {
      totalProfit: 12847.89,
      totalTrades: 247,
      winRate: 89.5,
      averageReturn: 2.1,
      sharpeRatio: 1.62,
      maxDrawdown: 6.8
    },
    monthlyData: [
      { month: 'Últimos 7 dias', profit: 12847, trades: 247, winRate: 89.5 }
    ],
    topPairs: [
      { pair: 'BTC/USDT', profit: 6200, trades: 89, winRate: 91.2 },
      { pair: 'ETH/USDT', profit: 4100, trades: 67, winRate: 88.1 },
      { pair: 'ADA/USDT', profit: 2547, trades: 91, winRate: 87.9 }
    ]
  },
  '30d': {
    performance: {
      totalProfit: 47592.34,
      totalTrades: 1847,
      winRate: 92.8,
      averageReturn: 2.4,
      sharpeRatio: 1.85,
      maxDrawdown: 8.2
    },
    monthlyData: [
      { month: 'Jan', profit: 12500, trades: 245, winRate: 89.2 },
      { month: 'Feb', profit: 15800, trades: 289, winRate: 91.5 },
      { month: 'Mar', profit: 19292, trades: 321, winRate: 92.8 }
    ],
    topPairs: [
      { pair: 'BTC/USDT', profit: 18500, trades: 567, winRate: 94.1 },
      { pair: 'ETH/USDT', profit: 15200, trades: 423, winRate: 91.8 },
      { pair: 'ADA/USDT', profit: 8900, trades: 298, winRate: 88.9 },
      { pair: 'DOT/USDT', profit: 4992, trades: 189, winRate: 87.3 }
    ]
  },
  '90d': {
    performance: {
      totalProfit: 142850.67,
      totalTrades: 5234,
      winRate: 91.3,
      averageReturn: 2.6,
      sharpeRatio: 1.92,
      maxDrawdown: 12.5
    },
    monthlyData: [
      { month: 'Jan', profit: 45200, trades: 1689, winRate: 89.8 },
      { month: 'Feb', profit: 48950, trades: 1834, winRate: 91.2 },
      { month: 'Mar', profit: 48700, trades: 1711, winRate: 92.9 }
    ],
    topPairs: [
      { pair: 'BTC/USDT', profit: 52400, trades: 1567, winRate: 93.8 },
      { pair: 'ETH/USDT', profit: 41200, trades: 1234, winRate: 91.2 },
      { pair: 'ADA/USDT', profit: 28950, trades: 1098, winRate: 89.7 },
      { pair: 'DOT/USDT', profit: 20300, trades: 789, winRate: 88.1 }
    ]
  },
  '1y': {
    performance: {
      totalProfit: 524789.23,
      totalTrades: 18947,
      winRate: 90.7,
      averageReturn: 2.8,
      sharpeRatio: 2.15,
      maxDrawdown: 15.8
    },
    monthlyData: [
      { month: 'Jan', profit: 42850, trades: 1567, winRate: 88.9 },
      { month: 'Fev', profit: 45200, trades: 1689, winRate: 89.8 },
      { month: 'Mar', profit: 48950, trades: 1834, winRate: 91.2 },
      { month: 'Abr', profit: 51200, trades: 1923, winRate: 92.1 },
      { month: 'Mai', profit: 48700, trades: 1711, winRate: 90.5 },
      { month: 'Jun', profit: 52400, trades: 1889, winRate: 91.8 },
      { month: 'Jul', profit: 49850, trades: 1756, winRate: 90.9 },
      { month: 'Ago', profit: 54200, trades: 1945, winRate: 92.4 },
      { month: 'Set', profit: 47900, trades: 1623, winRate: 89.7 },
      { month: 'Out', profit: 51850, trades: 1834, winRate: 91.6 },
      { month: 'Nov', profit: 49200, trades: 1756, winRate: 90.3 },
      { month: 'Dez', profit: 22487, trades: 420, winRate: 88.1 }
    ],
    topPairs: [
      { pair: 'BTC/USDT', profit: 198500, trades: 5678, winRate: 92.8 },
      { pair: 'ETH/USDT', profit: 156200, trades: 4234, winRate: 90.5 },
      { pair: 'ADA/USDT', profit: 98950, trades: 3298, winRate: 88.9 },
      { pair: 'DOT/USDT', profit: 71139, trades: 2189, winRate: 87.3 }
    ]
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de acesso necessário' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { period = '30d' } = req.query;
    
    const validPeriods = ['7d', '30d', '90d', '1y'];
    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({ message: 'Período inválido' });
    }

    const data = reportsData[period as keyof typeof reportsData];
    
    res.status(200).json(data);

  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

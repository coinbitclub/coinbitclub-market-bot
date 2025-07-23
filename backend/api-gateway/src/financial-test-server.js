import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { id: '1', role: 'admin' };
  next();
};

app.use(mockAuth);

// Test routes for new functionality
app.get('/docs', (req, res) => {
  res.json({
    title: 'CoinBitClub API',
    version: '2.0.0',
    status: 'operational'
  });
});

// Financial AI Reports endpoint
app.get('/financial/ai-reports', (req, res) => {
  const mockReports = [
    {
      id: 1,
      type: 'financial_summary',
      title: 'Relatório Financeiro Automático',
      content: {
        revenue_growth: '+12.5%',
        commission_ratio: '8.5%',
        user_retention: '89%',
        recommendations: [
          'Receita em crescimento constante nos últimos 7 dias',
          'Taxa de comissão dentro do esperado',
          'Considerar campanha para aumentar retenção de usuários'
        ]
      },
      created_at: new Date(),
      user_id: null
    },
    {
      id: 2,
      type: 'system_health',
      title: 'Saúde do Sistema Financeiro',
      content: {
        uptime: '99.9%',
        transaction_success: '98.2%',
        api_latency: '145ms',
        alerts: ['Volume de transações 15% acima da média']
      },
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
      user_id: null
    }
  ];

  res.json({
    reports: mockReports,
    nextUpdate: new Date(Date.now() + 4 * 60 * 60 * 1000),
    updateInterval: '4 hours'
  });
});

// Financial Dashboard endpoint
app.get('/financial/dashboard', (req, res) => {
  res.json({
    summary: {
      totalRevenue: 50000.00,
      periodRevenue: 12500.00,
      userBalances: 8700.00,
      pendingCommissions: 1200.00,
      businessBalance: 5300.00
    },
    recentSubscriptions: [
      {
        userName: 'João Santos',
        plan: 'Plano Básico',
        value: 100.00,
        date: '2024-04-22',
        status: 'Pago'
      }
    ],
    recentAffiliates: [
      {
        affiliateName: 'Carlos Silva',
        referredName: 'Ana Costa',
        commission: 25.00,
        status: 'Pendente',
        date: '2024-04-22'
      }
    ],
    withdrawalRequests: [
      {
        userName: 'João Santos',
        value: 200.00,
        date: '2024-04-22',
        status: 'Pendente'
      }
    ],
    charts: {
      dailyRevenue: [
        { date: '2024-04-20', revenue: 2500, subscriptions: 12 },
        { date: '2024-04-21', revenue: 3200, subscriptions: 15 },
        { date: '2024-04-22', revenue: 2800, subscriptions: 14 }
      ]
    }
  });
});

// Accounting Dashboard endpoint
app.get('/financial/accounting', (req, res) => {
  res.json({
    period: { month: 4, year: 2024 },
    profitLoss: {
      revenue: {
        categories: [
          { category: 'Plano Básico', amount: 15000, transactions: 150 },
          { category: 'Plano Pro', amount: 25000, transactions: 125 },
          { category: 'Plano Premium', amount: 30000, transactions: 60 }
        ],
        total: 70000
      },
      expenses: {
        categories: [
          { category: 'Comissões de Afiliados', amount: 8500, transactions: 85 }
        ],
        total: 8500
      },
      grossProfit: 61500,
      netProfit: 57000
    },
    cashFlow: {
      daily: [
        { date: '2024-04-01', inflow: 2500, outflow: 800, netFlow: 1700 },
        { date: '2024-04-02', inflow: 3200, outflow: 1200, netFlow: 2000 }
      ],
      summary: {
        totalInflow: 70000,
        totalOutflow: 8500,
        netCashFlow: 61500
      }
    },
    taxAnalysis: {
      grossRevenue: 70000,
      deductibleExpenses: 8500,
      taxableIncome: 61500,
      estimatedTax: 9225,
      netIncome: 52275
    },
    bankReconciliation: {
      bankBalance: 125000,
      bookBalance: 120000,
      pendingDeposits: 2500,
      pendingWithdrawals: 7500,
      adjustedBalance: 120000
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Financial Test Server running on http://localhost:${PORT}`);
  console.log('📊 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/docs`);
  console.log(`   GET http://localhost:${PORT}/financial/ai-reports`);
  console.log(`   GET http://localhost:${PORT}/financial/dashboard`);
  console.log(`   GET http://localhost:${PORT}/financial/accounting`);
});

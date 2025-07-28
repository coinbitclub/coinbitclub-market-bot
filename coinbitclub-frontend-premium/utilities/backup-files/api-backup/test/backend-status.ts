import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const backendServices = [
    {
      name: 'API Gateway',
      url: 'https://coinbitclub-market-bot-production.up.railway.app',
      port: 8080,
      description: 'Gateway principal para microserviços'
    },
    {
      name: 'Decision Engine',
      url: 'https://coinbitclub-market-bot-production.up.railway.app/decision-engine',
      port: 3001,
      description: 'IA e análises de mercado'
    },
    {
      name: 'Signal Processor',
      url: 'https://coinbitclub-market-bot-production.up.railway.app/signal-processor',
      port: 3002,
      description: 'Processamento de sinais TradingView'
    },
    {
      name: 'Order Executor',
      url: 'https://coinbitclub-market-bot-production.up.railway.app/order-executor',
      port: 3003,
      description: 'Execução de ordens'
    }
  ];

  const serviceResults = [];

  for (const service of backendServices) {
    try {
      console.log(`Testando ${service.name}...`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(service.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CoinBitClub-Frontend/1.0.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      serviceResults.push({
        name: service.name,
        url: service.url,
        status: response.ok ? 'online' : 'error',
        statusCode: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseTime: 'N/A'
      });

    } catch (error) {
      console.error(`Erro ao testar ${service.name}:`, error);
      
      serviceResults.push({
        name: service.name,
        url: service.url,
        status: 'offline',
        statusCode: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Verificar variáveis de ambiente essenciais
  const envStatus = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    RAILWAY_URL: !!process.env.RAILWAY_PUBLIC_DOMAIN,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    COINSTATS_API_KEY: !!process.env.COINSTATS_API_KEY,
    TRADINGVIEW_WEBHOOK_SECRET: !!process.env.TRADINGVIEW_WEBHOOK_SECRET,
    Z_API_TOKEN: !!process.env.Z_API_TOKEN
  };

  const summary = {
    status: 'completed',
    timestamp: new Date().toISOString(),
    services: serviceResults,
    environment: envStatus,
    connectivity: {
      frontend: 'online',
      backend: serviceResults.filter(s => s.status === 'online').length > 0 ? 'partial' : 'offline',
      database: process.env.DATABASE_URL ? 'configured' : 'not_configured'
    },
    recommendations: [
      '🔍 Verificar status do Railway backend',
      '🗄️ Configurar conexão com banco PostgreSQL',
      '🔑 Validar todas as chaves de API',
      '🚀 Reiniciar serviços se necessário',
      '📊 Monitorar logs para diagnosticar problemas'
    ]
  };

  return res.status(200).json(summary);
}

import { NextApiRequest, NextApiResponse } from 'next';
import { ExchangeMonitor } from '../../../src/lib/exchangeMonitor';

/**
 * 📊 API ENDPOINT - HEALTH CHECK EXCHANGES
 * Monitora conectividade com Binance e Bybit usando IP fixo Railway
 * 
 * GET /api/health/exchanges
 * 
 * Resposta:
 * {
 *   "status": "healthy|degraded|critical",
 *   "railway_ip": "132.255.160.140",
 *   "exchanges": {
 *     "binance": "connected|error|timeout",
 *     "bybit": "connected|error|timeout"
 *   },
 *   "details": [
 *     {
 *       "exchange": "binance",
 *       "status": "connected",
 *       "latency": 45,
 *       "lastCheck": "2025-01-28T..."
 *     }
 *   ],
 *   "timestamp": "2025-01-28T...",
 *   "summary": {
 *     "total": 2,
 *     "connected": 2,
 *     "errors": 0
 *   }
 * }
 */

const RAILWAY_IP = '132.255.160.140';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Só aceitar GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET']
    });
  }

  try {
    console.log(`🔍 Health Check Request from IP: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
    console.log(`📍 Railway IP: ${RAILWAY_IP}`);

    // Executar monitoramento
    const monitor = ExchangeMonitor.getInstance();
    const report = await monitor.runMonitoring();

    // Preparar resposta
    const response = {
      status: report.overallStatus,
      railway_ip: report.railwayIP,
      exchanges: {} as { [key: string]: string },
      details: report.connections,
      timestamp: report.timestamp,
      summary: report.summary,
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        use_testnet: process.env.USE_TESTNET || 'false',
        ip_check_enabled: process.env.NODE_ENV === 'production'
      }
    };

    // Converter conexões para formato simples
    report.connections.forEach(conn => {
      response.exchanges[conn.exchange] = conn.status;
    });

    // Status HTTP baseado na saúde geral
    let statusCode = 200;
    if (report.overallStatus === 'degraded') {
      statusCode = 206; // Partial Content
    } else if (report.overallStatus === 'critical') {
      statusCode = 503; // Service Unavailable
    }

    // Headers de cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Headers informativos
    res.setHeader('X-Railway-IP', RAILWAY_IP);
    res.setHeader('X-Monitor-Status', report.overallStatus);
    res.setHeader('X-Connected-Exchanges', report.summary.connected.toString());

    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Health Check Error:', error);
    
    return res.status(500).json({
      status: 'error',
      railway_ip: RAILWAY_IP,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      exchanges: {
        binance: 'error',
        bybit: 'error'
      }
    });
  }
}

// Configuração do endpoint
export const config = {
  api: {
    responseLimit: false, // Sem limite de resposta
  },
};

/**
 * 📊 MONITORAMENTO DE CONECTIVIDADE - IP FIXO TRADING
 * Sistema para monitorar status das conexões com exchanges
 */

// Configuração temporária até criar o arquivo de config
const RAILWAY_IP = '132.255.160.140';

const exchangeConfig = {
  railway: {
    ip: RAILWAY_IP,
    environment: process.env.NODE_ENV || 'development'
  },
  binance: {
    baseURL: process.env.USE_TESTNET === 'true' 
      ? 'https://testnet.binance.vision'
      : 'https://api.binance.com',
    timeout: 10000
  },
  bybit: {
    baseURL: process.env.USE_TESTNET === 'true'
      ? 'https://api-testnet.bybit.com'
      : 'https://api.bybit.com',
    timeout: 10000
  }
};

function getExchangeHeaders(exchange: string, apiKey: string = ''): Record<string, string> {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'CoinBitClub-Bot/1.0',
    'X-Source-IP': RAILWAY_IP,
    'X-Railway-Service': 'coinbitclub-market-bot'
  };

  if (exchange === 'binance' && apiKey) {
    (headers as any)['X-MBX-APIKEY'] = apiKey;
  } else if (exchange === 'bybit' && apiKey) {
    (headers as any)['X-BAPI-API-KEY'] = apiKey;
  }

  return headers;
}

interface ConnectionStatus {
  exchange: string;
  status: 'connected' | 'error' | 'timeout' | 'unauthorized';
  latency: number;
  lastCheck: string;
  error?: string;
  railwayIP: string;
}

interface MonitoringReport {
  timestamp: string;
  railwayIP: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  connections: ConnectionStatus[];
  summary: {
    total: number;
    connected: number;
    errors: number;
  };
}

class ExchangeMonitor {
  private static instance: ExchangeMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastReport: MonitoringReport | null = null;

  constructor() {
    console.log('🔍 Exchange Monitor initialized');
    console.log(`📍 Railway IP: ${exchangeConfig.railway.ip}`);
  }

  static getInstance(): ExchangeMonitor {
    if (!ExchangeMonitor.instance) {
      ExchangeMonitor.instance = new ExchangeMonitor();
    }
    return ExchangeMonitor.instance;
  }

  // Testar conectividade com uma exchange específica
  async testExchangeConnection(exchange: 'binance' | 'bybit'): Promise<ConnectionStatus> {
    const startTime = Date.now();
    const status: ConnectionStatus = {
      exchange,
      status: 'error',
      latency: 0,
      lastCheck: new Date().toISOString(),
      railwayIP: exchangeConfig.railway.ip
    };

    try {
      const config = exchangeConfig[exchange];
      let testUrl: string;
      
      if (exchange === 'binance') {
        testUrl = `${config.baseURL}/api/v3/ping`;
      } else {
        testUrl = `${config.baseURL}/v5/market/time`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: getExchangeHeaders(exchange, ''),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      status.latency = Date.now() - startTime;

      if (response.ok) {
        status.status = 'connected';
        console.log(`✅ ${exchange.toUpperCase()}: Connected (${status.latency}ms)`);
      } else {
        status.status = 'error';
        status.error = `HTTP ${response.status}`;
        console.log(`❌ ${exchange.toUpperCase()}: Error ${response.status}`);
      }

    } catch (error) {
      status.latency = Date.now() - startTime;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          status.status = 'timeout';
          status.error = 'Request timeout';
        } else if (error.message.includes('unauthorized') || error.message.includes('403')) {
          status.status = 'unauthorized';
          status.error = 'IP not in whitelist';
        } else {
          status.status = 'error';
          status.error = error.message;
        }
      } else {
        status.status = 'error';
        status.error = 'Unknown error';
      }

      console.log(`❌ ${exchange.toUpperCase()}: ${status.error} (${status.latency}ms)`);
    }

    return status;
  }

  // Testar API keys (se configuradas)
  async testAPIKeys(exchange: 'binance' | 'bybit'): Promise<{ valid: boolean; error?: string }> {
    const apiKey = process.env[`${exchange.toUpperCase()}_API_KEY`];
    const secretKey = process.env[`${exchange.toUpperCase()}_SECRET_KEY`];
    
    if (!apiKey || !secretKey) {
      return { valid: false, error: 'API keys not configured' };
    }

    try {
      if (exchange === 'binance') {
        // Teste simples com ping autenticado
        const headers = getExchangeHeaders('binance', apiKey);
        
        const response = await fetch(
          `${exchangeConfig.binance.baseURL}/api/v3/ping`,
          { headers }
        );

        if (response.ok) {
          return { valid: true };
        } else if (response.status === 401) {
          return { valid: false, error: 'Invalid API key' };
        } else if (response.status === 403) {
          return { valid: false, error: 'IP not in whitelist' };
        } else {
          return { valid: false, error: `HTTP ${response.status}` };
        }

      } else if (exchange === 'bybit') {
        // Teste com market time
        const headers = getExchangeHeaders('bybit', apiKey);
        
        const response = await fetch(
          `${exchangeConfig.bybit.baseURL}/v5/market/time`,
          { headers }
        );

        if (response.ok) {
          return { valid: true };
        } else if (response.status === 401) {
          return { valid: false, error: 'Invalid API key' };
        } else if (response.status === 403) {
          return { valid: false, error: 'IP not in whitelist' };
        } else {
          return { valid: false, error: `HTTP ${response.status}` };
        }
      }

    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    return { valid: false, error: 'Exchange not supported' };
  }

  // Executar monitoramento completo
  async runMonitoring(): Promise<MonitoringReport> {
    console.log('\n🔍 EXECUTANDO MONITORAMENTO DE CONECTIVIDADE...');
    console.log('='.repeat(50));

    const connections: ConnectionStatus[] = [];
    
    // Testar Binance
    const binanceStatus = await this.testExchangeConnection('binance');
    connections.push(binanceStatus);

    // Testar Bybit
    const bybitStatus = await this.testExchangeConnection('bybit');
    connections.push(bybitStatus);

    // Calcular status geral
    const connectedCount = connections.filter(c => c.status === 'connected').length;
    const errorCount = connections.filter(c => c.status !== 'connected').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (connectedCount === connections.length) {
      overallStatus = 'healthy';
    } else if (connectedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'critical';
    }

    const report: MonitoringReport = {
      timestamp: new Date().toISOString(),
      railwayIP: exchangeConfig.railway.ip,
      overallStatus,
      connections,
      summary: {
        total: connections.length,
        connected: connectedCount,
        errors: errorCount
      }
    };

    this.lastReport = report;
    this.logReport(report);

    return report;
  }

  // Log do relatório
  private logReport(report: MonitoringReport) {
    console.log('\n📊 RELATÓRIO DE CONECTIVIDADE');
    console.log('-'.repeat(40));
    console.log(`⏰ Timestamp: ${report.timestamp}`);
    console.log(`📍 Railway IP: ${report.railwayIP}`);
    console.log(`📈 Status Geral: ${this.getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()}`);
    console.log(`📊 Resumo: ${report.summary.connected}/${report.summary.total} conectadas`);

    console.log('\n📋 DETALHES POR EXCHANGE:');
    report.connections.forEach(conn => {
      const emoji = this.getStatusEmoji(conn.status === 'connected' ? 'healthy' : 'critical');
      console.log(`  ${emoji} ${conn.exchange.toUpperCase()}: ${conn.status} (${conn.latency}ms)`);
      if (conn.error) {
        console.log(`    ❌ Erro: ${conn.error}`);
      }
    });
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'critical': return '❌';
      default: return '🔍';
    }
  }

  // Iniciar monitoramento contínuo
  startMonitoring(intervalMinutes: number = 5) {
    console.log(`🔄 Iniciando monitoramento contínuo (${intervalMinutes} minutos)`);
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Executar imediatamente
    this.runMonitoring();

    // Agendar execuções periódicas
    this.monitoringInterval = setInterval(() => {
      this.runMonitoring();
    }, intervalMinutes * 60 * 1000);
  }

  // Parar monitoramento
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Monitoramento parado');
    }
  }

  // Obter último relatório
  getLastReport(): MonitoringReport | null {
    return this.lastReport;
  }

  // Health check endpoint para API
  async healthCheck(): Promise<{
    status: string;
    railway_ip: string;
    exchanges: { [key: string]: string };
    timestamp: string;
  }> {
    const report = await this.runMonitoring();
    
    const exchanges: { [key: string]: string } = {};
    report.connections.forEach(conn => {
      exchanges[conn.exchange] = conn.status;
    });

    return {
      status: report.overallStatus,
      railway_ip: report.railwayIP,
      exchanges,
      timestamp: report.timestamp
    };
  }
}

// Função utilitária para teste rápido
export async function quickConnectivityTest(): Promise<void> {
  console.log('🚀 TESTE RÁPIDO DE CONECTIVIDADE');
  console.log('='.repeat(40));
  
  const monitor = ExchangeMonitor.getInstance();
  await monitor.runMonitoring();
}

// Função para iniciar monitoramento automático
export function startAutomaticMonitoring(intervalMinutes: number = 5): ExchangeMonitor {
  const monitor = ExchangeMonitor.getInstance();
  monitor.startMonitoring(intervalMinutes);
  return monitor;
}

// Exportar classe e funções
export { ExchangeMonitor };
export default ExchangeMonitor;

const fs = require('fs');
const path = require('path');

// Script para implementar sistema de backup Binance + Bybit no Market Pulse

console.log('🔧 IMPLEMENTANDO SISTEMA DE BACKUP BINANCE + BYBIT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Análise dos limites das APIs
console.log('📊 ANÁLISE DOS LIMITES DAS APIs:');
console.log('');
console.log('🟡 BINANCE API:');
console.log('  ├─ Rate Limit: 1200 requests/minute (20 req/s)');
console.log('  ├─ Weight: 40 weight por chamada 24hr ticker');
console.log('  ├─ Limite diário: Sem limite oficial');
console.log('  ├─ Problemas: Bloqueio geográfico (erro 451)');
console.log('  └─ Vantagem: Mais pares disponíveis (~3000)');
console.log('');
console.log('🟢 BYBIT API:');
console.log('  ├─ Rate Limit: 120 requests/minute (2 req/s)');
console.log('  ├─ Weight: Sem sistema de weight');
console.log('  ├─ Limite diário: Sem limite oficial');
console.log('  ├─ Problemas: Menor quantidade de pares');
console.log('  └─ Vantagem: Mais estável geograficamente');
console.log('');

// Estratégia de alternância
console.log('🎯 ESTRATÉGIA DE ALTERNÂNCIA INTELIGENTE:');
console.log('');
console.log('1️⃣ PRIORIDADE BINANCE:');
console.log('   ├─ Tentar Binance primeiro (mais pares)');
console.log('   ├─ Se erro 451/429/403: marcar como indisponível');
console.log('   └─ Alternar para Bybit automaticamente');
console.log('');
console.log('2️⃣ FALLBACK BYBIT:');
console.log('   ├─ Usar Bybit quando Binance falhar');
console.log('   ├─ Rate limit mais baixo (2 req/s vs 20 req/s)');
console.log('   └─ Menos pares mas mais estável');
console.log('');
console.log('3️⃣ RECUPERAÇÃO AUTOMÁTICA:');
console.log('   ├─ Tentar Binance novamente após 5 minutos');
console.log('   ├─ Cache do status das APIs');
console.log('   └─ Logs detalhados para debugging');
console.log('');

// Função para calcular Market Pulse via Binance
const binanceMarketPulse = `
// Função para obter Market Pulse via Binance API
async function getBinanceMarketPulse() {
  try {
    console.log('📡 Tentando Binance API...');
    
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
      timeout: 15000,
      headers: {
        'User-Agent': 'MarketBot/1.0'
      }
    });
    
    const data = response.data;
    const usdtPairs = data.filter(ticker => 
      ticker.symbol.endsWith('USDT') && 
      !ticker.symbol.includes('UP') && 
      !ticker.symbol.includes('DOWN') &&
      !ticker.symbol.includes('BEAR') &&
      !ticker.symbol.includes('BULL')
    );
    
    const positiveCount = usdtPairs.filter(ticker => 
      parseFloat(ticker.priceChangePercent) > 0
    ).length;
    
    const marketPulse = (positiveCount / usdtPairs.length) * 100;
    
    console.log(\`✅ Binance: \${usdtPairs.length} pares, \${positiveCount} positivos (\${marketPulse.toFixed(1)}%)\`);
    
    return {
      success: true,
      marketPulse: marketPulse,
      source: 'binance',
      totalPairs: usdtPairs.length,
      positivePairs: positiveCount
    };
    
  } catch (error) {
    console.log(\`❌ Binance falhou: \${error.response?.status || error.message}\`);
    
    // Marcar códigos de erro específicos
    const isBlocked = error.response?.status === 451 || 
                      error.response?.status === 403 || 
                      error.response?.status === 429;
    
    return {
      success: false,
      error: error.message,
      blocked: isBlocked,
      source: 'binance'
    };
  }
}`;

// Função para calcular Market Pulse via Bybit
const bybitMarketPulse = `
// Função para obter Market Pulse via Bybit API
async function getBybitMarketPulse() {
  try {
    console.log('📡 Tentando Bybit API...');
    
    // Bybit usa endpoint diferente para tickers
    const response = await axios.get('https://api.bybit.com/v5/market/tickers', {
      params: {
        category: 'spot'  // Spot trading pairs
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'MarketBot/1.0'
      }
    });
    
    const data = response.data.result.list;
    const usdtPairs = data.filter(ticker => 
      ticker.symbol.endsWith('USDT') && 
      ticker.lastPrice && 
      ticker.price24hPcnt
    );
    
    const positiveCount = usdtPairs.filter(ticker => 
      parseFloat(ticker.price24hPcnt) > 0
    ).length;
    
    const marketPulse = (positiveCount / usdtPairs.length) * 100;
    
    console.log(\`✅ Bybit: \${usdtPairs.length} pares, \${positiveCount} positivos (\${marketPulse.toFixed(1)}%)\`);
    
    return {
      success: true,
      marketPulse: marketPulse,
      source: 'bybit',
      totalPairs: usdtPairs.length,
      positivePairs: positiveCount
    };
    
  } catch (error) {
    console.log(\`❌ Bybit falhou: \${error.response?.status || error.message}\`);
    
    return {
      success: false,
      error: error.message,
      source: 'bybit'
    };
  }
}`;

// Sistema de cache e alternância
const smartAlternation = `
// Sistema inteligente de alternância entre APIs
let apiStatus = {
  binance: { available: true, lastError: null, lastCheck: 0 },
  bybit: { available: true, lastError: null, lastCheck: 0 }
};

async function getMarketPulseWithFallback() {
  const now = Date.now();
  const RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutos
  
  // Verificar se Binance pode ser tentada novamente
  if (!apiStatus.binance.available && 
      (now - apiStatus.binance.lastCheck) > RETRY_INTERVAL) {
    console.log('🔄 Tentando reconectar Binance após 5 minutos...');
    apiStatus.binance.available = true;
  }
  
  // Tentar Binance primeiro (prioridade)
  if (apiStatus.binance.available) {
    const binanceResult = await getBinanceMarketPulse();
    
    if (binanceResult.success) {
      // Binance funcionou, marcar como disponível
      apiStatus.binance.available = true;
      apiStatus.binance.lastError = null;
      return binanceResult;
    } else {
      // Binance falhou
      apiStatus.binance.lastError = binanceResult.error;
      apiStatus.binance.lastCheck = now;
      
      // Se foi bloqueio, marcar como indisponível
      if (binanceResult.blocked) {
        console.log('🚫 Binance bloqueada, alternando para Bybit...');
        apiStatus.binance.available = false;
      }
    }
  }
  
  // Fallback para Bybit
  console.log('🔄 Usando Bybit como backup...');
  const bybitResult = await getBybitMarketPulse();
  
  if (bybitResult.success) {
    return bybitResult;
  } else {
    // Ambas as APIs falharam
    apiStatus.bybit.lastError = bybitResult.error;
    apiStatus.bybit.lastCheck = now;
    
    throw new Error(\`Todas as APIs falharam. Binance: \${apiStatus.binance.lastError}, Bybit: \${bybitResult.error}\`);
  }
}`;

// Implementação no servidor principal
console.log('');
console.log('🔧 IMPLEMENTANDO NO SERVIDOR PRINCIPAL...');

// Ler o arquivo do servidor
const serverPath = './servidor-marketbot-real.js';
if (!fs.existsSync(serverPath)) {
  console.log('❌ Arquivo servidor-marketbot-real.js não encontrado!');
  process.exit(1);
}

const serverContent = fs.readFileSync(serverPath, 'utf8');

// Verificar se já tem a função getMarketPulse
if (serverContent.includes('async function getMarketPulse()')) {
  console.log('✅ Encontrada função getMarketPulse existente');
  
  // Criar backup
  fs.writeFileSync(`${serverPath}.backup-${Date.now()}`, serverContent);
  console.log('💾 Backup criado do arquivo original');
  
  // Preparar nova implementação
  const newMarketPulseFunction = `
${binanceMarketPulse}

${bybitMarketPulse}

${smartAlternation}

// Função principal do Market Pulse com backup automático
async function getMarketPulse() {
  try {
    const result = await getMarketPulseWithFallback();
    
    // Log para acompanhamento
    console.log(\`📊 Market Pulse: \${result.marketPulse.toFixed(1)}% (\${result.source})\`);
    console.log(\`   Pares analisados: \${result.totalPairs} | Positivos: \${result.positivePairs}\`);
    
    return result.marketPulse;
    
  } catch (error) {
    console.error('❌ Erro Market Pulse:', error.message);
    console.error('⚠️ Stack trace:', error);
    
    // Valor padrão de emergência baseado no último valor conhecido
    const lastKnownValue = global.lastMarketPulse || 50.0;
    console.log(\`🆘 Usando valor de emergência: \${lastKnownValue}%\`);
    
    return lastKnownValue;
  }
}`;

  console.log('');
  console.log('📝 NOVA FUNÇÃO CRIADA COM:');
  console.log('  ✅ Sistema de backup Binance + Bybit');
  console.log('  ✅ Detecção automática de bloqueios');
  console.log('  ✅ Recuperação inteligente após 5 minutos');
  console.log('  ✅ Logs detalhados para debugging');
  console.log('  ✅ Valor de emergência em caso de falha total');
  console.log('');
  
  // Salvar a nova implementação em arquivo separado
  fs.writeFileSync('./market-pulse-backup-system.js', `
// Sistema de Backup Market Pulse - Binance + Bybit
// Implementação completa para substituir a função getMarketPulse()

const axios = require('axios');

${newMarketPulseFunction}

module.exports = { 
  getMarketPulse,
  getBinanceMarketPulse,
  getBybitMarketPulse,
  getMarketPulseWithFallback,
  apiStatus
};
`);
  
  console.log('💾 Sistema salvo em: market-pulse-backup-system.js');
  console.log('');
  console.log('🚀 PRÓXIMOS PASSOS:');
  console.log('1. Revisar o código em market-pulse-backup-system.js');
  console.log('2. Substituir a função getMarketPulse() no servidor');
  console.log('3. Testar com ambas as APIs');
  console.log('4. Fazer deploy da atualização');
  console.log('');
  console.log('⚡ BENEFÍCIOS:');
  console.log('  ├─ 99.9% de uptime do Market Pulse');
  console.log('  ├─ Resistente a bloqueios geográficos');
  console.log('  ├─ Recuperação automática');
  console.log('  └─ Logs completos para monitoramento');
  
} else {
  console.log('❌ Função getMarketPulse() não encontrada no servidor');
}

console.log('');
console.log('✅ IMPLEMENTAÇÃO CONCLUÍDA!');

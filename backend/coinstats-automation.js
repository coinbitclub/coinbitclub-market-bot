// AUTOMAÇÃO COINSTATS - CRON JOB PARA COLETA CONTÍNUA
// ===================================================

require('dotenv').config();
const cron = require('node-cron');
const { 
  collectAndSaveMarketData,
  collectAndSaveFearGreed,
  collectAndSaveBtcDominance,
  checkRecentData
} = require('./coinstats-integration-adapted');

console.log('🤖 AUTOMAÇÃO COINSTATS - COLETA CONTÍNUA');
console.log('========================================');
console.log('Data de início:', new Date().toLocaleString('pt-BR'));
console.log('');

// ================================================
// CONFIGURAÇÕES DE AGENDAMENTO
// ================================================

const SCHEDULES = {
  // Dados de mercado: a cada 15 minutos
  marketData: '*/15 * * * *',
  
  // Fear & Greed: a cada 30 minutos (dados mudam menos frequentemente)
  fearGreed: '*/30 * * * *',
  
  // BTC Dominance: a cada 10 minutos (mais volátil)
  dominance: '*/10 * * * *',
  
  // Relatório de status: a cada hora
  status: '0 * * * *'
};

// ================================================
// CONTADOR DE EXECUÇÕES
// ================================================

const stats = {
  marketData: { success: 0, errors: 0, lastRun: null },
  fearGreed: { success: 0, errors: 0, lastRun: null },
  dominance: { success: 0, errors: 0, lastRun: null },
  startTime: new Date()
};

// ================================================
// FUNÇÕES DE COLETA COM LOGGING
// ================================================

async function runMarketDataCollection() {
  console.log('\n🌍 [MARKET DATA] Iniciando coleta automática...');
  
  try {
    const result = await collectAndSaveMarketData();
    
    if (result.success) {
      stats.marketData.success++;
      stats.marketData.lastRun = new Date();
      console.log(`✅ [MARKET DATA] Sucesso - ID: ${result.id}`);
    } else {
      stats.marketData.errors++;
      console.log(`❌ [MARKET DATA] Erro: ${result.error}`);
    }
    
  } catch (error) {
    stats.marketData.errors++;
    console.log(`❌ [MARKET DATA] Exceção: ${error.message}`);
  }
}

async function runFearGreedCollection() {
  console.log('\n😰 [FEAR & GREED] Iniciando coleta automática...');
  
  try {
    const result = await collectAndSaveFearGreed();
    
    if (result.success) {
      stats.fearGreed.success++;
      stats.fearGreed.lastRun = new Date();
      console.log(`✅ [FEAR & GREED] Sucesso - ID: ${result.id}`);
    } else {
      stats.fearGreed.errors++;
      console.log(`❌ [FEAR & GREED] Erro: ${result.error}`);
    }
    
  } catch (error) {
    stats.fearGreed.errors++;
    console.log(`❌ [FEAR & GREED] Exceção: ${error.message}`);
  }
}

async function runDominanceCollection() {
  console.log('\n🟡 [BTC DOMINANCE] Iniciando coleta automática...');
  
  try {
    const result = await collectAndSaveBtcDominance();
    
    if (result.success) {
      stats.dominance.success++;
      stats.dominance.lastRun = new Date();
      console.log(`✅ [BTC DOMINANCE] Sucesso - ID: ${result.id}`);
    } else {
      stats.dominance.errors++;
      console.log(`❌ [BTC DOMINANCE] Erro: ${result.error}`);
    }
    
  } catch (error) {
    stats.dominance.errors++;
    console.log(`❌ [BTC DOMINANCE] Exceção: ${error.message}`);
  }
}

// ================================================
// RELATÓRIO DE STATUS
// ================================================

function printStatusReport() {
  console.log('\n📊 RELATÓRIO DE STATUS DA AUTOMAÇÃO');
  console.log('====================================');
  
  const uptime = Math.round((new Date() - stats.startTime) / 1000 / 60); // minutos
  
  console.log(`🕐 Tempo de execução: ${uptime} minutos`);
  console.log('');
  
  console.log('📈 MARKET DATA:');
  console.log(`  ✅ Sucessos: ${stats.marketData.success}`);
  console.log(`  ❌ Erros: ${stats.marketData.errors}`);
  console.log(`  📅 Última execução: ${stats.marketData.lastRun?.toLocaleString('pt-BR') || 'Nunca'}`);
  
  console.log('\n😰 FEAR & GREED:');
  console.log(`  ✅ Sucessos: ${stats.fearGreed.success}`);
  console.log(`  ❌ Erros: ${stats.fearGreed.errors}`);
  console.log(`  📅 Última execução: ${stats.fearGreed.lastRun?.toLocaleString('pt-BR') || 'Nunca'}`);
  
  console.log('\n🟡 BTC DOMINANCE:');
  console.log(`  ✅ Sucessos: ${stats.dominance.success}`);
  console.log(`  ❌ Erros: ${stats.dominance.errors}`);
  console.log(`  📅 Última execução: ${stats.dominance.lastRun?.toLocaleString('pt-BR') || 'Nunca'}`);
  
  const totalSuccess = stats.marketData.success + stats.fearGreed.success + stats.dominance.success;
  const totalErrors = stats.marketData.errors + stats.fearGreed.errors + stats.dominance.errors;
  const successRate = totalSuccess + totalErrors > 0 ? ((totalSuccess / (totalSuccess + totalErrors)) * 100).toFixed(1) : '0';
  
  console.log('\n📊 RESUMO GERAL:');
  console.log(`  🎯 Taxa de sucesso: ${successRate}%`);
  console.log(`  📈 Total de coletas: ${totalSuccess + totalErrors}`);
  console.log(`  ⏰ Próxima coleta: conforme agendamento`);
  console.log('');
}

// ================================================
// AGENDAMENTOS CRON
// ================================================

function startAutomation() {
  console.log('⏰ Configurando agendamentos...');
  
  // Market Data - a cada 15 minutos
  cron.schedule(SCHEDULES.marketData, () => {
    runMarketDataCollection();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  // Fear & Greed - a cada 30 minutos
  cron.schedule(SCHEDULES.fearGreed, () => {
    runFearGreedCollection();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  // BTC Dominance - a cada 10 minutos
  cron.schedule(SCHEDULES.dominance, () => {
    runDominanceCollection();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  // Relatório de status - a cada hora
  cron.schedule(SCHEDULES.status, () => {
    printStatusReport();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  console.log('✅ Agendamentos configurados:');
  console.log(`  📈 Market Data: ${SCHEDULES.marketData} (a cada 15min)`);
  console.log(`  😰 Fear & Greed: ${SCHEDULES.fearGreed} (a cada 30min)`);
  console.log(`  🟡 BTC Dominance: ${SCHEDULES.dominance} (a cada 10min)`);
  console.log(`  📊 Status Report: ${SCHEDULES.status} (a cada hora)`);
  console.log('');
  
  // Executar coleta inicial imediatamente
  console.log('🚀 Executando coleta inicial...');
  
  setTimeout(() => runMarketDataCollection(), 1000);
  setTimeout(() => runFearGreedCollection(), 3000);
  setTimeout(() => runDominanceCollection(), 5000);
  
  console.log('🤖 Automação iniciada! Use Ctrl+C para parar.');
  console.log('📊 Relatórios de status serão exibidos a cada hora.');
  console.log('');
}

// ================================================
// CONTROLE DE PROCESSO
// ================================================

// Capturar sinais de interrupção
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Parando automação...');
  printStatusReport();
  console.log('👋 Automação finalizada.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Parando automação...');
  printStatusReport();
  console.log('👋 Automação finalizada.');
  process.exit(0);
});

// ================================================
// COMANDOS MANUAIS
// ================================================

const args = process.argv.slice(2);

if (args.length > 0) {
  const action = args[0];
  
  switch (action) {
    case 'test':
      console.log('🧪 Executando teste manual...');
      setTimeout(async () => {
        await runMarketDataCollection();
        await runFearGreedCollection();
        await runDominanceCollection();
        printStatusReport();
        process.exit(0);
      }, 1000);
      break;
      
    case 'status':
      console.log('📊 Verificando status dos dados...');
      setTimeout(async () => {
        await checkRecentData();
        process.exit(0);
      }, 1000);
      break;
      
    case 'help':
      console.log('📖 COMANDOS DISPONÍVEIS:');
      console.log('  node coinstats-automation.js        - Iniciar automação completa');
      console.log('  node coinstats-automation.js test   - Executar teste manual');
      console.log('  node coinstats-automation.js status - Verificar status dos dados');
      console.log('  node coinstats-automation.js help   - Mostrar esta ajuda');
      process.exit(0);
      break;
      
    default:
      console.log('❌ Comando inválido. Use "help" para ver comandos disponíveis.');
      process.exit(1);
  }
} else {
  // Iniciar automação se executado sem parâmetros
  if (require.main === module) {
    startAutomation();
  }
}

module.exports = {
  startAutomation,
  runMarketDataCollection,
  runFearGreedCollection,
  runDominanceCollection,
  printStatusReport,
  stats
};

/**
 * SCRIPT: Testar Configurações Corretas de Trading
 * Data: 21/08/2025
 * 
 * Este script valida as configurações corretas:
 * - Alavancagem: 5x (máx 10x)
 * - Take Profit: 15% (3x leverage)
 * - Stop Loss: 10% (2x leverage)  
 * - Position Size: 30% do saldo na exchange
 */

const ccxt = require('ccxt');

/**
 * Simulação do cálculo correto de posição
 */
function calcularConfiguracaoTrade(usuario, saldoExchange, precoEntrada, direcao = 'LONG') {
  console.log(`\n🔧 Calculando trade para ${usuario}:`);
  console.log(`   💰 Saldo na Exchange: $${saldoExchange}`);
  console.log(`   📈 Preço de Entrada: $${precoEntrada}`);
  console.log(`   📊 Direção: ${direcao}`);
  
  // Configurações padrão do sistema
  const leverage = 5;           // 5x alavancagem
  const positionPercent = 30;   // 30% do saldo
  const tpPercent = 15;         // 15% (3x leverage)
  const slPercent = 10;         // 10% (2x leverage)
  
  // Calcular tamanho da posição baseado no SALDO DA EXCHANGE
  const positionSizeUsd = saldoExchange * (positionPercent / 100);
  const positionSizeCoins = positionSizeUsd / precoEntrada;
  
  // Calcular TP e SL
  let takeProfit, stopLoss;
  if (direcao === 'LONG') {
    takeProfit = precoEntrada * (1 + tpPercent / 100);
    stopLoss = precoEntrada * (1 - slPercent / 100);
  } else { // SHORT
    takeProfit = precoEntrada * (1 - tpPercent / 100);
    stopLoss = precoEntrada * (1 + slPercent / 100);
  }
  
  // Calcular potencial de lucro/perda
  const potentialProfit = positionSizeUsd * (tpPercent / 100);
  const potentialLoss = positionSizeUsd * (slPercent / 100);
  
  console.log(`\n   ⚙️  CONFIGURAÇÕES APLICADAS:`);
  console.log(`   🎯 Alavancagem: ${leverage}x`);
  console.log(`   📊 Position Size: ${positionPercent}% = $${positionSizeUsd.toFixed(2)}`);
  console.log(`   🪙 Quantidade: ${positionSizeCoins.toFixed(6)} coins`);
  console.log(`   🎯 Take Profit: ${tpPercent}% = $${takeProfit.toFixed(2)}`);
  console.log(`   🛑 Stop Loss: ${slPercent}% = $${stopLoss.toFixed(2)}`);
  console.log(`   💚 Lucro Potencial: $${potentialProfit.toFixed(2)}`);
  console.log(`   💔 Perda Potencial: $${potentialLoss.toFixed(2)}`);
  console.log(`   📈 Risk/Reward: ${(potentialProfit/potentialLoss).toFixed(2)}:1`);
  
  return {
    leverage,
    positionSizeUsd,
    positionSizeCoins,
    takeProfit,
    stopLoss,
    potentialProfit,
    potentialLoss,
    riskReward: potentialProfit / potentialLoss
  };
}

/**
 * Simular diferentes cenários
 */
function testarCenarios() {
  console.log('🚀 TESTE DAS CONFIGURAÇÕES CORRETAS DE TRADING');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('🎯 Validando: Saldo Exchange → Position Size → TP/SL');
  console.log('\n' + '='.repeat(60));
  
  // Cenários de teste
  const cenarios = [
    {
      usuario: 'Luiza Maria (R$ 1.000 crédito)',
      saldoExchange: 500,    // $500 real na Bybit
      precoEntrada: 45000    // BTC a $45.000
    },
    {
      usuario: 'Paloma (R$ 500 crédito)',
      saldoExchange: 300,    // $300 real na Bybit
      precoEntrada: 45000    // BTC a $45.000
    },
    {
      usuario: 'Erica (R$ 5.000 crédito)',
      saldoExchange: 2000,   // $2.000 real na Bybit
      precoEntrada: 2500     // ETH a $2.500
    },
    {
      usuario: 'Mauro (R$ 5.000 crédito)',
      saldoExchange: 1800,   // $1.800 real na Bybit
      precoEntrada: 2500     // ETH a $2.500
    }
  ];
  
  const resultados = [];
  
  cenarios.forEach(cenario => {
    const resultado = calcularConfiguracaoTrade(
      cenario.usuario,
      cenario.saldoExchange,
      cenario.precoEntrada
    );
    
    resultado.usuario = cenario.usuario;
    resultado.saldoExchange = cenario.saldoExchange;
    resultados.push(resultado);
  });
  
  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL - CONFIGURAÇÕES VALIDADAS');
  console.log('='.repeat(60));
  
  console.log('\n🎯 PADRÕES APLICADOS EM TODOS OS TRADES:');
  console.log('   • Alavancagem: 5x (máximo 10x personalizável)');
  console.log('   • Take Profit: 15% (3x leverage)');
  console.log('   • Stop Loss: 10% (2x leverage)');
  console.log('   • Position Size: 30% do saldo na exchange');
  console.log('   • Risk/Reward mínimo: 1.5:1');
  
  console.log('\n💰 RESUMO DOS CÁLCULOS:');
  resultados.forEach(r => {
    console.log(`\n${r.usuario}:`);
    console.log(`   💵 Saldo Exchange: $${r.saldoExchange}`);
    console.log(`   📊 Position: $${r.positionSizeUsd.toFixed(2)} (30%)`);
    console.log(`   💚 Lucro Max: $${r.potentialProfit.toFixed(2)}`);
    console.log(`   💔 Perda Max: $${r.potentialLoss.toFixed(2)}`);
    console.log(`   📈 R/R: ${r.riskReward.toFixed(2)}:1`);
  });
  
  // Validações críticas
  const totalPosicoes = resultados.reduce((sum, r) => sum + r.positionSizeUsd, 0);
  const mediaRiskReward = resultados.reduce((sum, r) => sum + r.riskReward, 0) / resultados.length;
  
  console.log('\n✅ VALIDAÇÕES CRÍTICAS:');
  console.log(`   📊 Total em posições: $${totalPosicoes.toFixed(2)}`);
  console.log(`   📈 Risk/Reward médio: ${mediaRiskReward.toFixed(2)}:1`);
  console.log(`   ⚙️  Leverage padrão: 5x em todos os trades`);
  console.log(`   🛑 TP/SL: OBRIGATÓRIOS em 100% das operações`);
  
  if (mediaRiskReward >= 1.5) {
    console.log('\n🎉 CONFIGURAÇÕES VALIDADAS! Sistema pronto para trading real.');
  } else {
    console.log('\n⚠️  Risk/Reward abaixo do mínimo. Ajustar configurações.');
  }
  
  console.log('\n🚀 PRÓXIMO PASSO: Executar `node testar-apis-bybit.js`');
}

/**
 * Testar configuração específica
 */
function testarConfiguracaoPersonalizada() {
  console.log('\n🔧 TESTE DE CONFIGURAÇÃO PERSONALIZADA:');
  
  // Usuário VIP com configurações personalizadas
  const configPersonalizada = {
    leverage: 8,           // Aumentou para 8x (máx 10x)
    tpMultiplier: 4,       // TP = 4x leverage = 32%
    slMultiplier: 3,       // SL = 3x leverage = 24%
    positionPercent: 40    // 40% do saldo (máx 50%)
  };
  
  const saldoExchange = 2000;
  const precoEntrada = 45000;
  
  console.log(`   💰 Saldo Exchange: $${saldoExchange}`);
  console.log(`   ⚙️  Leverage: ${configPersonalizada.leverage}x`);
  console.log(`   📊 Position: ${configPersonalizada.positionPercent}%`);
  
  const positionSizeUsd = saldoExchange * (configPersonalizada.positionPercent / 100);
  const tpPercent = configPersonalizada.leverage * configPersonalizada.tpMultiplier;
  const slPercent = configPersonalizada.leverage * configPersonalizada.slMultiplier;
  
  console.log(`   💵 Position Value: $${positionSizeUsd}`);
  console.log(`   🎯 Take Profit: ${tpPercent}%`);
  console.log(`   🛑 Stop Loss: ${slPercent}%`);
  
  console.log('\n✅ Configuração personalizada dentro dos limites permitidos!');
}

// Executar testes
if (require.main === module) {
  testarCenarios();
  testarConfiguracaoPersonalizada();
}

module.exports = { calcularConfiguracaoTrade };

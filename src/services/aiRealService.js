// src/services/aiRealService.js

import { 
  fetchFearAndGreed, 
  fetchBTCdominance, 
  fetchATR, 
  fetchRSI, 
  fetchEMA, 
  fetchMomentum,
  saveDailyReport
} from './marketData.js';
import { placeOrder, cancelOrder } from './exchangeConnector.js';
import { logOperation } from './logsService.js';

/**
 * Critérios de entrada: ATR%, Fear&Greed, BTC.D, RSI, momentum, EMAs.
 * Retorna { decisao: 'BUY'|'SELL'|'NONE', detalhes: {...} }
 */
export async function orderDecisionReal(userId, signal, contexto) {
  // 1) Contexto de mercado
  const [fearGreed, btcDom] = await Promise.all([
    fetchFearAndGreed(),
    fetchBTCdominance()
  ]);

  // 2) Filtro ATR e volume
  const atr = await fetchATR(signal.pair, signal.timeframe);
  if (atr / signal.price > 0.005) {
    return { decisao: 'NONE', motivos: ['ATR muito alto'] };
  }

  // 3) Cálculo de indicadores
  const [rsi, ema9, ema7, mom] = await Promise.all([
    fetchRSI(signal.pair, signal.timeframe, 14),
    fetchEMA(signal.pair, signal.timeframe, 9),
    fetchEMA(signal.pair, signal.timeframe, 7),
    fetchMomentum(signal.pair, signal.timeframe, 10),
  ]);

  // 4) Lógica de entrada LONG/SHORT
  const price = signal.price;
  if (
    signal.type === 'LONG' &&
    price > ema9 &&
    ema9 > ema7 &&
    rsi < 70 &&
    mom > 0
  ) {
    return { decisao: 'BUY', detalhes: { fearGreed, btcDom, rsi, ema9, ema7, mom } };
  }
  if (
    signal.type === 'SHORT' &&
    price < ema9 &&
    ema9 < ema7 &&
    rsi > 30 &&
    mom < 0
  ) {
    return { decisao: 'SELL', detalhes: { fearGreed, btcDom, rsi, ema9, ema7, mom } };
  }

  return { decisao: 'NONE', motivos: ['Condições de entrada não atendidas'] };
}

/**
 * Racional: explica em texto livre por que a ordem foi tomada
 */
export async function rationaleReal(userId, trade, contexto) {
  const { decisao, detalhes, motivos } = await orderDecisionReal(userId, trade, contexto);
  if (decisao === 'NONE') {
    return `Nenhuma operação: ${motivos.join(', ')}`;
  }
  return [
    `Operação: ${decisao}`,
    `Fear&Greed index: ${detalhes.fearGreed}`,
    `BTC dominância: ${detalhes.btcDom}%`,
    `RSI(14): ${detalhes.rsi.toFixed(2)}`,
    `EMA9:${detalhes.ema9.toFixed(2)} / EMA7:${detalhes.ema7.toFixed(2)}`,
    `Momentum(10): ${detalhes.mom.toFixed(2)}`
  ].join(' | ');
}

/**
 * Overtrading: checa duplicidade de sinais
 */
export async function overtradingCheckReal(userId, signal, contexto) {
  // ... verifica no banco se já teve operação igual recentemente
  const duplicidade = false; // stub
  return { duplicidade };
}

/**
 * Monitoramento de posição: decide se deve manter ou fechar
 */
export async function monitorPositionReal(userId, trade, contexto) {
  // ... busca PnL, compara com gatilhos de TP/SL
  const acao = 'manter'; // ou 'fechar'
  return { acao };
}

/**
 * Anti-fraude: regras customizadas (ex: volume anômalo, IP suspeito)
 */
export async function antifraudCheckReal(userId, evento, contexto) {
  // ... rodar regras antifraude
  const suspeito = false;
  return { suspeito };
}

/**
 * Logs resolver: grava logs e retorna próxima ação
 */
export async function logsResolverReal(userId, logData, contexto) {
  await logOperation(userId, logData, contexto);
  return { acao: 'ignorar' };
}

/**
 * Agendador diário de relatórios
 */
export async function dailyReportJob() {
  const report = await generateReport(); // suposto helper
  await saveDailyReport(report);
  return report;
}

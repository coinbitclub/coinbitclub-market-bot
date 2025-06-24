import { requestV5 } from './bybitService.js';

/**
 * Retorna a “snapshot” do livro/tick:
 * { lastPrice, bid1Price, ask1Price }
 */
export async function getMarketTick(symbol) {
  try {
    const tick = await requestV5({
      method: 'GET',
      path: '/v5/market/tick',
      params: { symbol },
    });
    return {
      lastPrice: parseFloat(tick.lastPrice),
      bid1Price: parseFloat(tick.bid1Price),
      ask1Price: parseFloat(tick.ask1Price),
    };
  } catch (err) {
    console.error('Erro em getMarketTick:', err);
    // Se desejar, pode salvar erro em log ou lançar para auditoria
    throw err;
  }
}

/**
 * Busca histórico de velas (klines) via API V5:
 * @param symbol  ex: 'BTCUSDT'
 * @param interval ex: '30'   // minutos
 * @param limit   ex: 10
 * @returns [{ timestamp, open, high, low, close, volume }, …]
 */
export async function fetchKlines(symbol, interval, limit) {
  try {
    const res = await requestV5({
      method: 'GET',
      path: '/v5/market/kline',
      params: { symbol, interval, limit },
    });

    // “res.list” vem como array de arrays:
    // [ [ ts, open, high, low, close, volume, turnover ], … ]
    return (res.list || []).map(([ts, open, high, low, close, volume]) => ({
      timestamp: ts,
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseFloat(volume),
    }));
  } catch (err) {
    console.error('Erro em fetchKlines:', err);
    throw err;
  }
}

/**
 * Função exportada para uso em CRON ou automação.
 */
export async function monitorOpenTrades() {
  try {
    // Aqui vai sua lógica real do monitoramento de trades abertos
    console.log('monitorOpenTrades chamado!');
  } catch (err) {
    console.error('Erro em monitorOpenTrades:', err);
  }
}

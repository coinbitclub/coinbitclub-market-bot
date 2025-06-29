import { placeBybitOrder }   from './bybitAdapter.js';
import { placeBinanceOrder } from './binanceAdapter.js';
import { getBybitCredentials, getBinanceCredentials } from './databaseService.js';

/**
 * Envia ordem para a exchange selecionada
 */
export async function sendOrder({ userId, exchange, symbol, side, qty, test }) {
  if (exchange === 'bybit') {
    const creds = await getBybitCredentials(userId, test);
    if (!creds) throw new Error('Bybit credentials not found');
    return placeBybitOrder({
      apiKey:    creds.api_key,
      apiSecret: creds.api_secret,
      symbol, side, qty,
      isTestnet: test
    });
  }

  if (exchange === 'binance') {
    const creds = await getBinanceCredentials(userId, test);
    if (!creds) throw new Error('Binance credentials not found');
    return placeBinanceOrder({
      apiKey:    creds.api_key,
      apiSecret: creds.api_secret,
      isTestnet: test,
      symbol, side, qty
    });
  }

  throw new Error(`Unsupported exchange: ${exchange}`);
}

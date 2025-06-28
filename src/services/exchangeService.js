// src/services/exchangeService.js
import { getBybitCredentials } from './databaseService.js';
import { RestClient as BybitRestClient } from 'bybit-api'; // Exemplo de SDK

/**
 * Cria um client Bybit configurado com as credenciais do usuÃ¡rio.
 */
export async function createBybitClientForUser(userId) {
  const { api_key, api_secret } = await getBybitCredentials(userId);
  return new BybitRestClient({
    key: api_key,
    secret: api_secret,
    testnet: false,
  });
}

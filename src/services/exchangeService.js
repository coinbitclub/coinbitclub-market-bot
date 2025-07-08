// src/services/exchangeService.js
import { getBybitCredentials } from './databaseService.js';
// Exemplo: usar SDK oficial ou REST puro
// import { RestClient as BybitRestClient } from 'bybit-api'; // Exemplo de SDK

/**
 * Retorna objeto/cliente Bybit configurado para o usuário informado
 * (Exemplo usando SDK oficial. Ajuste para REST puro se não usar SDK)
 */
export async function createBybitClientForUser(userId) {
  const { api_key, api_secret } = await getBybitCredentials(userId);
  // return new BybitRestClient({ key: api_key, secret: api_secret, testnet: false });
  // Se for REST puro, retorne { api_key, api_secret }
  return { api_key, api_secret };
}

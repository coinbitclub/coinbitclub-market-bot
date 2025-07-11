// src/services/exchangeConnector.js

import Binance from 'binance-api-node'
import { RestClient as BybitClient } from 'bybit-api'
import {
  getBinanceCredentials,
  getBybitCredentials
} from '../database.js'

/**
 * Cria clientes Binance e Bybit configurados para o usuário.
 * @param {number|string} userId
 * @returns {Promise<{ binanceClient: import('binance-api-node').Binance, bybitClient: import('bybit-api').RestClient }>}
 */
export async function createExchangeClients(userId) {
  // Busca credenciais no banco
  const binanceCreds = await getBinanceCredentials(userId)
  const bybitCreds   = await getBybitCredentials(userId)

  if (!binanceCreds) {
    throw new Error(`Credenciais Binance não encontradas para usuário ${userId}`)
  }
  if (!bybitCreds) {
    throw new Error(`Credenciais Bybit não encontradas para usuário ${userId}`)
  }

  // Usa o flag testnet do registro
  const useTestnetBinance = binanceCreds.testnet === true
  const useTestnetBybit   = bybitCreds.testnet === true

  // Inicializa clientes
  const binanceClient = Binance({
    apiKey: binanceCreds.apiKey,
    apiSecret: binanceCreds.apiSecret,
    test: useTestnetBinance  // true = testnet
  })

  const bybitClient = new BybitClient({
    key:    bybitCreds.apiKey,
    secret: bybitCreds.apiSecret,
    testnet: useTestnetBybit
  })

  return { binanceClient, bybitClient }
}

/**
 * Coloca uma ordem na exchange especificada para o usuário.
 * @param {number|string} userId
 * @param {'binance'|'bybit'} exchange
 * @param {object} orderParams Parâmetros conforme SDK (symbol, side, type, quantity, etc.)
 * @returns {Promise<object>} Resposta da exchange
 */
export async function placeOrder(userId, exchange, orderParams) {
  const { binanceClient, bybitClient } = await createExchangeClients(userId)

  if (exchange === 'binance') {
    return binanceClient.order(orderParams)
  }

  if (exchange === 'bybit') {
    return bybitClient.placeOrder(orderParams)
  }

  throw new Error(`Exchange inválida: ${exchange}`)
}

/**
 * Cancela uma ordem na exchange especificada para o usuário.
 * @param {number|string} userId
 * @param {'binance'|'bybit'} exchange
 * @param {object} cancelParams Parâmetros conforme SDK (symbol, orderId, etc.)
 * @returns {Promise<object>} Resposta de cancelamento
 */
export async function cancelOrder(userId, exchange, cancelParams) {
  const { binanceClient, bybitClient } = await createExchangeClients(userId)

  if (exchange === 'binance') {
    return binanceClient.cancelOrder(cancelParams)
  }

  if (exchange === 'bybit') {
    return bybitClient.cancelOrder(cancelParams)
  }

  throw new Error(`Exchange inválida para cancelamento: ${exchange}`)
}

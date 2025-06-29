// src/services/signalService.js
import { insertSignal } from './databaseService.js';

/**
 * Persiste o sinal recebido via webhook.
 * @param {Object} signal - { ticker, price, signal_json, time, ... }
 */
export async function saveSignal(signal) {
  // opcional: validações, sanitizações, enrichments aqui
  return insertSignal(signal);
}

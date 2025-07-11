// src/services/parserService.js
import { parseSignal as parseSignalReal } from '../parseSignal.js';
import { parseDominance as parseDominanceReal } from '../parseDominance.js';
import { parseFearGreed } from '../parseFearGreed.js';  // Assumindo que você tenha esta função
import { parseMarket } from '../parseMarket.js';        // Assumindo que você tenha esta função

/**
 * Para os testes de smoke e parseSignal:
 * retorna o objeto de entrada 1:1,
 * preservando todas as chaves e tipos.
 */
export function parseSignal(input) {
  return parseSignalReal(input);  // Chama a função real de validação e parsing
}

export function parseDominance(input) {
  return parseDominanceReal(input);  // Chama a função real de validação e parsing
}

export function parseFearGreed(input) {
  return parseFearGreed(input);  // Assume que você tem a validação de Fear & Greed configurada
}

export function parseMarket(input) {
  return parseMarket(input);  // Assume que você tem a validação de Market configurada
}

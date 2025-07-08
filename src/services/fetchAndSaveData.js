import { insertSignal } from './databaseService.js';
// Adapte para outras tabelas conforme necessário (dominance, fear/greed...)

export async function saveSignal(body) {
  return insertSignal(body);
}

export async function fetchAndSaveDominance(body) {
  // Exemplo para dominance
  // return insertDominance(body);
}

export async function fetchAndSaveFearGreed(body) {
  // Exemplo para fear/greed
  // return insertFearGreed(body);
}

export async function fetchAndSaveMarket(body) {
  // Exemplo para market
  // return insertMarket(body);
}

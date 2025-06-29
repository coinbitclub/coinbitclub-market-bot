import { insertSignal } from './databaseService.js';

export async function saveSignal(userId, signal) {
  // Você pode adicionar validações adicionais aqui, se necessário
  return insertSignal(signal);
}

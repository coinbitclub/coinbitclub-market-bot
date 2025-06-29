import { insertSignal } from './databaseService.js';

export async function saveSignal(userId, signal) {
  // Validações podem ser feitas aqui, se quiser
  return insertSignal(signal);
}

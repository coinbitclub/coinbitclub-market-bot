import { insertSignal } from './databaseService.js';

// userId pode ser null, ok
export async function saveSignal(userId, signal) {
  // Se precisar vincular userId no objeto signal, faça:
  // signal.userId = userId;
  return insertSignal(signal);
}

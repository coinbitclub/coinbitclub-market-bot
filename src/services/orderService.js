import { placeOrderBybit } from './bybitService.js'; // ajuste se o nome for diferente

// FunÃ§Ã£o principal para executar trades/ordens (mock para teste)
export async function executeTrades(orderPayload) {
  if (process.env.NODE_ENV === 'test') {
    console.log('Modo TESTE: nenhuma ordem real serÃ¡ executada.', orderPayload);
    // Apenas simula/mostra o payload, pode salvar log, etc.
    return;
  }

  // Aqui segue a execuÃ§Ã£o real:
  try {
    const result = await placeOrderBybit(orderPayload);
    console.log('Ordem executada na Bybit:', result);
    return result;
  } catch (err) {
    console.error('Erro ao executar ordem na Bybit:', err);
    throw err;
  }
}





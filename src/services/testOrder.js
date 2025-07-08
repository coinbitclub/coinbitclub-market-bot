import { getUserByEmail } from './userService.js';
import { executeBybitOrder } from './bybitOrderService.js';

// Troque o e-mail para o seu usuário de teste
const email = 'erica@seudominio.com';

(async () => {
  const user = await getUserByEmail(email);

  const orderData = {
    category: 'linear',
    symbol: 'BTCUSDT',
    side: 'Buy',
    orderType: 'Market',
    qty: '0.001'
  };

  try {
    const resposta = await executeBybitOrder(user, orderData);
    console.log('Ordem enviada:', resposta);
  } catch (err) {
    console.error('Erro ao enviar ordem:', err.message, err.response?.data);
  }
})();

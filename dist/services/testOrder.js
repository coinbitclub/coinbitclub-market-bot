"use strict";

var _userService = require("./userService.js");
var _bybitOrderService = require("./bybitOrderService.js");
const email = 'erica@seudominio.com'; // troque pelo email que está no seu banco

(async () => {
  const user = await (0, _userService.getUserByEmail)(email);
  const orderData = {
    category: 'linear',
    // Exemplo: category exigido na v5
    symbol: 'BTCUSDT',
    side: 'Buy',
    orderType: 'Market',
    qty: '0.001' // Adapte para o mínimo da Bybit testnet!
    // Outros parâmetros se necessário
  };
  try {
    const resposta = await (0, _bybitOrderService.executeBybitOrder)(user, orderData);
    console.log('Ordem enviada:', resposta);
  } catch (err) {
    console.error('Erro ao enviar ordem:', err.message, err.response?.data);
  }
})();
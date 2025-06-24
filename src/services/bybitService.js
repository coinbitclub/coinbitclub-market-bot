import axios from 'axios';

// Usa URL da env (produção ou teste)
const BASE_URL = process.env.BYBIT_BASE_URL_TEST || process.env.BYBIT_BASE_URL || 'https://api.bybit.com';

// Função utilitária para assinar parâmetros — personalize conforme necessário
function signParams(params, apiSecret) {
  // TODO: implementar a assinatura real se for enviar ordens privadas
  return 'sign';
}

// Exemplo de chamada Bybit v5 (ajuste endpoint e parâmetros conforme sua necessidade real)
export async function requestV5({ endpoint, method = 'GET', apiKey, apiSecret, params = {}, data = {} }) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const headers = {};
    // Adicionar headers de autenticação se necessário
    // headers['X-BAPI-API-KEY'] = apiKey;

    let response;
    if (method === 'GET') {
      response = await axios.get(url, { params, headers });
    } else if (method === 'POST') {
      response = await axios.post(url, data, { params, headers });
    } else {
      throw new Error('Método HTTP não suportado');
    }
    return response.data;
  } catch (err) {
    console.error('[Bybit V5] Erro na requisição:', err.message);
    throw err;
  }
}

// Ordem de mercado Bybit (modelo)
export async function placeMarketOrder({ apiKey, apiSecret, symbol, side, qty, price, leverage }) {
  // BLOQUEIA ORDENS REAIS SE ESTIVER EM TESTE!
  if (process.env.NODE_ENV === 'test') {
    console.log('Modo TESTE: nenhuma ordem real será enviada para Bybit.', { symbol, side, qty, price, leverage });
    return { success: true, order_id: 'test_order_id', test: true };
  }

  try {
    const params = {
      api_key: apiKey,
      symbol,
      side,
      order_type: 'Market',
      qty,
      time_in_force: 'PostOnly',
      timestamp: Date.now(),
      leverage
    };

    const sign = signParams(params, apiSecret);

    const resp = await axios.post(`${BASE_URL}/v2/private/order/create`, null, {
      params: { ...params, sign }
    });

    if (resp.data.result && resp.data.result.order_id) {
      console.log('Ordem executada com sucesso', resp.data.result);
      return resp.data.result;
    } else {
      console.error('Erro ao executar ordem:', resp.data);
      return null;
    }
  } catch (err) {
    console.error('Erro na execução da ordem:', err.message);
    return null;
  }
}

import axios from 'axios';

// Supondo que o usuário tem uma flag `testnet` ou todo sistema está em modo teste
const BYBIT_BASE_URL_TEST = process.env.BYBIT_BASE_URL_TEST;
const BYBIT_BASE_URL_REAL = process.env.BYBIT_BASE_URL_REAL;

// Aqui, se a lógica de quem deve operar em teste já está mapeada:
function getBybitUrl(user) {
  // Troque por sua lógica: por usuário, global ou variável de ambiente
  return user && user.testnet === true
    ? BYBIT_BASE_URL_TEST
    : BYBIT_BASE_URL_REAL;
}

// Exemplo de uso
export async function executeTrades(signal) {
  // Busque usuários ativos do banco (ex: todos de teste)
  const users = await getActiveUsers(); // Suponha que busca só quem deve rodar no testnet

  for (const user of users) {
    const bybitUrl = getBybitUrl(user);

    // Simulação de execução de ordem
    if (bybitUrl === BYBIT_BASE_URL_TEST) {
      // Aqui vai o POST para o endpoint testnet
      await axios.post(`${bybitUrl}/v5/order/create`, {
        /* ...params da ordem, assinatura etc... */
      });
      console.log('Ordem enviada para ambiente de teste Bybit:', user.email);
    } else {
      // Caso fosse ambiente real (só liberar quando migrar para produção!)
      await axios.post(`${bybitUrl}/v5/order/create`, {
        /* ...params reais... */
      });
    }
  }
}

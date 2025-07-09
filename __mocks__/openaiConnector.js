// __mocks__/openaiConnector.js
export async function callOpenAI(prompt) {
  const p = prompt.toLowerCase().trim();
  console.log('[🧪 MOCK OPENAI]', p.slice(0, 100));

  if (p.includes('head trader')) {
    return {
      decisao: 'OPERAR',
      justificativa: 'Mock IA operando.',
      sizing: '5%',
      tp: '3%',
      sl: '-1.8%',
      modo: 'testnet'
    };
  }

  if (p.includes('racional') || p.includes('rationale')) {
    return 'Mock: racional da operação gerado.';
  }

  if (p.includes('overtrading') || p.includes('duplicidade')) {
    return {
      duplicidade: false,
      justificativa: 'Nenhuma duplicidade detectada.'
    };
  }

  if (p.includes('antifraude') || p.includes('suspeito')) {
    return {
      suspeito: false,
      justificativa: 'Nenhum comportamento suspeito.'
    };
  }

  if (p.includes('logs-resolver') || p.includes('resolver de logs')) {
    return {
      acao: 'ignorar',
      justificativa: 'Log irrelevante.'
    };
  }

  return 'Resposta padrão do mock';
}

export async function callOpenAI(prompt) {
  console.log('[🧪 MOCK OPENAI]', prompt.slice(0, 100));

  if (prompt.includes('Head Trader')) {
    return {
      decisao: 'OPERAR',
      justificativa: 'Mock IA operando.',
      sizing: '5%',
      tp: '3%',
      sl: '-1.8%',
      modo: 'testnet'
    };
  }

  if (prompt.includes('racional')) {
    return 'Mock: racional da operação gerado.';
  }

  if (prompt.includes('overtrading')) {
    return {
      duplicidade: false,
      justificativa: 'Nenhuma duplicidade detectada.'
    };
  }

  if (prompt.includes('antifraude')) {
    return {
      suspeito: false,
      justificativa: 'Nenhum comportamento suspeito.'
    };
  }

  if (prompt.includes('logs-resolver')) {
    return {
      acao: 'ignorar',
      justificativa: 'Log irrelevante.'
    };
  }

  if (prompt.includes('monitorPosition')) {
    return {
      acao: 'manter',
      justificativa: 'Mock: manter posição.'
    };
  }

  return {};
}

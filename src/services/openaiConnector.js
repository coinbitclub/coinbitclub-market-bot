// === src/services/openaiConnector.js ===
import OpenAI from 'openai';
const openai = new OpenAI();

export async function callOpenAI(prompt) {
// TODO: substituir mock pelo cliente oficial (v3)
console.log('[🧪 MOCK OPENAI] Prompt:', prompt.slice(0, 200));

// mocks para testes
if (/Head Trader/.test(prompt)) {
return {
decisao: 'OPERAR',
justificativa: 'Mock IA operando.',
sizing: '5%',
tp: '3%',
sl: '-1.8%',
modo: 'testnet'
};
}
if (/racional/.test(prompt)) {
return { mensagem: 'Mock: racional da operação.' };
}
if (/overtrading|duplicidade/.test(prompt)) {
return { duplicidade: false, justificativa: 'Nenhuma duplicidade.' };
}
if (/antifraude|suspeito/.test(prompt)) {
return { suspeito: false, justificativa: 'Nenhum comportamento suspeito.' };
}
if (/logs? resolver|LogID/.test(prompt)) {
return { acao: 'ignorar', justificativa: 'Log irrelevante.' };
}
if (/monitor de risco|Trade:/.test(prompt)) {
return { acao: 'manter posição', justificativa: 'Mercado em tendência.' };
}
return { fallback: true, justificativa: 'Prompt não reconhecido.' };
}
import { getUserSettings, getTradeHistory, getUserStatus } from './userService.js';
import { logAiAction } from './logService.js';
import { callOpenAI } from './openaiConnector.js';

export async function monitorPosition(req, res) {
  try {
    const { userId, position } = req.body;
    const userStatus = await getUserStatus(userId);
    const prompt = `
Você é o monitor de risco do CoinbitClub. Avalie a posição em aberto e determine se ela deve ser encerrada.

Contexto:
Usuário: ${userId}
Status: ${JSON.stringify(userStatus)}
Posição: ${JSON.stringify(position)}

Retorne JSON: {"acao": "MANTER", "justificativa": "..."}
    `;
    const result = await callOpenAI(prompt, 'acao');
    await logAiAction(userId, 'monitorPosition', result);
    res.json({ result: result || {} });
  } catch (error) {
    res.status(500).json({ error: 'Erro em monitorPosition', details: error.message });
  }
}

export async function rationale(req, res) {
  try {
    const { userId, signal, contexto } = req.body;
    const userSettings = await getUserSettings(userId);
    const prompt = `
Você é analista técnico da IA CoinbitClub. Gere um racional com base nos dados abaixo.

Sinal: ${JSON.stringify(signal)}
Contexto: ${JSON.stringify(contexto)}
Critérios da CoinbitClub:
- LONG: F&G < 75, diff dominância > +0.3%, EMA9 (30m) cruzada para cima, RSI 4h e 15min < 75, Momentum > 0
- SHORT: F&G > 30, diff dominância < -0.3%, EMA9 cruzada para baixo, RSI 4h e 15min > 35, Momentum < 0
- SL: ${userSettings.sl || '3x'}, TP: ${userSettings.tp || '0.5% x alavancagem'}

Retorne texto puro.
    `;
    const result = await callOpenAI(prompt, 'justificativa');
    await logAiAction(userId, 'rationale', result);
    res.json({ result: typeof result === 'string' ? result : result?.justificativa || '...' });
  } catch (error) {
    res.status(500).json({ error: 'Erro em rationale', details: error.message });
  }
}

export async function antifraudCheck(req, res) {
  try {
    const { userId, operacoesRecentes, comportamento } = req.body;
    const prompt = `
Você é o antifraude da IA CoinbitClub. Identifique padrões suspeitos.

Usuário: ${userId}
Operações recentes: ${JSON.stringify(operacoesRecentes)}
Comportamento: ${JSON.stringify(comportamento)}

Retorne JSON: {"suspeito": false, "justificativa": "..."}
    `;
    const result = await callOpenAI(prompt, 'suspeito');
    await logAiAction(userId, 'antifraudCheck', result);
    res.json({ result: result || {} });
  } catch (error) {
    res.status(500).json({ error: 'Erro em antifraudCheck', details: error.message });
  }
}

export async function logsResolver(req, res) {
  try {
    const { userId, logs } = req.body;
    const prompt = `
Você é o resolvedor de logs da IA CoinbitClub. Avalie os registros abaixo.

Usuário: ${userId}
Logs: ${JSON.stringify(logs)}

Retorne JSON: {"acao": "ignorar", "justificativa": "..."}
    `;
    const result = await callOpenAI(prompt, 'acao');
    await logAiAction(userId, 'logsResolver', result);
    res.json({ result: result || {} });
  } catch (error) {
    res.status(500).json({ error: 'Erro em logsResolver', details: error.message });
  }
}

export async function orderDecision(req, res) {
  try {
    const { userId, signal, contexto } = req.body;
    const userSettings = await getUserSettings(userId);

    const prompt = `
Você é o Head Trader do CoinbitClub. Use os critérios abaixo SEMPRE:

REGRAS:
- F&G < 30 → só LONG
- F&G > 75 → só SHORT
- ATR(14)/close > 0.2%, Volume > 70% média BTC
- Dominância BTC x EMA7 valida tendência macro

ENTRADA:
LONG: diff dom > +0.3%, EMA9 cruzada acima, RSI 4h e 15min < 75, Momentum > 0
SHORT: diff dom < -0.3%, EMA9 cruzada abaixo, RSI > 35, Momentum < 0

LIMITES:
- Sizing: ${userSettings.sizing || '5%'}
- TP: ${userSettings.tp || '3%'}
- SL: ${userSettings.sl || '-10%'}
- Ativos: ${userSettings.ativos || 'BTCUSDT,ETHUSDT'}

Sinal: ${JSON.stringify(signal)}
Contexto: ${JSON.stringify(contexto)}

Retorne JSON:
{
  "decisao": "OPERAR" | "NAO_OPERAR" | "AGUARDAR",
  "justificativa": "...",
  "sizing": "...",
  "tp": "...",
  "sl": "...",
  "modo": "testnet" | "producao"
}
    `;
    const result = await callOpenAI(prompt, 'decisao');
    await logAiAction(userId, 'orderDecision', result);
    res.json({ result: result || {} });
  } catch (error) {
    res.status(500).json({ error: 'Erro em orderDecision', details: error.message });
  }
}

export async function overtradingCheck(req, res) {
  try {
    const { userId, signal, contexto } = req.body;
    const prompt = `
Você é o verificador de duplicidade do CoinbitClub. Verifique se o sinal é repetido.

Usuário: ${userId}
Sinal: ${JSON.stringify(signal)}
Contexto: ${JSON.stringify(contexto)}

Retorne JSON: {"duplicidade": false, "justificativa": "..."}
    `;
    const result = await callOpenAI(prompt, 'duplicidade');
    await logAiAction(userId, 'overtradingCheck', result);
    res.json({ result: result || {} });
  } catch (error) {
    res.status(500).json({ error: 'Erro em overtradingCheck', details: error.message });
  }
}

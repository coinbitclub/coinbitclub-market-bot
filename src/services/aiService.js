import { callOpenAI } from "./openaiConnector.js";
import { getUserSettings, getTradeHistory, getUserStatus } from "./userService.js";
import { logAiAction } from "./logService.js";

// HEAD TRADER: Aprovação/reprovação de sinais antes de operar
export async function orderDecision(req, res) {
  try {
    const { userId, signal, contexto } = req.body;
    const userSettings = await getUserSettings(userId);

    // Prompt padrão CoinbitClub, incluindo seus critérios, sizing, TP/SL etc.
    const prompt = `
Você é o Head Trader do CoinbitClub. Use os critérios do CoinbitClub SEMPRE:
- Sizing: ${userSettings.sizing || '8%'}
- Take Profit: ${userSettings.tp || '3%'}
- Stop Loss: ${userSettings.sl || '-1.8%'}
- Ativos permitidos: ${userSettings.ativos || 'BTCUSDT,ETHUSDT'}
- Só opere em modo produção se assinatura ativa e saldo; senão, modo testnet.

Sinal recebido: ${JSON.stringify(signal)}
Contexto: ${JSON.stringify(contexto)}
Status usuário: ${JSON.stringify(await getUserStatus(userId))}
Histórico: ${JSON.stringify(await getTradeHistory(userId, 20))}

Responda só em JSON:
{
  "decisao": "OPERAR" | "NAO_OPERAR" | "AGUARDAR",
  "justificativa": "...",
  "sizing": "...",
  "tp": "...",
  "sl": "...",
  "modo": "testnet" | "producao"
}
Se for "NAO_OPERAR", explique por que. Não altere TP/SL/Sizing fixos do CoinbitClub.
    `;

    const resposta = await callOpenAI(prompt);
    await logAiAction("order-decision", userId, prompt, resposta);
    res.json({ result: safeParseJson(resposta) });
  } catch (err) {
    res.status(500).json({ error: "Erro IA order-decision: " + err.message });
  }
}

// MONITORAMENTO — Sugestão de ajuste/encerramento de posições
export async function monitorPosition(req, res) {
  try {
    const { userId, trade, contexto } = req.body;
    const prompt = `
Você está monitorando uma operação ativa do CoinbitClub. Regras:
- Nunca altere TP/SL fixos CoinbitClub sem justificativa de evento extremo.
- Só recomende fechar antecipado se houver contexto grave (ex: notícia, volatilidade, crash).
- Detalhes: ${JSON.stringify(trade)}
Contexto atual: ${JSON.stringify(contexto)}
Usuário: ${userId}
Responda só em JSON:
{
  "acao": "MANTER" | "AJUSTAR_STOP" | "FECHAR",
  "justificativa": "...",
  "novo_stop": "opcional"
}
    `;
    const resposta = await callOpenAI(prompt);
    await logAiAction("monitor-position", userId, prompt, resposta);
    res.json({ result: safeParseJson(resposta) });
  } catch (err) {
    res.status(500).json({ error: "Erro IA monitor-position: " + err.message });
  }
}

// RACIONAL — Explicação/justificativa de cada operação
export async function rationale(req, res) {
  try {
    const { userId, trade, contexto } = req.body;
    const prompt = `
Explique em até 3 linhas o racional desta operação do CoinbitClub para o usuário final:
Operação: ${JSON.stringify(trade)}
Contexto: ${JSON.stringify(contexto)}
    `;
    const resposta = await callOpenAI(prompt);
    await logAiAction("rationale", userId, prompt, resposta);
    res.json({ result: resposta.trim() });
  } catch (err) {
    res.status(500).json({ error: "Erro IA rationale: " + err.message });
  }
}

// PROBABILIDADE — IA estima chance de sucesso do sinal
export async function signalProbability(req, res) {
  try {
    const { userId, signal, contexto } = req.body;
    const prompt = `
Você é um especialista CoinbitClub. Analise o seguinte sinal e estime a probabilidade (0-100%) de sucesso, só com base em contexto e histórico. Explique brevemente.
Sinal: ${JSON.stringify(signal)}
Contexto: ${JSON.stringify(contexto)}
Histórico: ${JSON.stringify(await getTradeHistory(userId, 30))}
Responda só em JSON: { "probabilidade": 0-100, "justificativa": "..." }
    `;
    const resposta = await callOpenAI(prompt);
    await logAiAction("signal-probability", userId, prompt, resposta);
    res.json({ result: safeParseJson(resposta) });
  } catch (err) {
    res.status(500).json({ error: "Erro IA signal-probability: " + err.message });
  }
}

// ANTI-OVERTRADING — Checa se já há operação duplicada
export async function overtradingCheck(req, res) {
  try {
    const { userId, signal, contexto } = req.body;
    const prompt = `
Detecte se o usuário ${userId} está tentando abrir operação duplicada ou em excesso (overtrading) com este sinal:
Sinal: ${JSON.stringify(signal)}
Contexto: ${JSON.stringify(contexto)}
Histórico: ${JSON.stringify(await getTradeHistory(userId, 10))}
Responda em JSON: { "duplicidade": true/false, "justificativa": "..." }
    `;
    const resposta = await callOpenAI(prompt);
    await logAiAction("overtrading-check", userId, prompt, resposta);
    res.json({ result: safeParseJson(resposta) });
  } catch (err) {
    res.status(500).json({ error: "Erro IA overtrading-check: " + err.message });
  }
}

// ANTIFRAUDE — Avaliação de comportamentos anômalos
export async function antifraudCheck(req, res) {
  try {
    const { userId, evento, contexto } = req.body;
    const prompt = `
Você é o agente antifraude do CoinbitClub. Avalie se há comportamento suspeito/anômalo:
Usuário: ${userId}
Evento: ${JSON.stringify(evento)}
Contexto: ${JSON.stringify(contexto)}
Responda só em JSON: { "suspeito": true/false, "justificativa": "..." }
    `;
    const resposta = await callOpenAI(prompt);
    await logAiAction("antifraud-check", userId, prompt, resposta);
    res.json({ result: safeParseJson(resposta) });
  } catch (err) {
    res.status(500).json({ error: "Erro IA antifraud-check: " + err.message });
  }
}

// LOGS RESOLVER — IA analisa logs e sugere/executa ação corretiva
export async function logsResolver(req, res) {
  try {
    const { logId, logMsg, contexto } = req.body;
    const prompt = `
Você é o suporte automatizado CoinbitClub. Analise o seguinte log e sugira/execute ação corretiva, se possível:
Log: ${logMsg}
Contexto: ${JSON.stringify(contexto)}
Responda só em JSON: { "acao": "corrigir" | "ignorar" | "repetir" | "abrir_suporte", "justificativa": "..." }
    `;
    const resposta = await callOpenAI(prompt);
    await logAiAction("logs-resolver", "system", prompt, resposta, logId);
    res.json({ result: safeParseJson(resposta) });
  } catch (err) {
    res.status(500).json({ error: "Erro IA logs-resolver: " + err.message });
  }
}

// Função auxiliar para parse seguro de JSON
function safeParseJson(txt) {
  try { return JSON.parse(txt); }
  catch { return { raw: txt }; }
}

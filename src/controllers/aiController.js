// src/controllers/aiController.js
import { getUserSettings, getTradeHistory, getUserStatus } from '../services/userService.js';
import { logAiAction } from '../services/logService.js';
import { callOpenAI } from '../services/openaiConnector.js';

// 📡 Leitura em tempo real de posição do usuário
export async function monitorPosition(req, res) {
  try {
    const { userId, position } = req.body;
    const userStatus = await getUserStatus(userId);

    const prompt = `
Você é o monitor de posições do CoinbitClub.
Recebe a posição atual do usuário para análise de risco, contexto e possibilidade de reversão.
Usuário: ${userId}
Status atual: ${JSON.stringify(userStatus)}
Posição: ${JSON.stringify(position)}
    
Avalie e responda se deve manter a posição ou encerrar com justificativa.
    `;

    const resposta = await callOpenAI(prompt);
    await logAiAction(userId, 'monitorPosition', resposta);

    res.json({ resultado: resposta });
  } catch (error) {
    res.status(500).json({ erro: 'Erro em monitorPosition', detalhes: error.message });
  }
}

// 🧠 Geração de racional técnico da operação aberta
export async function rationale(req, res) {
  try {
    const { userId, signal, contexto } = req.body;
    const userSettings = await getUserSettings(userId);

    const prompt = `
Você é o analista do CoinbitClub responsável por justificar racional técnico de operação.
Critérios do usuário:
- Sizing: ${userSettings.sizing || '8%'}
- TP: ${userSettings.tp || '3%'}
- SL: ${userSettings.sl || '-1.8%'}

Sinal: ${JSON.stringify(signal)}
Contexto: ${JSON.stringify(contexto)}

Gere o racional técnico dessa entrada com base nos dados acima, em tom direto e didático.
    `;

    const resposta = await callOpenAI(prompt);
    await logAiAction(userId, 'rationale', resposta);

    res.json({ racional: resposta });
  } catch (error) {
    res.status(500).json({ erro: 'Erro em rationale', detalhes: error.message });
  }
}

// 🔐 Verificação antifraude e integridade do comportamento
export async function antifraudCheck(req, res) {
  try {
    const { userId, operacoesRecentes, comportamento } = req.body;

    const prompt = `
Você é o sistema antifraude do CoinbitClub.
Analise se há comportamento suspeito ou automatizado no padrão de uso a seguir.

Usuário: ${userId}
Operações recentes: ${JSON.stringify(operacoesRecentes)}
Comportamento: ${JSON.stringify(comportamento)}

Diga se há indícios de uso indevido da conta ou padrão automatizado malicioso.
    `;

    const resposta = await callOpenAI(prompt);
    await logAiAction(userId, 'antifraudCheck', resposta);

    res.json({ status: 'ok', resultado: resposta });
  } catch (error) {
    res.status(500).json({ erro: 'Erro em antifraudCheck', detalhes: error.message });
  }
}

// 🧾 Diagnóstico dos logs de decisão e execução
export async function logsResolver(req, res) {
  try {
    const { userId, logs } = req.body;

    const prompt = `
Você é o resolvedor de logs do CoinbitClub.
Recebe os registros da operação do usuário e deve identificar falhas, incoerências ou atrasos.

Usuário: ${userId}
Logs recebidos: ${JSON.stringify(logs)}

Analise e diga se tudo correu bem ou se houve problema técnico ou lógico na execução.
    `;

    const resposta = await callOpenAI(prompt);
    await logAiAction(userId, 'logsResolver', resposta);

    res.json({ analise: resposta });
  } catch (error) {
    res.status(500).json({ erro: 'Erro em logsResolver', detalhes: error.message });
  }
}

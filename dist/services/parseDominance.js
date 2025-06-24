"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseDominance = parseDominance;
exports.saveDominance = saveDominance;
var _databaseService = require("./databaseService.js");
// Faz parsing seguro do payload recebido e monta o objeto dominance
function parseDominance(payload) {
  console.log('[parseDominance] Payload recebido:', payload);

  // Captura timestamp corretamente
  let captured_at = new Date();
  if (payload.time) {
    if (typeof payload.time === 'number' || /^\d+$/.test(payload.time)) {
      captured_at = new Date(Number(payload.time));
    } else {
      captured_at = new Date(payload.time);
    }
  }

  // Cria o objeto dominance
  const dominanceObj = {
    ticker: payload.ticker ?? 'BTCUSDT',
    // Valor padrão para teste
    captured_at,
    dominance_pct: parseFloat(payload.btc_dominance ?? payload.dominance ?? 0),
    ema7: parseFloat(payload.ema_7 ?? payload.ema7 ?? 0),
    diff_pct: parseFloat(payload.diff_pct ?? 0),
    signal: payload.sinal ?? payload.signal ?? null
  };
  console.log('[parseDominance] Objeto dominance gerado:', dominanceObj);
  return dominanceObj;
}

// Salva dominance no banco de dados
async function saveDominance(dom) {
  const sql = `
    INSERT INTO btc_dominance_signals
      (ticker, captured_at, dominance_pct, ema7, diff_pct, signal)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  try {
    console.log('[saveDominance] Salvando no banco:', dom);
    await (0, _databaseService.query)(sql, [dom.ticker, dom.captured_at, dom.dominance_pct, dom.ema7, dom.diff_pct, dom.signal]);
    console.log('[saveDominance] Dominance salva no banco:', dom.ticker, dom.captured_at);
  } catch (err) {
    console.error('[saveDominance] Erro ao salvar dominance:', err);
    throw err;
  }
}
// src/trainModel.js

import { pool } from './database.js';
// Se você usar bibliotecas de ML, importe-as aqui:
// import * as tf from '@tensorflow/tfjs-node';

export async function trainAndGenerateSignals() {
  console.log('[TrainModel] Iniciando treinamento');

  // 1) Carrega histórico de preços e indicadores
  const { rows: history } = await pool.query(`
    SELECT time, payload->>'close' AS close, 
           (signal_json->>'ema9')::float AS ema9, 
           (signal_json->>'rsi4h')::float AS rsi4h
      FROM signals
     ORDER BY time ASC
  `);

  // 2) (Opcional) Treina seu modelo ML
  // Exemplo: use history para gerar features + labels

  // 3) Gera sinais sintéticos ou previsões
  const syntheticSignals = history.slice(-5).map((row, i) => ({
    ticker: 'BTC', 
    price: parseFloat(row.close), 
    time: new Date(row.time).toISOString()
  }));

  // 4) Insere novos sinais na tabela
  for (const sig of syntheticSignals) {
    await pool.query(
      `INSERT INTO signals (signal_json, ticker, time, close, captured_at)
         VALUES ($1, $2, $3, $4, NOW())`,
      [sig, sig.ticker, sig.time, sig.price]
    );
    console.log('[TrainModel] Inserido sinal de treinamento:', sig);
  }

  console.log('[TrainModel] Treinamento e inserção de sinais concluídos');
}

 if (import.meta.url === `file://${process.cwd()}/src/trainModel.js`) {
   trainAndGenerateSignals()
     .then(() => process.exit(0))
     .catch(err => {
       console.error('[TrainModel] Erro fatal:', err);
       process.exit(1);
     });
 }

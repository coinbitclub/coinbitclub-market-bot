import { pool } from './database.js';
// Se você usar bibliotecas de ML, importe-as aqui:
// import * as tf from '@tensorflow/tfjs-node';

export async function trainAndGenerateSignals() {
  console.log('[TrainModel] Iniciando treinamento');

  // 1) Carrega histórico de preços e indicadores
  const { rows: history } = await pool.query(`
    SELECT 
      time,
      signal_json->>'close'    AS close,
      (signal_json->>'ema9')::float   AS ema9,
      (signal_json->>'rsi4h')::float AS rsi4h
    FROM signals
    ORDER BY time ASC
  `);

  // 2) (Opcional) Treina seu modelo ML
  // Aqui você poderia usar `history` para gerar features e labels
  // e treinar um modelo TensorFlow, XGBoost, etc.

  // 3) Gera sinais sintéticos ou previsões
  const syntheticSignals = history.slice(-5).map(row => ({
    ticker: 'BTC',
    price: parseFloat(row.close),
    time: new Date(row.time).toISOString(),
    // você pode incluir mais dados no objeto JSON, se quiser
  }));

  // 4) Insere novos sinais na tabela
  for (const sig of syntheticSignals) {
    await pool.query(
      `INSERT INTO signals (signal_json, ticker, time, price, captured_at)
         VALUES ($1, $2, $3, $4, NOW())`,
      [sig, sig.ticker, sig.time, sig.price]
    );
    console.log('[TrainModel] Inserido sinal sintético:', sig);
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

import { query } from '../services/databaseService.js';

// Remove dados mais antigos que 72h
async function purgeOldData() {
  await query(`DELETE FROM signals WHERE time < NOW() - INTERVAL '72 HOURS'`);
  await query(`DELETE FROM dominance WHERE created_at < NOW() - INTERVAL '72 HOURS'`);
  await query(`DELETE FROM fear_greed WHERE created_at < NOW() - INTERVAL '72 HOURS'`);
  await query(`DELETE FROM market WHERE created_at < NOW() - INTERVAL '72 HOURS'`);
}

// Salva snapshot diÃ¡rio nas tabelas *_daily (campos alinhados!)
async function snapshotDailyData() {
  await query(`
    INSERT INTO signals_daily (
      ticker, time, close, ema9_30, rsi_4h, rsi_15, momentum_15,
      atr_30, atr_pct_30, vol_30, vol_ma_30, diff_btc_ema7,
      cruzou_acima_ema9, cruzou_abaixo_ema9, leverage
    )
    SELECT
      ticker, time, close, ema9_30, rsi_4h, rsi_15, momentum_15,
      atr_30, atr_pct_30, vol_30, vol_ma_30, diff_btc_ema7,
      cruzou_acima_ema9, cruzou_abaixo_ema9, leverage
    FROM signals
    WHERE DATE(time) = CURRENT_DATE
    ON CONFLICT DO NOTHING
  `);

  await query(`
    INSERT INTO dominance_daily (
      timestamp, btc_dom, eth_dom, created_at, dominance, ema7
    )
    SELECT
      timestamp, btc_dom, eth_dom, created_at, dominance, ema7
    FROM dominance
    WHERE DATE(created_at) = CURRENT_DATE
    ON CONFLICT DO NOTHING
  `);

  await query(`
    INSERT INTO fear_greed_daily (
      value, value_classification, captured_at, created_at
    )
    SELECT
      value, value_classification, captured_at, created_at
    FROM fear_greed
    WHERE DATE(created_at) = CURRENT_DATE
    ON CONFLICT DO NOTHING
  `);

  await query(`
    INSERT INTO market_daily (
      symbol, captured_at, open, high, low, close, volume
    )
    SELECT
      symbol, captured_at, open, high, low, close, volume
    FROM market
    WHERE DATE(captured_at) = CURRENT_DATE
    ON CONFLICT DO NOTHING
  `);
}

export async function runAuditAndPurge() {
  await purgeOldData();
  await snapshotDailyData();
  console.log('Rotina de auditoria/limpeza/snapshot executada com sucesso!');
}

if (process.env.RUN_CRON === 'true') {
  runAuditAndPurge();
}





import fs from 'fs';
import path from 'path';
import { query } from './databaseService.js';
import { trainAndSerialize } from './mlPipeline.js';
import { logger } from '../logger.js';

(async () => {
  try {
    const [
      signals,
      metrics,
      fgData,
      operations,
      userSettings,
      macroEvents,
      whaleMovements,
      newsSentiment,
      holidays
    ] = await Promise.all([
      query("SELECT * FROM signals WHERE created_at >= NOW() - INTERVAL '72 hours' ORDER BY created_at ASC"),
      query("SELECT * FROM market_metrics WHERE captured_at >= NOW() - INTERVAL '72 hours' ORDER BY captured_at ASC"),
      query("SELECT * FROM fear_greed WHERE captured_at >= NOW() - INTERVAL '72 hours' ORDER BY captured_at ASC"),
      query("SELECT * FROM orders WHERE created_at >= NOW() - INTERVAL '72 hours' ORDER BY created_at ASC"),
      query("SELECT u.id AS user_id, uc.exchange, uc.settings FROM users u LEFT JOIN user_credentials uc ON uc.user_id = u.id"),
      query("SELECT * FROM macro_events WHERE event_time >= NOW() - INTERVAL '72 hours' ORDER BY event_time ASC"),
      query("SELECT * FROM whale_movements WHERE recorded_at >= NOW() - INTERVAL '72 hours' ORDER BY recorded_at ASC"),
      query("SELECT * FROM news_sentiment WHERE published_at >= NOW() - INTERVAL '72 hours' ORDER BY published_at ASC"),
      query("SELECT * FROM holidays WHERE date >= CURRENT_DATE - INTERVAL '3 days'")
    ]).then(results => results.map(r => r.rows));

    const modelBuffer = await trainAndSerialize({
      signals,
      metrics,
      fgData,
      operations,
      userSettings,
      macroEvents,
      whaleMovements,
      newsSentiment,
      holidays
    });

    const outPath = path.resolve(process.cwd(), 'model.bin');
    fs.writeFileSync(outPath, modelBuffer);
    logger.info(`Model saved to ${outPath}`);
    process.exit(0);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();

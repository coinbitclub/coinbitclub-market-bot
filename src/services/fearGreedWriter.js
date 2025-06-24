import { query } from './databaseService.js';
import fetch from 'node-fetch';
import logger from '../utils/logger.js';

async function saveFearGreed(point) {
  await query(
    `INSERT INTO fear_greed (value, classification, date)
     VALUES ($1,$2,$3)`,
    [ point.value, point.classification, point.date ]
  );
}

export async function fetchAndSaveFearGreed() {
  logger.info('Scheduler: fetching Fear & Greed index');
  const res = await fetch('https://api.alternative.me/fng/?limit=1');
  const { data } = await res.json();
  const point = {
    value: parseInt(data[0].value, 10),
    classification: data[0].value_classification,
    date: new Date( parseInt(data[0].timestamp,10) * 1000 )
  };
  await saveFearGreed(point);
  logger.info('Scheduler: Fear & Greed saved', point);
}

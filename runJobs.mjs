import {
  fetchAndSaveFearGreed,
  fetchAndSaveDominance,
  fetchAndSaveVolatility,
  fetchAndSaveFearGreed2,
  fetchAndSaveExtra,
} from './src/services/fetchAndSaveData.js';

(async () => {
  await fetchAndSaveFearGreed();
  await fetchAndSaveDominance();
  await fetchAndSaveVolatility();
  await fetchAndSaveFearGreed2();
  await fetchAndSaveExtra();
  process.exit(0);
})();

import { CronJob } from "cron";
import logger from '../utils/logger.js';
import { fetchAndSaveDominance } from "./dominanceService.js";
import { fetchAndSaveFearGreed } from "./fearGreedService.js";
import { fetchAndSaveMarkets } from "./marketsWriter.js";

// Centraliza todos os agendamentos do sistema
export function setupScheduler() {
  logger.info("Scheduler: starting jobs");
  new CronJob(
    "0 0 * * *", async () => {
      try { await fetchAndSaveDominance();   logger.info("Dominance job OK"); } catch(e){logger.error("Dominance job failed",e);}
      try { await fetchAndSaveFearGreed();   logger.info("FearGreed job OK"); } catch(e){logger.error("FearGreed job failed",e);}
      try { await fetchAndSaveMarkets();     logger.info("Markets job OK"); } catch(e){logger.error("Markets job failed",e);}
    },
    null, true, "UTC"
  );
}

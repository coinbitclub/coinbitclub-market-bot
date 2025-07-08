# apply-fixes.ps1

# 1) Defina aqui o seu .env
Set-Content -Path ".env" -Encoding utf8 @'
PORT=3000
DATABASE_URL=postgres://postgres:WxZyoibLaQepvEFgzScTPziwCalxeGqa@hopper.proxy.rlwy.net:28808/railway
DATABASE_SSL=true
COINSTATS_API_KEY=ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=
WEBHOOK_TOKEN=210406
NODE_ENV=development
'@

# 2) Todos os arquivos de uma vez
$files = @{
  "src/utils/logger.js" = @'
import pino from "pino";

const logger = pino({
  transport: { target: "pino-pretty", options: { colorize: true } },
  timestamp: pino.stdTimeFunctions.isoTime
});

export default logger;
'@

  "src/services/databaseService.js" = @'
import pg from "pg";
import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: false }
    : false
});

pool.on("connect", () => logger.info("✔️ Postgres connected"));
pool.on("error", err => logger.error("❌ Postgres error", err));

export async function query(text, params) {
  return pool.query(text, params);
}
export default pool;
'@

  "src/services/signalsService.js" = @'
import { query } from "./databaseService.js";
import logger from "../utils/logger.js";

export async function saveSignal(userId, signal) {
  logger.info("Saving signal", { userId, signal });
  const sql = `
    INSERT INTO signals(
      user_id, ticker, time, close, ema9_30, rsi_4h, rsi_15, momentum_15,
      atr_30, atr_pct_30, vol_30, vol_ma_30, diff_btc_ema7,
      cruzou_acima_ema9, cruzou_abaixo_ema9, leverage
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,
      $14,$15,$16
    )
  `;
  await query(sql, [
    userId, signal.ticker, signal.time, signal.close,
    signal.ema9, signal.rsi4h, signal.rsi15, signal.momentum15,
    signal.atr30, signal.atrPct30, signal.vol30, signal.volMa30,
    signal.diffBtcEma7, signal.cruzouAcimaEma9, signal.cruzouAbaixoEma9,
    signal.leverage
  ]);
}
'@

  "src/services/dominanceService.js" = @'
import { query } from "./databaseService.js";
import fetch from "node-fetch";
import logger from "../utils/logger.js";

const COINSTATS_API_KEY = process.env.COINSTATS_API_KEY;

// Webhook
export async function saveDominance(userId, dom) {
  logger.info("Saving dominance via webhook", { userId, dom });
  const date = dom.timestamp.toISOString().slice(0,10);
  await query(
    `INSERT INTO dominance_daily(date, avg_btc_dominance, avg_alt_dominance)
     VALUES($1,$2,$3)
     ON CONFLICT(date) DO UPDATE
       SET avg_btc_dominance = EXCLUDED.avg_btc_dominance,
           avg_alt_dominance = EXCLUDED.avg_alt_dominance`,
    [date, dom.dominance, dom.ema7]
  );
}

// Scheduler
async function fetchDominanceData() {
  const res = await fetch(
    `https://api.coinstats.app/public/v1/global-stats?apikey=${COINSTATS_API_KEY}`
  );
  if (!res.ok) throw new Error(`CoinStats API ${res.status}`);
  const { coinstats } = await res.json();
  return {
    date: new Date().toISOString().slice(0,10),
    avg_btc_dominance: coinstats.btcDominance,
    avg_alt_dominance: null,
    avg_total_marketcap: coinstats.totalCoinsMarketCap
  };
}

async function upsertDominance(data) {
  await query(
    `INSERT INTO dominance_daily(date, avg_btc_dominance, avg_total_marketcap)
     VALUES($1,$2,$3)
     ON CONFLICT(date) DO UPDATE
       SET avg_btc_dominance = EXCLUDED.avg_btc_dominance,
           avg_total_marketcap = EXCLUDED.avg_total_marketcap`,
    [data.date, data.avg_btc_dominance, data.avg_total_marketcap]
  );
}

export async function fetchAndSaveDominance() {
  logger.info("Scheduler: fetching dominance");
  const data = await fetchDominanceData();
  await upsertDominance(data);
  logger.info("Scheduler: dominance saved", data);
}
'@

  "src/services/fearGreedService.js" = @'
import fetch from "node-fetch";
import { query } from "./databaseService.js";
import logger from "../utils/logger.js";

export async function saveFearGreed(point) {
  await query(
    `INSERT INTO fear_greed(value, classification, date)
     VALUES($1,$2,$3)`,
    [point.value, point.classification, point.date]
  );
}

export async function fetchAndSaveFearGreed() {
  logger.info("Scheduler: fetching Fear & Greed");
  const res = await fetch("https://api.alternative.me/fng/?limit=1");
  if (!res.ok) throw new Error(`FNG API ${res.status}`);
  const { data } = await res.json();
  const p = data[0];
  const point = {
    value: parseInt(p.value,10),
    classification: p.value_classification,
    date: new Date(p.timestamp*1000)
  };
  await saveFearGreed(point);
  logger.info("Scheduler: Fear & Greed saved", point);
}
'@

  "src/services/marketsService.js" = @'
import fetch from "node-fetch";
import { query } from "./databaseService.js";
import logger from "../utils/logger.js";

export async function saveMarkets(markets) {
  for (const m of markets) {
    await query(
      `INSERT INTO markets(symbol, price, change, volume)
       VALUES($1,$2,$3,$4)
       ON CONFLICT(symbol) DO UPDATE
         SET price  = EXCLUDED.price,
             change = EXCLUDED.change,
             volume = EXCLUDED.volume`,
      [m.symbol, m.price, m.change, m.volume]
    );
  }
}

export async function fetchAndSaveMarkets() {
  logger.info("Scheduler: fetching top markets");
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10"
  );
  if (!res.ok) throw new Error(`Coingecko API ${res.status}`);
  const data = await res.json();
  const simplified = data.map(m => ({
    symbol: m.symbol.toUpperCase(),
    price: m.current_price,
    change: m.price_change_percentage_24h,
    volume: m.total_volume
  }));
  await saveMarkets(simplified);
  logger.info("Scheduler: markets saved");
}
'@

  "src/services/scheduler.js" = @'
import { CronJob } from "cron";
import logger from "../utils/logger.js";
import { fetchAndSaveDominance } from "./dominanceService.js";
import { fetchAndSaveFearGreed }   from "./fearGreedService.js";
import { fetchAndSaveMarkets }     from "./marketsService.js";

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
'@

  "src/routes/webhook.js" = @'
import { Router } from "express";
import logger from "../utils/logger.js";
import { parseSignal }    from "../parseSignal.js";
import { saveSignal }     from "../services/signalsService.js";
import { parseDominance } from "../parseDominance.js";
import { saveDominance }  from "../services/dominanceService.js";

const router = Router();

router.use((req,_res,next)=>{
  req.userId = req.query.userId || null; next();
});

router.post("/signal", async (req,res)=>{
  try {
    logger.info("[raw webhook/signal]",req.body);
    const data = parseSignal(req.body);
    await saveSignal(req.userId,data);
    res.json({status:"ok"});
  } catch(err){
    logger.error("Signal handler error",err);
    res.status(500).json({ error:"Signal processing failed", detail:err.message });
  }
});

router.post("/dominance", async (req,res)=>{
  try {
    logger.info("[raw webhook/dominance]",req.body);
    const data = parseDominance(req.body);
    await saveDominance(req.userId,data);
    res.json({status:"ok"});
  } catch(err){
    logger.error("Dominance handler error",err);
    res.status(500).json({ error:"Dominance processing failed", detail:err.message });
  }
});

export default router;
'@

  "src/parseSignal.js" = @'
export function parseSignal(body) {
  return {
    ticker:          body.ticker,
    time:            new Date(body.time),
    close:           parseFloat(body.close),
    ema9:            parseFloat(body.ema9_30),
    rsi4h:           parseFloat(body.rsi_4h),
    rsi15:           parseFloat(body.rsi_15),
    momentum15:      parseFloat(body.momentum_15),
    atr30:           parseFloat(body.atr_30),
    atrPct30:        parseFloat(body.atr_pct_30),
    vol30:           parseFloat(body.vol_30),
    volMa30:         parseFloat(body.vol_ma_30),
    diffBtcEma7:     parseFloat(body.diff_btc_ema7),
    cruzouAcimaEma9: Boolean(body.cruzou_acima_ema9),
    cruzouAbaixoEma9:Boolean(body.cruzou_abaixo_ema9),
    leverage:        parseInt(body.leverage,10)
  };
}
'@

  "src/parseDominance.js" = @'
export function parseDominance(body) {
  return {
    dominance: parseFloat(body.dominance),
    ema7:      parseFloat(body.ema7),
    timestamp: new Date(body.timestamp)
  };
}
'@

  "src/index.js" = @'
import express from "express";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import webhookRouter from "./routes/webhook.js";
import { setupScheduler } from "./services/scheduler.js";

dotenv.config();

const app = express();
app.use(express.json({ limit:"100kb" }));

app.get("/", (_req,res)=>res.send("OK"));
app.get("/health",(_req,res)=>res.sendStatus(200));

app.use((req,res,next)=>{
  console.log(">>> token recv:", req.query.token," expected:", process.env.WEBHOOK_TOKEN);
  if(req.query.token!==process.env.WEBHOOK_TOKEN)
    return res.status(401).json({ error:"Unauthorized" });
  next();
});

app.use("/webhook", webhookRouter);
app.use((err,_req,res,_next)=>{
  logger.error("Unhandled",err);
  res.status(500).json({ error:"Internal server error" });
});

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>{
  logger.info(`Server running on port ${PORT}`);
  setupScheduler();
});
'@
}

# 3) Aplica todas as patches
foreach($path in $files.Keys) {
  $full = Join-Path $PWD $path
  if (!(Test-Path $full)) { Write-Warning "$path não encontrado"; continue }
  Write-Host "Gravando $path..."
  $files[$path] | Set-Content $full -Encoding utf8
}

Write-Host "`n✅ Todos os arquivos foram atualizados. Agora rode:"
Write-Host "   npm install; $Env:WEBHOOK_TOKEN='$($env:WEBHOOK_TOKEN)'; npm run start"

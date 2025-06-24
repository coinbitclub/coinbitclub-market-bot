import axios from "axios";
import { query } from "./databaseService.js";

export async function saveSignal(body) {
  const { ticker, time, close } = body;
  await query(
    `INSERT INTO public.signals (signal_json, received_at, ticker, time, close)
       VALUES ($1, now(), $2, $3, $4)`,
    [body, ticker, time, close]
  );
}

export async function fetchAndSaveDominance() {
  const resp = await axios.get("https://api.example.com/dominance");
  const { timestamp, btc_dom, eth_dom } = resp.data;
  await query(
    `INSERT INTO public.dominance (timestamp, btc_dom, eth_dom)
       VALUES ($1, $2, $3)`,
    [timestamp, btc_dom, eth_dom]
  );
}

export async function fetchAndSaveFearGreed() {
  const resp = await axios.get("https://api.example.com/fear-greed");
  const { index_value, value_classification, timestamp } = resp.data;
  await query(
    `INSERT INTO public.fear_greed (index_value, value_classification, timestamp)
       VALUES ($1, $2, $3)`,
    [index_value, value_classification, timestamp]
  );
}

export async function fetchAndSaveMarket() {
  const resp = await axios.get("https://api.example.com/market");
  for (const { symbol, price, timestamp } of resp.data) {
    await query(
      `INSERT INTO public.market (symbol, price, timestamp)
         VALUES ($1, $2, $3)`,
      [symbol, price, timestamp]
    );
  }
}


"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.insertDominance = insertDominance;
exports.insertFearGreed = insertFearGreed;
exports.insertSignal = insertSignal;
var _database = require("../database.js");
// 1) Inserção de sinais
async function insertSignal({
  symbol,
  price,
  timestamp,
  ...rest
}) {
  const text = `
    INSERT INTO signals(symbol, price, timestamp, captured_at, raw_payload)
    VALUES($1, $2, $3, NOW(), $4);
  `;
  const values = [symbol, price, timestamp, JSON.stringify(rest)];
  return _database.pool.query(text, values);
}

// 2) Inserção de dominância
async function insertDominance({
  value,
  captured_at,
  ...rest
}) {
  const text = `
    INSERT INTO dominance(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  const values = [value, captured_at, JSON.stringify(rest)];
  return _database.pool.query(text, values);
}

// 3) Inserção de Fear & Greed
async function insertFearGreed({
  value,
  captured_at,
  ...rest
}) {
  const text = `
    INSERT INTO fear_greed(value, captured_at, created_at, raw_payload)
    VALUES($1, $2, NOW(), $3);
  `;
  const values = [value, captured_at, JSON.stringify(rest)];
  return _database.pool.query(text, values);
}
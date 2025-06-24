"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveRawWebhook = saveRawWebhook;
var _databaseService = require("./databaseService.js");
async function saveRawWebhook({
  source,
  payload,
  error
}) {
  await (0, _databaseService.query)('INSERT INTO raw_webhook (source, payload, error, created_at) VALUES ($1, $2, $3, NOW())', [source, JSON.stringify(payload), error]);
}
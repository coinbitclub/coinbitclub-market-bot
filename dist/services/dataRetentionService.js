"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.purgeOldData = purgeOldData;
var _databaseService = require("./databaseService.js");
async function purgeOldData() {
  const sql = `
    DELETE FROM public.signals      WHERE received_at < now() - interval '90 days';
    DELETE FROM public.dominance    WHERE timestamp   < now() - interval '90 days';
    DELETE FROM public.fear_greed   WHERE timestamp   < now() - interval '90 days';
    DELETE FROM public.market       WHERE timestamp   < now() - interval '90 days';
  `;
  await (0, _databaseService.query)(sql);
}
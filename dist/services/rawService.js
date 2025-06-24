"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveRaw = saveRaw;
var _databaseService = require("./databaseService.js");
async function saveRaw(route, p) {
  const t = `INSERT INTO raw_webhook(route,payload)VALUES($1,$2)`;
  await (0, _databaseService.executeQuery)(t, [route, p]);
}
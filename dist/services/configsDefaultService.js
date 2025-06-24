"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDefaultConfigs = getDefaultConfigs;
exports.saveDefaultConfigs = saveDefaultConfigs;
var _databaseService = require("./databaseService.js");
async function getDefaultConfigs() {
  const query = `
    SELECT *
    FROM configs_default
    WHERE ativa = true
    LIMIT 1;
  `;
  return await (0, _databaseService.executeQuery)(query);
}
async function saveDefaultConfigs(configs) {
  const query = `
    INSERT INTO configs_default (/* campos */)
    VALUES (/* valores derivados de configs */)
    RETURNING id;
  `;
  return await (0, _databaseService.executeQuery)(query, [/* valores */]);
}
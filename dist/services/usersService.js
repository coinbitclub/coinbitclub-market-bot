"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserById = getUserById;
exports.saveUser = saveUser;
var _databaseService = require("./databaseService.js");
// src/services/usersService.js

async function saveUser({
  id,
  nome,
  email,
  assinatura_inicio,
  assinatura_fim,
  exchange,
  api_key,
  api_secret,
  configs_id
}) {
  const query = `
    INSERT INTO users (
      id, nome, email, assinatura_inicio, assinatura_fim,
      exchange, api_key, api_secret, configs_id
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      assinatura_inicio = EXCLUDED.assinatura_inicio,
      assinatura_fim = EXCLUDED.assinatura_fim,
      exchange = EXCLUDED.exchange,
      api_key = EXCLUDED.api_key,
      api_secret = EXCLUDED.api_secret,
      configs_id = EXCLUDED.configs_id;
  `;
  const params = [id, nome, email, assinatura_inicio, assinatura_fim, exchange, api_key, api_secret, configs_id];
  return await (0, _databaseService.executeQuery)(query, params);
}
async function getUserById(user_id) {
  const query = `SELECT * FROM users WHERE id = $1;`;
  return await (0, _databaseService.executeQuery)(query, [user_id]);
}
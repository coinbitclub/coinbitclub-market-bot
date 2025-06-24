"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBybitClientForUser = createBybitClientForUser;
var _databaseService = require("./databaseService.js");
var _bybitApi = require("bybit-api");
// src/services/exchangeService.js

// Exemplo de SDK

/**
 * Cria um client Bybit configurado com as credenciais do usuário.
 */
async function createBybitClientForUser(userId) {
  const {
    api_key,
    api_secret
  } = await (0, _databaseService.getBybitCredentials)(userId);
  return new _bybitApi.RestClient({
    key: api_key,
    secret: api_secret,
    testnet: false
  });
}
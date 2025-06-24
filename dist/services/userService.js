"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserByEmail = getUserByEmail;
var _databaseService = require("./databaseService.js");
/**
 * Busca usu�rio pelo email
 * @param {string} email
 * @returns {Promise<Object>}
 */
async function getUserByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email =  LIMIT 1';
  const result = await (0, _databaseService.query)(sql, [email]);
  return result.rows[0];
}
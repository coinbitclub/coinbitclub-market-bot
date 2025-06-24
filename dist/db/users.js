"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.listUsers = listUsers;
var _db = require("../db.js");
// src/db/users.js

/**
 * Retorna todos os usuários cadastrados (só o ID por enquanto).
 */
async function listUsers() {
  const res = await (0, _db.query)('SELECT id FROM users');
  return res.rows;
}
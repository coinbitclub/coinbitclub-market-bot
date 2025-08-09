// Script para inserir o admin no banco SQLite via Node.js
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const db = new Database('../backend/api-gateway/db.sqlite3');

const email = 'faleconosco@coinbitclub.vip';
const password = 'Apelido22@';
const name = 'ERICA ANDRADE';
const country = 'Brasil';
const role = 'admin';
const status = 'active';

(async () => {
  const password_hash = await bcrypt.hash(password, 10);
  // Remove usuário antigo se existir
  db.prepare('DELETE FROM users WHERE email = ?').run(email);
  // Insere novo admin
  db.prepare(`INSERT INTO users (name, email, password_hash, country, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`).run(
    name, email, password_hash, country, role, status
  );
  console.log('Usuário admin inserido com sucesso!');
  db.close();
})();

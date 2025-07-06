// fixDatabase.js
import fs from 'fs';
const file = 'src/database.js';
let c = fs.readFileSync(file, 'utf8');

// 1) remove a chave extra após updateUser
c = c.replace(
  /(export async function updateUser[\s\S]*?return rows\[0\];)\s*}\s*}/,
  '$1}'
);

// 2) substitui todo o bloco addUserMessage pelo SQL correto
c = c.replace(
  /export async function addUserMessage[\s\S]*?\}/,
  `export async function addUserMessage(userId, tipo, mensagem) {
  await pool.query(
    \`INSERT INTO user_messages (user_id, tipo_mensagem, mensagem, enviado_em)
     VALUES ($1, $2, $3, NOW())\`,
    [userId, tipo, mensagem]
  );
}`
);

fs.writeFileSync(file, c, 'utf8');
console.log('✅ Correções aplicadas em src/database.js');

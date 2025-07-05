import fs from 'fs';
const file = 'src/database.js';
let c = fs.readFileSync(file, 'utf8');
// 1) remove '}' extra depois de updateUser
c = c.replace(/(export async function updateUser[\s\S]*?return rows\[\s*0\s*\];)\s*}\s*}/, '\}');
// 2) corrige todo o bloco addUserMessage
c = c.replace(/export async function addUserMessage[\s\S]*?\};/, export async function addUserMessage(userId, tipo, mensagem) {
  await pool.query(\INSERT INTO user_messages (user_id, tipo_mensagem, mensagem, enviado_em)
     VALUES (, , , NOW())\, [userId, tipo, mensagem]);
});
fs.writeFileSync(file, c, 'utf8');
console.log('✅ database.js corrigido');

import { pool } from '../database.js';

export async function getDefaultConfigs() {
  const query = `
    SELECT *
    FROM configs_default
    WHERE ativa = true
    LIMIT 1;
  `;
  const { rows } = await pool.query(query);
  return rows[0];
}

export async function saveDefaultConfigs(configs) {
  // Preencha os campos e valores conforme seu modelo de tabela/configs
  const query = `
    INSERT INTO configs_default (/* campos */)
    VALUES (/* valores derivados de configs */)
    RETURNING id;
  `;
  // Exemplo: await pool.query(query, [configs.valor1, configs.valor2, ...]);
  // Ajuste conforme os campos reais do seu projeto!
  return await pool.query(query, [/* valores */]);
}

import { executeQuery } from './databaseService.js';

export async function getDefaultConfigs() {
  const query = `
    SELECT *
    FROM configs_default
    WHERE ativa = true
    LIMIT 1;
  `;
  return await executeQuery(query);
}

export async function saveDefaultConfigs(configs) {
  const query = `
    INSERT INTO configs_default (/* campos */)
    VALUES (/* valores derivados de configs */)
    RETURNING id;
  `;
  return await executeQuery(query, [/* valores */]);
}





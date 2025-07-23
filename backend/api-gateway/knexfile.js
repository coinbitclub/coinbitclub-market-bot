const productionBase = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: { directory: '../migrations' },
  seeds: { directory: '../seeds' },
};

const developmentBase = {
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  migrations: { directory: '../migrations' },
  seeds: { directory: '../seeds' },
};

export default {
  development: developmentBase,
  test: developmentBase,
  production: productionBase,
};

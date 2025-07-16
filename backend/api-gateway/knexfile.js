const base = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' },
};

export default {
  development: base,
  test: base,
  production: base,
};

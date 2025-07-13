// knexfile.js
import 'dotenv/config';

export default {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: 'localhost',
      user: 'seu_user',
      password: 'sua_senha',
      database: 'seu_db'
    },
    migrations: { directory: './src/database/migrations' },
    seeds:      { directory: './src/database/seeds' }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: { directory: './src/database/migrations' },
    seeds:      { directory: './src/database/seeds' }
  }
};

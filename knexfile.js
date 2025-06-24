// knexfile.js
import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env correspondente (default a 'test' se NODE_ENV não definido)
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'test'}` });

export default {
  test: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.resolve('migrations')
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.resolve('migrations')
    }
  }
};

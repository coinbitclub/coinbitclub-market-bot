import 'dotenv/config';

// Garante JWT_SECRET para ambiente de desenvolvimento
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não definido nas variáveis de ambiente. Usando segredo padrão de desenvolvimento.');
  process.env.JWT_SECRET = 'dev-secret';
}
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { initDB } from './common/db.js';
import { setupScheduler } from './common/scheduler.js';
import { apiGateway } from './api-gateway/app.js';

async function main() {
  let db;
  try {
    // Inicializa conexão com o banco de dados e obtém instância
    db = await initDB();

    // Aplica schema via schema.sql (sem migrations)
    const schemaPath = path.resolve(process.cwd(), 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await db.raw(sql);
      console.log('✅ Schema aplicado com sucesso');
    } else {
      console.warn(`⚠️ Arquivo schema.sql não encontrado em ${schemaPath}`);
    }
  } catch (err) {
    console.error('❌ Falha na inicialização do DB ou aplicação do schema:', err);
    process.exit(1);
  }

  const app = express();

  // Segurança e CORS
  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => res.sendStatus(200));

  // Roteamento da API
  app.use('/api', apiGateway);

  // Tratamento global de erros
  app.use((err, _req, res, _next) => {
    console.error('🚨 Erro na requisição:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const port = process.env.PORT || 8080;
  const server = app.listen(port, () => {
    console.log(`🚀 API running on port ${port}`);
    // Inicia os jobs agendados somente após a API subir
    setupScheduler();
  });

  // Encerramento graçoso
  process.on('SIGINT', () => {
    console.log('🛑 Encerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor finalizado');
      process.exit(0);
    });
  });
}

main();

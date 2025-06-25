import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import { expressjwt as jwt } from 'express-jwt';
import webhookRouter from './routes/webhook.js';
import fetchRouter from './routes/fetch.js';
import promClient from 'prom-client';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());

// Health & metrics
app.get('/',        (req, res) => res.send('CoinbitClub Market Bot está rodando! 🚀'));
app.get('/healthz', (req, res) => res.send('OK'));
app.get('/metrics', async (req, res) => {
res.set('Content-Type', promClient.register.contentType);
res.end(await promClient.register.metrics());
});

// JWT protege apenas /webhook e /fetch
app.use(jwt({ secret: process.env.WEBHOOK_JWT_SECRET, algorithms: \['HS256'] })
.unless({ path: \['/', '/healthz', '/metrics'] })
);

app.use('/webhook', webhookRouter);
app.use('/fetch',   fetchRouter);

// Export app for testing
export default app;

// Only start server if this file is run directly
if (process.argv\[1].endsWith('src/index.js')) {
app.listen(port, () => console.log(`🚀 Servidor rodando na porta ${port}`));
}

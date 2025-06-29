import express from 'express';

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (_req, res) => res.send('🚀 CoinbitClub Market Bot ativo!'));
app.get('/healthz', (_req, res) => res.send('OK'));

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});

export default app;

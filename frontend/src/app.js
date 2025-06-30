import express from 'express';
import cors from 'cors';

import adminRoutes from './routes/admin.js';
import kpiRoutes from './routes/kpi.js';
import logsRoutes from './routes/logs.js';
import marketRoutes from './routes/market.js';
import signalsRoutes from './routes/signals.js';
import tradesRoutes from './routes/trades.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/admin/kpis', kpiRoutes);
app.use('/api/admin/logs', logsRoutes);
app.use('/api/admin/market', marketRoutes);
app.use('/api/admin/signals', signalsRoutes);
app.use('/api/admin/trades', tradesRoutes);

export default app;

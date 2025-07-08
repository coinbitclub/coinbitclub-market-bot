// src/app.js
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

// Carrega variáveis de ambiente de .env
dotenv.config()

// Importa conexão com banco
import { pool } from './database.js'

// Importa rotas
import userRoutes from './routes/user.js'
import adminRoutes from './routes/admin.js'
import signalsRoutes from './routes/signals.js'
import webhookRoutes from './routes/webhook.js'
import plansRoutes from './routes/plans.js'
import notificationsRoutes from './routes/notifications.js'
import integrationsRoutes from './routes/integrations.js'

const app = express()

// ————— Trust proxy (para uso em plataformas como Railway) —————
app.set('trust proxy', 1)

// ————— CORS —————
const FRONTEND_URL = process.env.FRONTEND_URL || '*'
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}))
app.options('*', cors())

// ————— Rate limiting —————
app.use(rateLimit({
  windowMs: 60 * 1000,  // 1 minuto
  max: 100,             // até 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false
}))

// ————— Body parser & logging —————
app.use(express.json({ limit: '200kb' }))
app.use(morgan('combined'))

// ————— Rotas públicas —————
app.use('/api/user', userRoutes)
app.use('/api/signals', signalsRoutes)
app.use('/api/webhook', webhookRoutes)
app.use('/api/plans', plansRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/integrations', integrationsRoutes)

// ————— Rotas admin (já protegem internamente via middleware) —————
app.use('/api/admin', adminRoutes)

// ————— Healthcheck —————
app.get('/healthz', (_req, res) =>
  res.status(200).json({ status: 'ok', version: process.env.npm_package_version })
)

// ————— Catch-all 404 —————
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado.' })
})

// ————— Erro handler global —————
app.use((err, _req, res, _next) => {
  console.error('❌ ERRO GERAL:', err.stack || err)
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor.'
  })
})

export default app

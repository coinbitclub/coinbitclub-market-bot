// src/index.js
import express from 'express'
import 'express-async-errors'
import 'dotenv/config'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import * as Sentry from '@sentry/node'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import path from 'path'
import { collectDefaultMetrics, register, Histogram } from 'prom-client'

import {
  ensureSignalsTable,
  ensureCointarsTable,
  ensurePositionsTable,
  ensureIndicatorsTable
} from './services/dbMigrations.js'
import { parseSignal } from './services/parseSignal.js'
import { parseDominance } from './services/parseDominance.js'
import { saveSignal, saveDominance } from './services/signalService.js'
import { setupScheduler } from './services/scheduler.js'

const app = express()

// ————— Proxy Trust —————
app.set('trust proxy', 1)

// ————— PORT & Ambiente —————
let PORT
if (process.env.NODE_ENV === 'production') {
  if (!process.env.PORT) {
    console.error('❌ ERRO: variável de ambiente PORT não definida em produção.')
    process.exit(1)
  }
  PORT = Number(process.env.PORT)
} else {
  PORT = Number(process.env.PORT) || 8080
}
console.log(`🛡️  Usando porta ${PORT}`)

// ————— WEBHOOK_TOKEN obrigatório —————
if (!process.env.WEBHOOK_TOKEN) {
  console.error('❌ ERRO: variável de ambiente WEBHOOK_TOKEN não definida.')
  process.exit(1)
}
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN
const FRONTEND_URL = process.env.FRONTEND_URL || '*'

// ————— CORS —————
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}))
app.options('*', cors())

// ————— Rate Limiting —————
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
}))

// ————— JSON Body —————
app.use(express.json({ limit: '200kb' }))

// ————— Sentry & Metrics —————
Sentry.init({ dsn: process.env.SENTRY_DSN })
app.use(Sentry.Handlers.requestHandler())
collectDefaultMetrics()
new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em seconds',
  labelNames: ['method','route','code']
})

// ————— Health & Metrics —————
app.get('/', (_req, res) => res.status(200).send('OK'))
app.get('/healthz', (_req, res) => res.status(200).send('OK'))
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.send(await register.metrics())
})

// ————— Swagger UI —————
const swaggerDocument = YAML.load(path.resolve('docs/swagger.yaml'))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// ————— Helper: extrai token do webhook —————
function getWebhookToken(req) {
  if (req.query.token) return req.query.token
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return null
}

// ————— Webhook Signal —————
app.post('/webhook/signal', async (req, res, next) => {
  if (getWebhookToken(req) !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // DEBUG: inspecionar payload recebido
  console.log('🔔 [webhook/signal] payload raw:', req.body)

  try {
    const payload = parseSignal(req.body)
    const { id } = await saveSignal(payload)
    return res.status(200).json({ ok: true, id })
  } catch (err) {
    if (err.message === 'Invalid signal payload') {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
})

// ————— Webhook Dominance —————
app.post('/webhook/dominance', async (req, res, next) => {
  if (getWebhookToken(req) !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' })
  }
  try {
    const payload = parseDominance(req.body)
    const { id } = await saveDominance(payload)
    return res.status(200).json({ ok: true, id })
  } catch (err) {
    if (err.message === 'Invalid dominance payload') {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
})

// ————— Error Handler —————
app.use(Sentry.Handlers.errorHandler())
app.use((err, _req, res, _next) => {
  console.error('❌ ERRO GERAL:', err.stack || err)
  res.status(err.status || 500).json({ error: err.message })
})

// ————— Startup: migrations + scheduler + listen —————
if (process.env.NODE_ENV !== 'test') {
  ;(async () => {
    console.log('🛠️ Iniciando migrações de DB…')
    await ensureSignalsTable();    console.log('✔️ signals')
    await ensureCointarsTable();   console.log('✔️ cointars')
    await ensurePositionsTable();  console.log('✔️ positions')
    await ensureIndicatorsTable(); console.log('✔️ indicators')
    console.log('🛠️ Migrações concluídas.')

    console.log('⏰ Iniciando scheduler…')
    setupScheduler()
    console.log('⏰ Scheduler iniciado.')

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`)
    })

    // Graceful shutdown
    const shutdown = () => {
      console.log('📦 Shutdown signal received, closing server...')
      server.close(() => {
        console.log('✅ HTTP server closed. Exiting.')
        process.exit(0)
      })
      setTimeout(() => {
        console.error('⏱️ Forced shutdown.')
        process.exit(1)
      }, 10000).unref()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  })().catch(ex => {
    console.error('🔥 Startup error:', ex.stack || ex)
    process.exit(1)
  })
}

export default app

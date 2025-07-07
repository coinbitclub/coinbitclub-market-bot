// src/index.js
import express from 'express'
import 'express-async-errors'
import 'dotenv/config'

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
const PORT = Number(process.env.PORT) || 8080
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN

app.use(express.json())

// --- Healthchecks ---
app.get('/', (_req, res) => res.send('🚀 Bot ativo!'))
app.get('/healthz', (_req, res) => res.send('OK'))

// --- Webhook de SINAL ---
app.post('/webhook/signal', async (req, res, next) => {
  if (req.query.token !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' })
  }
  try {
    const payload = parseSignal(req.body)
    const { id } = await saveSignal(payload)
    return res.json({ ok: true, id })
  } catch (err) {
    if (err.message === 'Invalid signal payload') {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
})

// --- Webhook de DOMINANCE ---
app.post('/webhook/dominance', async (req, res, next) => {
  if (req.query.token !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' })
  }
  try {
    const payload = parseDominance(req.body)
    const { id } = await saveDominance(payload)
    return res.json({ ok: true, id })
  } catch (err) {
    if (err.message === 'Invalid dominance payload') {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
})

// --- Tratador global de erros ---
app.use((err, _req, res, _next) => {
  console.error('❌ ERRO GERAL:', err.stack || err)
  res.status(err.status || 500).json({ error: err.message })
})

// --- Bootstrap em dev/produção ---
if (process.env.NODE_ENV !== 'test') {
  ;(async () => {
    try {
      console.log('🛠️ Iniciando migrações de DB…')
      await ensureSignalsTable();    console.log('✔️ signals')
      await ensureCointarsTable();   console.log('✔️ cointars')
      await ensurePositionsTable();  console.log('✔️ positions')
      await ensureIndicatorsTable(); console.log('✔️ indicators')
      console.log('🛠️ Migrações concluídas.')

      console.log('⏰ Iniciando scheduler…')
      await setupScheduler()
      console.log('⏰ Scheduler iniciado.')

      app.listen(PORT, () => {
        console.log(`🚀 Server listening on port ${PORT}`)
      })
    } catch (ex) {
      console.error('🔥 Startup error:', ex.stack || ex)
      process.exit(1)
    }
  })()
}

export default app

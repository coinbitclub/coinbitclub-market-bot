// src/index.js
import express from 'express'
import 'express-async-errors'
import './services/dbMigrations.js'      // garante que as migrations rodem antes de tudo
import dotenv from 'dotenv/config'

import parseSignal from './services/parseSignal.js'                    // default export
import { parseDominance } from './services/parseDominance.js'          // named export
import { saveSignal, saveDominance } from './services/signalService.js'// named exports
import initScheduler from './services/scheduler.js'                    // default export

const app = express()
app.use(express.json())

const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN

// rotas GET
app.get('/', (_req, res) => {
  res.send('alive')
})
app.get('/healthz', (_req, res) => {
  res.status(200).end()
})

// rota de sinal
app.post('/webhook/signal', async (req, res, next) => {
  try {
    const token = req.query.token
    if (token !== WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // parseSignal lança erro 400 se payload inválido
    const { symbol, price, side, time } = parseSignal(req.body)
    const id = await saveSignal({ symbol, price, side, time })
    return res.json({ ok: true, id })
  } catch (err) {
    return next(err)
  }
})

// rota de dominância
app.post('/webhook/dominance', async (req, res, next) => {
  try {
    const token = req.query.token
    if (token !== WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // parseDominance lança erro 400 se payload inválido
    const { btc_dom, eth_dom } = parseDominance(req.body)
    const id = await saveDominance({ btc_dom, eth_dom })
    return res.json({ ok: true, id })
  } catch (err) {
    return next(err)
  }
})

// inicia o scheduler (jobs agendados)
initScheduler()

// tratamento global de erros
app.use((err, _req, res, _next) => {
  console.error('❌ ERRO GERAL:', err.stack || err)
  res.status(err.status || 500).json({ error: err.message })
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`)
})

// exporta o app para os testes
export default app

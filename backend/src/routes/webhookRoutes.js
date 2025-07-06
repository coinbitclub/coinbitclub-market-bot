// src/routes/webhookRoutes.js
import express from 'express'
import { verifyToken } from '../middleware/verifyToken.js'

import {
  parseSignal,
  parseDominance,
  parseFearGreed,
  parseMarket
} from '../services/parserService.js'

import { saveSignal }      from '../services/signalService.js'
import {
  insertDominance,
  insertFearGreed,
  insertMarket
} from '../services/databaseService.js'

const router = express.Router()

// Aplica autenticação (Bearer JWT ou ?token=…) em todas as rotas abaixo
router.use(verifyToken)

/**
 * POST /webhook/signal
 */
router.post('/signal', async (req, res, next) => {
  try {
    const signal = parseSignal(req.body)
    const userId = req.userId ?? null
    await saveSignal(userId, signal)
    res.json({ status: 'ok' })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /webhook/dominance
 */
router.post('/dominance', async (req, res, next) => {
  try {
    const dom = parseDominance(req.body)
    await insertDominance(dom)
    res.json({ status: 'ok' })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /webhook/fear-greed
 */
router.post('/fear-greed', async (req, res, next) => {
  try {
    const fg = parseFearGreed(req.body)
    await insertFearGreed(fg)
    res.json({ status: 'ok' })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /webhook/market
 */
router.post('/market', async (req, res, next) => {
  try {
    const mk = parseMarket(req.body)
    await insertMarket(mk)
    res.json({ status: 'ok' })
  } catch (err) {
    next(err)
  }
})

export default router

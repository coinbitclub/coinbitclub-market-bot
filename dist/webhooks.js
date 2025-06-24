"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = require("express");
var _signalsService = require("../services/signalsService.js");
var _dominanceService = require("../services/dominanceService.js");
var _rawService = require("../services/rawService.js");
var _parseSignal = require("../parseSignal.js");
var _parseDominance = require("../parseDominance.js");
var _logger = require("../logger.js");
const router = (0, _express.Router)();

// Token validation
router.use((req, res, next) => {
  if (req.query.token !== process.env.WEBHOOK_TOKEN) {
    _logger.logger.warn('Token inválido no webhook', {
      token: req.query.token
    });
    return res.status(401).json({
      error: 'Token inválido'
    });
  }
  next();
});

// Save raw webhook data
router.use(async (req, res, next) => {
  try {
    await (0, _rawService.saveRaw)(req.path, {
      ...(req.query || {}),
      ...(req.body || {})
    });
  } catch (e) {
    _logger.logger.warn('Falha ao gravar raw_webhook', e);
  }
  next();
});

// GET /signal
router.get('/signal', async (req, res) => {
  _logger.logger.info('GET /signal', {
    query: req.query
  });
  try {
    const signal = (0, _parseSignal.parseSignal)(req.query);
    await (0, _signalsService.saveSignal)(signal);
    res.json({
      status: 'ok'
    });
  } catch (err) {
    _logger.logger.error('Erro no GET /signal', err);
    res.status(500).json({
      error: 'Erro ao processar GET'
    });
  }
});

// POST /signal
router.post('/signal', async (req, res) => {
  _logger.logger.info('POST /signal', {
    body: req.body
  });
  try {
    const signal = (0, _parseSignal.parseSignal)(req.body);
    await (0, _signalsService.saveSignal)(signal);
    res.json({
      status: 'ok'
    });
  } catch (err) {
    _logger.logger.error('Erro no POST /signal', err);
    res.status(500).json({
      error: 'Erro ao processar POST'
    });
  }
});

// POST /dominance
router.post('/dominance', async (req, res) => {
  _logger.logger.info('POST /dominance', {
    body: req.body
  });
  try {
    const dom = (0, _parseDominance.parseDominance)(req.body);
    await (0, _dominanceService.saveDominance)(dom);
    res.json({
      status: 'ok'
    });
  } catch (err) {
    _logger.logger.error('Erro no POST /dominance', err);
    res.status(500).json({
      error: 'Erro ao processar dominância'
    });
  }
});
var _default = exports.default = router;
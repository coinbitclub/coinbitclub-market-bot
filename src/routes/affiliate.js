// src/routes/affiliate.js
import express from 'express';
import Joi from 'joi';
import { validate } from '../middleware/validatePayload.js';
import { isUser, isAdmin } from '../middleware/auth.js';
import * as affiliateService from '../services/affiliateService.js';

const router = express.Router();

// ──── Area do Afiliado (Usuário autenticado) ────
router.use(isUser);

// GET /affiliate/profile
router.get(
  '/profile',
  async (req, res, next) => {
    try {
      const data = await affiliateService.getAffiliateProfile(req.user.userId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /affiliate/profile
router.put(
  '/profile',
  validate(
    Joi.object({
      body: Joi.object({
        nome: Joi.string(),
        sobrenome: Joi.string(),
        telefone: Joi.string(),
        pais: Joi.string(),
        // outros campos editáveis
      })
    })
  ),
  async (req, res, next) => {
    try {
      await affiliateService.updateAffiliateProfile(req.user.userId, req.body);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// GET /affiliate/extract
router.get(
  '/extract',
  async (req, res, next) => {
    try {
      const data = await affiliateService.getAffiliateExtract(req.user.userId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// GET /affiliate/indications
router.get(
  '/indications',
  async (req, res, next) => {
    try {
      const data = await affiliateService.getAffiliateIndications(req.user.userId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// GET /affiliate/referral-link
router.get(
  '/referral-link',
  async (req, res, next) => {
    try {
      const link = await affiliateService.getReferralLink(req.user.userId);
      res.json({ link });
    } catch (err) {
      next(err);
    }
  }
);

// ──── Area do Admin ────
router.use(isAdmin);

// GET /affiliate/ (listar afiliados)
router.get(
  '/',
  async (_req, res, next) => {
    try {
      const data = await affiliateService.listAffiliates();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// POST /affiliate/ (criar afiliado)
router.post(
  '/',
  validate(
    Joi.object({
      body: Joi.object({
        userId: Joi.number().integer().required(),
        code: Joi.string().required(),
        // outros campos iniciais
      })
    })
  ),
  async (req, res, next) => {
    try {
      const data = await affiliateService.createAffiliate(req.body);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /affiliate/:id (atualizar afiliado)
router.put(
  '/:id',
  validate(
    Joi.object({
      params: Joi.object({ id: Joi.number().integer().required() }),
      body: Joi.object({
        code: Joi.string(),
        // possíveis campos para edição
      })
    })
  ),
  async (req, res, next) => {
    try {
      await affiliateService.updateAffiliate(Number(req.params.id), req.body);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /affiliate/:id (remover afiliado)
router.delete(
  '/:id',
  validate(
    Joi.object({ params: Joi.object({ id: Joi.number().integer().required() }) })
  ),
  async (req, res, next) => {
    try {
      await affiliateService.deleteAffiliate(Number(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// GET /affiliate/:id/extract (extract admin)
router.get(
  '/:id/extract',
  validate(
    Joi.object({ params: Joi.object({ id: Joi.number().integer().required() }) })
  ),
  async (req, res, next) => {
    try {
      const data = await affiliateService.adminGetAffiliateExtract(Number(req.params.id));
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// POST /affiliate/:id/credit (lançamento manual)
router.post(
  '/:id/credit',
  validate(
    Joi.object({
      params: Joi.object({ id: Joi.number().integer().required() }),
      body: Joi.object({
        tipo: Joi.string().valid('credit','debit').required(),
        valor: Joi.number().required(),
        descricao: Joi.string().allow(''),
        status: Joi.string().valid('pending','completed').default('pending')
      })
    })
  ),
  async (req, res, next) => {
    try {
      await affiliateService.addAffiliateExtract({
        user_id: Number(req.params.id),
        tipo: req.body.tipo,
        valor: req.body.valor,
        descricao: req.body.descricao,
        status: req.body.status
      });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

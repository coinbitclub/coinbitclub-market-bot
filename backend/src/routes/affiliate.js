import express from "express";
import * as affiliateService from "../services/affiliateService.js";
import { jwtMiddleware } from "../services/adminService.js"; // Ou outro middleware, se usar JWT no painel

const router = express.Router();

// ------- Área do Afiliado (autenticado) -------
router.get("/profile", jwtMiddleware, async (req, res, next) => {
  try {
    const data = await affiliateService.getAffiliateProfile(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

router.put("/profile", jwtMiddleware, async (req, res, next) => {
  try {
    await affiliateService.updateAffiliateProfile(req.user.id, req.body);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get("/extract", jwtMiddleware, async (req, res, next) => {
  try {
    const data = await affiliateService.getAffiliateExtract(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/indications", jwtMiddleware, async (req, res, next) => {
  try {
    const data = await affiliateService.getAffiliateIndications(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/referral-link", jwtMiddleware, async (req, res, next) => {
  try {
    const link = await affiliateService.getReferralLink(req.user.id);
    res.json({ link });
  } catch (err) { next(err); }
});

// ------- Área do Admin -------
router.get("/", jwtMiddleware, async (req, res, next) => {
  try {
    // Aqui pode restringir para admin (ex: req.user.role === "admin")
    const data = await affiliateService.listAffiliates();
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/", jwtMiddleware, async (req, res, next) => {
  try {
    const data = await affiliateService.createAffiliate(req.body);
    res.json(data);
  } catch (err) { next(err); }
});

router.put("/:id", jwtMiddleware, async (req, res, next) => {
  try {
    await affiliateService.updateAffiliate(req.params.id, req.body);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete("/:id", jwtMiddleware, async (req, res, next) => {
  try {
    await affiliateService.deleteAffiliate(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get("/:id/extract", jwtMiddleware, async (req, res, next) => {
  try {
    const data = await affiliateService.adminGetAffiliateExtract(req.params.id);
    res.json(data);
  } catch (err) { next(err); }
});

// Lançamento manual de crédito/débito/extrato pelo admin
router.post("/:id/credit", jwtMiddleware, async (req, res, next) => {
  try {
    const { tipo, valor, descricao, status } = req.body;
    await affiliateService.addAffiliateExtract({ user_id: req.params.id, tipo, valor, descricao, status });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;

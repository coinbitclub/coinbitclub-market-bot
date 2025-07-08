import express from "express";
import * as adminService from "../services/adminService.js";

const router = express.Router();

// Login admin (simples, sem senha por enquanto)
router.post("/login", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "E-mail obrigatório." });
    const result = await adminService.loginAdmin(email);
    res.json(result);
  } catch (err) { next(err); }
});

// KPIs principais
router.get("/kpis", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const kpis = await adminService.getKpis();
    res.json(kpis);
  } catch (err) { next(err); }
});

// Listagem de usuários
router.get("/users", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const users = await adminService.getUsers();
    res.json(users);
  } catch (err) { next(err); }
});

// Reset de senha de usuário
router.post("/reset-password", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId obrigatório." });
    const result = await adminService.resetUserPassword(userId);
    res.json(result);
  } catch (err) { next(err); }
});

// Deletar usuário
router.delete("/user/:id", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

// Assinaturas dos usuários
router.get("/subscriptions", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const subs = await adminService.getSubscriptions();
    res.json(subs);
  } catch (err) { next(err); }
});

// Logs gerais (bot, sistema, IA, etc)
router.get("/logs", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const logs = await adminService.getLogs();
    res.json(logs);
  } catch (err) { next(err); }
});

// Extrato financeiro de um usuário
router.get("/finance/:userId", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const fin = await adminService.getUserFinance(req.params.userId);
    res.json(fin);
  } catch (err) { next(err); }
});

// PAUSAR TODOS OS ROBÔS (admin)
router.post("/pause-all-bots", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const { motivo } = req.body;
    await adminService.pauseAllBots(motivo || "Pausa global por admin");
    res.json({ status: "Todos os robôs pausados" });
  } catch (err) { next(err); }
});

// REATIVAR TODOS OS ROBÔS (admin)
router.post("/reactivate-all-bots", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const { motivo } = req.body;
    await adminService.reactivateAllBots(motivo || "Reativação global por admin");
    res.json({ status: "Todos os robôs reativados" });
  } catch (err) { next(err); }
});

// FECHAR TODAS AS OPERAÇÕES ABERTAS (Bybit/Binance/BD)
router.post("/close-all-trades", adminService.jwtMiddleware, async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const totalClosed = await adminService.closeAllOpenTrades(motivo || "Ordem admin global");
    res.json({ status: "OK", total_closed: totalClosed });
  } catch (err) { next(err); }
});

export default router;

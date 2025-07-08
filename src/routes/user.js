import express from "express";
import { pool } from "../database.js";
import * as userService from "../services/userService.js";

const router = express.Router();

// Cadastro de novo usuário
router.post("/register", async (req, res, next) => {
  try {
    const { nome, sobrenome, email, telefone, pais, aceite_termo } = req.body;
    if (!nome || !sobrenome || !email || !telefone || !pais || !aceite_termo)
      return res.status(400).json({ error: "Campos obrigatórios não preenchidos" });

    const user = await userService.registerUser({ nome, sobrenome, email, telefone, pais, aceite_termo });
    res.status(201).json(user);
  } catch (err) { next(err); }
});

// Login de usuário
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email /*|| !password*/) // Senha opcional até integrar no front
      return res.status(400).json({ error: "Email (e senha, futuramente) obrigatórios." });

    const result = await userService.loginUser({ email, password });
    res.status(result.status || 200).json(result);
  } catch (err) { next(err); }
});

// Recuperação de senha (endpoint preparado)
router.post("/forgot", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Informe o email." });
    const result = await userService.forgotPassword(email);
    res.json(result);
  } catch (err) { next(err); }
});

// Consulta do próprio perfil (requer JWT, ajuste depois)
router.get("/me", userService.jwtMiddleware, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
});

// Atualização de perfil (nome, telefone, etc)
router.post("/update", userService.jwtMiddleware, async (req, res, next) => {
  try {
    const update = await userService.updateUser(req.user.id, req.body);
    res.json(update);
  } catch (err) { next(err); }
});

// Cadastro ou atualização de credenciais (chaves)
router.post("/credentials", userService.jwtMiddleware, async (req, res, next) => {
  try {
    const { exchange, api_key, api_secret, is_testnet } = req.body;
    if (!exchange || !api_key || !api_secret)
      return res.status(400).json({ error: "Campos obrigatórios." });

    const cred = await userService.saveCredentials(req.user.id, { exchange, api_key, api_secret, is_testnet });
    res.json(cred);
  } catch (err) { next(err); }
});

// Consulta de operações do usuário
router.get("/operations", userService.jwtMiddleware, async (req, res, next) => {
  try {
    const { modo } = req.query; // modo: "testnet" ou "producao"
    const ops = await userService.getOperations(req.user.id, modo);
    res.json(ops);
  } catch (err) { next(err); }
});

// Consulta do extrato financeiro do usuário
router.get("/finance", userService.jwtMiddleware, async (req, res, next) => {
  try {
    const fin = await userService.getFinance(req.user.id);
    res.json(fin);
  } catch (err) { next(err); }
});

// Consulta de assinaturas/plano do usuário
router.get("/subscriptions", userService.jwtMiddleware, async (req, res, next) => {
  try {
    const plans = await userService.getSubscriptions(req.user.id);
    res.json(plans);
  } catch (err) { next(err); }
});

// Assinar/cancelar plano
router.post("/subscription", userService.jwtMiddleware, async (req, res, next) => {
  try {
    const result = await userService.changeSubscription(req.user.id, req.body);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;

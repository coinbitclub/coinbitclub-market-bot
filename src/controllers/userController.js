// src/controllers/userController.js
import {
  registerUser,
  loginUser,
  forgotPassword,
  getUserById,
  updateUser,
  saveCredentials,
  getOperations,
  getFinance,
  getSubscriptions,
  changeSubscription,
  getRisks,
  updateRisks,
  getSignals,
  requestWithdrawal
} from '../services/userService.js';

/**
 * Registra novo usuário
 */
export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * Login do usuário
 */
export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Recuperação de senha (stub)
 */
export async function forgot(req, res, next) {
  try {
    const response = await forgotPassword(req.body.email);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

/**
 * Consulta perfil do usuário
 */
export async function getProfile(req, res, next) {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * Atualiza dados do usuário
 */
export async function updateProfile(req, res, next) {
  try {
    const updated = await updateUser(req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Salva credenciais de API
 */
export async function saveApiCredentials(req, res, next) {
  try {
    const creds = await saveCredentials(req.user.id, req.body);
    res.json(creds);
  } catch (err) {
    next(err);
  }
}

/**
 * Consulta operações do usuário
 */
export async function listOperations(req, res, next) {
  try {
    const ops = await getOperations(req.user.id, req.query.modo);
    res.json(ops);
  } catch (err) {
    next(err);
  }
}

/**
 * Consulta extrato financeiro do usuário
 */
export async function listFinance(req, res, next) {
  try {
    const data = await getFinance(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * Consulta assinaturas do usuário
 */
export async function listSubscriptions(req, res, next) {
  try {
    const subs = await getSubscriptions(req.user.id);
    res.json(subs);
  } catch (err) {
    next(err);
  }
}

/**
 * Altera assinatura/plano do usuário
 */
export async function changeUserSubscription(req, res, next) {
  try {
    const response = await changeSubscription(req.user.id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

/**
 * Obtém riscos do usuário
 */
export async function fetchRisks(req, res, next) {
  try {
    const risks = await getRisks(req.user.id);
    res.json(risks);
  } catch (err) {
    next(err);
  }
}

/**
 * Atualiza riscos do usuário
 */
export async function modifyRisks(req, res, next) {
  try {
    const response = await updateRisks(req.user.id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

/**
 * Consulta sinais do usuário
 */
export async function fetchSignals(req, res, next) {
  try {
    const signals = await getSignals(req.user.id);
    res.json(signals);
  } catch (err) {
    next(err);
  }
}

/**
 * Solicita saque
 */
export async function withdraw(req, res, next) {
  try {
    const response = await requestWithdrawal(req.user.id, req.body.amount);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

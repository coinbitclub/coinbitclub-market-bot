// src/services/aiMockService.js
import { callOpenAI } from './openaiConnector.js';

/**
 * Mock usando OpenAI (ou o stub atual) para testes e desenvolvimento rápido.
 */

export async function orderDecision(userId, signal, contexto) {
  const prompt = `Head Trader decida para usuário ${userId}, Signal: ${JSON.stringify(signal)}, Contexto: ${JSON.stringify(contexto)}`;
  return callOpenAI(prompt);
}

export async function rationale(userId, trade, contexto) {
  const prompt = `racional para usuário ${userId}, trade: ${JSON.stringify(trade)}, Contexto: ${JSON.stringify(contexto)}`;
  const raw = await callOpenAI(prompt);
  // garante string
  return typeof raw === 'string' ? raw : JSON.stringify(raw);
}

export async function overtradingCheck(userId, signal, contexto) {
  const prompt = `overtrading para usuário ${userId}, Signal: ${JSON.stringify(signal)}, Contexto: ${JSON.stringify(contexto)}`;
  return callOpenAI(prompt);
}

export async function antifraudCheck(userId, signal, contexto) {
  const prompt = `antifraude para usuário ${userId}, Signal: ${JSON.stringify(signal)}, Contexto: ${JSON.stringify(contexto)}`;
  return callOpenAI(prompt);
}

export async function logsResolver(userId, logs, contexto) {
  const prompt = `logs-resolver para usuário ${userId}, logs: ${JSON.stringify(logs)}, Contexto: ${JSON.stringify(contexto)}`;
  return callOpenAI(prompt);
}

export async function monitorPosition(userId, trade, contexto) {
  const prompt = `logs-resolver para monitorPosition usuário ${userId}, trade: ${JSON.stringify(trade)}, Contexto: ${JSON.stringify(contexto)}`;
  return callOpenAI(prompt);
}

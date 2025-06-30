// src/worker.js
import dotenv from 'dotenv';
import { setupScheduler } from './services/scheduler.js';

dotenv.config();

// Apenas inicializa o scheduler.
// Não há HTTP server aqui.
console.log('🛠️  Worker starting – scheduler only');
setupScheduler();

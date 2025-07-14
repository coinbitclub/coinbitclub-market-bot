import express from 'express';
import { listEventLogs, listAiLogs } from './auditController.js';
import { listUsers, suspendUser, reactivateUser, assignAffiliate } from './userManagement.js';

const router = express.Router();

router.get('/logs/events', listEventLogs);
router.get('/logs/ai', listAiLogs);
router.get('/users', listUsers);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/reactivate', reactivateUser);
router.post('/users/:id/affiliate', assignAffiliate);

export default router;

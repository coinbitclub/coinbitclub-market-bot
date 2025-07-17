import express from 'express';
import { listEventLogs, listAiLogs } from './auditController.js';
import { listUsers, suspendUser, reactivateUser, assignAffiliate } from './userManagement.js';
import { listCredentials, createCredential, deleteCredential } from './credentialController.js';
import { setAffiliate, listCommissions } from './affiliateController.js';
import { listIaLogs } from './iaLogController.js';

const router = express.Router();

router.get('/logs/events', listEventLogs);
router.get('/logs/ai', listAiLogs);
router.get('/logs/ia-fallback', listIaLogs);
router.get('/users', listUsers);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/reactivate', reactivateUser);
router.post('/users/:id/affiliate', assignAffiliate);
router.get('/credentials/:userId', listCredentials);
router.post('/credentials/:userId', createCredential);
router.delete('/credentials/:id', deleteCredential);
router.post('/affiliates/:id', setAffiliate);
router.get('/affiliates/:id/commissions', listCommissions);

export default router;

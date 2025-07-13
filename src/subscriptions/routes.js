import express from 'express';
import { jwtMiddleware } from '../common/auth.js';
import { subscribe, requestRefund } from './service.js';
const router = express.Router();
router.post('/subscribe', jwtMiddleware, subscribe);
router.post('/request-refund', jwtMiddleware, requestRefund);
export default router;

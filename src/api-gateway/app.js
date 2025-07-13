import express from 'express';
import authRouter from '../auth/routes.js';
import credRouter from '../user-credentials/routes.js';
import planRouter from '../plans/routes.js';
import subRouter from '../subscriptions/routes.js';
import stripeWebhookRouter from '../webhooks/stripe/routes.js';
import signalRouter from '../signal-ingestor/routes.js';

export const apiGateway = express.Router();
apiGateway.use('/auth', authRouter);
apiGateway.use('/credentials', credRouter);
apiGateway.use('/plans', planRouter);
apiGateway.use('/subscriptions', subRouter);
apiGateway.use('/webhooks/stripe', stripeWebhookRouter);
apiGateway.use('/signals', signalRouter);

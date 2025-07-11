// src/routes/subscriptionRoutes.js
import express from 'express';
import { jwtMiddleware } from '../middleware/auth.js';
// import your subscription service functions here

const router = express.Router();

// POST /subscriptions
router.post('/', jwtMiddleware, async (req, res, next) => {
  try {
    // TODO: call your service to create a subscription
    // const sub = await createSubscription(req.user.id, req.body.planId);
    res.status(201).json({ /* id: sub.id, ... */ });
  } catch (err) {
    next(err);
  }
});

// GET /subscriptions/:id
router.get('/:id', jwtMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: call your service to fetch subscription details
    // const sub = await getSubscription(id, req.user.id);
    res.json({ /* ...sub */ });
  } catch (err) {
    next(err);
  }
});

export default router;

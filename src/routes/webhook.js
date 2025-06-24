import express from 'express';
import {
  insertSignal,
  insertDominance,
  insertFearGreed
} from '../services/databaseService.js';

const router = express.Router();

router.use(express.json());

router.post('/webhook/signal', async (req, res) => {
  try {
    await insertSignal(req.body);
    res.status(200).send('Signal saved');
  } catch (err) {
    res.status(500).send('Error saving signal');
  }
});

router.post('/webhook/dominance', async (req, res) => {
  try {
    await insertDominance(req.body);
    res.status(200).send('Dominance saved');
  } catch (err) {
    res.status(500).send('Error saving dominance');
  }
});

router.post('/webhook/fear-greed', async (req, res) => {
  try {
    await insertFearGreed(req.body);
    res.status(200).send('Fear & Greed saved');
  } catch (err) {
    res.status(500).send('Error saving fear-greed');
  }
});

export default router;
 import express from 'express';
 import { insertSignal } from '../services/databaseService.js';
 import { handleSignal } from '../services/tradingEngine.js';

 const router = express.Router();
 router.use(express.json());

 router.post('/webhook/signal', async (req, res) => {
   try {
     await insertSignal(req.body);
     await handleSignal(req.body);
     return res.status(200).send('Signal processed');
   } catch (err) {
     console.error('❌ webhook/signal error:', err);
     return res.status(500).send('Error processing signal');
   }
 });

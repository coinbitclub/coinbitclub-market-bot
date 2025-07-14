import express from 'express';
import { listenWebhooks } from './ingestor.js';

const app = express();
app.use(express.json());
listenWebhooks(app);

const port = process.env.PORT || 9001;
app.listen(port, () => console.log(`Signal ingestor on ${port}`));

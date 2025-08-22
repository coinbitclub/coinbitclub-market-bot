const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'MARKETBOT ONLINE',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/webhooks/signal', (req, res) => {
  const token = req.query.token;
  console.log('Signal received:', req.body);
  
  if (token === '210406') {
    res.json({ status: 'success', received: true });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log('MARKETBOT STARTED');

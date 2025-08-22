// MARKETBOT MINIMAL SERVER
console.log('🚀 STARTING MINIMAL SERVER...');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'ONLINE', 
    message: 'MARKETBOT MINIMAL SERVER WORKING',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/webhooks/signal', (req, res) => {
  console.log('📡 Signal received:', req.body);
  res.json({ 
    status: 'received', 
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server online on port ${PORT}`);
});

console.log('🎯 MINIMAL SERVER CONFIGURED');

// FORÇA DEPLOY RAILWAY - Cache Killer Total
// Deploy UUID: force-build-ultimate-2025-07-26-01-10-00
// Random ID: ae87a320-0921-4d32-9b35-d3f923839d5a

console.log('FORÇA DEPLOY INICIADO - ID: ae87a320-0921-4d32-9b35-d3f923839d5a');

const express = require('express');
const app = express();

// Timestamp único para forçar mudança
const BUILD_TIMESTAMP = '2025-07-26T01:10:00.000Z';
const FORCE_BUILD_ID = 'ae87a320-0921-4d32-9b35-d3f923839d5a-' + Date.now();
const CACHE_KILLER = 'ae87a320-kill-cache-' + Math.random().toString(36);

console.log('🚀 SERVIDOR FORÇA BUILD - ID:', FORCE_BUILD_ID);

app.use(express.json());

// Headers anti-cache extremos
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': FORCE_BUILD_ID,
    'Last-Modified': new Date().toUTCString(),
    'X-Force-Build': FORCE_BUILD_ID,
    'X-Cache-Killer': CACHE_KILLER,
    'X-Build-Timestamp': BUILD_TIMESTAMP
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    force_build_id: FORCE_BUILD_ID,
    cache_killer: CACHE_KILLER,
    build_timestamp: BUILD_TIMESTAMP,
    random_value: Math.random(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    railway_forced: true
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'FORÇA BUILD RAILWAY ATIVO',
    force_build_id: FORCE_BUILD_ID,
    status: 'FORCE_DEPLOYED',
    timestamp: new Date().toISOString(),
    random: Math.random()
  });
});

app.post('/webhook/test', (req, res) => {
  res.json({
    success: true,
    force_build_id: FORCE_BUILD_ID,
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FORÇA BUILD ATIVO - PORT: ${PORT}`);
  console.log(`🎯 BUILD ID: ${FORCE_BUILD_ID}`);
  console.log('✅ RAILWAY FORÇADO A FAZER BUILD!');
});

module.exports = app;

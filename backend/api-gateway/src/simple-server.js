import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'coinbitclub-api-gateway'
  });
});

// API routes
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'CoinBitClub API Gateway is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock user credentials endpoint
app.get('/api/v1/user/credentials', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        exchange: 'binance',
        name: 'Binance Main',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        exchange: 'bybit',
        name: 'Bybit Trading',
        isActive: false,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Mock financial data endpoint
app.get('/api/v1/financial/summary', (req, res) => {
  res.json({
    success: true,
    data: {
      totalBalance: 15420.50,
      totalPnL: 2840.30,
      pnlPercentage: 22.5,
      activeTrades: 5,
      todayPnL: 120.80,
      weeklyPnL: 480.20,
      monthlyPnL: 1240.90
    }
  });
});

// Mock system monitoring endpoint
app.get('/api/v1/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      services: [
        { name: 'API Gateway', status: 'healthy', uptime: '2h 30m' },
        { name: 'Decision Engine', status: 'healthy', uptime: '2h 28m' },
        { name: 'Order Executor', status: 'healthy', uptime: '2h 25m' },
        { name: 'Signal Processor', status: 'healthy', uptime: '2h 22m' }
      ],
      system: {
        cpu: 15.2,
        memory: 68.5,
        disk: 45.8
      }
    }
  });
});

// Mock trading signals endpoint
app.get('/api/v1/signals', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        symbol: 'BTCUSDT',
        type: 'BUY',
        price: 43250.50,
        confidence: 85.2,
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        symbol: 'ETHUSDT',
        type: 'SELL',
        price: 2680.30,
        confidence: 78.9,
        timestamp: new Date().toISOString()
      }
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CoinBitClub API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Status: http://localhost:${PORT}/api/v1/status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

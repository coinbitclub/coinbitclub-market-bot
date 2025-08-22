// ========================================
// MARKETBOT BACKEND - SERVER ENTRY POINT
// ========================================
// Enterprise Trading Bot - Main Server Entry
// Production-ready startup with graceful shutdown

import { startServer } from './app';

// Start the MARKETBOT Backend Server
startServer().catch((error: Error) => {
  console.error('❌ Failed to start MARKETBOT Backend:', error);
  process.exit(1);
});

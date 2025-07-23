const express = require('express');
const cors = require('cors');
const { listEventLogs, listAiLogs } = require('./auditController.js');
const { listUsers, suspendUser, reactivateUser, assignAffiliate } = require('./userManagement.js');
const { listCredentials, createCredential, deleteCredential } = require('./credentialController.js');
const { setAffiliate, listCommissions } = require('./affiliateController.js');
const { listIaLogs } = require('./iaLogController.js');
const { testConnection } = require('./db');
const usersController = require('./usersController');
const operationsController = require('./operationsController');
const affiliatesController = require('./affiliatesController');
const accountingController = require('./accountingController');

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Legacy routes (keeping for backwards compatibility)
app.get('/api/logs/events', listEventLogs);
app.get('/api/logs/ai', listAiLogs);
app.get('/api/logs/ia-fallback', listIaLogs);

// User Management routes (new comprehensive controller)
app.get('/api/admin/users', usersController.getAllUsers);
app.get('/api/admin/users/stats', usersController.getUserStats);
app.get('/api/admin/users/:id', usersController.getUserById);
app.post('/api/admin/users', usersController.createUser);
app.put('/api/admin/users/:id', usersController.updateUser);
app.put('/api/admin/users/:id/financial', usersController.updateUserFinancial);
app.delete('/api/admin/users/:id', usersController.deleteUser);

// Legacy user routes
app.get('/api/users', listUsers);
app.post('/api/users/:id/suspend', suspendUser);
app.post('/api/users/:id/reactivate', reactivateUser);
app.post('/api/users/:id/affiliate', assignAffiliate);

// Operations Management routes
app.get('/api/admin/operations', operationsController.getAllOperations);
app.get('/api/admin/operations/stats', operationsController.getOperationsStats);
app.get('/api/admin/operations/performance', operationsController.getPerformanceMetrics);
app.get('/api/admin/operations/by-date', operationsController.getOperationsByDateRange);
app.get('/api/admin/operations/:id', operationsController.getOperationById);
app.post('/api/admin/operations', operationsController.createOperation);

// Affiliates Management routes (new comprehensive controller)
app.get('/api/admin/affiliates', affiliatesController.getAllAffiliates);
app.get('/api/admin/affiliates/stats', affiliatesController.getAffiliateStats);
app.get('/api/admin/affiliates/:id', affiliatesController.getAffiliateById);
app.get('/api/admin/affiliates/:id/commissions', affiliatesController.getCommissionHistory);
app.post('/api/admin/affiliates', affiliatesController.createAffiliate);
app.put('/api/admin/affiliates/:id/credits', affiliatesController.updateAffiliateCredits);
app.post('/api/admin/affiliates/:id/payment', affiliatesController.processAffiliatePayment);

// Legacy affiliate routes
app.post('/api/affiliates/:id', setAffiliate);
app.get('/api/affiliates/:id/commissions', listCommissions);

// Credentials routes
app.get('/api/credentials/:userId', listCredentials);
app.post('/api/credentials/:userId', createCredential);
app.delete('/api/credentials/:id', deleteCredential);

// Accounting Management routes
app.get('/api/admin/accounting/overview', accountingController.getCompanyFinancialOverview);
app.get('/api/admin/accounting/monthly-flow', accountingController.getMonthlyFlow);
app.get('/api/admin/accounting/transactions', accountingController.getAllTransactions);
app.get('/api/admin/accounting/pending', accountingController.getPendingObligations);
app.get('/api/admin/accounting/revenue-by-plan', accountingController.getRevenueByPlan);
app.get('/api/admin/accounting/user/:user_id', accountingController.getUserFinancialDetails);
app.post('/api/admin/accounting/transactions', accountingController.createTransaction);
app.post('/api/admin/accounting/refunds/:id/process', accountingController.processRefund);

// Inicializar servidor com teste de conexão
async function startServer() {
  console.log('Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('Failed to connect to database. Server will still start but may have issues.');
  }
  
  app.listen(PORT, () => {
    console.log(`Admin Panel server running on port ${PORT}`);
    console.log(`Database connection: ${connected ? 'OK' : 'FAILED'}`);
  });
}

startServer();

module.exports = app;

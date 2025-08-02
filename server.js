require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const smsController = require('./src/controllers/smsController');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.post('/webhook/sms', async (req, res) => {
  await smsController.handleIncomingSMS(req, res);
});

app.get('/health', async (req, res) => {
  await smsController.handleHealthCheck(req, res);
});

// Test endpoint for development (disable in production)
if (process.env.NODE_ENV === 'development') {
  app.post('/test', async (req, res) => {
    await smsController.handleTest(req, res);
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Buddi AI SMS Bot is running! 🤖',
    version: '1.0.0',
    endpoints: {
      webhook: 'POST /webhook/sms',
      health: 'GET /health',
      ...(process.env.NODE_ENV === 'development' && { test: 'POST /test' })
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.logError('Express', error.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Buddi AI SMS Bot server running on port ${PORT}`);
  console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook/sms`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  }
  
  // Log initial stats
  const memoryStore = require('./src/data/memoryStore');
  const stats = memoryStore.getStats();
  console.log(`📊 Initial stats:`, stats);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

module.exports = app; 
/**
 * ReviveAI Server
 * Express.js backend for autonomous revenue recovery agent
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, closeDb } from './db/init.js';
import { ENV } from './env.js';
import { logger } from './utils/logger.js';
import leadsRouter from './api/leads.js';
import analyticsRouter from './api/analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  const allowedOrigins = ENV.CORS_ORIGIN.split(',').map((o) => o.trim());
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API root
app.get('/api', (req, res) => {
  res.json({
    name: 'ReviveAI Server',
    version: '0.1.0',
    environment: ENV.NODE_ENV,
    mockMode: ENV.MOCK_MODE,
  });
});

// Mount routers
app.use('/api', leadsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/agent', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    message: 'Agent endpoints will be implemented in Phase 4-5',
  });
});

// Static files (production)
if (ENV.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(staticPath));

  app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: ENV.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Server startup
async function start() {
  try {
    // Initialize database
    await initDb();
    logger.info('✅ Database initialized');

    // Start server
    const port = ENV.PORT;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📊 Environment: ${ENV.NODE_ENV}`);
      logger.info(`🤖 Mock mode: ${ENV.MOCK_MODE}`);
      logger.info(`🔑 Claude model: ${ENV.ANTHROPIC_MODEL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  closeDb();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  closeDb();
  process.exit(0);
});

start();

export default app;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import observationsRouter from './routes/observations.js';
import claimsRouter from './routes/claims.js';
import evidenceRouter from './routes/evidence.js';
import disputesRouter from './routes/disputes.js';
import safetyRouter from './routes/safety.js';
import plansRouter from './routes/plans.js';
import projectsRouter from './routes/projects.js';
import requestsRouter from './routes/requests.js';
import resourcesRouter from './routes/resources.js';
import matcherRouter from './routes/matcher.js';
import learningRouter from './routes/learning.js';
import communitiesRouter from './routes/communities.js';
import notificationsRouter from './routes/notifications.js';
import conversationsRouter from './routes/conversations.js';
import reportsRouter from './routes/reports.js';
import readinessRouter from './routes/readiness.js';
import bootstrapRouter from './routes/bootstrap.js';
import adminRouter from './routes/admin.js';
import writeRateLimiter from './middleware/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database and seed if empty
initDatabase();
seedDatabase(false);

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Write Rate Limiter & Anti-Spam Middleware
app.use(writeRateLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), service: 'CareMesh Backend API' });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);
app.use('/api/observations', observationsRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/disputes', disputesRouter);
app.use('/api/safety', safetyRouter);
app.use('/api/plans', plansRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/events', projectsRouter); // Alias for compatibility
app.use('/api/requests', requestsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/matcher', matcherRouter);
app.use('/api/learning', learningRouter);
app.use('/api/communities', communitiesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/readiness', readinessRouter);
app.use('/api/bootstrap', bootstrapRouter);

// 404 Route handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve React frontend
const frontendPath = path.join(__dirname, '../dist');

app.use(express.static(frontendPath));

// React Router fallback
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, _next) => {
  if (typeof _next === 'function') {
    // preserve Express 4-argument error signature
  }
  console.error('[API Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

export const server = app.listen(PORT, () => {
  console.log(`🚀 CareMesh Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Bootstrap API: http://localhost:${PORT}/api/bootstrap`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process. Please free port ${PORT} or check running Node processes.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

export default app;

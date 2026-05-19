import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import keywordRoutes from './routes/keywords';
import articleRoutes from './routes/articles';
import contentPlanRoutes from './routes/contentPlans';
import analyticsRoutes from './routes/analytics';
import cmsRoutes from './routes/cms';
import billingRoutes from './routes/billing';
import jobRoutes from './routes/jobs';

// Workers
import './workers/articleWorker';
import './workers/keywordWorker';
import './workers/publishWorker';
import './workers/analyticsWorker';

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'AI rate limit exceeded. Please wait before generating more content.' },
});

app.use(globalLimiter);
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'ranksyncer-api', version: '1.0.0' });
});

// ─── Public Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/billing/webhook', billingRoutes); // Paddle webhook (no auth)

// ─── Protected Routes ──────────────────────────────────────────────────────────
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/keywords', authMiddleware, aiLimiter, keywordRoutes);
app.use('/api/articles', authMiddleware, aiLimiter, articleRoutes);
app.use('/api/content-plans', authMiddleware, contentPlanRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/cms', authMiddleware, cmsRoutes);
app.use('/api/billing', authMiddleware, billingRoutes);
app.use('/api/jobs', authMiddleware, jobRoutes);

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
// Port 3000 is required by the environment
const PORT = config.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 RankSyncer API running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.NODE_ENV}`);
});

export default app;

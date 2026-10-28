import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

export const createApp = (): Application => {
  const app = express();

  // 1. Security HTTP headers (XSS, clickjacking, MIME sniffing, HSTS)
  app.use(helmet());

  // 2. Strict CORS Configuration
  app.use(
    cors({
      origin: [ENV.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Body parsers with payload size limits to prevent Denial of Service
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 4. Rate limiting to prevent brute-force attacks and volumetric DoS
  if (ENV.NODE_ENV !== 'test') {
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300, // max 300 requests per 15 min per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
      },
    });

    const loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20, // max 20 login attempts per 15 min per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes',
      },
    });

    app.use('/api/', apiLimiter);
    app.use('/api/auth/login', loginLimiter);
  }

  // 5. HTTP Request Logger (non-test environments)
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check endpoints
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
  });
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Catch-all 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import experimentRoutes from './routes/experiments';
import generationRoutes from './routes/generation';
import exportRoutes from './routes/export';
import healthRoutes, { setCronService } from './routes/health';

// Import services
import { CronService } from './services/cronService';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Initialize cron service to keep server alive
const cronService = new CronService(process.env.SERVER_URL || `http://localhost:${port}`);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/experiments', experimentRoutes);
app.use('/api/generate', generationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api', healthRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  cronService.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  cronService.stop();
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`📊 Detailed health check: http://localhost:${port}/api/health/detailed`);
  
  // Start cron service to keep server alive
  cronService.start();
  
  // Set cron service reference for health routes
  setCronService(cronService);
});

export default app;

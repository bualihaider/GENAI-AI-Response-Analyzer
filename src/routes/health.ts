import { Router, Request, Response } from 'express';
import { CronService } from '../services/cronService';

const router = Router();

// Store cron service reference (will be set by main server)
let cronService: CronService | null = null;

export const setCronService = (service: CronService) => {
  cronService = service;
};

/**
 * Health check endpoint to keep the server alive
 * This endpoint is pinged by the cron job to prevent Render from shutting down the server
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    
    console.log(`🏥 Health check pinged at ${timestamp} - Server uptime: ${Math.floor(uptime)}s`);
    
    res.json({
      status: 'healthy',
      timestamp,
      uptime: Math.floor(uptime),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Detailed health check with database connectivity
 */
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    
    // Test database connectivity
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Simple database query to test connectivity
    await prisma.experiment.count();
    await prisma.$disconnect();
    
    console.log(`🏥 Detailed health check at ${timestamp} - All systems operational`);
    
    res.json({
      status: 'healthy',
      timestamp,
      uptime: Math.floor(uptime),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    });
  } catch (error) {
    console.error('❌ Detailed health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: 'disconnected'
    });
  }
});

/**
 * Cron service status endpoint
 */
router.get('/cron/status', (req: Request, res: Response) => {
  try {
    if (!cronService) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'Cron service not initialized'
      });
    }

    const status = cronService.getStatus();
    return res.json({
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cron status error:', error);
    return res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

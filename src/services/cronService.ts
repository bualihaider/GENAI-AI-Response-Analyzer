import * as cron from 'node-cron';
import fetch from 'node-fetch';

export class CronService {
  private isRunning: boolean = false;
  private readonly serverUrl: string;
  private readonly cronExpression: string = '*/5 * * * *'; // Every 5 minutes
  private cronTask: cron.ScheduledTask | null = null;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  /**
   * Start the cron job to keep the server alive
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️  Cron service is already running');
      return;
    }

    console.log('🚀 Starting cron service to keep server alive...');
    console.log(`📅 Cron expression: ${this.cronExpression} (every 5 minutes)`);
    console.log(`🌐 Server URL: ${this.serverUrl}`);

    // Schedule the health check ping
    this.cronTask = cron.schedule(this.cronExpression, async () => {
      await this.pingHealthCheck();
    });

    // Also ping immediately on startup
    setTimeout(() => {
      this.pingHealthCheck();
    }, 5000); // Wait 5 seconds after startup

    this.isRunning = true;
    console.log('✅ Cron service started successfully');
  }

  /**
   * Stop the cron service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Cron service is not running');
      return;
    }

    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
    
    this.isRunning = false;
    console.log('🛑 Cron service stopped');
  }

  /**
   * Ping the health check endpoint
   */
  private async pingHealthCheck(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      console.log(`🏥 [${timestamp}] Pinging health check endpoint...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${this.serverUrl}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'CronService/1.0.0',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json() as any;
        console.log(`✅ [${timestamp}] Health check successful:`, {
          status: data.status,
          uptime: `${data.uptime}s`,
          environment: data.environment
        });
      } else {
        console.error(`❌ [${timestamp}] Health check failed with status: ${response.status}`);
      }
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`❌ [${timestamp}] Health check error:`, error instanceof Error ? error.message : 'Unknown error');
      
      // If it's a connection error, the server might be starting up
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.log('🔄 Server might be starting up, will retry on next schedule');
      }
    }
  }

  /**
   * Get cron service status
   */
  getStatus(): { running: boolean; cronExpression: string; serverUrl: string } {
    return {
      running: this.isRunning,
      cronExpression: this.cronExpression,
      serverUrl: this.serverUrl
    };
  }
}
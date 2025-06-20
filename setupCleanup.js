// setupCleanup.js - Setup script for automatic file cleanup
import cron from 'node-cron';
import { runScheduledCleanup, manualCleanup } from './fileCleanupService';
import { useState } from 'react';
// Configuration
const CLEANUP_CONFIG = {
  // Run cleanup every hour at minute 0
  schedule: '0 * * * *',
  
  // Alternative schedules:
  // '*/30 * * * *'     // Every 30 minutes
  // '0 */2 * * *'      // Every 2 hours
  // '0 0 * * *'        // Daily at midnight
  
  timezone: 'UTC',
  runOnStart: false, // Set to true to run cleanup immediately on startup
};

class CleanupManager {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalFilesDeleted: 0,
    };
  }

  /**
   * Initialize automatic cleanup
   */
  initialize() {
    console.log('🚀 Initializing File Cleanup Service...');
    
    // Schedule automatic cleanup
    cron.schedule(CLEANUP_CONFIG.schedule, async () => {
      await this.runCleanup();
    }, {
      scheduled: true,
      timezone: CLEANUP_CONFIG.timezone,
    });

    console.log(`⏰ Cleanup scheduled: ${CLEANUP_CONFIG.schedule} (${CLEANUP_CONFIG.timezone})`);

    // Run immediately if configured
    if (CLEANUP_CONFIG.runOnStart) {
      setTimeout(() => this.runCleanup(), 5000); // Wait 5 seconds after startup
    }

    // Setup graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Run the cleanup process
   */
  async runCleanup() {
    if (this.isRunning) {
      console.log('⚠️ Cleanup already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.stats.totalRuns++;
    const startTime = Date.now();

    try {
      console.log(`\n🧹 Starting cleanup run #${this.stats.totalRuns}`);
      
      // Get current stats
      const beforeStats = await manualCleanup.getStats();
      if (beforeStats) {
        console.log('📊 Before cleanup:', beforeStats);
      }

      // Run the cleanup
      const result = await runScheduledCleanup();

      if (result.success) {
        this.stats.successfulRuns++;
        if (result.results) {
          const deletedCount = result.results.supabase.success + result.results.gofile.success;
          this.stats.totalFilesDeleted += deletedCount;
        }
        
        // Get stats after cleanup
        const afterStats = await manualCleanup.getStats();
        if (afterStats) {
          console.log('📊 After cleanup:', afterStats);
        }
      } else {
        this.stats.failedRuns++;
        console.error('❌ Cleanup failed:', result.error);
      }

    } catch (error) {
      console.error('💥 Unexpected error during cleanup:', error);
      this.stats.failedRuns++;
    } finally {
      this.isRunning = false;
      this.lastRun = new Date();
      const duration = Date.now() - startTime;
      console.log(`✅ Cleanup completed in ${duration}ms\n`);
    }
  }

  /**
   * Get cleanup manager statistics
   */
  getManagerStats() {
    return {
      ...this.stats,
      lastRun: this.lastRun,
      isCurrentlyRunning: this.isRunning,
      successRate: this.stats.totalRuns > 0 ? 
        (this.stats.successfulRuns / this.stats.totalRuns * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * Manual cleanup trigger
   */
  async triggerManualCleanup() {
    console.log('🔧 Manual cleanup triggered');
    await this.runCleanup();
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    console.log('\n🛑 Shutting down cleanup service...');
    
    if (this.isRunning) {
      console.log('⏳ Waiting for current cleanup to finish...');
      // In a real application, you might want to implement a timeout here
    }
    
    console.log('👋 Cleanup service stopped');
    process.exit(0);
  }
}

// API endpoints for manual control (Express.js example)
export const setupCleanupAPI = (app) => {
  const cleanupManager = new CleanupManager();
  
  // Initialize cleanup on server start
  cleanupManager.initialize();

  // Manual cleanup endpoint
  app.post('/api/admin/cleanup', async (req, res) => {
    try {
      await cleanupManager.triggerManualCleanup();
      res.json({ success: true, message: 'Cleanup completed' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get cleanup stats
  app.get('/api/admin/cleanup/stats', async (req, res) => {
    try {
      const managerStats = cleanupManager.getManagerStats();
      const fileStats = await manualCleanup.getStats();
      
      res.json({
        success: true,
        data: {
          manager: managerStats,
          files: fileStats,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete specific files
  app.post('/api/admin/cleanup/files', async (req, res) => {
    try {
      const { files } = req.body;
      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Files array is required' 
        });
      }

      const result = await manualCleanup.cleanupFiles(files);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return cleanupManager;
};

// Standalone initialization (for background services)
export const initializeStandaloneCleanup = () => {
  const cleanupManager = new CleanupManager();
  cleanupManager.initialize();
  return cleanupManager;
};

// React hook for frontend integration
export const useCleanupStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/cleanup/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching cleanup stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerCleanup = async () => {
    try {
      const response = await fetch('/api/admin/cleanup', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchStats(); // Refresh stats
      }
      return data;
    } catch (error) {
      console.error('Error triggering cleanup:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    stats,
    loading,
    fetchStats,
    triggerCleanup,
  };
};

// Example usage in your main app
/*
// For Express.js server
import express from 'express';
import { setupCleanupAPI } from './setupCleanup.js';

const app = express();
const cleanupManager = setupCleanupAPI(app);

// For standalone background service
import { initializeStandaloneCleanup } from './setupCleanup.js';
const cleanupManager = initializeStandaloneCleanup();

// For React component
import { useCleanupStats } from './setupCleanup.js';

function AdminDashboard() {
  const { stats, loading, fetchStats, triggerCleanup } = useCleanupStats();
  
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      <h2>File Cleanup Dashboard</h2>
      {stats && (
        <div>
          <p>Expired files: {stats.files.expired}</p>
          <p>Pending files: {stats.files.pending}</p>
          <p>Total cleanup runs: {stats.manager.totalRuns}</p>
          <p>Success rate: {stats.manager.successRate}</p>
          <button onClick={triggerCleanup}>Manual Cleanup</button>
        </div>
      )}
    </div>
  );
}
*/
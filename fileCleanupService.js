// fileCleanupService.js
import { supabase } from "./SupaBase";

class FileCleanupService {
  constructor() {
    this.goFileToken = import.meta.env.VITE_GOFILE_API_TOKEN; // Optional: for account-based operations
  }

  /**
   * Delete file from GoFile using admin code
   * @param {string} fileId - GoFile file ID
   * @param {string} adminCode - Admin code for the file
   */
  async deleteFromGoFile(fileId, adminCode) {
    try {
      const response = await fetch(`https://api.gofile.io/deleteContent`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: fileId,
          adminCode: adminCode,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'ok') {
        console.log(`✅ GoFile file ${fileId} deleted successfully`);
        return { success: true, fileId };
      } else {
        console.error(`❌ Failed to delete GoFile file ${fileId}:`, result.error);
        return { success: false, fileId, error: result.error };
      }
    } catch (error) {
      console.error(`❌ Error deleting GoFile file ${fileId}:`, error);
      return { success: false, fileId, error: error.message };
    }
  }

  /**
   * Delete file from Supabase storage
   * @param {string} bucket - Bucket name
   * @param {string} filePath - File path in bucket
   */
  async deleteFromSupabase(bucket, filePath) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error(`❌ Failed to delete Supabase file ${filePath}:`, error);
        return { success: false, bucket, filePath, error };
      }

      console.log(`✅ Supabase file ${filePath} deleted successfully from ${bucket}`);
      return { success: true, bucket, filePath };
    } catch (error) {
      console.error(`❌ Error deleting Supabase file ${filePath}:`, error);
      return { success: false, bucket, filePath, error: error.message };
    }
  }

  /**
   * Clean up expired temporary files
   */
  async cleanupExpiredFiles() {
    console.log('🧹 Starting cleanup of expired files...');
    
    try {
      // Get all expired files that haven't been deleted yet
      const { data: expiredFiles, error: fetchError } = await supabase
        .from('scheduled_deletions')
        .select('*')
        .lt('expires_at', new Date().toISOString())
        .is('deleted_at', null);

      if (fetchError) {
        console.error('❌ Error fetching expired files:', fetchError);
        return { success: false, error: fetchError };
      }

      if (!expiredFiles || expiredFiles.length === 0) {
        console.log('✅ No expired files to clean up');
        return { success: true, deletedCount: 0 };
      }

      console.log(`📋 Found ${expiredFiles.length} expired files to delete`);

      const results = {
        supabase: { success: 0, failed: 0 },
        total: expiredFiles.length
      };

      // Process each expired file
      for (const file of expiredFiles) {
        let deleteResult = null;

        // Delete from Supabase (temporary files are always in Supabase)
        deleteResult = await this.deleteFromSupabase(file.bucket_name, file.file_path);

        if (deleteResult.success) {
          results.supabase.success++;
          
          // Mark as deleted in database
          await supabase
            .from('scheduled_deletions')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', file.id);
        } else {
          results.supabase.failed++;
          console.error(`Failed to delete file ${file.file_path}:`, deleteResult.error);
        }
      }

      console.log(`✅ Cleanup completed! Supabase: ${results.supabase.success} deleted, ${results.supabase.failed} failed`);
      return { success: true, results };

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up files by file record IDs (manual cleanup)
   * @param {Array} fileRecords - Array of file objects from your uploaded files
   */
  async cleanupFilesByRecords(fileRecords) {
    console.log(`🧹 Starting manual cleanup of ${fileRecords.length} files...`);

    const results = {
      supabase: { success: 0, failed: 0 },
      gofile: { success: 0, failed: 0 },
      total: fileRecords.length
    };

    for (const file of fileRecords) {
      let deleteResult = null;

      if (file.service === 'supabase') {
        // Delete from Supabase
        deleteResult = await this.deleteFromSupabase(file.bucket, file.filePath);
        
        if (deleteResult.success) {
          results.supabase.success++;
          
          // If it's a temporary file, mark as deleted in scheduled_deletions
          if (file.isTemporary) {
            await supabase
              .from('scheduled_deletions')
              .update({ deleted_at: new Date().toISOString() })
              .eq('file_path', file.filePath)
              .eq('bucket_name', file.bucket);
          }
        } else {
          results.supabase.failed++;
        }

      } else if (file.service === 'gofile') {
        // Delete from GoFile
        deleteResult = await this.deleteFromGoFile(file.fileId, file.adminCode);
        
        if (deleteResult.success) {
          results.gofile.success++;
        } else {
          results.gofile.failed++;
        }
      }
    }

    console.log(`✅ Manual cleanup completed!`);
    console.log(`   Supabase: ${results.supabase.success} deleted, ${results.supabase.failed} failed`);
    console.log(`   GoFile: ${results.gofile.success} deleted, ${results.gofile.failed} failed`);
    
    return { success: true, results };
  }

  /**
   * Get statistics about files and cleanup status
   */
  async getCleanupStats() {
    try {
      // Get expired files count
      const { count: expiredCount } = await supabase
        .from('scheduled_deletions')
        .select('*', { count: 'exact', head: true })
        .lt('expires_at', new Date().toISOString())
        .is('deleted_at', null);

      // Get pending deletions count
      const { count: pendingCount } = await supabase
        .from('scheduled_deletions')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString())
        .is('deleted_at', null);

      // Get already deleted count
      const { count: deletedCount } = await supabase
        .from('scheduled_deletions')
        .select('*', { count: 'exact', head: true })
        .not('deleted_at', 'is', null);

      return {
        expired: expiredCount || 0,
        pending: pendingCount || 0,
        deleted: deletedCount || 0,
        total: (expiredCount || 0) + (pendingCount || 0) + (deletedCount || 0)
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return null;
    }
  }

  /**
   * Clean up old deletion records (housekeeping)
   * @param {number} daysOld - Delete records older than this many days
   */
  async cleanupOldDeletionRecords(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('scheduled_deletions')
        .delete()
        .not('deleted_at', 'is', null)
        .lt('deleted_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error cleaning up old deletion records:', error);
        return { success: false, error };
      }

      console.log(`✅ Cleaned up deletion records older than ${daysOld} days`);
      return { success: true };
    } catch (error) {
      console.error('Error in cleanupOldDeletionRecords:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const fileCleanupService = new FileCleanupService();

// Cron job function (for use with node-cron or similar)
export const runScheduledCleanup = async () => {
  console.log('⏰ Running scheduled file cleanup...');
  
  const stats = await fileCleanupService.getCleanupStats();
  if (stats) {
    console.log('📊 Cleanup Stats:', stats);
  }

  const result = await fileCleanupService.cleanupExpiredFiles();
  
  if (result.success && result.results) {
    // Clean up old deletion records weekly
    const today = new Date().getDay();
    if (today === 0) { // Sunday
      await fileCleanupService.cleanupOldDeletionRecords(30);
    }
  }

  return result;
};

// Manual cleanup functions for direct use
export const manualCleanup = {
  // Clean specific files
  cleanupFiles: (fileRecords) => fileCleanupService.cleanupFilesByRecords(fileRecords),
  
  // Clean expired files now
  cleanupExpired: () => fileCleanupService.cleanupExpiredFiles(),
  
  // Get stats
  getStats: () => fileCleanupService.getCleanupStats(),
  
  // Clean old records
  cleanupOldRecords: (days) => fileCleanupService.cleanupOldDeletionRecords(days),
};

// Example usage:
/*
// 1. Automatic cleanup (set up as cron job)
import cron from 'node-cron';
cron.schedule('0 * * * *', runScheduledCleanup); // Run every hour

// 2. Manual cleanup of specific files
const filesToDelete = [
  { service: 'supabase', bucket: 'uploads', filePath: 'file1.jpg', isTemporary: false },
  { service: 'gofile', fileId: 'abc123', adminCode: 'xyz789' },
];
await manualCleanup.cleanupFiles(filesToDelete);

// 3. Clean expired files manually
await manualCleanup.cleanupExpired();

// 4. Get cleanup statistics
const stats = await manualCleanup.getStats();
console.log(stats);
*/
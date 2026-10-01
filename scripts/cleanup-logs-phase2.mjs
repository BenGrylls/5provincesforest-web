#!/usr/bin/env node

/**
 * Log Cleanup & Rotation Script
 * Removes logs older than retention period
 * 
 * Run: node scripts/cleanup-logs-phase2.mjs
 * Or add to cron: 0 2 * * * node /path/to/scripts/cleanup-logs-phase2.mjs
 */

import pg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Retention policies (in days)
const RETENTION_POLICIES = {
  admin_logs: 120,           // Audit trail - 4 months
  security_incidents: 180,   // Forensics - 6 months
  application_logs: 30,      // Debugging - 1 month
  performance_logs: 14,      // Trending - 2 weeks
  file_operations: 120,      // File audit - 4 months
  query_logs: 14,           // Slow query tracking - 2 weeks
  api_metrics: 30,          // Aggregated metrics - 1 month
  public_page_views: 90,    // Privacy-preserving daily aggregates - 3 months
};

async function cleanupLogs() {
  try {
    console.log('🧹 Starting log cleanup...\n');

    let totalDeleted = 0;

    for (const [tableName, retentionDays] of Object.entries(RETENTION_POLICIES)) {
      try {
        // Check if table exists
        const tableExists = await pool.query(
          `SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )`,
          [tableName]
        );

        if (!tableExists.rows[0].exists) {
          console.log(`⊘ Table ${tableName} does not exist (skipping)`);
          continue;
        }

        // Delete old records
        const result = await pool.query(
          `DELETE FROM ${tableName}
           WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
           RETURNING 1`,
          []
        );

        const deletedCount = result.rows.length;
        totalDeleted += deletedCount;

        console.log(
          `✓ ${tableName}: Deleted ${deletedCount} records older than ${retentionDays} days`
        );
      } catch (error) {
        console.error(
          `✗ Error cleaning ${tableName}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log(`\n✅ Cleanup complete! Total records deleted: ${totalDeleted}\n`);

    // Print summary statistics
    console.log('📊 Current log sizes:\n');

    for (const tableName of Object.keys(RETENTION_POLICIES)) {
      try {
        const tableExists = await pool.query(
          `SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )`,
          [tableName]
        );

        if (!tableExists.rows[0].exists) continue;

        const result = await pool.query(
          `SELECT 
            COUNT(*) as record_count,
            ROUND(pg_total_relation_size('${tableName}') / 1024.0 / 1024.0, 2) as size_mb,
            MIN(created_at) as oldest_record,
            MAX(created_at) as newest_record
           FROM ${tableName}`
        );

        const row = result.rows[0];
        console.log(`${tableName}:`);
        console.log(`  Records: ${row.record_count}`);
        console.log(`  Size: ${row.size_mb} MB`);
        console.log(`  Range: ${row.oldest_record ? new Date(row.oldest_record).toLocaleDateString() : 'N/A'} - ${row.newest_record ? new Date(row.newest_record).toLocaleDateString() : 'N/A'}`);
        console.log();
      } catch (error) {
        // Silently ignore stats errors
      }
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run cleanup
cleanupLogs();

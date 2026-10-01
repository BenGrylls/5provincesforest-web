#!/usr/bin/env node

/**
 * Initialize Phase 2 database tables for advanced monitoring
 * 
 * Creates:
 * - file_operations: Track all file uploads, downloads, deletions
 * - query_logs: Track slow database queries
 * 
 * Run: node scripts/init-logging-phase2.mjs
 */

import pg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initPhase2Tables() {
  try {
    console.log('🔧 Initializing Phase 2 logging tables...\n');

    // Create file_operations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS file_operations (
        id BIGSERIAL PRIMARY KEY,
        operation_type VARCHAR(20) NOT NULL,
        user_id VARCHAR(100),
        file_name VARCHAR(500) NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        file_path VARCHAR(1000) NOT NULL,
        category VARCHAR(100),
        status VARCHAR(20) DEFAULT 'success',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ file_operations table created');

    // Create indexes on file_operations
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_file_operations_created_at 
      ON file_operations(created_at DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_file_operations_user_id 
      ON file_operations(user_id, created_at DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_file_operations_type 
      ON file_operations(operation_type, created_at DESC)
    `);

    console.log('✓ file_operations indexes created');

    // Create query_logs table (for slow query tracking)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS query_logs (
        id BIGSERIAL PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        query_text TEXT,
        duration_ms INTEGER NOT NULL,
        user_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'success',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ query_logs table created');

    // Create indexes on query_logs
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_query_logs_created_at 
      ON query_logs(created_at DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_query_logs_duration 
      ON query_logs(duration_ms DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_query_logs_endpoint 
      ON query_logs(endpoint, created_at DESC)
    `);

    console.log('✓ query_logs indexes created');

    // Create api_metrics table (for API statistics)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_metrics (
        id BIGSERIAL PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        avg_response_time_ms NUMERIC(10, 2),
        p95_response_time_ms INTEGER,
        p99_response_time_ms INTEGER,
        request_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        success_rate NUMERIC(5, 2),
        last_checked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ api_metrics table created');

    // Create indexes on api_metrics
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint 
      ON api_metrics(endpoint, created_at DESC)
    `);

    console.log('\n✅ Phase 2 tables initialized successfully!\n');
    console.log('Tables created:');
    console.log('  1. file_operations - Track file uploads/downloads');
    console.log('  2. query_logs - Track slow queries');
    console.log('  3. api_metrics - Store performance statistics');
    console.log('\nRetention:');
    console.log('  - file_operations: 120 days');
    console.log('  - query_logs: 14 days');
    console.log('  - api_metrics: 30 days (aggregated)');

  } catch (error) {
    console.error('❌ Error initializing Phase 2 tables:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initPhase2Tables();

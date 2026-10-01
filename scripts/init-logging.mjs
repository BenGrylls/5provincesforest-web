#!/usr/bin/env node
/**
 * Initialize logging tables for security and application logs
 * Run: node scripts/init-logging.mjs
 */

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Initializing logging tables...');
    const client = await pool.connect();

    // Create security_incidents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_incidents (
        id SERIAL PRIMARY KEY,
        incident_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        user_id VARCHAR(100),
        details JSONB,
        extra JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ security_incidents table created');

    // Create indexes for security_incidents
    await client.query(`CREATE INDEX IF NOT EXISTS idx_security_incidents_created_at ON security_incidents(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_security_incidents_incident_type ON security_incidents(incident_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity)`);
    console.log('✓ security_incidents indexes created');

    // Create application_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS application_logs (
        id SERIAL PRIMARY KEY,
        log_level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        stack_trace TEXT,
        endpoint VARCHAR(255),
        user_id VARCHAR(100),
        context JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ application_logs table created');

    // Create indexes for application_logs
    await client.query(`CREATE INDEX IF NOT EXISTS idx_application_logs_created_at ON application_logs(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_application_logs_log_level ON application_logs(log_level)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_application_logs_endpoint ON application_logs(endpoint)`);
    console.log('✓ application_logs indexes created');

    // Create performance_logs table (for Phase 2)
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_logs (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code SMALLINT,
        response_time_ms INTEGER NOT NULL,
        user_id VARCHAR(100),
        query_count SMALLINT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ performance_logs table created');

    // Create indexes for performance_logs
    await client.query(`CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON performance_logs(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_performance_logs_endpoint ON performance_logs(endpoint)`);
    console.log('✓ performance_logs indexes created');

    client.release();

    console.log('\n✅ All logging tables initialized successfully!');
    console.log('📊 Tables created:');
    console.log('   - security_incidents (for security events)');
    console.log('   - application_logs (for errors/exceptions)');
    console.log('   - performance_logs (for metrics - Phase 2)');
  } catch (error) {
    console.error('❌ Failed to initialize logging tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

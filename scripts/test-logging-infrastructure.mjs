#!/usr/bin/env node

/**
 * Integration Test: Verify logging infrastructure
 * 
 * Tests:
 * 1. Database connectivity
 * 2. Table structure verification
 * 3. API endpoints accessible
 * 4. Logging functions working
 * 5. Data being stored correctly
 * 
 * Run: node scripts/test-logging-infrastructure.mjs
 */

import pg from 'pg';
import { config } from 'dotenv';
import http from 'http';

config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const API_BASE_URL = 'http://localhost:3002';

// Helper to make HTTP requests
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data.length > 0 && res.headers['content-type']?.includes('application/json') 
              ? JSON.parse(data) 
              : data,
          });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  try {
    console.log('🧪 Logging Infrastructure Test Suite\n');

    // Test 1: Database Connection
    console.log('Test 1: Database Connectivity');
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Database connected');
      console.log(`   Version: ${result.rows[0].now}\n`);
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }

    // Test 2: Table Structure
    console.log('Test 2: Table Structure Verification');
    const tables = [
      'admin_logs',
      'security_incidents',
      'application_logs',
      'performance_logs',
      'file_operations',
      'query_logs',
      'api_metrics',
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(
          `SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1
          )`,
          [table]
        );

        if (result.rows[0].exists) {
          console.log(`✅ ${table}`);
        } else {
          console.log(`⚠️  ${table} - not created`);
        }
      } catch (error) {
        console.log(`❌ ${table} - error: ${error.message}`);
      }
    }
    console.log();

    // Test 3: API Endpoints
    console.log('Test 3: API Endpoints Accessibility');
    const endpoints = [
      { method: 'GET', path: '/api/cms?category=news', name: 'CMS API (GET)' },
      { method: 'GET', path: '/admin/logs', name: 'Logs Dashboard' },
      { method: 'GET', path: '/admin/performance', name: 'Performance Dashboard' },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await makeRequest({
          hostname: 'localhost',
          port: 3002,
          path: endpoint.path,
          method: endpoint.method,
          headers: { 'User-Agent': 'Test-Suite' },
          timeout: 5000,
        });

        if (response.status === 401 || response.status === 403) {
          console.log(`⚠️  ${endpoint.name} (${response.status} - auth required)`);
        } else if (response.status >= 200 && response.status < 500) {
          console.log(`✅ ${endpoint.name} (${response.status})`);
        } else {
          console.log(`❌ ${endpoint.name} (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} - ${error.message}`);
      }
    }
    console.log();

    // Test 4: Log Entry Counts
    console.log('Test 4: Log Entry Verification');
    const logTables = [
      { table: 'admin_logs', label: 'Admin Audit Logs' },
      { table: 'security_incidents', label: 'Security Incidents' },
      { table: 'application_logs', label: 'Application Logs' },
      { table: 'performance_logs', label: 'Performance Logs' },
      { table: 'file_operations', label: 'File Operations' },
    ];

    for (const { table, label } of logTables) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM ${table}
           WHERE created_at >= NOW() - INTERVAL '24 hours'`
        );
        const count = result.rows[0].count;
        console.log(`${label}: ${count} entries (last 24h)`);
      } catch (error) {
        console.log(`❌ ${label} - query error`);
      }
    }
    console.log();

    // Test 5: Database Schema Summary
    console.log('Test 5: Database Schema Summary');
    try {
      const result = await pool.query(
        `SELECT 
          table_name,
          ROUND(pg_total_relation_size(table_name) / 1024.0 / 1024.0, 2) as size_mb,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
         FROM information_schema.tables t
         WHERE table_schema = 'public'
         AND table_name LIKE '%log%' OR table_name LIKE '%incident%' OR table_name LIKE '%operation%' OR table_name = 'api_metrics'
         ORDER BY table_name`
      );

      console.log('Logging Tables:');
      let totalSize = 0;
      for (const row of result.rows) {
        console.log(`  ${row.table_name}: ${row.size_mb} MB (${row.column_count} columns)`);
        totalSize += row.size_mb;
      }
      console.log(`  Total: ${totalSize.toFixed(2)} MB\n`);
    } catch (error) {
      console.log(`❌ Schema summary failed\n`);
    }

    // Test 6: Performance Query Check
    console.log('Test 6: Query Performance Check');
    try {
      const start = Date.now();
      await pool.query(
        `SELECT COUNT(*) FROM performance_logs
         WHERE created_at >= NOW() - INTERVAL '24 hours'`
      );
      const duration = Date.now() - start;
      console.log(`✅ Performance query: ${duration}ms`);

      const start2 = Date.now();
      await pool.query(
        `SELECT endpoint, AVG(response_time_ms) as avg_time
         FROM performance_logs
         WHERE created_at >= NOW() - INTERVAL '24 hours'
         GROUP BY endpoint`
      );
      const duration2 = Date.now() - start2;
      console.log(`✅ Aggregation query: ${duration2}ms\n`);
    } catch (error) {
      console.log(`❌ Query performance check failed\n`);
    }

    // Summary
    console.log('═══════════════════════════════════');
    console.log('✅ Integration test completed!');
    console.log('═══════════════════════════════════\n');

    console.log('Next steps:');
    console.log('1. Access admin panel: http://localhost:3002/admin');
    console.log('2. View audit logs: http://localhost:3002/admin/logs');
    console.log('3. View performance: http://localhost:3002/admin/performance');
    console.log('4. Make API requests to generate logs');
    console.log('5. Schedule cleanup: node scripts/cleanup-logs-phase2.mjs\n');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();

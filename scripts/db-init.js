#!/usr/bin/env node
/**
 * Database Migration Init Script
 * Creates initial migration based on schema.prisma
 * Usage: node scripts/db-init.js
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

const commands = [
  {
    name: 'Generate Prisma Client',
    cmd: 'npx prisma generate',
  },
  {
    name: 'Create Initial Migration',
    cmd: 'npx prisma migrate dev --name init',
  },
  {
    name: 'Seed Database',
    cmd: 'npx prisma db seed',
  },
];

async function runCommand(name, cmd) {
  try {
    console.log(`\n📋 ${name}...`);
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${name} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed`);
    return false;
  }
}

async function main() {
  console.log('\n🗄️  Database Initialization\n');

  // Check if .env exists
  if (!fs.existsSync('.env')) {
    console.error('❌ .env file not found. Please run: node scripts/generate-env.js');
    process.exit(1);
  }

  let allSuccess = true;
  for (const { name, cmd } of commands) {
    const success = await runCommand(name, cmd);
    allSuccess = allSuccess && success;
  }

  if (allSuccess) {
    console.log('\n✅ Database initialization complete!\n');
    console.log('📝 Tables created:');
    console.log('  - AdminUser (for authentication)');
    console.log('  - Article (for content)');
    console.log('  - SiteSetting (for site configuration)\n');
  } else {
    console.log('\n⚠️  Some steps failed. Please check the output above.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

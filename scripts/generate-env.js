#!/usr/bin/env node
/**
 * Environment Setup Helper Script
 * Generates secure credentials for .env file
 * Usage: node scripts/generate-env.js
 */

import { generateSessionToken, hashPassword } from '../src/lib/security.js';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔐 Environment Setup Helper\n');
  console.log('This script will help you generate secure credentials for your .env file.\n');

  // Ask for database URL
  const dbUrl = await question('📦 PostgreSQL Database URL (e.g., postgresql://user:pass@localhost:5432/forest_db): ');
  if (!dbUrl) {
    console.error('❌ Database URL is required');
    rl.close();
    return;
  }

  // Ask for admin username
  const adminUsername = await question('👤 Admin Username (default: admin): ') || 'admin';

  // Ask for admin password
  let adminPassword = await question('🔒 Admin Password (min 8 chars, press Enter to auto-generate): ');
  if (!adminPassword) {
    adminPassword = generateSessionToken(12).substring(0, 12);
    console.log(`   Auto-generated: ${adminPassword}\n`);
  } else if (adminPassword.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    rl.close();
    return;
  }

  // Generate secure session token
  const sessionToken = generateSessionToken();
  console.log('\n✅ Session token generated (auto-generated, 256-bit)\n');

  // Generate env content
  const envContent = `# Database Configuration
DATABASE_URL="${dbUrl}"

# Admin Authentication
ADMIN_USERNAME="${adminUsername}"
ADMIN_PASSWORD="${adminPassword}"
ADMIN_SESSION_TOKEN="${sessionToken}"

# Environment
NODE_ENV="production"
`;

  console.log('📝 Generated .env content:\n');
  console.log(envContent);

  // Ask if user wants to save to .env
  const save = await question('\n💾 Save to .env file? (y/n): ');
  if (save.toLowerCase() === 'y') {
    const envPath = path.resolve(process.cwd(), '.env');
    try {
      fs.writeFileSync(envPath, envContent, { mode: 0o600 });
      console.log(`✅ Saved to ${envPath}`);
      console.log('⚠️  Make sure to backup your .env file!');
    } catch (error) {
      console.error(`❌ Failed to save: ${error.message}`);
    }
  }

  console.log('\n📋 Next steps:');
  console.log('1. npx prisma migrate deploy');
  console.log('2. npm run dev\n');

  rl.close();
}

main().catch(console.error);

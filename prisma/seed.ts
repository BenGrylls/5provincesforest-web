import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/security';

const prisma = new PrismaClient();

async function main() {
  // Hash the password before storing
  const hashedPassword = await hashPassword('AdMin2059');

  const adminUser = await prisma.adminUser.upsert({
    where: { username: 'BorderForest' },
    update: {
      password: hashedPassword,
    },
    create: {
      username: 'BorderForest',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ สร้าง Super Admin สำเร็จ:', adminUser.username);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
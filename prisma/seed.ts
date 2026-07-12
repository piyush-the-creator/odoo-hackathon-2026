// prisma/seed.ts
import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: { name: RoleName.ADMIN },
    }),
    prisma.role.upsert({
      where: { name: RoleName.FLEET_MANAGER },
      update: {},
      create: { name: RoleName.FLEET_MANAGER },
    }),
    prisma.role.upsert({
      where: { name: RoleName.DRIVER },
      update: {},
      create: { name: RoleName.DRIVER },
    }),
    prisma.role.upsert({
      where: { name: RoleName.SAFETY_OFFICER },
      update: {},
      create: { name: RoleName.SAFETY_OFFICER },
    }),
    prisma.role.upsert({
      where: { name: RoleName.FINANCIAL_ANALYST },
      update: {},
      create: { name: RoleName.FINANCIAL_ANALYST },
    }),
  ]);

  console.log(`✅ Created ${roles.length} roles`);

  // 2. Create Admin User
  const adminRole = await prisma.role.findUnique({
    where: { name: RoleName.ADMIN },
  });

  if (!adminRole) throw new Error('Admin role not found');

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@transitops.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@transitops.com',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Admin user created: ${admin.email} (password: Admin@123)`);

  // 3. Create Demo Driver User (optional, useful for testing)
  const driverRole = await prisma.role.findUnique({
    where: { name: RoleName.DRIVER },
  });

  if (driverRole) {
    const driverPassword = await bcrypt.hash('Driver@123', 10);
    const driverUser = await prisma.user.upsert({
      where: { email: 'driver@transitops.com' },
      update: {},
      create: {
        name: 'Demo Driver',
        email: 'driver@transitops.com',
        passwordHash: driverPassword,
        roleId: driverRole.id,
        status: 'ACTIVE',
      },
    });

    // Create driver profile linked to this user
    await prisma.driverProfile.upsert({
      where: { userId: driverUser.id },
      update: {},
      create: {
        userId: driverUser.id,
        licenseNumber: 'DL-2024-001',
        licenseCategory: 'Heavy Vehicle',
        licenseExpiry: new Date('2026-12-31'),
        safetyScore: 100,
        experienceYears: 5,
        status: 'AVAILABLE',
      },
    });

    console.log(`✅ Demo driver created: ${driverUser.email} (password: Driver@123)`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

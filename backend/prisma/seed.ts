import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

function requirePassword(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Seed passwords must come from the environment — never hardcode them.`,
    );
  }
  return value;
}

async function main() {
  const ownerPassword = requirePassword('SEED_OWNER_PASSWORD');
  const staffPassword = requirePassword('SEED_STAFF_PASSWORD');
  const clientPassword = requirePassword('SEED_CLIENT_PASSWORD');

  const ownerEmail = (process.env.SEED_OWNER_EMAIL ?? 'owner@studio.com').trim().toLowerCase();
  const staffEmail = (process.env.SEED_STAFF_EMAIL ?? 'staff@studio.com').trim().toLowerCase();
  const clientEmail = (process.env.SEED_CLIENT_EMAIL ?? 'client@email.com').trim().toLowerCase();
  const businessName = process.env.SEED_BUSINESS_NAME ?? 'Studio Aureel';
  const slug = process.env.SEED_BUSINESS_SLUG ?? 'studio-aureel';

  const [ownerHash, staffHash, clientHash] = await Promise.all([
    bcrypt.hash(ownerPassword, BCRYPT_ROUNDS),
    bcrypt.hash(staffPassword, BCRYPT_ROUNDS),
    bcrypt.hash(clientPassword, BCRYPT_ROUNDS),
  ]);

  const business = await prisma.business.upsert({
    where: { slug },
    update: { name: businessName, timezone: 'Europe/Tirane' },
    create: { name: businessName, slug, timezone: 'Europe/Tirane' },
  });

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      passwordHash: ownerHash,
      firstName: 'Ana',
      lastName: 'Hoxha',
      role: 'OWNER',
      businessId: business.id,
      isActive: true,
    },
    create: {
      email: ownerEmail,
      passwordHash: ownerHash,
      firstName: 'Ana',
      lastName: 'Hoxha',
      role: 'OWNER',
      businessId: business.id,
    },
  });

  const serviceSpecs = [
    { name: 'Masazh terapeutik', durationMinutes: 50, priceCents: 4500 },
    { name: 'Seancë jogë (privat)', durationMinutes: 60, priceCents: 3500 },
  ];

  const services = [];
  for (const spec of serviceSpecs) {
    const existing = await prisma.service.findFirst({
      where: { businessId: business.id, name: spec.name },
    });
    services.push(
      existing
        ? await prisma.service.update({
            where: { id: existing.id },
            data: { ...spec, isActive: true },
          })
        : await prisma.service.create({
            data: { ...spec, isActive: true, businessId: business.id },
          }),
    );
  }

  const staffUser = await prisma.user.upsert({
    where: { email: staffEmail },
    update: {
      passwordHash: staffHash,
      firstName: 'Mira',
      lastName: 'Leka',
      role: 'STAFF',
      businessId: business.id,
      isActive: true,
    },
    create: {
      email: staffEmail,
      passwordHash: staffHash,
      firstName: 'Mira',
      lastName: 'Leka',
      role: 'STAFF',
      businessId: business.id,
    },
  });

  const staff = await prisma.staff.upsert({
    where: { userId: staffUser.id },
    update: { displayName: 'Mira Leka', isActive: true, businessId: business.id },
    create: {
      displayName: 'Mira Leka',
      isActive: true,
      businessId: business.id,
      userId: staffUser.id,
    },
  });

  await prisma.staffService.deleteMany({ where: { staffId: staff.id } });
  await prisma.staffService.createMany({
    data: services.map((service) => ({ staffId: staff.id, serviceId: service.id })),
    skipDuplicates: true,
  });

  const windows = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    dayOfWeek,
    startTime: '09:00',
    endTime: '18:00',
    businessId: business.id,
    staffId: staff.id,
  }));

  await prisma.availability.createMany({
    data: windows,
    skipDuplicates: true,
  });

  await prisma.user.upsert({
    where: { email: clientEmail },
    update: {
      passwordHash: clientHash,
      firstName: 'Elira',
      lastName: 'Berisha',
      role: 'CLIENT',
      businessId: business.id,
      isActive: true,
    },
    create: {
      email: clientEmail,
      passwordHash: clientHash,
      firstName: 'Elira',
      lastName: 'Berisha',
      role: 'CLIENT',
      businessId: business.id,
    },
  });

  console.info(`Seeded business ${slug} with owner ${ownerEmail}, staff ${staffEmail}, client ${clientEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

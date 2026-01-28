import { PrismaClient, ScreenMode } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const hashed = await bcrypt.hash(adminPassword, 10);

  if (process.env.ADMIN_PASSWORD !== hashed) {
    console.log('Use the hashed ADMIN_PASSWORD in .env for production.');
  }

  const project = await prisma.project.upsert({
    where: { slug: 'demo-event' },
    update: {},
    create: {
      name: 'Demo Event',
      slug: 'demo-event',
      messageBottom: 'Merci pour votre visite',
      screenMode: ScreenMode.GRID,
      cameraFacingMode: 'user',
      backgrounds: {
        create: [
          {
            name: 'Placeholder décor',
            s3Key: 'placeholders/background-1.jpg',
            sortOrder: 1,
            isActive: true
          }
        ]
      }
    }
  });

  console.log('Seeded project:', project.slug);
  console.log('Admin hash:', hashed);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

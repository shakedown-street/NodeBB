import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const userData = [
  {
    email: 'test@test.com',
    password: 'test',
  },
];

export async function main() {
  for (const u of userData) {
    const passwordHash = await bcrypt.hash(u.password, 12);

    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
      },
    });
  }
}

main();

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
    username: 'admin',
    password: 'password',
  },
];

export async function main() {
  for (const u of userData) {
    const passwordHash = await bcrypt.hash(u.password, 12);

    await prisma.user.create({
      data: {
        username: u.username,
        passwordHash,
        isAdmin: true,
      },
    });
  }
}

main();

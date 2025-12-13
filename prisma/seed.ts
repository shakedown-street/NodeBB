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
    isAdmin: true,
  },
];

const categoryData = [
  {
    name: 'NodeBB',
    slug: 'node-bb',
    order: 0,
    subcategories: [
      {
        name: 'Announcements',
        slug: 'announcements',
        description: 'Announcements about NodeBB',
        adminPostOnly: true,
        order: 0,
      },
      {
        name: 'Guides',
        slug: 'guides',
        description: 'Learn how to install and configure NodeBB',
        adminPostOnly: true,
        order: 1,
      },
    ],
  },
  {
    name: 'Community',
    slug: 'community',
    order: 1,
    subcategories: [
      {
        name: 'Help',
        slug: 'help',
        description: 'Get help installing and configuring NodeBB',
        order: 0,
      },
      {
        name: 'Random',
        slug: 'random',
        description: 'For everything else!',
        order: 1,
      },
    ],
  },
];

export async function main() {
  for (const u of userData) {
    const passwordHash = await bcrypt.hash(u.password, 12);

    await prisma.user.create({
      data: {
        username: u.username,
        passwordHash,
        isAdmin: u.isAdmin,
      },
    });
  }

  for (const category of categoryData) {
    const { subcategories, ...c } = category;

    const newCategory = await prisma.category.create({
      data: {
        ...c,
      },
    });

    for (const subcategory of subcategories) {
      await prisma.subcategory.create({
        data: {
          ...subcategory,
          categoryId: newCategory.id,
        },
      });
    }
  }
}

main();

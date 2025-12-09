import { Link } from 'react-router';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import prisma from '~/lib/prisma';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({}: Route.LoaderArgs) {
  const categories = await prisma.category.findMany();

  const categoriesWithLatestThread = await Promise.all(
    categories.map(async (category) => {
      const threadCount = await prisma.thread.count({
        where: { categoryId: category.id },
      });
      const postCount = await prisma.post.count({
        where: {
          thread: {
            categoryId: category.id,
          },
        },
      });
      const latestThread = await prisma.thread.findFirst({
        where: { categoryId: category.id },
        include: {
          user: {
            omit: { passwordHash: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return { ...category, threadCount, postCount, latestThread };
    }),
  );

  const recentThreads = await prisma.thread.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    categories: categoriesWithLatestThread,
    recentThreads,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData;

  return (
    <>
      <div className="container mx-auto px-4">
        <Table className="mb-8">
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="w-24 text-center">Threads</TableHead>
              <TableHead className="w-24 text-center">Posts</TableHead>
              <TableHead className="text-right">Latest thread</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Link className="text-primary" to={`/categories/${category.id}`}>
                    {category.name}
                  </Link>
                </TableCell>
                <TableCell className="text-center">{category.threadCount}</TableCell>
                <TableCell className="text-center">{category.postCount}</TableCell>
                <TableCell>
                  {category.latestThread ? (
                    <div className="flex items-center justify-end gap-3">
                      <Avatar>
                        <AvatarFallback>{category.latestThread.user.email.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link className="text-primary" to={`/threads/${category.latestThread.id}`}>
                          {category.latestThread.title}
                        </Link>
                        <div>
                          {category.latestThread.createdAt.toLocaleString()} • {category.latestThread.user.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    'No threads yet'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <h2 className="mb-4 text-xl font-bold">Recent threads</h2>
        <ul>
          {loaderData.recentThreads.map((thread) => (
            <li key={thread.id}>
              <Link className="text-primary" to={`/threads/${thread.id}`}>
                {thread.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

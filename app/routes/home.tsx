import { Link } from 'react-router';
import { Markdown } from '~/components/markdown';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import prisma from '~/lib/prisma';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({}: Route.LoaderArgs) {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: true,
    },
  });

  const indexCategories = await Promise.all(
    categories.map(async (category) => {
      const subcategories = await Promise.all(
        category.subcategories.map(async (subcategory) => {
          const threadCount = await prisma.thread.count({
            where: { subcategoryId: subcategory.id },
          });
          const postCount = await prisma.post.count({
            where: { thread: { subcategoryId: subcategory.id } },
          });
          const latestThread = await prisma.thread.findFirst({
            orderBy: { createdAt: 'desc' },
            where: { subcategoryId: subcategory.id },
            include: {
              user: {
                omit: {
                  passwordHash: true,
                },
              },
            },
          });
          return { ...subcategory, threadCount, postCount, latestThread };
        }),
      );
      return { ...category, subcategories };
    }),
  );

  return { categories: indexCategories };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData;

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-8">
          {categories.map((category) => (
            <Table key={category.id}>
              <TableHeader>
                <TableRow>
                  <TableHead>{category.name}</TableHead>
                  <TableHead className="w-24 text-center">Threads</TableHead>
                  <TableHead className="w-24 text-center">Posts</TableHead>
                  <TableHead className="w-80 text-right">Latest Thread</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.subcategories.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell>
                      <Link className="text-primary" to={`/subcategories/${subcategory.id}`}>
                        {subcategory.name}
                      </Link>
                      <Markdown content={subcategory.description} />
                    </TableCell>
                    <TableCell className="text-center">{subcategory.threadCount}</TableCell>
                    <TableCell className="text-center">{subcategory.postCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-3">
                        {subcategory.latestThread ? (
                          <>
                            <Avatar>
                              <AvatarFallback>
                                {subcategory.latestThread.user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link className="text-primary" to={`/threads/${subcategory.latestThread.id}`}>
                                {subcategory.latestThread.title}
                              </Link>
                              <div>
                                {subcategory.latestThread.createdAt.toLocaleString()} •{' '}
                                {subcategory.latestThread.user.username}
                              </div>
                            </div>
                          </>
                        ) : (
                          'No threads yet'
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ))}
        </div>
      </div>
    </>
  );
}

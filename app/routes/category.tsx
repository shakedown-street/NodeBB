import { Link } from 'react-router';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { useAuth } from '~/context/auth';
import prisma from '~/lib/prisma';
import type { Route } from './+types/category';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const category = await prisma.category.findUnique({
    where: { id: Number(params.id) },
  });

  const threads = await Promise.all(
    await prisma.thread
      .findMany({
        where: { categoryId: Number(params.id) },
      })
      .then((threads) =>
        threads.map(async (thread) => {
          const postCount = await prisma.post.count({
            where: { threadId: thread.id },
          });

          const latestPost = await prisma.post.findFirst({
            where: { threadId: thread.id },
            include: {
              user: {
                omit: { passwordHash: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          return { ...thread, postCount, latestPost };
        }),
      ),
  );

  return {
    category,
    threads,
  };
}

export default function Category({ loaderData }: Route.ComponentProps) {
  const { category, threads } = loaderData;

  const { user } = useAuth();

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4">
        <Button asChild className="mb-4" variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {user && (
            <Button asChild>
              <Link to={`/categories/${category.id}/create-thread`}>Create thread</Link>
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thread</TableHead>
              <TableHead className="w-24 text-center">Posts</TableHead>
              <TableHead className="text-right">Latest post</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {threads.map((thread) => (
              <TableRow key={thread.id}>
                <TableCell>
                  <Link className="text-primary" to={`/threads/${thread.id}`}>
                    {thread.title}
                  </Link>
                </TableCell>
                <TableCell className="text-center">{thread.postCount}</TableCell>
                <TableCell className="text-right">
                  {thread.latestPost ? (
                    <div className="flex items-center justify-end gap-3">
                      <Avatar>
                        <AvatarFallback>{thread.latestPost.user.email.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link className="text-primary" to={`/threads/${thread.id}#post-${thread.latestPost.id}`}>
                          {thread.latestPost.createdAt.toLocaleString()}
                        </Link>
                        <div>{thread.latestPost.user.email}</div>
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
      </div>
    </>
  );
}

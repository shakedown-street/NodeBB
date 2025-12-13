import { Link } from 'react-router';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { Button } from '~/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { useAuth } from '~/context/auth';
import prisma from '~/lib/prisma';
import type { Route } from './+types/subcategory';

export function meta({ loaderData }: Route.MetaArgs) {
  const { subcategory } = loaderData;

  return [{ title: subcategory ? `${subcategory.name} | NodeBB` : 'NodeBB' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const subcategory = await prisma.subcategory.findUnique({
    where: { id: Number(params.id) },
    include: {
      category: true,
    },
  });

  const threadsWithLatestPost = await prisma.thread
    .findMany({
      where: { subcategoryId: Number(params.id) },
      include: {
        user: {
          omit: {
            passwordHash: true,
          },
        },
      },
    })
    .then((threads) =>
      Promise.all(
        threads.map(async (thread) => {
          const postCount = await prisma.post.count({
            where: { threadId: thread.id },
          });

          const latestPost = await prisma.post.findFirst({
            orderBy: { createdAt: 'desc' },
            where: { threadId: thread.id },
            include: {
              user: true,
            },
          });

          return { ...thread, postCount, latestPost };
        }),
      ),
    );

  return { subcategory, threads: threadsWithLatestPost };
}

export default function Category({ loaderData }: Route.ComponentProps) {
  const { subcategory, threads } = loaderData;

  const { user } = useAuth();

  if (!subcategory) {
    return <div>Subcategory not found</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4">
        <Breadcrumb className="bg-card rounded-md border p-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">{subcategory.category.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{subcategory.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="my-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{subcategory.name}</h1>
          {user && (
            <Button asChild>
              <Link to={`/subcategories/${subcategory.id}/create-thread`}>Create Thread</Link>
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader>Thread</TableHeader>
              <TableHead className="w-24 text-center">Posts</TableHead>
              <TableHead className="w-80 text-right">Latest Post</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {threads.map((thread) => (
              <TableRow key={thread.id}>
                <TableCell>
                  <Link className="text-primary block" to={`/threads/${thread.id}`}>
                    {thread.title}
                  </Link>
                  <div>
                    {thread.user.username} • {thread.createdAt.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="text-center">{thread.postCount}</TableCell>
                <TableCell className="text-right">
                  {thread.latestPost ? (
                    <div className="flex items-center justify-end gap-3">
                      <Avatar>
                        <AvatarFallback>{thread.latestPost.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link className="text-primary" to={`/threads/${thread.latestPost.id}`}>
                          {thread.latestPost.createdAt.toLocaleString()}
                        </Link>
                        <div>
                          {thread.latestPost.createdAt.toLocaleString()} • {thread.latestPost.user.username}
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
      </div>
    </>
  );
}

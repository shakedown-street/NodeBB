import React from 'react';
import { Link, redirect } from 'react-router';
import { Markdown } from '~/components/markdown';
import { MarkdownEditor } from '~/components/markdown-editor';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination';
import { useAuth } from '~/context/auth';
import prisma from '~/lib/prisma';
import { getUserId } from '~/services/auth.service';
import type { Route } from './+types/thread';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const thread = await prisma.thread.findUnique({
    where: { id: Number(params.id) },
    include: {
      category: true,
      user: {
        omit: { passwordHash: true },
      },
    },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  // Paginate posts

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const posts = await prisma.post.findMany({
    where: { threadId: thread ? thread.id : undefined },
    include: {
      user: {
        omit: { passwordHash: true },
      },
    },
    orderBy: { createdAt: 'asc' },
    skip,
    take: pageSize,
  });

  const totalPosts = await prisma.post.count({
    where: { threadId: thread.id },
  });

  return {
    thread: thread,
    page,
    pageSize,
    posts,
    totalPosts,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const userId = await getUserId(request);

  if (!userId) {
    return { error: 'You must be logged in to post.' };
  }

  const form = await request.formData();
  const content = String(form.get('content') || '').trim();

  if (!content) {
    return { error: 'Content is required.' };
  }

  const threadId = Number(params.id);

  if (isNaN(threadId)) {
    return { error: 'Invalid thread.' };
  }

  await prisma.post.create({
    data: {
      content,
      threadId,
      userId,
    },
  });

  return redirect(`/threads/${threadId}`);
}

export default function Thread({ loaderData }: Route.ComponentProps) {
  const { thread, posts, totalPosts, page, pageSize } = loaderData;
  const totalPages = Math.ceil(totalPosts / pageSize);

  const [postContent, setPostContent] = React.useState('');

  const { user } = useAuth();

  if (!thread) {
    return <div>Thread not found</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4">
        <Button asChild className="mb-4" variant="outline">
          <Link to={`/categories/${thread.categoryId}`}>Back to {thread.category.name}</Link>
        </Button>
        <h1 className="mb-4 text-2xl font-bold">{thread.title}</h1>
        <div className="flex flex-col gap-4">
          {page === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{thread.createdAt.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex">
                  <div className="flex-1 p-4">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-32 w-32">
                        <AvatarFallback>{thread.user.email.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>{thread.user.email}</div>
                    </div>
                  </div>
                  <div className="flex-5 p-4">
                    <div className="prose dark:prose-invert max-w-full">
                      <Markdown content={thread.content} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {posts.map((post) => (
            <Card>
              <CardHeader>
                <CardTitle>{post.createdAt.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex">
                  <div className="flex-1 p-4">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-32 w-32">
                        <AvatarFallback>{post.user.email.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>{post.user.email}</div>
                    </div>
                  </div>
                  <div className="flex-5 p-4">
                    <div className="prose dark:prose-invert max-w-full">
                      <Markdown content={post.content} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious to={page === 1 ? '#' : `?page=${page - 1}`}>Previous</PaginationPrevious>
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink to={`?page=${i + 1}`} isActive={page === i + 1}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext to={page === totalPages ? '#' : `?page=${page + 1}`}>Next</PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Reply to thread</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-4" method="post">
                  <div className="flex flex-col gap-2">
                    <MarkdownEditor onChange={setPostContent} value={postContent} />
                    <input type="hidden" name="content" value={postContent} />
                  </div>
                  <div className="flex items-center justify-end">
                    <Button type="submit">Post reply</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

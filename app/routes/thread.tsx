import { Edit, Trash } from 'lucide-react';
import React from 'react';
import { Link, redirect, useNavigate } from 'react-router';
import { Markdown } from '~/components/markdown';
import { MarkdownEditor } from '~/components/markdown-editor';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
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

export function meta({ loaderData }: Route.MetaArgs) {
  const { thread } = loaderData;

  return [{ title: thread ? `${thread.title} | NodeBB` : 'NodeBB' }];
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
  const [showDeleteThreadDialog, setShowDeleteThreadDialog] = React.useState(false);
  const [deletePostId, setDeletePostId] = React.useState<number | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  async function confirmDeleteThread() {
    await fetch(`/threads/${thread.id}/delete`, { method: 'POST', credentials: 'include' });

    navigate(`/categories/${thread.categoryId}`);
  }

  async function confirmDeletePost() {
    if (!deletePostId) {
      return;
    }

    await fetch(`/posts/${deletePostId}/delete`, {
      method: 'POST',
      credentials: 'include',
    });

    window.location.reload();
  }

  if (!thread) {
    return <div>Thread not found</div>;
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
                <Link to={`/categories/${thread.categoryId}`}>{thread.category.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{thread.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="my-8 text-2xl font-bold">{thread.title}</h1>
        <div className="flex flex-col gap-4">
          {page === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{thread.createdAt.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex">
                  <div className="flex min-w-64 flex-col items-center gap-4 p-4">
                    <Avatar className="h-32 w-32">
                      <AvatarFallback>{thread.user.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>{thread.user.email}</div>
                  </div>
                  <div className="flex w-full flex-col">
                    <div className="p-4">
                      <div className="prose dark:prose-invert max-w-full">
                        <Markdown content={thread.content} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              {user && user.id === thread.userId && (
                <CardFooter className="justify-end">
                  <div className="flex items-center gap-1">
                    <Button asChild size="icon" variant="ghost">
                      <Link to={`/threads/${thread.id}/update`}>
                        <Edit />
                      </Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setShowDeleteThreadDialog(true)}>
                      <Trash />
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          )}
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle>{post.createdAt.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex">
                  <div className="flex min-w-64 flex-col items-center gap-4 p-4">
                    <Avatar className="h-32 w-32">
                      <AvatarFallback>{post.user.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>{post.user.email}</div>
                  </div>
                  <div className="flex w-full flex-col">
                    <div className="p-4">
                      <div className="prose dark:prose-invert max-w-full">
                        <Markdown content={post.content} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              {user && user.id === post.userId && (
                <CardFooter className="justify-end">
                  <div className="flex items-center gap-1">
                    <Button asChild size="icon" variant="ghost">
                      <Link to={`/posts/${post.id}/update`}>
                        <Edit />
                      </Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeletePostId(post.id)}>
                      <Trash />
                    </Button>
                  </div>
                </CardFooter>
              )}
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
                <CardTitle>Reply to Thread</CardTitle>
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
      <Dialog open={showDeleteThreadDialog} onOpenChange={setShowDeleteThreadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thread</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this thread? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDeleteThreadDialog(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={confirmDeleteThread} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeletePostId(null)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={confirmDeletePost} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import React from 'react';
import { Link, redirect } from 'react-router';
import { MarkdownEditor } from '~/components/markdown-editor';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import prisma from '~/lib/prisma';
import { getUserId, requireUserId } from '~/services/auth.service';
import type { Route } from './+types/thread-update';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Update Thread | NodeBB' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireUserId(request);

  const threadId = Number(params.id);
  const userId = await getUserId(request);

  if (!userId) {
    throw new Error('You must be logged in to update a thread');
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      category: true,
    },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  if (thread.userId !== userId) {
    throw new Error('You do not have permission to update this thread');
  }

  return {
    thread,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const threadId = Number(params.id);
  const userId = await getUserId(request);

  if (!userId) {
    throw new Error('You must be logged in to update a thread');
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  if (thread.userId !== userId) {
    throw new Error('You do not have permission to update this thread');
  }

  const form = await request.formData();
  const title = String(form.get('title') || '');
  const content = String(form.get('content') || '');

  if (!title || !content) {
    throw new Error('Title and content are required');
  }

  await prisma.thread.update({
    where: { id: threadId },
    data: {
      title,
      content,
    },
  });

  return redirect(`/threads/${thread.id}`);
}

export default function ThreadUpdate({ loaderData }: Route.ComponentProps) {
  const { thread } = loaderData;

  const [title, setTitle] = React.useState(thread?.title ?? '');
  const [content, setContent] = React.useState(thread?.content ?? '');

  if (!thread) {
    return <div>Thread not found</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4">
        <Breadcrumb className="bg-card mb-8 rounded-md border p-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/categories/${thread.category.id}`}>{thread.category.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/threads/${thread.id}`}>{thread.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Update Thread</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card>
          <CardHeader>
            <CardTitle>Update Thread</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" method="post">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  type="text"
                  value={title}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="content">Content</Label>
                <MarkdownEditor height={600} onChange={setContent} value={content} />
                <input type="hidden" name="content" value={content} />
              </div>
              <div className="flex items-center justify-end gap-4">
                <Button type="submit">Update Thread</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

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
import { Label } from '~/components/ui/label';
import prisma from '~/lib/prisma';
import { getUserId, requireUserId } from '~/services/auth.service';
import type { Route } from './+types/post-update';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Update Post | NodeBB' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireUserId(request);

  const postId = Number(params.id);
  const userId = await getUserId(request);

  if (!userId) {
    throw new Error('You must be logged in to update a post');
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      thread: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  if (post.userId !== userId) {
    throw new Error('You do not have permission to update this post');
  }

  return {
    post,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const postId = Number(params.id);
  const userId = await getUserId(request);

  if (!userId) {
    throw new Error('You must be logged in to update a post');
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  if (post.userId !== userId) {
    throw new Error('You do not have permission to update this post');
  }

  const form = await request.formData();
  const content = String(form.get('content') || '');

  if (!content) {
    throw new Error('Content is required');
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      content,
    },
  });

  return redirect(`/threads/${post.threadId}`);
}

export default function PostUpdate({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  const [content, setContent] = React.useState(post?.content ?? '');

  if (!post) {
    return <div>Post not found</div>;
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
                <Link to="/">{post.thread.subcategory.category.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/categories/${post.thread.subcategory.id}`}>{post.thread.subcategory.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/threads/${post.thread.id}`}>{post.thread.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Update Post</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card>
          <CardHeader>
            <CardTitle>Update Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" method="post">
              <div className="flex flex-col gap-2">
                <Label htmlFor="content">Content</Label>
                <MarkdownEditor onChange={setContent} value={content} />
                <input type="hidden" name="content" value={content} />
              </div>
              <div className="flex items-center justify-end gap-4">
                <Button type="submit">Update Post</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

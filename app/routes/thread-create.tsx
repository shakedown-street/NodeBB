import React from 'react';
import { Link, redirect } from 'react-router';
import { MarkdownEditor } from '~/components/markdown-editor';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import prisma from '~/lib/prisma';
import { getUserId, requireUserId } from '~/services/auth.service';
import type { Route } from './+types/thread-create';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Create Thread | NodeBB' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireUserId(request);

  const category = await prisma.category.findUnique({
    where: { id: Number(params.id) },
  });

  return {
    category,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await request.formData();
  const title = String(form.get('title') || '');
  const content = String(form.get('content') || '');

  if (!title || !content) {
    return { error: 'Title and content are required' };
  }

  const userId = await getUserId(request);

  if (!userId) {
    return { error: 'You must be logged in to create a thread' };
  }

  const thread = await prisma.thread.create({
    data: {
      title,
      content,
      categoryId: Number(params.id),
      userId,
    },
  });

  return redirect(`/threads/${thread.id}`);
}

export default function ThreadCreate({ loaderData }: Route.ComponentProps) {
  const { category } = loaderData;

  const [content, setContent] = React.useState('');

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4">
        <Button asChild className="mb-4" variant="outline">
          <Link to={`/categories/${category.id}`}>Back to {category.name}</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Create thread</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" method="post">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required type="text" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="content">Content</Label>
                <MarkdownEditor onChange={setContent} value={content} />
                <input type="hidden" name="content" value={content} />
              </div>
              <div className="flex items-center justify-end gap-4">
                <Button type="submit">Create thread</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

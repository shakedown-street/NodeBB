import { Link } from 'react-router';
import prisma from '~/lib/prisma';
import { getUserId } from '~/services/auth.service';
import type { Route } from './+types/thread-create';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const category = await prisma.category.findUnique({
    where: { id: Number(params.id) },
    include: {
      threads: true,
    },
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

  return { thread };
}

export default function ThreadCreate({ loaderData }: Route.ComponentProps) {
  const { category } = loaderData;

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <>
      <h1>{category.name}</h1>
      <form method="post">
        <label>Title:</label>
        <input type="text" name="title" required />
        <label>Content:</label>
        <textarea name="content" required></textarea>
        <button type="submit">Create Thread</button>
      </form>
      <Link to={`/categories/${category.id}`}>Back to {category.name}</Link>
    </>
  );
}

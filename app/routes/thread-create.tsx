import { Link, redirect } from 'react-router';
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

  return redirect(`/threads/${thread.id}`);
}

export default function ThreadCreate({ loaderData }: Route.ComponentProps) {
  const { category } = loaderData;

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <>
      <div className="pw-container xl">
        <Link to={`/categories/${category.id}`}>Back to {category.name}</Link>
        <h1>{category.name}</h1>

        <div className="pw-card p-0">
          <div
            className="border-b p-4"
            style={{
              backgroundColor: 'var(--muted)',
            }}
          >
            <h4 className="my-0">Create thread</h4>
          </div>
          <div className="p-4">
            <form className="pw-form" method="post">
              <div className="pw-form-group">
                <label htmlFor="title">Title</label>
                <input className="w-full" id="title" name="title" required type="text" />
              </div>
              <div className="pw-form-group">
                <label htmlFor="content">Content</label>
                <textarea id="content" rows={8} name="content" required></textarea>
              </div>
              <div className="pw-form-actions end">
                <button type="submit">Create thread</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

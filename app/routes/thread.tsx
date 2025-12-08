import { Link, redirect } from 'react-router';
import prisma from '~/lib/prisma';
import { getUser } from '~/services/auth.service';
import type { Route } from './+types/thread';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await getUser(request);

  const thread = await prisma.thread.findUnique({
    where: { id: Number(params.id) },
    include: {
      category: true,
      user: true,
      posts: true,
    },
  });

  return {
    user,
    thread,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const user = await getUser(request);

  if (!user) {
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
      userId: user.id,
    },
  });

  return redirect(`/threads/${threadId}`);
}

export default function Thread({ loaderData }: Route.ComponentProps) {
  const { user, thread } = loaderData;

  if (!thread) {
    return <div>Thread not found</div>;
  }

  return (
    <>
      <h1>{thread.title}</h1>
      <p>{thread.createdAt.toLocaleDateString()}</p>
      <p>By: {thread.user.email}</p>
      <p>{thread.content}</p>
      <h2>Posts</h2>
      <ul>
        {thread.posts.map((post) => (
          <li key={post.id}>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
      {user && (
        <form method="post">
          <textarea name="content" required></textarea>
          <button type="submit">Add Post</button>
        </form>
      )}
      <Link to={`/categories/${thread.categoryId}`}>Back to {thread.category.name}</Link>
    </>
  );
}

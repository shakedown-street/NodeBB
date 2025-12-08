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
    },
  });

  const posts = await prisma.post.findMany({
    where: { threadId: thread ? thread.id : undefined },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    user,
    thread: thread,
    posts,
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
  const { user, thread, posts } = loaderData;

  if (!thread) {
    return <div>Thread not found</div>;
  }

  return (
    <>
      <div className="pw-container xl mb-16">
        <Link to={`/categories/${thread.categoryId}`}>Back to {thread.category.name}</Link>
        <h1>{thread.title}</h1>
        <div className="flex flex-col gap-4">
          <div className="pw-card p-0">
            <div
              className="border-b p-4"
              style={{
                backgroundColor: 'var(--muted)',
              }}
            >
              <h4 className="my-0">{thread.createdAt.toLocaleString()}</h4>
            </div>
            <div className="flex">
              <div className="flex w-64 flex-col items-center gap-4 border-r p-4">
                <div className="pw-avatar xl">
                  <div className="pw-avatar-fallback">{thread.user.email.charAt(0).toUpperCase()}</div>
                </div>
                <div>{thread.user.email}</div>
              </div>
              <div className="flex-1 p-4">
                <p
                  style={{
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {thread.content}
                </p>
              </div>
            </div>
          </div>
          {posts.map((post) => (
            <div className="pw-card p-0">
              <div
                className="border-b p-4"
                style={{
                  backgroundColor: 'var(--muted)',
                }}
              >
                <h4 className="my-0">{post.createdAt.toLocaleString()}</h4>
              </div>
              <div className="flex">
                <div className="flex w-64 flex-col items-center gap-4 border-r p-4">
                  <div className="pw-avatar xl">
                    <div className="pw-avatar-fallback">{post.user.email.charAt(0).toUpperCase()}</div>
                  </div>
                  <div>{post.user.email}</div>
                </div>
                <div className="flex-1 p-4">
                  <p
                    style={{
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {post.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {user && (
            <div className="pw-card p-0">
              <div
                className="border-b p-4"
                style={{
                  backgroundColor: 'var(--muted)',
                }}
              >
                <h4 className="my-0">Reply to thread</h4>
              </div>
              <div className="p-4">
                <form className="pw-form" method="post">
                  <div className="pw-form-group">
                    <textarea rows={8} name="content" required></textarea>
                  </div>
                  <div className="pw-form-actions end">
                    <button type="submit">Post reply</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import clsx from 'clsx';
import { Link, redirect } from 'react-router';
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

  const { user } = useAuth();

  if (!thread) {
    return <div>Thread not found</div>;
  }

  return (
    <>
      <div className="pw-container xl">
        <Link to={`/categories/${thread.categoryId}`}>Back to {thread.category.name}</Link>
        <h1>{thread.title}</h1>
        <div className="flex flex-col gap-4">
          {page === 1 && (
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
          )}
          {posts.map((post) => (
            <div key={post.id} className="pw-card p-0">
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
          {totalPages > 1 && (
            <ul className="pw-pagination">
              <li
                className={clsx({
                  disabled: page === 1,
                })}
              >
                {page === 1 ? 'Prev' : <Link to={`?page=${page - 1}`}>Prev</Link>}
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li
                  key={i}
                  className={clsx({
                    active: page === i + 1,
                  })}
                >
                  {page === i + 1 ? i + 1 : <Link to={`?page=${i + 1}`}>{i + 1}</Link>}
                </li>
              ))}
              <li
                className={clsx({
                  disabled: page === totalPages,
                })}
              >
                {page === totalPages ? 'Next' : <Link to={`?page=${page + 1}`}>Next</Link>}
              </li>
            </ul>
          )}
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

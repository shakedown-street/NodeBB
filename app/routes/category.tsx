import { Link } from 'react-router';
import prisma from '~/lib/prisma';
import { getUser } from '~/services/auth.service';
import type { Route } from './+types/category';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await getUser(request);

  const category = await prisma.category.findUnique({
    where: { id: Number(params.id) },
  });

  const threads = await Promise.all(
    await prisma.thread
      .findMany({
        where: { categoryId: Number(params.id) },
      })
      .then((threads) =>
        threads.map(async (thread) => {
          const postCount = await prisma.post.count({
            where: { threadId: thread.id },
          });

          const latestPost = await prisma.post.findFirst({
            where: { threadId: thread.id },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
          });
          return { ...thread, postCount, latestPost };
        }),
      ),
  );

  return {
    user,
    category,
    threads,
  };
}

export default function Category({ loaderData }: Route.ComponentProps) {
  const { user, category, threads } = loaderData;

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <>
      <div className="pw-container xl">
        <Link to="/">Back to home</Link>
        <div className="flex items-center justify-between">
          <h1>{category.name}</h1>
          {user && (
            <Link to={`/categories/${category.id}/create-thread`}>
              <button className="pw-button primary">Create thread</button>
            </Link>
          )}
        </div>
        <div className="pw-table-container">
          <table>
            <thead>
              <tr>
                <th>Thread</th>
                <th>Posts</th>
                <th>Latest post</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread.id}>
                  <td>
                    <Link to={`/threads/${thread.id}`}>{thread.title}</Link>
                  </td>
                  <td>{thread.postCount}</td>
                  <td>
                    {thread.latestPost ? (
                      <div className="flex items-center gap-3">
                        <div className="pw-avatar xs">
                          <div className="pw-avatar-fallback">
                            {thread.latestPost.user.email.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <Link className="block" to={`/threads/${thread.id}#post-${thread.latestPost.id}`}>
                            {thread.latestPost.createdAt.toLocaleString()}
                          </Link>
                          <div>{thread.latestPost.user.email}</div>
                        </div>
                      </div>
                    ) : (
                      'No threads yet'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

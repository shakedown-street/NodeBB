import { Link } from 'react-router';
import prisma from '~/lib/prisma';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({}: Route.LoaderArgs) {
  const categories = await prisma.category.findMany();

  const categoriesWithLatestThread = await Promise.all(
    categories.map(async (category) => {
      const threadCount = await prisma.thread.count({
        where: { categoryId: category.id },
      });
      const postCount = await prisma.post.count({
        where: {
          thread: {
            categoryId: category.id,
          },
        },
      });
      const latestThread = await prisma.thread.findFirst({
        where: { categoryId: category.id },
        include: {
          user: {
            select: { id: true, createdAt: true, updatedAt: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return { ...category, threadCount, postCount, latestThread };
    }),
  );

  const recentThreads = await prisma.thread.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    categories: categoriesWithLatestThread,
    recentThreads,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData;

  return (
    <>
      <div className="pw-container xl">
        <div className="pw-table-container">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Threads</th>
                <th>Posts</th>
                <th>Latest thread</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <Link to={`/categories/${category.id}`}>{category.name}</Link>
                  </td>
                  <td>{category.threadCount}</td>
                  <td>{category.postCount}</td>
                  <td>
                    {category.latestThread ? (
                      <div className="flex items-center gap-3">
                        <div className="pw-avatar xs">
                          <div className="pw-avatar-fallback">
                            {category.latestThread.user.email.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <Link className="block" to={`/threads/${category.latestThread.id}`}>
                            {category.latestThread.title}
                          </Link>
                          <div>
                            {category.latestThread.createdAt.toLocaleString()} • {category.latestThread.user.email}
                          </div>
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
        <h2>Recent threads</h2>
        <ul>
          {loaderData.recentThreads.map((thread) => (
            <li key={thread.id}>
              <Link to={`/threads/${thread.id}`}>{thread.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

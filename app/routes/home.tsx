import { Link } from 'react-router';
import prisma from '~/lib/prisma';
import { getUser } from '~/services/auth.service';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  const categories = await prisma.category.findMany();

  const categoriesWithLatestThread = await Promise.all(
    categories.map(async (category) => {
      const latestThread = await prisma.thread.findFirst({
        where: { categoryId: category.id },
        orderBy: { createdAt: 'desc' },
      });
      return { ...category, latestThread };
    }),
  );

  return {
    user,
    categories: categoriesWithLatestThread,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, categories } = loaderData;

  return (
    <>
      {user ? <Link to="/logout">Logout</Link> : <Link to="/login">Login</Link>}
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <Link to={`/categories/${category.id}`}>{category.name}</Link>
            {category.latestThread && (
              <div>
                Latest Thread: <Link to={`/threads/${category.latestThread.id}`}>{category.latestThread.title}</Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

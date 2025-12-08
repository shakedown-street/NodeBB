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
    include: {
      threads: true,
    },
  });

  return {
    user,
    category,
  };
}

export default function Category({ loaderData }: Route.ComponentProps) {
  const { user, category } = loaderData;

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <>
      <h1>{category.name}</h1>
      <ul>
        {category.threads.map((thread) => (
          <li key={thread.id}>
            <Link to={`/threads/${thread.id}`}>{thread.title}</Link>
          </li>
        ))}
      </ul>
      <Link to="/">Back to Home</Link>
    </>
  );
}

import { Link } from 'react-router';
import prisma from '~/lib/prisma';
import type { Route } from './+types/category';

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

export default function Category({ loaderData }: Route.ComponentProps) {
  const { category } = loaderData;

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <>
      <h1>{category.name}</h1>
      <Link to={`/categories/${category.id}/create-thread`}>Create New Thread</Link>
      <ul>
        {category.threads.map((thread) => (
          <li key={thread.id}>
            <Link to={`/threads/${thread.id}`}>{thread.title}</Link>
          </li>
        ))}
      </ul>
      <Link to="/">Back to home</Link>
    </>
  );
}

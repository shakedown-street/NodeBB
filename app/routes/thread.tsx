import { Link } from 'react-router';
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
      user: true,
      posts: true,
    },
  });

  return {
    user,
    thread,
  };
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
      <Link to={`/categories/${thread.categoryId}`}>Back to Category</Link>
    </>
  );
}

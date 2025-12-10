import prisma from '~/lib/prisma';
import { getUserId } from '~/services/auth.service';

export async function action({ params, request }: { params: any; request: Request }) {
  const userId = await getUserId(request);
  const postId = Number(params.id);

  if (!userId) {
    throw new Error('You must be logged in to delete a post.');
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    throw new Error('Post not found.');
  }

  if (post.userId !== userId) {
    throw new Error('You do not have permission to delete this post');
  }

  await prisma.post.delete({ where: { id: postId } });

  return { success: true };
}

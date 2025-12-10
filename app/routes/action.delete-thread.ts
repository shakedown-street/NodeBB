import prisma from '~/lib/prisma';
import { getUserId } from '~/services/auth.service';

export async function action({ params, request }: { params: any; request: Request }) {
  const userId = await getUserId(request);
  const threadId = Number(params.id);

  if (!userId) {
    throw new Error('You must be logged in to delete a thread.');
  }

  const thread = await prisma.thread.findUnique({ where: { id: threadId } });

  if (!thread) {
    throw new Error('Thread not found.');
  }

  if (thread.userId !== userId) {
    throw new Error('You do not have permission to delete this thread');
  }

  await prisma.thread.delete({ where: { id: threadId } });

  return { success: true };
}

import bcrypt from 'bcrypt';
import { createCookieSessionStorage, redirect } from 'react-router';
import prisma from '~/lib/prisma';

const SESSION_SECRET = process.env.SESSION_SECRET!;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not set');
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    secrets: [SESSION_SECRET],
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

const USER_SESSION_KEY = 'userId';

export async function createUser({ email, password }: { email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new Error('Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user
    .create({
      data: {
        email,
        passwordHash,
      },
    })
    .then((user) => ({
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
    }));

  return user;
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
  };
}

export async function login(userId: number, redirectTo = '/') {
  const session = await sessionStorage.getSession();
  session.set(USER_SESSION_KEY, userId);

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);

  return redirect('/login', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}

export async function getSession(request: Request) {
  const cookie = request.headers.get('Cookie');

  return sessionStorage.getSession(cookie);
}

export async function getUserId(request: Request) {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);

  if (!userId || typeof userId !== 'number') {
    return null;
  }

  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      email: true,
    },
  });

  return user;
}

export async function requireUserId(request: Request, redirectTo = new URL(request.url).pathname) {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);

  if (!userId || typeof userId !== 'number') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }

  return userId;
}

export async function redirectIfAuthenticated(request: Request) {
  const userId = await getUserId(request);

  if (userId) {
    throw redirect('/');
  }
}

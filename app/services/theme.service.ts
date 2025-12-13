import { createCookieSessionStorage } from 'react-router';
import { createThemeSessionResolver } from 'remix-themes';

const SESSION_SECRET = process.env.SESSION_SECRET!;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not set');
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'theme',
    secrets: [SESSION_SECRET],
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
});

export const themeSessionResolver = createThemeSessionResolver(sessionStorage);

import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { PreventFlashOnWrongTheme, ThemeProvider } from 'remix-themes';
import type { Route } from './+types/root';
import './app.css';
import Nav from './components/nav';
import { AuthProvider } from './context/auth';
import { cn } from './lib/utils';
import { getUser } from './services/auth.service';
import { themeSessionResolver } from './services/theme.service';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  const { getTheme } = await themeSessionResolver(request);

  return { user, theme: getTheme() };
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { user, theme } = loaderData;

  return (
    <>
      <ThemeProvider specifiedTheme={theme} themeAction="/action/set-theme">
        <AuthProvider user={user}>
          <html lang="en" className={cn(theme)}>
            <head>
              <meta charSet="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <Meta />
              <PreventFlashOnWrongTheme ssrTheme={Boolean(theme)} />
              <Links />
            </head>
            <body>
              <Nav />
              <div className="my-12">
                <Outlet />
              </div>
              <ScrollRestoration />
              <Scripts />
            </body>
          </html>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

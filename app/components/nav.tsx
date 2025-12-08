import { MoonIcon, SunIcon } from '@heroicons/react/16/solid';
import type { User } from 'generated/prisma/client';
import { Link } from 'react-router';
import { useTheme } from '~/context/theme';

type NavProps = {
  user: User | null;
};

export default function Nav({ user }: NavProps) {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <div className="pw-container xl">
        <nav className="flex items-center justify-between py-4">
          <Link className="text-xl font-bold" to="/">
            NodeBB
          </Link>
          <div className="flex items-center gap-4">
            <button className="pw-button sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
            </button>
            {user ? (
              <Link to="/logout">
                <button className="pw-button sm">Logout</button>
              </Link>
            ) : (
              <Link to="/login">
                <button className="pw-button sm">Login</button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}

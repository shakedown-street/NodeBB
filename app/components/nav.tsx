import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router';
import { Theme, useTheme } from 'remix-themes';
import { useAuth } from '~/context/auth';
import { Button } from './ui/button';

export default function Nav() {
  const { user } = useAuth();
  const [theme, setTheme] = useTheme();

  return (
    <>
      <div className="border-b">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between py-4">
            <Link className="text-primary text-xl font-bold" to="/">
              NodeBB
            </Link>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT)}
                size="icon-sm"
                variant="outline"
              >
                {theme === Theme.LIGHT ? <Moon /> : <Sun />}
              </Button>
              {user ? (
                <Button asChild size="sm">
                  <Link to="/logout">Logout</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/signup">Signup</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/login">Login</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}

import type { User } from 'generated/prisma/client';
import { Link } from 'react-router';

type NavProps = {
  user: User | null;
};

export default function Nav({ user }: NavProps) {
  return (
    <>
      <div className="pw-container xl">
        <nav className="flex items-center justify-between py-4">
          <Link className="text-xl font-bold" to="/">
            NodeBB
          </Link>
          <div className="flex items-center gap-4">
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

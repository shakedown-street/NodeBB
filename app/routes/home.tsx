import { Link } from 'react-router';
import { getUser } from '~/services/auth.service';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'NodeBB' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  return {
    user,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return <>{user ? <Link to="/logout">Logout</Link> : <Link to="/login">Login</Link>}</>;
}

import { redirect } from 'react-router';
import { authenticate, getUser, login } from '~/services/auth.service';
import type { Route } from './+types/login';

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  if (user) {
    return redirect('/');
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();

  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const user = await authenticate(email, password);

  if (!user) {
    return { error: 'Invalid email or password' };
  }

  return login(user.id, '/');
}

export default function Login() {
  return (
    <form method="post">
      <label>
        Email <input name="email" type="email" />
      </label>
      <label>
        Password <input name="password" type="password" />
      </label>
      <button type="submit">Login</button>
    </form>
  );
}

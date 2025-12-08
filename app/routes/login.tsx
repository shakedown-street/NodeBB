import { redirect } from 'react-router';
import z from 'zod';
import { authenticate, getUser, login } from '~/services/auth.service';
import type { Route } from './+types/login';

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password is required'),
});

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  if (user) {
    return redirect('/');
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const formData = {
    email: String(form.get('email') || '').trim(),
    password: String(form.get('password') || ''),
  };

  const result = LoginSchema.safeParse(formData);

  if (!result.success) {
    return { error: result.error.issues.map((issue) => ({ message: issue.message })) };
  }

  const { email, password } = result.data;
  const user = await authenticate(email, password);

  if (!user) {
    return { error: [{ message: 'Invalid email or password' }] };
  }

  return login(user.id, '/');
}

export default function Login({ actionData }: Route.ComponentProps) {
  return (
    <form method="post">
      <label>
        Email <input name="email" type="email" />
      </label>
      <label>
        Password <input name="password" type="password" />
      </label>
      {actionData?.error && (
        <ul>
          {actionData.error.map((err: { message: string }, i: number) => (
            <li key={i} className="text-red-800">
              {err.message}
            </li>
          ))}
        </ul>
      )}
      <button type="submit">Login</button>
    </form>
  );
}

import z from 'zod';
import { authenticate, login, redirectIfAuthenticated } from '~/services/auth.service';
import type { Route } from './+types/login';

const LoginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1, 'Password is required'),
});

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Login | NodeBB' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectIfAuthenticated(request);
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const formData = {
    email: String(form.get('email') || ''),
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

  const redirectTo = new URL(request.url).searchParams.get('redirectTo') || '/';

  return login(user.id, redirectTo);
}

export default function Login({ actionData }: Route.ComponentProps) {
  return (
    <>
      <div className="pw-container xs">
        <div className="pw-card">
          <h1 className="mt-0">Login</h1>
          <form className="pw-form" method="post">
            <div className="pw-form-group">
              <label htmlFor="email">Email</label>
              <input className="w-full" id="email" name="email" required type="email" />
            </div>
            <div className="pw-form-group">
              <label htmlFor="password">Password</label>
              <input className="w-full" id="password" name="password" required type="password" />
            </div>
            {actionData?.error && (
              <ul>
                {actionData.error.map((err: { message: string }, i: number) => (
                  <li key={i} className="text-red-800">
                    {err.message}
                  </li>
                ))}
              </ul>
            )}
            <button className="pw-button primary" type="submit">
              Login
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

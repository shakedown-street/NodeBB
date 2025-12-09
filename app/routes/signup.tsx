import z from 'zod';
import { createUser, login, redirectIfAuthenticated } from '~/services/auth.service';
import type { Route } from './+types/signup';

const SignupSchema = z.object({
  email: z.email().trim(),
  password1: z.string().min(1, 'Password is required'),
  password2: z.string().min(1, 'Please confirm your password'),
});

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Signup | NodeBB' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectIfAuthenticated(request);
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const formData = {
    email: String(form.get('email') || ''),
    password1: String(form.get('password1') || ''),
    password2: String(form.get('password2') || ''),
  };

  const result = SignupSchema.safeParse(formData);

  if (!result.success) {
    return { error: result.error.issues.map((issue) => ({ message: issue.message })) };
  }

  if (result.data.password1 !== result.data.password2) {
    return { error: [{ message: 'Passwords do not match' }] };
  }

  const { email, password1 } = result.data;

  try {
    const user = await createUser({ email, password: password1 });

    return await login(user.id, '/');
  } catch (error: any) {
    return { error: [{ message: error.message || 'Something went wrong' }] };
  }
}

export default function Signup({ actionData }: Route.ComponentProps) {
  return (
    <>
      <div className="pw-container xs">
        <div className="pw-card">
          <h1 className="mt-0">Signup</h1>
          <form className="pw-form" method="post">
            <div className="pw-form-group">
              <label htmlFor="email">Email</label>
              <input className="w-full" id="email" name="email" required type="email" />
            </div>
            <div className="pw-form-group">
              <label htmlFor="password1">Password</label>
              <input className="w-full" id="password1" name="password1" required type="password" />
            </div>
            <div className="pw-form-group">
              <label htmlFor="password2">Password (Again)</label>
              <input className="w-full" id="password2" name="password2" required type="password" />
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
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

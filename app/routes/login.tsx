import z from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
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
      <div className="container mx-auto max-w-sm px-4">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" method="post">
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" required type="email" />
              </div>
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" required type="password" />
              </div>
              {actionData?.error && (
                <ul>
                  {actionData.error.map((err: { message: string }, i: number) => (
                    <li key={i} className="text-destructive">
                      {err.message}
                    </li>
                  ))}
                </ul>
              )}
              <Button type="submit">Login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import z from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { createUser, login, redirectIfAuthenticated } from '~/services/auth.service';
import type { Route } from './+types/signup';

const SignupSchema = z.object({
  username: z.string().trim(),
  password1: z.string().min(1, 'Password is required'),
  password2: z.string().min(1, 'Please confirm your password'),
});

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Sign Up | NodeBB' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await redirectIfAuthenticated(request);
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const formData = {
    username: String(form.get('username') || ''),
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

  const { username, password1 } = result.data;

  try {
    const user = await createUser({ username, password: password1 });

    return await login(user.id, '/');
  } catch (error: any) {
    return { error: [{ message: error.message || 'Something went wrong' }] };
  }
}

export default function Signup({ actionData }: Route.ComponentProps) {
  return (
    <>
      <div className="container mx-auto max-w-sm px-4">
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" method="post">
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required type="text" />
              </div>
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="password1">Password</Label>
                <Input id="password1" name="password1" required type="password" />
              </div>
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="password2">Password (Again)</Label>
                <Input id="password2" name="password2" required type="password" />
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
              <Button type="submit">Sign Up</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

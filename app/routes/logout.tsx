import { logout } from '~/services/auth.service';
import type { Route } from './+types/logout';

export async function loader({ request }: Route.LoaderArgs) {
  return logout(request);
}

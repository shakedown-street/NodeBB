import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('/login', 'routes/login.tsx'),
  route('/signup', 'routes/signup.tsx'),
  route('/logout', 'routes/logout.tsx'),
  route('/categories/:id', 'routes/category.tsx'),
  route('/categories/:id/create-thread', 'routes/thread-create.tsx'),
  route('/threads/:id', 'routes/thread.tsx'),
] satisfies RouteConfig;

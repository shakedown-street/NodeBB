import type { User } from 'generated/prisma/client';
import React from 'react';

type AuthUser = Omit<User, 'passwordHash'> | null;

const AuthContext = React.createContext<{
  user: AuthUser;
}>({ user: null });

export function AuthProvider({ children, user }: { children: React.ReactNode; user: AuthUser }) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => React.useContext(AuthContext);

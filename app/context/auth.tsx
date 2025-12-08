import type { User } from 'generated/prisma/client';
import React from 'react';

const AuthContext = React.createContext<{
  user: User | null;
}>({ user: null });

export function AuthProvider({ children, user }: { children: React.ReactNode; user: User | null }) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => React.useContext(AuthContext);

// src/context/auth.context.ts
// Context object + hook, kept out of AuthContext.tsx so that file only exports
// components (Vite Fast Refresh requirement).
import { createContext, useContext } from "react";

export interface AuthUser {
  id: number;
  name: string;
  initials: string;
  username: string;
  email: string;
  avatarSrc?: string;
  color?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}

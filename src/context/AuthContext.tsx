// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, logout as logoutService } from "../services/auth.service";
import { tokenStorage } from "../services/api.service";
import type { User } from "../types/api";

export interface AuthUser {
  id: number;
  name: string;
  initials: string;
  username: string;
  email: string;
  avatarSrc?: string;
  color?: string;
}

function toAuthUser(u: User): AuthUser {
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;
  const parts = full.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : full.slice(0, 2).toUpperCase();
  return { id: u.id, name: full, initials, username: u.username, email: u.email };
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    // No tokens at all → skip the network call entirely
    if (!tokenStorage.getAccess() && !tokenStorage.getRefresh()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      // api.service will automatically use the refresh token if access is expired
      const me = await getMe();
      setUser(toAuthUser(me));
    } catch {
      // Refresh also failed — user is genuinely logged out
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser, logout }}>
      {/* Hold rendering until auth state is resolved — prevents flash of logged-out UI */}
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}
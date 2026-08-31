/**
 * Auth state for the hospital login. The session (token + user + hospital)
 * is persisted to localStorage so a page refresh keeps the user signed in.
 *
 * - `login` calls the backend and stores the session.
 * - `logout` clears it.
 * - On mount, a restored session is re-validated against `/auth/me` in the
 *   background; expired/invalid tokens are cleared automatically.
 * - A 401 on any API call while a token is present dispatches
 *   `hbcr:unauthorized`, which also clears the session.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AUTH_STORAGE_KEY,
  authApi,
  readStoredToken,
  type AuthSession,
} from "./api";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthSession>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    // Accept session even without token (cookie-only mode)
    return parsed?.user ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readStoredSession(),
  );
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    // Tell the backend to clear the httpOnly auth cookie
    try {
      await authApi.logout();
    } catch {
      // If the logout API fails (e.g. server is down), still clear locally
    }
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // storage unavailable — ignore
    }
    // Drop any cached dashboard/patient data so a different hospital signing
    // into the same browser never sees the previous session's records.
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  const login = useCallback(async (username: string, password: string) => {
    const next = await authApi.login(username, password);
    try {
      // Only store user+hospital in localStorage; the token is now
      // in an httpOnly cookie managed by the backend. Keeping the
      // full session object (without token) in localStorage lets the
      // frontend know the user is logged in without exposing the
      // token to JavaScript.
      const { token: _token, ...safeSession } = next;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeSession));
    } catch {
      // storage unavailable — session stays in memory only
    }
    setSession(next);
    return next;
  }, []);

  // Re-validate a restored session in the background. If the token is
  // expired or the user was deactivated, the /me call fails and we log out.
  useEffect(() => {
    if (!readStoredToken()) return;
    let cancelled = false;
    authApi
      .me()
      .then((next) => {
        if (cancelled) return;
        try {
          const { token: _token, ...safeSession } = next;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeSession));
        } catch {
          // ignore
        }
        setSession(next);
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // Any API 401 with a token attached means the session died mid-use.
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener("hbcr:unauthorized", onUnauthorized);
    return () => window.removeEventListener("hbcr:unauthorized", onUnauthorized);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session?.token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

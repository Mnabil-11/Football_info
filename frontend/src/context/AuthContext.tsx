import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
} from '../api/authApi';
import { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  /** True while we verify an existing token on first load. */
  initializing: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // On first load, hydrate the session from the httpOnly cookie (if any):
  // /auth/me succeeds when a valid session cookie is present, 401s otherwise.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const current = await meRequest();
        if (!cancelled) {
          setUser(current);
        }
      } catch {
        // No valid session — stay logged out.
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedIn } = await loginRequest({ email, password });
    setUser(loggedIn);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: created } = await registerRequest({
        name,
        email,
        password,
      });
      setUser(created);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Logout is best-effort; clear the client session regardless.
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Access the auth context. Throws if used outside <AuthProvider>. */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  startTransition,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "../api/auth-client";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
});

function userFromSession(session: {
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null };
}): User {
  const meta = session.user.user_metadata ?? {};
  // Role hanya dari app_metadata (dikontrol server/admin), jangan dari
  // user_metadata yang bisa diedit user sendiri — hindari spoof role client.
  const appMeta = session.user.app_metadata ?? {};
  const role = (appMeta.role ?? meta.role) as User["role"] | undefined;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: (meta.name as string) ?? (meta.full_name as string) ?? "",
    role: role ?? "produksi",
    avatar_url: null,
    phone: null,
    is_active: true,
    assigned_kabupaten_ids: [],
    last_login_at: null,
    deleted_at: null,
    created_at: "",
    updated_at: "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let didSettle = false;
    // Pastikan isLoading selalu false (tidak gantung di layar putih).
    const settle = (after?: () => void) => {
      if (cancelled || didSettle) return;
      didSettle = true;
      setIsLoading(false);
      after?.();
    };

    // 1) Coba session dari client storage (cepat).
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        if (session) {
          try {
            setUser(userFromSession(session));
          } catch {
            // shape session tak terduga; fallback server akan ambil user.
          }
          settle(refreshUser);
        }
        // tanpa session -> biarkan fallback timer mengambil dari server.
      })
      .catch(() => {
        /* fallback timer yang tangani */
      });

    // 2) Fallback (2.5s): baca user via server action yang membaca cookie
    //    di server. Andal di TWA/WebView meski client storage getSession()
    //    menggantung/tidak bisa membaca cookie.
    const fallbackTimer = setTimeout(() => {
      if (cancelled || didSettle) return;
      getCurrentUser()
        .then((u) => {
          if (u) setUser(u);
        })
        .catch(() => {})
        .finally(() => settle());
    }, 2500);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      startTransition(() => {
        refreshUser();
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

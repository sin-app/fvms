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

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  // User di-seed dari SERVER (root layout membaca session cookie di server).
  // Ini andal di TWA/WebView tempat client getSession() bisa menggantung atau
  // tidak bisa membaca cookie, sehingga pemanggilan server action untuk mengambil
  // user di client berpotensi tidak pernah resolve (layar putih/loading).
  // isLoading langsung false agar UI langsung render; pembaruan client-side
  // bersifat best-effort di belakang layar dan tidak memblokir render.
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      // pertahankan user dari seed server jika pemanggilan gagal/hang.
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // Best-effort: sinkronkan dengan session client bila tersedia.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active || !session) return;
        try {
          setUser(userFromSession(session));
        } catch {
          // abaikan shape session tak terduga
        }
      })
      .catch(() => {});

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      startTransition(() => {
        void refreshUser();
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
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

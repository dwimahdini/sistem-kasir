"use client";

import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AuthService } from "@/services/AuthService";
import type { Profile } from "@/types";

const authService = new AuthService();
const missingProfileMessage = "Akun belum memiliki peran, hubungi admin";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;

    async function updateSession(nextSession: Session | null) {
      const currentRequestId = ++requestId.current;
      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(null);
      setError(null);
      setLoading(true);
      try {
        const nextProfile = await authService.getProfile();
        if (!active || currentRequestId !== requestId.current) return;
        setProfile(nextProfile);
        if (!nextProfile) {
          setError(missingProfileMessage);
          try {
            await authService.signOut();
          } catch {
            setError(`${missingProfileMessage}. Gagal mengeluarkan akun, coba keluar kembali.`);
          }
        }
      } catch {
        if (active && currentRequestId === requestId.current) {
          setError("Profil pengguna tidak dapat dimuat. Coba muat ulang halaman.");
        }
      } finally {
        if (active && currentRequestId === requestId.current) {
          setLoading(false);
        }
      }
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = authService.onAuthChange((nextSession) => {
        void updateSession(nextSession);
      });
      void authService.getSession().then(updateSession).catch(() => {
        if (!active) return;
        setError("Sesi tidak dapat diperiksa. Coba muat ulang halaman.");
        setLoading(false);
      });
    } catch {
      setError("Koneksi Supabase belum tersedia. Periksa pengaturannya.");
      setLoading(false);
    }

    return () => {
      active = false;
      requestId.current += 1;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  return context;
}

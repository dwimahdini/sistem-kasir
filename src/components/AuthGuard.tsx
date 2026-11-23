"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

const routeRoles: Record<string, Role[]> = {
  "/kasir": ["admin", "kasir"],
  "/riwayat": ["admin", "kasir"],
  "/produk": ["admin"],
  "/kategori": ["admin"],
};

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, profile, loading, error } = useAuth();
  const effectiveRoles = allowedRoles ?? routeRoles[pathname];

  useEffect(() => {
    if (pathname === "/login" || loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (error) return;
    if (profile && effectiveRoles && !effectiveRoles.includes(profile.peran)) {
      router.replace("/kasir");
    }
  }, [effectiveRoles, error, loading, pathname, profile, router, session]);

  if (pathname === "/login") return children;

  if (error) {
    return (
      <div className="page-shell py-16">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-coffee-900">
            {error === "Akun belum memiliki peran, hubungi admin"
              ? "Akun belum memiliki peran"
              : "Sesi belum dapat diperiksa"}
          </h1>
          <p className="mt-2 text-sm text-coffee-600">
            {error}
          </p>
          <button
            className="button-primary mt-5"
            onClick={() => window.location.reload()}
            type="button"
          >
            Muat ulang
          </button>
        </div>
      </div>
    );
  }

  if (loading || !session || !profile) {
    return (
      <div className="page-shell py-16">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-coffee-800">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  if (effectiveRoles && !effectiveRoles.includes(profile.peran)) {
    return (
      <div className="page-shell py-16">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-coffee-800">Mengarahkan ke halaman kasir...</p>
        </div>
      </div>
    );
  }

  return children;
}

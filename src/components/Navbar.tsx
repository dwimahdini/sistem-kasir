"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthService } from "@/services/AuthService";
import type { Role } from "@/types";

const authService = new AuthService();

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  if (pathname === "/login" || loading || !profile) return null;

  const links: Array<{ href: string; label: string; roles: Role[] }> = [
    { href: "/kasir", label: "Kasir", roles: ["admin", "kasir"] },
    { href: "/produk", label: "Produk", roles: ["admin"] },
    { href: "/kategori", label: "Kategori", roles: ["admin"] },
    { href: "/riwayat", label: "Riwayat", roles: ["admin", "kasir"] },
  ];
  const visibleLinks = links.filter((link) => link.roles.includes(profile.peran));

  async function handleSignOut() {
    setError("");
    setIsSigningOut(true);
    try {
      await authService.signOut();
      router.replace("/login");
    } catch {
      setError("Gagal keluar. Coba lagi.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gold/40 bg-surface/95 backdrop-blur">
      <nav className="page-shell flex min-h-20 items-center justify-between gap-5">
        <Link href="/kasir" className="flex items-center gap-3">
          <span>
            <span className="block font-serif text-xl font-bold tracking-tight text-ink">
              MLF Caffe
            </span>
            <span className="mt-1 block h-0.5 w-10 rounded-full bg-gold" />
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-page p-1">
            {visibleLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-brand-red text-white shadow-sm"
                      : "text-muted hover:bg-brand-soft hover:text-brand-deep"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="max-w-24 text-right sm:max-w-32">
            <p className="truncate text-sm font-semibold text-ink">{profile.nama}</p>
            <p className="text-xs text-muted">
              {profile.peran === "admin" ? "Admin" : "Kasir"}
            </p>
          </div>
          <button
            className="shrink-0 rounded-full border border-brand-red bg-surface px-4 py-2 text-sm font-semibold text-brand-red transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            type="button"
          >
            {isSigningOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </nav>
      {error && (
        <p className="page-shell pb-3 text-right text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthService } from "@/services/AuthService";

const authService = new AuthService();

export default function LoginPage() {
  const router = useRouter();
  const { session, profile, loading: isCheckingSession, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isCheckingSession && session && profile) router.replace("/kasir");
  }, [isCheckingSession, profile, router, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authService.signIn(email, password);
    } catch {
      setError("Email atau password salah. Periksa kembali lalu coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] place-items-center py-4 sm:py-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-coffee-100 bg-surface shadow-lg md:grid-cols-2">
        <aside className="flex min-h-64 flex-col justify-between bg-brand-deep p-8 text-white md:min-h-[560px] md:p-12">
          <div>
            <p className="font-serif text-3xl font-semibold tracking-wide">
              MLF Caffe
            </p>
            <span className="mt-3 block h-0.5 w-14 rounded-full bg-gold" />
          </div>
          <div className="py-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/65">
              Selamat datang
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight md:text-4xl">
              Hangat di setiap cangkir
            </h1>
          </div>
          <p className="text-sm text-white/65">Masuk untuk melanjutkan.</p>
        </aside>

        <div className="flex items-center p-7 sm:p-10 md:p-12">
          <div className="w-full">
            <h2 className="text-2xl font-semibold text-ink">Masuk ke akun</h2>
            <p className="mt-2 text-sm text-muted">
              Gunakan email dan password akun Anda.
            </p>

            {isCheckingSession ? (
              <p className="mt-7 rounded-2xl bg-page p-4 text-center text-sm text-muted">
                Memeriksa sesi...
              </p>
            ) : (
              <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                <label className="block text-sm font-semibold text-ink">
                  Email
                  <input
                    autoComplete="email"
                    className="field mt-2"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Password
                  <input
                    autoComplete="current-password"
                    className="field mt-2"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
                {(error || authError) && (
                  <p
                    aria-live="polite"
                    className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                  >
                    {error || authError}
                  </p>
                )}
                <button
                  className="button-primary w-full"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Memeriksa..." : "Masuk"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

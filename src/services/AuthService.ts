import type { Session } from "@supabase/supabase-js";
import { ensureSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Profile, Role } from "@/types";

export class AuthService {
  async signIn(email: string, password: string): Promise<void> {
    ensureSupabaseConfigured();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    ensureSupabaseConfigured();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getSession(): Promise<Session | null> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getProfile(): Promise<Profile | null> {
    ensureSupabaseConfigured();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const session = sessionData.session;
    if (!session) return null;

    const { data, error } = await supabase
      .from("profil")
      .select("id, nama, peran")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const row: unknown = data;
    if (
      typeof row !== "object" ||
      row === null ||
      !("id" in row) ||
      !("nama" in row) ||
      !("peran" in row) ||
      typeof row.id !== "string" ||
      typeof row.nama !== "string" ||
      (row.peran !== "admin" && row.peran !== "kasir")
    ) {
      throw new Error("Data profil atau peran tidak valid.");
    }

    return {
      id: row.id,
      nama: row.nama,
      peran: row.peran as Role,
    };
  }

  onAuthChange(callback: (session: Session | null) => void): () => void {
    ensureSupabaseConfigured();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => subscription.unsubscribe();
  }
}

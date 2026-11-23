import { ensureSupabaseConfigured, supabase } from "@/lib/supabase";
import type { CategoryRecord } from "@/types";

export class KategoriService {
  async getAll(): Promise<CategoryRecord[]> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
      .from("kategori")
      .select("id, nama")
      .order("nama");
    if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
    return data ?? [];
  }

  async getById(id: number): Promise<CategoryRecord | null> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
      .from("kategori")
      .select("id, nama")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
    return data;
  }

  async create(nama: string): Promise<CategoryRecord> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
      .from("kategori")
      .insert({ nama: nama.trim() })
      .select("id, nama")
      .single();
    if (error) throw new Error(`Gagal menambahkan kategori: ${error.message}`);
    return data;
  }

  async update(id: number, nama: string): Promise<CategoryRecord> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
      .from("kategori")
      .update({ nama: nama.trim() })
      .eq("id", id)
      .select("id, nama")
      .single();
    if (error) throw new Error(`Gagal mengubah kategori: ${error.message}`);
    return data;
  }

  async delete(id: number): Promise<void> {
    ensureSupabaseConfigured();
    const { count, error: productError } = await supabase
      .from("produk")
      .select("id", { count: "exact", head: true })
      .eq("kategori_id", id);
    if (productError) {
      throw new Error(`Gagal memeriksa produk dalam kategori: ${productError.message}`);
    }
    if ((count ?? 0) > 0) {
      throw new Error("Kategori tidak dapat dihapus karena masih digunakan oleh produk.");
    }
    const { error } = await supabase.from("kategori").delete().eq("id", id);
    if (error) throw new Error(`Gagal menghapus kategori: ${error.message}`);
  }
}

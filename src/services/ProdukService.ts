import { ensureSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ProductInput, ProductRecord, ProductWithCategory } from "@/types";

export class ProdukService {
  async uploadImage(file: File): Promise<string> {
    ensureSupabaseConfigured();
    const safeName = file.name
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    const fileName = `${Date.now()}-${crypto.randomUUID()}-${safeName || "gambar"}`;
    const { error } = await supabase.storage
      .from("produk")
      .upload(fileName, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Gagal mengunggah gambar: ${error.message}`);
    const { data } = supabase.storage.from("produk").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async deleteImage(url: string): Promise<void> {
    ensureSupabaseConfigured();
    let imagePath: string;
    try {
      const parsedUrl = new URL(url);
      const marker = "/storage/v1/object/public/produk/";
      const markerIndex = parsedUrl.pathname.indexOf(marker);
      if (markerIndex < 0) throw new Error("Lokasi gambar tidak dikenal.");
      imagePath = decodeURIComponent(
        parsedUrl.pathname.slice(markerIndex + marker.length),
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Gagal membaca URL gambar: ${error.message}`
          : "URL gambar tidak valid.",
      );
    }
    if (!imagePath) throw new Error("Lokasi gambar tidak ditemukan.");
    const { error } = await supabase.storage.from("produk").remove([imagePath]);
    if (error) throw new Error(`Gagal menghapus gambar: ${error.message}`);
  }

  async getAll(): Promise<ProductWithCategory[]> {
    ensureSupabaseConfigured();
    const { data: productData, error: productError } = await supabase
      .from("produk")
      .select("id, nama, harga, stok, kategori_id, gambar_url, dibuat_pada")
      .order("nama");
    if (productError) throw new Error(`Gagal memuat produk: ${productError.message}`);
    const products = (productData ?? []) as ProductRecord[];
    if (products.length === 0) return [];

    const { data: categoryData, error: categoryError } = await supabase
      .from("kategori")
      .select("id, nama");
    if (categoryError) {
      throw new Error(`Gagal memuat kategori produk: ${categoryError.message}`);
    }
    const categories = new Map(
      (categoryData ?? []).map((category) => [category.id, category]),
    );
    return products.map((product) => ({
      ...product,
      kategori: categories.get(product.kategori_id) ?? null,
    }));
  }

  async getById(id: number): Promise<ProductRecord | null> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
      .from("produk")
      .select("id, nama, harga, stok, kategori_id, gambar_url, dibuat_pada")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Gagal memuat produk: ${error.message}`);
    return data;
  }

  async create(input: ProductInput, imageFile?: File | null): Promise<ProductRecord> {
    ensureSupabaseConfigured();
    const imageUrl = imageFile
      ? await this.uploadImage(imageFile)
      : input.gambar_url ?? null;
    const { data, error } = await supabase
      .from("produk")
      .insert({ ...input, gambar_url: imageUrl })
      .select("id, nama, harga, stok, kategori_id, gambar_url, dibuat_pada")
      .single();
    if (error) {
      if (imageFile && imageUrl) await this.deleteImage(imageUrl);
      throw new Error(`Gagal menambahkan produk: ${error.message}`);
    }
    return data;
  }

  async update(
    id: number,
    input: ProductInput,
    imageFile?: File | null,
  ): Promise<ProductRecord> {
    ensureSupabaseConfigured();
    const currentProduct = await this.getById(id);
    if (!currentProduct) throw new Error("Produk yang akan diubah tidak ditemukan.");
    const imageUrl = imageFile ? await this.uploadImage(imageFile) : currentProduct.gambar_url;
    const { data, error } = await supabase
      .from("produk")
      .update({ ...input, gambar_url: imageUrl })
      .eq("id", id)
      .select("id, nama, harga, stok, kategori_id, gambar_url, dibuat_pada")
      .single();
    if (error) {
      if (imageFile && imageUrl) await this.deleteImage(imageUrl);
      throw new Error(`Gagal mengubah produk: ${error.message}`);
    }
    if (imageFile && currentProduct.gambar_url) {
      await this.deleteImage(currentProduct.gambar_url);
    }
    return data;
  }

  async delete(id: number): Promise<void> {
    ensureSupabaseConfigured();
    const currentProduct = await this.getById(id);
    const { error } = await supabase.from("produk").delete().eq("id", id);
    if (error) throw new Error(`Gagal menghapus produk: ${error.message}`);
    if (currentProduct?.gambar_url) await this.deleteImage(currentProduct.gambar_url);
  }
}

import { Product } from "@/models/Product";
import { ensureSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  OrderInput,
  OrderRecord,
  OrderStatus,
  OrderWithItems,
  ProductRecord,
} from "@/types";
import type { CartItem } from "@/models/Cart";

export class PesananService {
  async getAll(): Promise<OrderWithItems[]> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
      .from("pesanan")
      .select("id, nomor_meja, metode_pembayaran, total, bayar, kembalian, status, dibuat_pada")
      .eq("status", "selesai")
      .order("dibuat_pada", { ascending: false });
    if (error) throw new Error(`Gagal memuat riwayat pesanan: ${error.message}`);
    const orders = (data ?? []) as OrderRecord[];
    if (orders.length === 0) return [];
    const orderIds = orders.map((order) => order.id);
    const { data: detailData, error: detailError } = await supabase
      .from("detail_pesanan")
      .select("id, pesanan_id, produk_id, jumlah, harga_satuan, subtotal")
      .in("pesanan_id", orderIds);
    if (detailError) {
      throw new Error(`Gagal memuat item pesanan: ${detailError.message}`);
    }
    return this.attachItems(orders, detailData ?? []);
  }

  async getPending(): Promise<OrderRecord[]> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
      .from("pesanan")
      .select("id, nomor_meja, metode_pembayaran, total, bayar, kembalian, status, dibuat_pada")
      .eq("status", "menunggu_konfirmasi")
      .order("dibuat_pada", { ascending: true });
    if (error) throw new Error(`Gagal memuat pesanan tertunda: ${error.message}`);
    return (data ?? []) as OrderRecord[];
  }

  async getById(id: number): Promise<OrderWithItems | null> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
      .from("pesanan")
      .select("id, nomor_meja, metode_pembayaran, total, bayar, kembalian, status, dibuat_pada")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Gagal memuat detail pesanan: ${error.message}`);
    if (!data) return null;
    const order = data as OrderRecord;
    const { data: detailData, error: detailError } = await supabase
      .from("detail_pesanan")
      .select("id, pesanan_id, produk_id, jumlah, harga_satuan, subtotal")
      .eq("pesanan_id", id);
    if (detailError) {
      throw new Error(`Gagal memuat item pesanan: ${detailError.message}`);
    }
    const [orderWithItems] = await this.attachItems([order], detailData ?? []);
    return orderWithItems;
  }

  async create(input: OrderInput, items: CartItem[]): Promise<OrderRecord> {
    ensureSupabaseConfigured();
    if (items.length === 0) throw new Error("Keranjang masih kosong.");

    const productIds = items.map((item) => item.product.id);
    const { data: currentProducts, error: productError } = await supabase
      .from("produk")
      .select("id, nama, harga, stok, kategori_id, dibuat_pada")
      .in("id", productIds);
    if (productError) throw new Error(`Gagal memeriksa stok: ${productError.message}`);

    const productById = new Map(
      ((currentProducts ?? []) as ProductRecord[]).map((product) => [
        product.id,
        product,
      ]),
    );
    const checkedItems = items.map((item) => {
      const currentProduct = productById.get(item.product.id);
      if (!currentProduct) {
        throw new Error(`Produk ${item.product.nama} tidak lagi tersedia.`);
      }
      const product = new Product(currentProduct);
      product.reduceStock(item.quantity);
      return { item, product, updatedStock: product.getStock() };
    });
    const currentTotal = checkedItems.reduce(
      (sum, checked) => sum + checked.product.getPrice() * checked.item.quantity,
      0,
    );
    if (currentTotal !== input.total) {
      throw new Error("Harga menu berubah. Muat ulang menu sebelum memproses pembayaran.");
    }

    const { data: order, error: orderError } = await supabase
      .from("pesanan")
      .insert({ ...input, status: "menunggu_konfirmasi" })
      .select("id, nomor_meja, metode_pembayaran, total, bayar, kembalian, status, dibuat_pada")
      .single();
    if (orderError) throw new Error(`Gagal menyimpan pesanan: ${orderError.message}`);

    const detailRows = items.map(({ product, quantity }) => ({
      pesanan_id: order.id,
      produk_id: product.id,
      jumlah: quantity,
      harga_satuan: product.harga,
      subtotal: product.harga * quantity,
    }));
    const { error: detailError } = await supabase
      .from("detail_pesanan")
      .insert(detailRows);
    if (detailError) {
      await this.removeOrderAfterFailure(order.id);
      throw new Error(`Gagal menyimpan item pesanan: ${detailError.message}`);
    }

    const updatedProducts: Array<{ id: number; oldStock: number; newStock: number }> = [];
    for (const checked of checkedItems) {
      const { item, updatedStock } = checked;
      const currentProduct = productById.get(item.product.id);
      if (!currentProduct) continue;

      const { data, error } = await supabase
        .from("produk")
        .update({ stok: updatedStock })
        .eq("id", currentProduct.id)
        .eq("stok", currentProduct.stok)
        .select("id");
      if (error || !data?.length) {
        const rollbackErrors = await this.rollbackStock(updatedProducts);
        await this.removeOrderAfterFailure(order.id);
        const detail = error?.message ?? "Stok berubah saat transaksi berlangsung.";
        const rollbackMessage =
          rollbackErrors.length > 0
            ? ` Pemulihan sebagian gagal: ${rollbackErrors.join("; ")}`
            : "";
        throw new Error(`Pesanan dibatalkan karena stok tidak berhasil diperbarui: ${detail}.${rollbackMessage}`);
      }
      updatedProducts.push({
        id: currentProduct.id,
        oldStock: currentProduct.stok,
        newStock: updatedStock,
      });
    }

    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<void> {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
      .from("pesanan")
      .update({ status })
      .eq("id", id)
      .eq("status", "menunggu_konfirmasi")
      .select("id");
    if (error) throw new Error(`Gagal mengonfirmasi pesanan: ${error.message}`);
    if (!data?.length) {
      throw new Error("Pesanan tidak ditemukan atau sudah dikonfirmasi.");
    }
  }

  async delete(id: number): Promise<void> {
    ensureSupabaseConfigured();
    const { error: detailError } = await supabase
      .from("detail_pesanan")
      .delete()
      .eq("pesanan_id", id);
    if (detailError) {
      throw new Error(`Gagal menghapus item pesanan: ${detailError.message}`);
    }
    const { error } = await supabase.from("pesanan").delete().eq("id", id);
    if (error) throw new Error(`Gagal menghapus pesanan: ${error.message}`);
  }

  private async attachItems(
    orders: OrderRecord[],
    details: Array<{
      id: number;
      pesanan_id: number;
      produk_id: number;
      jumlah: number;
      harga_satuan: number;
      subtotal: number;
    }>,
  ): Promise<OrderWithItems[]> {
    const productIds = [...new Set(details.map((detail) => detail.produk_id))];
    const productNames = new Map<number, string>();
    if (productIds.length > 0) {
      const { data, error } = await supabase
        .from("produk")
        .select("id, nama")
        .in("id", productIds);
      if (error) throw new Error(`Gagal memuat nama produk pesanan: ${error.message}`);
      for (const product of data ?? []) {
        productNames.set(product.id, product.nama);
      }
    }

    const itemsByOrder = new Map<number, OrderWithItems["detail_pesanan"]>();
    for (const detail of details) {
      const items = itemsByOrder.get(detail.pesanan_id) ?? [];
      items.push({
        ...detail,
        produk: productNames.has(detail.produk_id)
          ? { nama: productNames.get(detail.produk_id) as string }
          : null,
      });
      itemsByOrder.set(detail.pesanan_id, items);
    }
    return orders.map((order) => ({
      ...order,
      detail_pesanan: itemsByOrder.get(order.id) ?? [],
    }));
  }

  private async rollbackStock(
    updates: Array<{ id: number; oldStock: number; newStock: number }>,
  ): Promise<string[]> {
    const errors: string[] = [];
    for (const update of updates.reverse()) {
      const { data, error } = await supabase
        .from("produk")
        .update({ stok: update.oldStock })
        .eq("id", update.id)
        .eq("stok", update.newStock)
        .select("id");
      if (error || !data?.length) {
        errors.push(error?.message ?? `Stok produk ${update.id} berubah sebelum pemulihan.`);
      }
    }
    return errors;
  }

  private async removeOrderAfterFailure(orderId: number): Promise<void> {
    const { error: detailError } = await supabase
      .from("detail_pesanan")
      .delete()
      .eq("pesanan_id", orderId);
    const { error: orderError } = await supabase
      .from("pesanan")
      .delete()
      .eq("id", orderId);
    if (detailError || orderError) {
      const messages = [detailError?.message, orderError?.message].filter(Boolean);
      throw new Error(`Gagal membersihkan pesanan yang tidak selesai: ${messages.join("; ")}`);
    }
  }
}

export interface CategoryRecord {
  id: number;
  nama: string;
}

export type Role = "admin" | "kasir";

export interface Profile {
  id: string;
  nama: string;
  peran: Role;
}

export type OrderStatus = "menunggu_konfirmasi" | "selesai";

export interface ProductRecord {
  id: number;
  nama: string;
  harga: number;
  stok: number;
  kategori_id: number;
  gambar_url: string | null;
  dibuat_pada: string;
}

export interface OrderRecord {
  id: number;
  nomor_meja: string;
  metode_pembayaran: "tunai" | "qris";
  total: number;
  bayar: number;
  kembalian: number;
  status: OrderStatus;
  dibuat_pada: string;
}

export interface OrderDetailRecord {
  id: number;
  pesanan_id: number;
  produk_id: number;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
}

export interface ProductWithCategory extends ProductRecord {
  kategori: CategoryRecord | null;
}

export interface OrderItem extends OrderDetailRecord {
  produk: Pick<ProductRecord, "nama"> | null;
}

export interface OrderWithItems extends OrderRecord {
  detail_pesanan: OrderItem[];
}

export interface ProductInput {
  nama: string;
  harga: number;
  stok: number;
  kategori_id: number;
  gambar_url?: string | null;
}

export interface OrderInput {
  nomor_meja: string;
  metode_pembayaran: "tunai" | "qris";
  total: number;
  bayar: number;
  kembalian: number;
}

import type { ProductRecord } from "@/types";

export class Product {
  private readonly id: number;
  private readonly nama: string;
  private readonly harga: number;
  private stok: number;
  private readonly kategoriId: number;
  private readonly gambarUrl: string | null;

  constructor(record: ProductRecord) {
    this.id = record.id;
    this.nama = record.nama;
    this.harga = record.harga;
    this.stok = record.stok;
    this.kategoriId = record.kategori_id;
    this.gambarUrl = record.gambar_url ?? null;
  }

  getId(): number {
    return this.id;
  }

  getName(): string {
    return this.nama;
  }

  getPrice(): number {
    return this.harga;
  }

  getStock(): number {
    return this.stok;
  }

  getCategoryId(): number {
    return this.kategoriId;
  }

  getImageUrl(): string | null {
    return this.gambarUrl;
  }

  reduceStock(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Jumlah produk harus berupa bilangan bulat lebih dari nol.");
    }
    if (this.stok < quantity) {
      throw new Error(`Stok ${this.nama} tidak mencukupi.`);
    }
    this.stok -= quantity;
  }
}

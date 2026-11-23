import type { ProductRecord } from "@/types";

export interface CartItem {
  product: ProductRecord;
  quantity: number;
}

export class Cart {
  private readonly items = new Map<number, CartItem>();

  addItem(product: ProductRecord): void {
    const currentItem = this.items.get(product.id);
    if (currentItem && currentItem.quantity >= product.stok) {
      throw new Error(`Stok ${product.nama} tidak mencukupi.`);
    }
    if (!currentItem && product.stok < 1) {
      throw new Error(`Stok ${product.nama} sedang habis.`);
    }
    this.items.set(product.id, {
      product,
      quantity: (currentItem?.quantity ?? 0) + 1,
    });
  }

  decreaseItem(productId: number): void {
    const currentItem = this.items.get(productId);
    if (!currentItem) return;
    if (currentItem.quantity <= 1) {
      this.items.delete(productId);
      return;
    }
    this.items.set(productId, {
      ...currentItem,
      quantity: currentItem.quantity - 1,
    });
  }

  removeItem(productId: number): void {
    this.items.delete(productId);
  }

  getTotal(): number {
    return this.getItems().reduce(
      (total, item) => total + item.product.harga * item.quantity,
      0,
    );
  }

  getItems(): CartItem[] {
    return Array.from(this.items.values(), (item) => ({
      product: { ...item.product },
      quantity: item.quantity,
    }));
  }

  clear(): void {
    this.items.clear();
  }
}

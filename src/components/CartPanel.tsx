"use client";

import type { CartItem } from "@/models/Cart";
import { formatRupiah } from "@/lib/formatRupiah";

interface CartPanelProps {
  items: CartItem[];
  total: number;
  tableNumber: string;
  paymentMethod: "tunai" | "qris";
  paidAmount: string;
  onTableNumberChange: (value: string) => void;
  onPaymentMethodChange: (value: "tunai" | "qris") => void;
  onPaidAmountChange: (value: string) => void;
  onIncrease: (productId: number) => void;
  onDecrease: (productId: number) => void;
  onRemove: (productId: number) => void;
  onPay: () => void;
  isPaying: boolean;
}

export function CartPanel({
  items,
  total,
  tableNumber,
  paymentMethod,
  paidAmount,
  onTableNumberChange,
  onPaymentMethodChange,
  onPaidAmountChange,
  onIncrease,
  onDecrease,
  onRemove,
  onPay,
  isPaying,
}: CartPanelProps) {
  const change =
    paymentMethod === "tunai" ? Math.max(0, Number(paidAmount || 0) - total) : 0;
  const canPay =
    items.length > 0 &&
    tableNumber.trim().length > 0 &&
    (paymentMethod === "qris" || Number(paidAmount) >= total) &&
    !isPaying;

  return (
    <aside className="rounded-3xl border border-coffee-100 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-coffee-900">Keranjang</h2>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
          {items.reduce((sum, item) => sum + item.quantity, 0)} item
        </span>
      </div>
      <div className="my-4 max-h-64 space-y-3 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-cream p-5 text-center text-sm text-coffee-500">
            Belum ada produk di keranjang.
          </div>
        ) : (
          items.map(({ product, quantity }) => (
            <div key={product.id} className="rounded-2xl bg-cream p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-coffee-900">{product.nama}</p>
                  <p className="mt-1 text-xs text-coffee-500">
                    {formatRupiah(product.harga)} / item
                  </p>
                </div>
                <button
                  aria-label={`Hapus ${product.nama}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                  onClick={() => onRemove(product.id)}
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Hapus
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    aria-label={`Kurangi ${product.nama}`}
                    className="grid size-7 place-items-center rounded-full bg-white font-bold text-coffee-800"
                    onClick={() => onDecrease(product.id)}
                    type="button"
                  >
                    −
                  </button>
                  <span className="min-w-5 text-center text-sm font-bold">{quantity}</span>
                  <button
                    aria-label={`Tambah ${product.nama}`}
                    className="grid size-7 place-items-center rounded-full bg-white font-bold text-coffee-800"
                    onClick={() => onIncrease(product.id)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-bold text-coffee-800">
                  {formatRupiah(product.harga * quantity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="space-y-4 border-t border-coffee-100 pt-4">
        <label className="block text-sm font-semibold text-coffee-800">
          Nomor meja
          <input
            className="field mt-2"
            onChange={(event) => onTableNumberChange(event.target.value)}
            placeholder="Contoh: 05"
            value={tableNumber}
          />
        </label>
        <label className="block text-sm font-semibold text-coffee-800">
          Metode pembayaran
          <select
            className="field mt-2"
            onChange={(event) =>
              onPaymentMethodChange(event.target.value as "tunai" | "qris")
            }
            value={paymentMethod}
          >
            <option value="tunai">Tunai</option>
            <option value="qris">QRIS</option>
          </select>
        </label>
        {paymentMethod === "tunai" && (
          <label className="block text-sm font-semibold text-coffee-800">
            Uang bayar
            <input
              className="field mt-2"
              min="0"
              onChange={(event) => onPaidAmountChange(event.target.value)}
              placeholder="Masukkan jumlah uang"
              type="number"
              value={paidAmount}
            />
          </label>
        )}
        <div className="space-y-2 rounded-2xl bg-coffee-50 p-4">
          <div className="flex justify-between text-sm text-coffee-600">
            <span>Total</span>
            <span className="font-bold text-coffee-900">{formatRupiah(total)}</span>
          </div>
          <div className="flex justify-between text-sm text-coffee-600">
            <span>Kembalian</span>
            <span className="font-bold text-coffee-900">{formatRupiah(change)}</span>
          </div>
        </div>
        <button
          className="w-full rounded-xl bg-orange-600 px-4 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-coffee-200 disabled:text-coffee-500"
          disabled={!canPay}
          onClick={onPay}
          type="button"
        >
          {isPaying ? "Memproses..." : "Bayar pesanan"}
        </button>
      </div>
    </aside>
  );
}

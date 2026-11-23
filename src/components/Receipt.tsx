"use client";

import type { OrderRecord } from "@/types";
import type { CartItem } from "@/models/Cart";
import { formatRupiah } from "@/lib/formatRupiah";
import { Modal } from "@/components/Modal";

interface ReceiptProps {
  order: OrderRecord;
  items: CartItem[];
  onClose: () => void;
  onConfirmReceived: () => void;
  isConfirming: boolean;
}

export function Receipt({
  order,
  items,
  onClose,
  onConfirmReceived,
  isConfirming,
}: ReceiptProps) {
  return (
    <Modal onClose={onClose} title="Pembayaran berhasil">
      <div className="rounded-2xl border border-dashed border-gold bg-page p-5">
        <div className="text-center">
          <p className="font-serif text-xl font-bold text-ink">MLF Caffe</p>
          <p className="mt-1 text-xs text-coffee-500">Struk pembayaran</p>
          <p className="mt-2 text-xs text-coffee-500">
            {new Date(order.dibuat_pada).toLocaleString("id-ID")}
          </p>
        </div>
        <p className="mt-4 rounded-xl bg-brand-soft px-3 py-2 text-center text-xs font-semibold text-brand-red">
          Konfirmasi setelah pesanan selesai dan diterima pelanggan.
        </p>
        <div className="my-4 border-t border-dashed border-coffee-200" />
        <div className="space-y-1 text-sm text-coffee-600">
          <p>Pesanan #{order.id}</p>
          <p>Meja {order.nomor_meja}</p>
          <p>Bayar {order.metode_pembayaran.toUpperCase()}</p>
        </div>
        <div className="my-4 border-t border-dashed border-coffee-200" />
        <div className="space-y-3">
          {items.map(({ product, quantity }) => (
            <div className="flex justify-between gap-3 text-sm" key={product.id}>
              <span className="text-coffee-700">
                {product.nama} × {quantity}
              </span>
              <span className="font-semibold text-coffee-900">
                {formatRupiah(product.harga * quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="my-4 border-t border-dashed border-coffee-200" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between rounded-xl bg-brand-soft px-3 py-2 text-base font-bold text-brand-red">
            <span>Total</span>
            <span>{formatRupiah(order.total)}</span>
          </div>
          <div className="flex justify-between text-coffee-600">
            <span>Bayar</span>
            <span>{formatRupiah(order.bayar)}</span>
          </div>
          <div className="flex justify-between text-coffee-600">
            <span>Kembalian</span>
            <span>{formatRupiah(order.kembalian)}</span>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button className="button-secondary" onClick={onClose} type="button">
          Konfirmasi nanti
        </button>
        <button
          className="button-primary"
          disabled={isConfirming}
          onClick={onConfirmReceived}
          type="button"
        >
          {isConfirming ? "Menyimpan..." : "Selesai & diterima"}
        </button>
      </div>
    </Modal>
  );
}

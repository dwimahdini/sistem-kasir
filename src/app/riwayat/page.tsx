"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah } from "@/lib/formatRupiah";
import { PesananService } from "@/services/PesananService";
import type { OrderWithItems } from "@/types";

const pesananService = new PesananService();

export default function RiwayatPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadOrders() {
    setIsLoading(true);
    setError("");
    try {
      setOrders(await pesananService.getAll());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Riwayat pesanan gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function deleteOrder(order: OrderWithItems) {
    if (!window.confirm(`Hapus pesanan meja ${order.nomor_meja} tanggal ${new Date(order.dibuat_pada).toLocaleString("id-ID")}?`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await pesananService.delete(order.id);
      setSuccess("Pesanan berhasil dihapus.");
      await loadOrders();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Pesanan gagal dihapus.");
    }
  }

  return (
    <div className="space-y-7">
      <section>
        <p className="text-sm font-semibold text-orange-700">Transaksi</p>
        <h1 className="mt-1 text-3xl font-bold text-coffee-900">Riwayat pesanan</h1>
        <p className="mt-2 text-sm text-coffee-500">Daftar transaksi terbaru beserta detail item pesanan.</p>
      </section>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {success && <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">{success}</p>}
      {isLoading ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm text-coffee-500">
          Memuat riwayat pesanan...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-coffee-200 bg-white p-10 text-center">
          <p className="font-semibold text-coffee-800">Belum ada pesanan</p>
          <p className="mt-1 text-sm text-coffee-500">Pesanan yang sudah dibayar akan tampil di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <article className="overflow-hidden rounded-3xl border border-coffee-100 bg-white shadow-sm" key={order.id}>
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <button
                    className="flex flex-1 flex-col items-start gap-1 text-left sm:flex-row sm:items-center sm:gap-6"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    type="button"
                  >
                    <span className="min-w-28">
                      <span className="block text-xs text-coffee-500">Pesanan #{order.id}</span>
                      <span className="mt-1 block font-bold text-coffee-900">Meja {order.nomor_meja}</span>
                    </span>
                    <span className="text-sm text-coffee-600">
                      {new Date(order.dibuat_pada).toLocaleString("id-ID")}
                    </span>
                    <span className="rounded-full bg-coffee-100 px-3 py-1 text-xs font-bold uppercase text-coffee-700">
                      {order.metode_pembayaran}
                    </span>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                      {order.status === "selesai" ? "Selesai & diterima" : "Menunggu konfirmasi"}
                    </span>
                    <span className="font-bold text-coffee-900">{formatRupiah(order.total)}</span>
                    <span className="text-xs font-semibold text-orange-700">
                      {isExpanded ? "Tutup detail" : `${order.detail_pesanan.length} item · Lihat detail`}
                    </span>
                  </button>
                  {profile?.peran === "admin" && (
                    <button
                      className="inline-flex items-center gap-1.5 self-start rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 sm:self-auto"
                      onClick={() => void deleteOrder(order)}
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
                      Hapus pesanan
                    </button>
                  )}
                </div>
                {isExpanded && (
                  <div className="border-t border-coffee-100 bg-cream/60 px-5 py-4">
                    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 text-xs font-bold uppercase tracking-wide text-coffee-500">
                      <span>Produk</span>
                      <span>Jumlah</span>
                      <span>Subtotal</span>
                    </div>
                    {order.detail_pesanan.map((item) => (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-t border-coffee-100 py-3 text-sm" key={item.id}>
                        <span className="font-semibold text-coffee-800">{item.produk?.nama ?? `Produk #${item.produk_id}`}</span>
                        <span className="text-coffee-600">{item.jumlah}</span>
                        <span className="font-semibold text-coffee-800">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex flex-wrap justify-end gap-x-6 gap-y-2 border-t border-coffee-200 pt-3 text-sm text-coffee-600">
                      <span>Bayar: {formatRupiah(order.bayar)}</span>
                      <span>Kembalian: {formatRupiah(order.kembalian)}</span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

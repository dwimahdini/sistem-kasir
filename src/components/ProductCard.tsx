"use client";

import Image from "next/image";
import type { ProductWithCategory } from "@/types";
import { formatRupiah } from "@/lib/formatRupiah";

interface ProductCardProps {
  product: ProductWithCategory;
  onAdd: (product: ProductWithCategory) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const unavailable = product.stok < 1;

  return (
    <article className="group flex min-h-56 flex-col justify-between rounded-3xl border border-coffee-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-coffee-100">
          {product.gambar_url ? (
            <Image
              alt={product.nama}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              src={product.gambar_url}
            />
          ) : (
            <div className="grid size-full place-items-center bg-coffee-100 text-4xl font-bold uppercase text-coffee-600">
              {product.nama.trim().charAt(0) || "?"}
            </div>
          )}
        </div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              unavailable ? "bg-red-50 text-red-700" : "bg-coffee-100 text-coffee-700"
            }`}
          >
            {unavailable ? "Stok habis" : `Stok ${product.stok}`}
          </span>
        </div>
        <p className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-red">
          {product.kategori?.nama ?? "Tanpa kategori"}
        </p>
        <h3 className="mt-1 text-lg font-bold text-coffee-900">{product.nama}</h3>
        <p className="mt-2 font-semibold text-brand-red">{formatRupiah(product.harga)}</p>
      </div>
      <button
        className="mt-5 w-full rounded-xl bg-coffee-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-coffee-700 disabled:cursor-not-allowed disabled:bg-coffee-200 disabled:text-coffee-500"
        disabled={unavailable}
        onClick={() => onAdd(product)}
        type="button"
      >
        Tambah ke keranjang
      </button>
    </article>
  );
}

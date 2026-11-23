"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { ProductForm } from "@/components/ProductForm";
import { formatRupiah } from "@/lib/formatRupiah";
import { KategoriService } from "@/services/KategoriService";
import { ProdukService } from "@/services/ProdukService";
import type { CategoryRecord, ProductInput, ProductRecord, ProductWithCategory } from "@/types";

const produkService = new ProdukService();
const kategoriService = new KategoriService();

export default function ProdukPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setIsLoading(true);
    setError("");
    try {
      const [productRows, categoryRows] = await Promise.all([
        produkService.getAll(),
        kategoriService.getAll(),
      ]);
      setProducts(productRows);
      setCategories(categoryRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Data produk gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function saveProduct(input: ProductInput, imageFile: File | null) {
    if (editingProduct) {
      await produkService.update(editingProduct.id, input, imageFile);
      setSuccess("Produk berhasil diperbarui.");
    } else {
      await produkService.create(input, imageFile);
      setSuccess("Produk berhasil ditambahkan.");
    }
    setEditingProduct(null);
    setIsCreating(false);
    await loadData();
  }

  async function deleteProduct(product: ProductWithCategory) {
    if (!window.confirm(`Hapus produk "${product.nama}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await produkService.delete(product.id);
      setSuccess("Produk berhasil dihapus.");
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Produk gagal dihapus.");
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-orange-700">Pengelolaan menu</p>
          <h1 className="mt-1 text-3xl font-bold text-coffee-900">Produk</h1>
          <p className="mt-2 text-sm text-coffee-500">Atur nama, harga, stok, dan kategori produk.</p>
        </div>
        <button
          className="button-primary self-start sm:self-auto"
          onClick={() => {
            setSuccess("");
            setIsCreating(true);
          }}
          type="button"
        >
          + Tambah produk
        </button>
      </section>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {success && <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">{success}</p>}
      <section className="overflow-hidden rounded-3xl border border-coffee-100 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-coffee-500">Memuat produk...</p>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-coffee-800">Belum ada produk</p>
            <p className="mt-1 text-sm text-coffee-500">Tambahkan produk pertama untuk mulai berjualan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-coffee-50 text-xs uppercase tracking-wide text-coffee-600">
                <tr>
                  <th className="px-5 py-4 font-bold">Gambar</th>
                  <th className="px-5 py-4 font-bold">Nama produk</th>
                  <th className="px-5 py-4 font-bold">Kategori</th>
                  <th className="px-5 py-4 font-bold">Harga</th>
                  <th className="px-5 py-4 font-bold">Stok</th>
                  <th className="px-5 py-4 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {products.map((product) => (
                  <tr className="hover:bg-cream/60" key={product.id}>
                    <td className="px-5 py-3">
                      <div className="relative size-12 overflow-hidden rounded-xl bg-coffee-100">
                        {product.gambar_url && (
                          <Image
                            alt={product.nama}
                            className="object-cover"
                            fill
                            sizes="48px"
                            src={product.gambar_url}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-coffee-900">{product.nama}</td>
                    <td className="px-5 py-4 text-coffee-600">{product.kategori?.nama ?? "—"}</td>
                    <td className="px-5 py-4 text-coffee-700">{formatRupiah(product.harga)}</td>
                    <td className="px-5 py-4 text-coffee-700">{product.stok}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg bg-coffee-100 px-3 py-2 text-xs font-bold text-coffee-800 hover:bg-coffee-200"
                          onClick={() => {
                            setSuccess("");
                            setEditingProduct(product);
                          }}
                          type="button"
                        >
                          Ubah
                        </button>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                          onClick={() => void deleteProduct(product)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {(isCreating || editingProduct) && (
        <Modal
          onClose={() => {
            setIsCreating(false);
            setEditingProduct(null);
          }}
          title={editingProduct ? "Ubah produk" : "Tambah produk"}
        >
          {categories.length === 0 ? (
            <div className="space-y-4">
              <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">
                Tambahkan kategori terlebih dahulu sebelum membuat produk.
              </p>
              <button
                className="button-secondary"
                onClick={() => {
                  setIsCreating(false);
                  setEditingProduct(null);
                }}
                type="button"
              >
                Tutup
              </button>
            </div>
          ) : (
            <ProductForm
              categories={categories}
              onCancel={() => {
                setIsCreating(false);
                setEditingProduct(null);
              }}
              onSubmit={saveProduct}
              product={editingProduct ?? undefined}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

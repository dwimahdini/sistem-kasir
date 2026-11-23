"use client";

import { useEffect, useState } from "react";
import { CategoryForm } from "@/components/CategoryForm";
import { Modal } from "@/components/Modal";
import { KategoriService } from "@/services/KategoriService";
import type { CategoryRecord } from "@/types";

const kategoriService = new KategoriService();

export default function KategoriPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCategories() {
    setIsLoading(true);
    setError("");
    try {
      setCategories(await kategoriService.getAll());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kategori gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function saveCategory(name: string) {
    if (editingCategory) {
      await kategoriService.update(editingCategory.id, name);
      setSuccess("Kategori berhasil diperbarui.");
    } else {
      await kategoriService.create(name);
      setSuccess("Kategori berhasil ditambahkan.");
    }
    setEditingCategory(null);
    setIsCreating(false);
    await loadCategories();
  }

  async function deleteCategory(category: CategoryRecord) {
    if (!window.confirm(`Hapus kategori "${category.nama}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await kategoriService.delete(category.id);
      setSuccess("Kategori berhasil dihapus.");
      await loadCategories();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Kategori gagal dihapus.");
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-orange-700">Pengelolaan menu</p>
          <h1 className="mt-1 text-3xl font-bold text-coffee-900">Kategori</h1>
          <p className="mt-2 text-sm text-coffee-500">Kelompokkan produk agar menu mudah ditelusuri.</p>
        </div>
        <button
          className="button-primary self-start sm:self-auto"
          onClick={() => {
            setSuccess("");
            setIsCreating(true);
          }}
          type="button"
        >
          + Tambah kategori
        </button>
      </section>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {success && <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">{success}</p>}
      <section className="overflow-hidden rounded-3xl border border-coffee-100 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-coffee-500">Memuat kategori...</p>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-coffee-800">Belum ada kategori</p>
            <p className="mt-1 text-sm text-coffee-500">Tambahkan kategori seperti Makanan, Minuman, atau Snack.</p>
          </div>
        ) : (
          <div className="divide-y divide-coffee-100">
            {categories.map((category) => (
              <div className="flex items-center justify-between gap-4 px-5 py-4" key={category.id}>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-700">#</span>
                  <span className="font-semibold text-coffee-900">{category.nama}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg bg-coffee-100 px-3 py-2 text-xs font-bold text-coffee-800 hover:bg-coffee-200"
                    onClick={() => {
                      setSuccess("");
                      setEditingCategory(category);
                    }}
                    type="button"
                  >
                    Ubah
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                    onClick={() => void deleteCategory(category)}
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
              </div>
            ))}
          </div>
        )}
      </section>
      {(isCreating || editingCategory) && (
        <Modal
          onClose={() => {
            setIsCreating(false);
            setEditingCategory(null);
          }}
          title={editingCategory ? "Ubah kategori" : "Tambah kategori"}
        >
          <CategoryForm
            initialName={editingCategory?.nama}
            onCancel={() => {
              setIsCreating(false);
              setEditingCategory(null);
            }}
            onSubmit={saveCategory}
          />
        </Modal>
      )}
    </div>
  );
}

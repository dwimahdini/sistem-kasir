"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { CategoryRecord, ProductInput, ProductRecord } from "@/types";

interface ProductFormProps {
  categories: CategoryRecord[];
  product?: ProductRecord;
  onSubmit: (input: ProductInput, imageFile: File | null) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({
  categories,
  product,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(product?.nama ?? "");
  const [price, setPrice] = useState(String(product?.harga ?? ""));
  const [stock, setStock] = useState(String(product?.stok ?? ""));
  const [categoryId, setCategoryId] = useState(
    String(product?.kategori_id ?? categories[0]?.id ?? ""),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const allowedTypes = new Map([
      ["image/jpeg", [".jpg", ".jpeg"]],
      ["image/png", [".png"]],
      ["image/webp", [".webp"]],
    ]);
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const validExtensions = allowedTypes.get(file.type);
    if (!validExtensions || !validExtensions.includes(extension)) {
      setError("Format gambar tidak didukung. Pilih file JPG, PNG, atau WEBP.");
      event.target.value = "";
      setImageFile(null);
      setPreviewUrl(null);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2 MB. Pilih gambar yang lebih kecil.");
      event.target.value = "";
      setImageFile(null);
      setPreviewUrl(null);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setImageFile(file);
    setPreviewUrl(nextPreviewUrl);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (!name.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Harga tidak boleh negatif.");
      return;
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setError("Stok harus berupa bilangan bulat dan tidak boleh negatif.");
      return;
    }
    if (!categoryId) {
      setError("Pilih kategori produk.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          nama: name.trim(),
          harga: parsedPrice,
          stok: parsedStock,
          kategori_id: Number(categoryId),
          gambar_url: product?.gambar_url ?? null,
        },
        imageFile,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Produk gagal disimpan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold text-coffee-800">
        Nama produk
        <input
          autoFocus
          className="field mt-2"
          onChange={(event) => setName(event.target.value)}
          placeholder="Contoh: Kopi susu gula aren"
          value={name}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-coffee-800">
          Harga (Rp)
          <input
            className="field mt-2"
            min="0"
            onChange={(event) => setPrice(event.target.value)}
            type="number"
            value={price}
          />
        </label>
        <label className="block text-sm font-semibold text-coffee-800">
          Stok
          <input
            className="field mt-2"
            min="0"
            onChange={(event) => setStock(event.target.value)}
            type="number"
            value={stock}
          />
        </label>
      </div>
      <label className="block text-sm font-semibold text-coffee-800">
        Kategori
        <select
          className="field mt-2"
          onChange={(event) => setCategoryId(event.target.value)}
          value={categoryId}
        >
          {categories.length === 0 && <option value="">Belum ada kategori</option>}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nama}
            </option>
          ))}
        </select>
      </label>
      <div>
        <label className="block text-sm font-semibold text-coffee-800" htmlFor="product-image">
          Gambar produk
        </label>
        <input
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="field mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-coffee-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-coffee-800"
          disabled={isSubmitting}
          id="product-image"
          onChange={handleImageChange}
          type="file"
        />
        <p className="mt-1 text-xs text-coffee-500">Format JPG, PNG, atau WEBP. Maksimal 2 MB.</p>
        {(previewUrl || product?.gambar_url) && (
          <div className="mt-3 flex items-center gap-3">
            <div className="relative size-20 overflow-hidden rounded-xl bg-coffee-100">
              <Image
                alt={previewUrl ? "Pratinjau gambar produk baru" : `Gambar ${product?.nama}`}
                className="object-cover"
                fill
                sizes="80px"
                src={previewUrl ?? product?.gambar_url ?? ""}
                unoptimized={Boolean(previewUrl)}
              />
            </div>
            <p className="text-sm text-coffee-600">
              {previewUrl ? "Pratinjau gambar baru" : "Gambar saat ini"}
            </p>
          </div>
        )}
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button className="button-secondary" onClick={onCancel} type="button">
          Batal
        </button>
        <button className="button-primary" disabled={isSubmitting || !categories.length} type="submit">
          {isSubmitting ? "Menyimpan..." : "Simpan produk"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";

interface CategoryFormProps {
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({
  initialName = "",
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Kategori gagal disimpan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold text-coffee-800">
        Nama kategori
        <input
          autoFocus
          className="field mt-2"
          onChange={(event) => setName(event.target.value)}
          placeholder="Contoh: Makanan"
          value={name}
        />
      </label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button className="button-secondary" onClick={onCancel} type="button">
          Batal
        </button>
        <button className="button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Menyimpan..." : "Simpan kategori"}
        </button>
      </div>
    </form>
  );
}

# Caffe & Resto

Aplikasi kasir dan pengelolaan menu menggunakan Next.js App Router, TypeScript, Tailwind CSS, dan Supabase.

## Setup dari awal

1. Pastikan Node.js 20.9 atau lebih baru dan npm tersedia.
2. Dari folder proyek, pasang dependency:

   ```powershell
   npm install
   ```

3. Salin `.env.example` menjadi `.env.local`, lalu isi URL project Supabase dan anon key:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Pastikan tabel `kategori`, `produk`, `pesanan`, `detail_pesanan`, dan `profil` serta kebijakan akses Supabase sudah disiapkan.
5. Untuk fitur konfirmasi pesanan, jalankan isi file `supabase/migrations/20261123_add_pesanan_status.sql` di Supabase SQL Editor. Pesanan lama akan ditandai selesai; pesanan baru menunggu konfirmasi Kasir sebelum muncul di Riwayat.
6. Jalankan aplikasi:

   ```powershell
   npm run dev
   ```

7. Buka `http://localhost:3000`. Halaman awal akan mengarahkan ke `/kasir`.

Perintah `npm run build`, `npm run typecheck`, dan `npm run lint` tersedia untuk validasi.

## Struktur utama

- `src/app`: layout dan halaman Kasir, Produk, Kategori, serta Riwayat.
- `src/components`: komponen antarmuka yang digunakan ulang.
- `src/lib`: client Supabase dan helper format rupiah.
- `src/models`: model domain Product, Cart, dan pembayaran.
- `src/services`: akses data kategori, produk, dan pesanan melalui Supabase.
- `src/types`: tipe data yang mempertahankan nama kolom database.

## Catatan Supabase

Aplikasi menggunakan Supabase Auth dengan peran Admin dan Kasir. Atur Row Level Security/policies di project Supabase supaya operasi tabel yang diperlukan dapat dilakukan, termasuk izin pembaruan status pesanan untuk pengguna berperan Admin atau Kasir. Selain migration status pesanan di atas, skema tabel tidak dibuat atau diubah oleh aplikasi ini. Saat transaksi, stok diperiksa lalu diperbarui dengan kondisi nilai stok sebelumnya untuk mengurangi risiko dua transaksi memakai stok yang sama.

"use client";

import { useEffect, useMemo, useState } from "react";
import { Cart, type CartItem } from "@/models/Cart";
import { CashPayment } from "@/models/CashPayment";
import { QrisPayment } from "@/models/QrisPayment";
import { KategoriService } from "@/services/KategoriService";
import { ProdukService } from "@/services/ProdukService";
import { PesananService } from "@/services/PesananService";
import { formatRupiah } from "@/lib/formatRupiah";
import { CartPanel } from "@/components/CartPanel";
import { ProductCard } from "@/components/ProductCard";
import { Receipt } from "@/components/Receipt";
import { useAuth } from "@/contexts/AuthContext";
import type {
  CategoryRecord,
  OrderRecord,
  ProductWithCategory,
} from "@/types";

const kategoriService = new KategoriService();
const produkService = new ProdukService();
const pesananService = new PesananService();

export default function KasirPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [cart, setCart] = useState(() => new Cart());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"tunai" | "qris">("tunai");
  const [paidAmount, setPaidAmount] = useState("");
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [receiptItems, setReceiptItems] = useState<CartItem[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadMenu() {
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
      setError(loadError instanceof Error ? loadError.message : "Menu gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPendingOrders() {
    setIsLoadingPending(true);
    try {
      setPendingOrders(await pesananService.getPending());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Pesanan tertunda gagal dimuat.",
      );
    } finally {
      setIsLoadingPending(false);
    }
  }

  useEffect(() => {
    void loadMenu();
    void loadPendingOrders();
  }, []);

  const total = useMemo(() => cartItems.reduce(
    (sum, item) => sum + item.product.harga * item.quantity,
    0,
  ), [cartItems]);

  const categoryOptions = useMemo(
    () => [
      ...new Set([
        "Semua",
        "Makanan",
        "Minuman",
        "Snack",
        ...categories.map((category) => category.nama),
      ]),
    ],
    [categories],
  );
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "Semua" || product.kategori?.nama === selectedCategory;
      const matchesSearch =
        !normalizedSearch || product.nama.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  function refreshCart(nextCart: Cart) {
    setCart(nextCart);
    setCartItems(nextCart.getItems());
  }

  function addProduct(product: ProductWithCategory) {
    setNotice("");
    try {
      const nextCart = new Cart();
      cart.getItems().forEach((item) => {
        for (let count = 0; count < item.quantity; count += 1) {
          nextCart.addItem(item.product);
        }
      });
      nextCart.addItem(product);
      refreshCart(nextCart);
    } catch (cartError) {
      setNotice(cartError instanceof Error ? cartError.message : "Produk gagal ditambahkan.");
    }
  }

  function changeQuantity(productId: number, direction: "increase" | "decrease") {
    const nextCart = new Cart();
    cart.getItems().forEach((item) => {
      for (let count = 0; count < item.quantity; count += 1) {
        nextCart.addItem(item.product);
      }
    });
    if (direction === "decrease") {
      nextCart.decreaseItem(productId);
    } else {
      const item = cartItems.find((cartItem) => cartItem.product.id === productId);
      const latestProduct = products.find((product) => product.id === productId);
      if (item && latestProduct) {
        const currentQuantity = item.quantity;
        if (currentQuantity >= latestProduct.stok) {
          setNotice(`Stok ${latestProduct.nama} tidak mencukupi.`);
          return;
        }
        nextCart.addItem(latestProduct);
      }
    }
    refreshCart(nextCart);
  }

  function removeProduct(productId: number) {
    const nextCart = new Cart();
    cart.getItems().forEach((item) => {
      for (let count = 0; count < item.quantity; count += 1) {
        nextCart.addItem(item.product);
      }
    });
    nextCart.removeItem(productId);
    refreshCart(nextCart);
  }

  async function handlePayment() {
    setError("");
    setNotice("");
    if (!tableNumber.trim()) {
      setError("Nomor meja wajib diisi.");
      return;
    }
    const payment = paymentMethod === "tunai" ? new CashPayment() : new QrisPayment();
    const paid = paymentMethod === "tunai" ? Number(paidAmount) : total;
    try {
      payment.process(total, paid);
      setIsPaying(true);
      const createdOrder = await pesananService.create(
        {
          nomor_meja: tableNumber.trim(),
          metode_pembayaran: paymentMethod,
          total,
          bayar: paymentMethod === "qris" ? new QrisPayment().getPaidAmount(total) : paid,
          kembalian: payment.getChange(),
        },
        cartItems,
      );
      setReceiptItems(cartItems);
      setOrder(createdOrder);
      const clearedCart = new Cart();
      refreshCart(clearedCart);
      setPaidAmount("");
      setTableNumber("");
      await Promise.all([loadMenu(), loadPendingOrders()]);
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Pembayaran gagal.");
    } finally {
      setIsPaying(false);
    }
  }

  function closeReceipt() {
    setOrder(null);
    setReceiptItems([]);
  }

  async function confirmOrderReceived(orderId: number) {
    setError("");
    setNotice("");
    setConfirmingOrderId(orderId);
    try {
      await pesananService.updateStatus(orderId, "selesai");
      setNotice("Pesanan selesai dan diterima. Pesanan telah masuk ke Riwayat Admin.");
      if (order?.id === orderId) closeReceipt();
      await loadPendingOrders();
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : "Pesanan gagal dikonfirmasi.",
      );
    } finally {
      setConfirmingOrderId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-brand-red to-brand-deep p-6 text-white shadow-md md:flex-row md:items-end md:p-8">
        <div>
          <p className="font-serif text-lg font-semibold tracking-wide text-white">
            MLF Caffe
          </p>
          <p className="text-sm font-semibold text-orange-200">
            Selamat datang, {profile?.peran === "admin" ? "Admin" : "Kasir"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Kasir</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-coffee-100">
            Pilih menu favorit pelanggan, masukkan nomor meja, lalu selesaikan pembayaran.
          </p>
        </div>
        <div className="rounded-2xl bg-white/10 px-5 py-3">
          <p className="text-xs text-coffee-100">Menu tersedia</p>
          <p className="mt-1 text-2xl font-bold">{products.length}</p>
        </div>
      </section>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{error}</p>
          <button className="font-bold underline" onClick={() => setError("")} type="button">Tutup</button>
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          {notice}
        </div>
      )}

      <section className="rounded-3xl border border-coffee-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-coffee-900">
              Pesanan menunggu konfirmasi
            </h2>
            <p className="mt-1 text-sm text-coffee-500">
              Konfirmasi setelah pesanan diserahkan kepada pelanggan.
            </p>
          </div>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
            {pendingOrders.length}
          </span>
        </div>
        {isLoadingPending ? (
          <p className="rounded-2xl bg-cream p-4 text-center text-sm text-coffee-500">
            Memuat pesanan tertunda...
          </p>
        ) : pendingOrders.length === 0 ? (
          <p className="rounded-2xl bg-cream p-4 text-center text-sm text-coffee-500">
            Tidak ada pesanan yang menunggu konfirmasi.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((pendingOrder) => (
              <div
                className="flex flex-col justify-between gap-3 rounded-2xl bg-cream p-4 sm:flex-row sm:items-center"
                key={pendingOrder.id}
              >
                <div>
                  <p className="font-semibold text-coffee-900">
                    Meja {pendingOrder.nomor_meja} · Pesanan #{pendingOrder.id}
                  </p>
                  <p className="mt-1 text-xs text-coffee-500">
                    {new Date(pendingOrder.dibuat_pada).toLocaleString("id-ID")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-coffee-800">
                    {formatRupiah(pendingOrder.total)}
                  </p>
                </div>
                <button
                  className="button-primary"
                  disabled={confirmingOrderId !== null}
                  onClick={() => void confirmOrderReceived(pendingOrder.id)}
                  type="button"
                >
                  {confirmingOrderId === pendingOrder.id
                    ? "Menyimpan..."
                    : "Selesai & diterima"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-coffee-900">Menu pilihan</h2>
                <p className="mt-1 text-sm text-coffee-500">Cari dan pilih produk untuk pesanan.</p>
              </div>
              <label className="relative block sm:w-64">
                <span className="sr-only">Cari menu</span>
                <input
                  className="field pl-10"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari menu..."
                  value={search}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400">⌕</span>
              </label>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categoryOptions.map((category) => (
                <button
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedCategory === category
                      ? "border border-brand-red bg-brand-red text-white"
                      : "border border-coffee-200 bg-surface text-coffee-700 hover:bg-brand-soft"
                  }`}
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-coffee-500">
              Memuat menu...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-coffee-200 bg-white p-10 text-center">
              <p className="font-semibold text-coffee-800">Menu belum tersedia</p>
              <p className="mt-1 text-sm text-coffee-500">
                {products.length === 0
                  ? "Tambahkan produk dan kategori pada halaman pengelolaan."
                  : "Tidak ada menu yang cocok dengan pencarian ini."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} onAdd={addProduct} product={product} />
              ))}
            </div>
          )}
        </section>
        <CartPanel
          items={cartItems}
          isPaying={isPaying}
          onDecrease={(id) => changeQuantity(id, "decrease")}
          onIncrease={(id) => changeQuantity(id, "increase")}
          onPaidAmountChange={setPaidAmount}
          onPay={() => void handlePayment()}
          onPaymentMethodChange={setPaymentMethod}
          onRemove={removeProduct}
          onTableNumberChange={setTableNumber}
          paidAmount={paidAmount}
          paymentMethod={paymentMethod}
          tableNumber={tableNumber}
          total={total}
        />
      </div>
      <p className="sr-only">Total saat ini {formatRupiah(total)}</p>
      {order && (
        <Receipt
          isConfirming={confirmingOrderId === order.id}
          items={receiptItems}
          onClose={closeReceipt}
          onConfirmReceived={() => void confirmOrderReceived(order.id)}
          order={order}
        />
      )}
    </div>
  );
}

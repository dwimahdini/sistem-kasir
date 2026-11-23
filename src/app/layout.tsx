import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MLF Caffe | Sistem Kasir",
  description: "Aplikasi kasir dan manajemen produk MLF Caffe.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${playfairDisplay.variable}`}>
        <AuthProvider>
          <AuthGuard>
            <Navbar />
            <main className="page-shell py-8 md:py-10">{children}</main>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}

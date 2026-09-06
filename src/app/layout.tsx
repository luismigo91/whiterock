import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Whiterock — Inmuebles de bancos en un solo mapa",
  description: "Agregador exclusivo de inmobiliarias de bancos: Aliseda, Servihabitat, Haya, Altamira/doValue, Solvia, Anticipa, Diglo. Todo en un mapa unificado.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50">{children}</body>
    </html>
  );
}

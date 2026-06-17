import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminFloatingButton from "@/components/AdminFloatingButton";

import { UserProvider } from "@/context/UserProvider";

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
  title: "GameMarket — Маркетплейс игровых товаров",
  description:
    "Покупай и продавай игровые аккаунты, валюту, предметы и услуги.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-white flex flex-col">
        <UserProvider>
          <Navbar />
          {children}
          <Footer />
          <AdminFloatingButton />
        </UserProvider>
      </body>
    </html>
  );
}
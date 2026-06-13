"use client";

import { useState } from "react";
import Link from "next/link";
import AuthButtons from "./AuthButtons";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
          >
            GameMarket
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-sm">
              Главная
            </Link>
            <Link href="/catalog" className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-sm">
              Каталог
            </Link>
            <Link href="/sell" className="px-3 py-2 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800 transition text-sm">
              + Продать
            </Link>
            <Link href="/deals" className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-sm">
              Сделки
            </Link>
            <Link href="/wallet" className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-sm">
              💳
            </Link>
            <Link href="/my-listings" className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-sm">
              Объявления
            </Link>
            <Link href="/favorites" className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-sm">
              ❤️
            </Link>
            <Link href="/messages" className="px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-sm">
              💬
            </Link>
          </nav>

          <div className="hidden md:block">
            <AuthButtons />
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-2xl"
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-6 py-4">
          <nav className="flex flex-col gap-2">
            <Link href="/" onClick={() => setIsOpen(false)} className="px-3 py-3 rounded-lg text-zinc-300 hover:bg-zinc-800 transition">
              Главная
            </Link>
            <Link href="/catalog" onClick={() => setIsOpen(false)} className="px-3 py-3 rounded-lg text-zinc-300 hover:bg-zinc-800 transition">
              Каталог
            </Link>
            <Link href="/sell" onClick={() => setIsOpen(false)} className="px-3 py-3 rounded-lg text-cyan-400 hover:bg-zinc-800 transition">
              + Продать
            </Link>
            <Link href="/deals" onClick={() => setIsOpen(false)} className="px-3 py-3 rounded-lg text-zinc-300 hover:bg-zinc-800 transition">
              Сделки
            </Link>
            <Link href="/wallet" onClick={() => setIsOpen(false)} className="px-3 py-3 rounded-lg text-zinc-300 hover:bg-zinc-800 transition">
              💳 Кошелёк
            </Link>
            <Link href="/my-listings" onClick={() => setIsOpen(false)} className="px-3 py-3 rounded-lg text-zinc-300 hover:bg-zinc-800 transition">
              Мои объявления
            </Link>
            <Link href="/favorites" onClick={() => setIsOpen(false)} className="px-3 py-3 rounded-lg text-zinc-300 hover:bg-zinc-800 transition">
              ❤️ Избранное
            </Link>
            <Link href="/messages" onClick={() => setIsOpen(false)} className="px-3 py-3 rounded-lg text-zinc-300 hover:bg-zinc-800 transition">
              💬 Сообщения
            </Link>
            <Link href="/support" onClick={() => setIsOpen(false)} className="px-3 py-3 rounded-lg text-zinc-300 hover:bg-zinc-800 transition">
              Поддержка
            </Link>

            <div className="pt-4 border-t border-zinc-800">
              <AuthButtons />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
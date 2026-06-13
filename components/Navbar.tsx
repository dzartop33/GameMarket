"use client";

import { useState } from "react";
import Link from "next/link";
import AuthButtons from "./AuthButtons";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/sell", label: "+ Продать", accent: true },
  { href: "/deals", label: "Сделки" },
  { href: "/wallet", label: "💳" },
  { href: "/my-listings", label: "Объявления" },
  { href: "/favorites", label: "❤️" },
  { href: "/messages", label: "💬" },
];

const mobileLinks = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/sell", label: "+ Продать", accent: true },
  { href: "/deals", label: "Сделки" },
  { href: "/wallet", label: "💳 Кошелёк" },
  { href: "/my-listings", label: "Мои объявления" },
  { href: "/favorites", label: "❤️ Избранное" },
  { href: "/messages", label: "💬 Сообщения" },
  { href: "/support", label: "Поддержка" },
];

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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  link.accent
                    ? "text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <AuthButtons />
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-2xl w-10 h-10 flex items-center justify-center"
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-6 py-4">
          <nav className="flex flex-col gap-1">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 rounded-lg transition ${
                  link.accent
                    ? "text-cyan-400 hover:bg-zinc-800"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 mt-2 border-t border-zinc-800">
              <AuthButtons />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
import Link from "next/link";
import AuthButtons from "./AuthButtons";

export default function Navbar() {
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
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              Главная
            </Link>

            <Link
              href="/catalog"
              className="px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              Каталог
            </Link>

            <Link
              href="/sell"
              className="px-4 py-2 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800 transition"
            >
              + Продать
            </Link>

            <Link
              href="/my-listings"
              className="px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              Мои объявления
            </Link>

            <Link
              href="/favorites"
              className="px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              ❤️
            </Link>

            <Link
              href="/sellers"
              className="px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              Продавцы
            </Link>

            <Link
              href="/messages"
              className="px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              💬
            </Link>
          </nav>

          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
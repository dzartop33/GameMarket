import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-2xl font-bold text-cyan-400"
        >
          GameMarket
        </Link>

        <nav className="flex gap-6 text-white">
          <Link href="/">Главная</Link>
          <Link href="/catalog">Каталог</Link>
          <Link href="/sell">Продать</Link>
          <Link href="/login">Вход</Link>
          <Link href="/register">Регистрация</Link>
          <Link href="/profile">Профиль</Link>
        </nav>
      </div>
    </header>
  );
}
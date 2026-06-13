import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              GameMarket
            </h3>

            <p className="text-zinc-400 mt-3 text-sm">
              Безопасный маркетплейс игровых товаров и услуг.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">
              Маркетплейс
            </h4>

            <div className="flex flex-col gap-2 text-zinc-400 text-sm">
              <Link href="/catalog" className="hover:text-white transition">
                Каталог
              </Link>

              <Link href="/sell" className="hover:text-white transition">
                Продать
              </Link>

              <Link href="/sellers" className="hover:text-white transition">
                Продавцы
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">
              Аккаунт
            </h4>

            <div className="flex flex-col gap-2 text-zinc-400 text-sm">
              <Link href="/profile" className="hover:text-white transition">
                Профиль
              </Link>

              <Link href="/my-listings" className="hover:text-white transition">
                Мои объявления
              </Link>

              <Link href="/messages" className="hover:text-white transition">
                Сообщения
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">
              Помощь
            </h4>

            <div className="flex flex-col gap-2 text-zinc-400 text-sm">
              <Link href="/support" className="hover:text-white transition">
                Поддержка
              </Link>

              <Link href="/login" className="hover:text-white transition">
                Вход
              </Link>

              <Link href="/register" className="hover:text-white transition">
                Регистрация
              </Link>
            </div>

            <p className="text-zinc-600 text-xs mt-6">
              © 2026 GameMarket
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
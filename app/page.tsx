import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/products";
import { games } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();
  const latestProducts = products.slice(0, 8);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-cyan-500/10 text-cyan-400 text-sm font-semibold px-4 py-2 rounded-full mb-6">
              🎮 Безопасный маркетплейс игровых товаров
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Покупай и продавай
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {" "}игровые товары
              </span>
            </h1>

            <p className="mt-6 text-zinc-400 text-lg max-w-xl">
              Аккаунты, валюта, бустинг, предметы и игровые услуги
              в одном месте. Быстро, удобно и безопасно.
            </p>

            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                href="/catalog"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-4 rounded-xl font-bold hover:opacity-90 transition"
              >
                Перейти в каталог
              </Link>
              <Link
                href="/sell"
                className="border border-zinc-700 px-8 py-4 rounded-xl hover:border-cyan-500 transition"
              >
                + Продать товар
              </Link>
            </div>

            <div className="flex gap-8 mt-10">
              <div>
                <p className="text-2xl font-bold">{products.length}+</p>
                <p className="text-zinc-500 text-sm">Объявлений</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{games.length}</p>
                <p className="text-zinc-500 text-sm">Игр</p>
              </div>
              <div>
                <p className="text-2xl font-bold">5%</p>
                <p className="text-zinc-500 text-sm">Комиссия</p>
              </div>
              <div>
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-zinc-500 text-sm">Поддержка</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex h-[450px] rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-700/20 border border-cyan-500/20 items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-4">🎮</div>
              <p className="text-cyan-400 font-semibold">GameMarket</p>
              <p className="text-zinc-400 text-sm mt-1">Маркетплейс игровых товаров</p>
            </div>
          </div>
        </div>
      </section>

      {/* Игры */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Популярные игры</h2>
          <Link href="/catalog" className="text-cyan-400 hover:underline text-sm">
            Все игры →
          </Link>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {games.map((game) => (
            <Link
              key={game.name}
              href={`/catalog?game=${encodeURIComponent(game.name)}`}
            >
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center hover:border-cyan-500/50 hover:bg-zinc-900 transition group">
                <div className="relative w-14 h-14 mx-auto mb-2">
                  <Image
                    src={game.image}
                    alt={game.name}
                    fill
                    sizes="56px"
                    className="object-contain rounded-xl group-hover:scale-110 transition-transform"
                  />
                </div>
                <h3 className="font-medium text-xs text-zinc-300">{game.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Последние объявления */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Последние объявления</h2>
          <Link href="/catalog" className="text-cyan-400 hover:underline text-sm">
            Все объявления →
          </Link>
        </div>

        {latestProducts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <p className="text-zinc-400 text-lg">Пока нет объявлений</p>
            <Link
              href="/sell"
              className="inline-block mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-xl font-bold"
            >
              Создать первое
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {latestProducts.map((product: any) => (
              <Link
                key={product.id}
                href={`/listing/${product.id}`}
                prefetch={true}
              >
                <div className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all">
                  <div className="relative h-36 bg-zinc-800">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />
                    )}
                    {product.category && (
                      <span className="absolute top-2 left-2 bg-zinc-900/80 backdrop-blur-sm text-[10px] px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                    )}
                    {product.quantity > 0 && (
                      <span className="absolute top-2 right-2 bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] px-2 py-1 rounded-full">
                        {product.quantity} шт.
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-cyan-400 text-[10px]">{product.game}</p>
                    <h3 className="font-semibold text-sm mt-1 line-clamp-1">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-lg font-bold">{product.price}</p>
                      <p className="text-zinc-500 text-xs truncate max-w-[80px]">
                        {product.seller}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Как это работает */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Как это работает</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "1", icon: "👤", title: "Регистрация", desc: "Создайте аккаунт за 30 секунд" },
            { step: "2", icon: "💳", title: "Пополните баланс", desc: "Переведите через СБП" },
            { step: "3", icon: "🛒", title: "Выберите товар", desc: "Найдите нужное в каталоге" },
            { step: "4", icon: "✅", title: "Получите товар", desc: "Безопасная сделка" },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center hover:border-cyan-500/30 transition"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="text-cyan-400 text-xs font-bold mb-1">ШАГ {item.step}</div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-zinc-400 text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Преимущества */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8">Почему выбирают нас</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-cyan-500/30 transition">
            <div className="text-3xl mb-4">🛡️</div>
            <h3 className="text-lg font-bold">Безопасность</h3>
            <p className="text-zinc-400 mt-2 text-sm">
              Деньги хранятся на балансе сайта до подтверждения получения товара. Система отзывов и рейтингов.
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-cyan-500/30 transition">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-bold">Быстрые сделки</h3>
            <p className="text-zinc-400 mt-2 text-sm">
              Покупка в один клик, мгновенный чат с продавцом, удобное управление сделками.
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-cyan-500/30 transition">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-bold">Низкая комиссия</h3>
            <p className="text-zinc-400 mt-2 text-sm">
              Всего 5% с каждой сделки. Продавайте выгодно и без скрытых платежей.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Готовы начать?
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Зарегистрируйтесь и начните покупать или продавать прямо сейчас
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-4 rounded-xl font-bold hover:opacity-90 transition"
            >
              Создать аккаунт
            </Link>
            <Link
              href="/catalog"
              className="border border-zinc-700 px-8 py-4 rounded-xl hover:border-cyan-500 transition"
            >
              Смотреть каталог
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
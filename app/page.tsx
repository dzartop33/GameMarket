import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/products";
import { games } from "@/lib/games";

export const revalidate = 30;

export default async function Home() {
  const products = await getProducts();
  const latestProducts = products.slice(0, 4);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-cyan-400 font-semibold mb-4">
              Безопасный маркетплейс игровых товаров
            </p>

            <h1 className="text-6xl font-bold leading-tight">
              Покупай и продавай игровые товары
            </h1>

            <p className="mt-6 text-zinc-400 text-lg">
              Аккаунты, валюта, бустинг, предметы и игровые услуги
              в одном месте.
            </p>

            <div className="flex gap-4 mt-10">
              <Link
                href="/catalog"
                className="bg-cyan-500 text-black px-8 py-4 rounded-xl font-bold"
              >
                Перейти в каталог
              </Link>

              <Link
                href="/sell"
                className="border border-zinc-700 px-8 py-4 rounded-xl"
              >
                Продать товар
              </Link>
            </div>
          </div>

          <div className="h-[450px] rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-8xl">
            🎮
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-8">
          Популярные игры
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {games.map((game) => (
            <Link
              key={game.name}
              href={`/catalog?game=${encodeURIComponent(game.name)}`}
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center hover:border-cyan-500 transition">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <Image
                    src={game.image}
                    alt={game.name}
                    fill
                    sizes="64px"
                    className="object-contain rounded-xl"
                  />
                </div>

                <h3 className="font-semibold text-sm">
                  {game.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-8">
          Последние объявления
        </h2>

        {latestProducts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            Пока нет объявлений.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {latestProducts.map((product: any) => (
              <Link
                key={product.id}
                href={`/listing/${product.id}`}
                prefetch={true}
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-cyan-500 transition">
                  <div className="relative h-32 rounded-xl overflow-hidden mb-4 bg-zinc-800">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800" />
                    )}
                  </div>

                  <h3 className="font-semibold">
                    {product.title}
                  </h3>

                  <p className="text-cyan-400 mt-2">
                    {product.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8">
          Почему выбирают нас
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold">
              Безопасность
            </h3>

            <p className="text-zinc-400 mt-3">
              Защита сделок и система рейтингов.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold">
              Быстрые сделки
            </h3>

            <p className="text-zinc-400 mt-3">
              Удобная покупка и продажа товаров.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold">
              Надёжные продавцы
            </h3>

            <p className="text-zinc-400 mt-3">
              Отзывы и рейтинги помогают выбирать лучших.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
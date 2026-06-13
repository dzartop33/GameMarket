"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/lib/categories";
import { games } from "@/lib/games";
import Image from "next/image";

type Product = {
  id: number;
  title: string;
  game: string;
  category?: string;
  price: string;
  seller: string;
  rating?: number;
  image_url?: string;
  status?: string;
};

const ITEMS_PER_PAGE = 12;

export default function CatalogClient({
  products,
}: {
  products: Product[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const [game, setGame] = useState("Все");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const activeProducts = products.filter(
    (p) => !p.status || p.status === "active"
  );

  const filteredProducts = activeProducts.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "Все" || product.category === category;

    const matchesGame =
      game === "Все" || product.game === game;

    return matchesSearch && matchesCategory && matchesGame;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === "newest") return b.id - a.id;
    if (sort === "oldest") return a.id - b.id;

    const priceA = parseFloat(a.price.replace(/[^\d.]/g, "")) || 0;
    const priceB = parseFloat(b.price.replace(/[^\d.]/g, "")) || 0;

    if (sort === "price_asc") return priceA - priceB;
    if (sort === "price_desc") return priceB - priceA;

    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  function changePage(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Поиск товаров..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 p-4 outline-none focus:border-cyan-500 transition"
        />

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 outline-none"
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
        </select>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => {
              setCategory(cat.name);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              category === cat.name
                ? "bg-cyan-500 text-black border-cyan-500"
                : "bg-zinc-900 border-zinc-800 text-white hover:border-zinc-600"
            } transition`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        <button
          onClick={() => {
            setGame("Все");
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg border text-sm ${
            game === "Все"
              ? "bg-cyan-500 text-black border-cyan-500"
              : "bg-zinc-900 border-zinc-800 text-white hover:border-zinc-600"
          } transition`}
        >
          Все игры
        </button>

        {games.map((g) => (
          <button
            key={g.name}
            onClick={() => {
              setGame(g.name);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${
              game === g.name
                ? "bg-cyan-500 text-black border-cyan-500"
                : "bg-zinc-900 border-zinc-800 text-white hover:border-zinc-600"
            } transition`}
          >
            <div className="relative w-4 h-4">
              <Image
                src={g.image}
                alt={g.name}
                fill
                sizes="16px"
                className="object-contain"
              />
            </div>
            {g.name}
          </button>
        ))}
      </div>

      <p className="text-zinc-400 text-sm mb-4">
        Найдено: {sortedProducts.length}
      </p>

      {paginatedProducts.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-400">Ничего не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-zinc-800 disabled:opacity-30"
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
            )
            .map((p, i, arr) => (
              <span key={p} className="flex items-center">
                {i > 0 && arr[i - 1] !== p - 1 && (
                  <span className="px-2 text-zinc-500">...</span>
                )}
                <button
                  onClick={() => changePage(p)}
                  className={`w-10 h-10 rounded-lg ${
                    page === p
                      ? "bg-cyan-500 text-black font-bold"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  } transition`}
                >
                  {p}
                </button>
              </span>
            ))}

          <button
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-zinc-800 disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
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
};

export default function CatalogClient({
  products,
}: {
  products: Product[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const [game, setGame] = useState("Все");

  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "Все" ||
        product.category === category;

      const matchesGame =
        game === "Все" ||
        product.game === game;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesGame
      );
    }
  );

  return (
    <>
      <input
        type="text"
        placeholder="Поиск товаров..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 mb-6"
      />

      <div className="flex gap-3 flex-wrap mb-4">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setCategory(cat.name)}
            className={`px-4 py-2 rounded-xl border ${
              category === cat.name
                ? "bg-cyan-500 text-black border-cyan-500"
                : "bg-zinc-900 border-zinc-800 text-white"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap mb-8">
        <button
          onClick={() => setGame("Все")}
          className={`px-4 py-2 rounded-xl border ${
            game === "Все"
              ? "bg-cyan-500 text-black border-cyan-500"
              : "bg-zinc-900 border-zinc-800 text-white"
          }`}
        >
          Все игры
        </button>

        {games.map((g) => (
          <button
            key={g.name}
            onClick={() => setGame(g.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
              game === g.name
                ? "bg-cyan-500 text-black border-cyan-500"
                : "bg-zinc-900 border-zinc-800 text-white"
            }`}
          >
            <div className="relative w-5 h-5">
              <Image
                src={g.image}
                alt={g.name}
                fill
                className="object-contain"
              />
            </div>

            {g.name}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          Ничего не найдено.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </>
  );
}
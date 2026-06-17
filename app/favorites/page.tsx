"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  title: string;
  game: string;
  price: string;
  image_url?: string | null;
};

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAuth, setNotAuth] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setNotAuth(true);
        setLoading(false);
        return;
      }

      const { data: favs } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", session.user.id);

      if (!favs || favs.length === 0) {
        setLoading(false);
        return;
      }

      const ids = favs.map((f) => f.product_id);

      const { data } = await supabase
        .from("products")
        .select("id, title, game, price, image_url")
        .in("id", ids);

      setProducts(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Ошибка загрузки избранного:", error);
      setLoading(false);
    }
  }

  async function removeFavorite(productId: number) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", session.user.id)
        .eq("product_id", productId);

      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      console.error("Ошибка удаления из избранного:", error);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (notAuth) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Войдите в аккаунт</h1>
          <Link
            href="/login"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-3 rounded-xl font-bold"
          >
            Войти
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Избранное</h1>
        <p className="text-zinc-400 mb-8">{products.length} товаров</p>

        {products.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <p className="text-3xl mb-4">❤️</p>
            <p className="text-zinc-400">Нет избранных товаров</p>
            <Link
              href="/catalog"
              className="inline-block mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-xl font-bold"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id} className="relative group">
                <button
                  onClick={() => removeFavorite(product.id)}
                  className="absolute top-3 right-3 z-10 text-2xl hover:scale-110 transition"
                >
                  ❤️
                </button>
                <Link href={`/listing/${product.id}`}>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition">
                    <div className="relative h-32 bg-zinc-800">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          sizes="25vw"
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-cyan-400 text-xs">{product.game}</p>
                      <h3 className="font-semibold text-sm line-clamp-1 mt-1">
                        {product.title}
                      </h3>
                      <p className="text-lg font-bold mt-2">{product.price}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
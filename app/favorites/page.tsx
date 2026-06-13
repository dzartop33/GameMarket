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

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
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
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
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
            <p className="text-zinc-400">Нет избранных товаров</p>
            <Link href="/catalog" className="inline-block mt-4 text-cyan-400 hover:underline">
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link key={product.id} href={`/listing/${product.id}`}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition">
                  <div className="relative h-32 bg-zinc-800">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.title} fill sizes="25vw" className="object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-1">{product.title}</h3>
                    <p className="text-cyan-400 mt-2 font-bold">{product.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
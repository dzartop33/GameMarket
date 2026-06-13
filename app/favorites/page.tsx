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

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .in("id", ids);

    setProducts(productsData || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-10">
        Загрузка...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Избранное
        </h1>

        {products.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            У вас пока нет избранных товаров.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/listing/${product.id}`}
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition">
                  <div className="relative h-32 bg-zinc-800">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold">
                      {product.title}
                    </h3>

                    <p className="text-cyan-400 mt-2">
                      {product.price}
                    </p>
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
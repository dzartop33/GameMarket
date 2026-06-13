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

export default function MyListingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    setProducts(data || []);
    setLoading(false);
  }

  async function deleteProduct(id: number) {
    const confirmed = confirm("Удалить объявление?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setProducts((prev) =>
      prev.filter((item) => item.id !== id)
    );
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
          Мои объявления
        </h1>

        {products.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            У вас пока нет объявлений.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="relative h-32 rounded-xl overflow-hidden mb-4 bg-zinc-800">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" />
                  )}
                </div>

                <h3 className="font-semibold">
                  {product.title}
                </h3>

                <p className="text-zinc-400 mt-2">
                  {product.game}
                </p>

                <p className="text-cyan-400 mt-3">
                  {product.price}
                </p>

                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/listing/${product.id}`}
                    className="flex-1 bg-cyan-500 text-black text-center py-2 rounded-xl"
                  >
                    Открыть
                  </Link>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="bg-red-500 px-4 rounded-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
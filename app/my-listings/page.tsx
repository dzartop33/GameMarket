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
  status?: string;
  image_url?: string | null;
};

export default function MyListingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAuth, setNotAuth] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setNotAuth(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("products")
        .select("id, title, game, price, status, image_url")
        .eq("user_id", session.user.id)
        .order("id", { ascending: false });

      setProducts(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Ошибка загрузки объявлений:", error);
      setLoading(false);
    }
  }

  async function toggleStatus(id: number, current: string) {
    const newStatus = current === "active" ? "sold" : "active";

    try {
      await supabase.from("products").update({ status: newStatus }).eq("id", id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
    } catch (error) {
      console.error("Ошибка смены статуса:", error);
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm("Удалить объявление?")) return;

    try {
      await supabase.from("products").delete().eq("id", id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Ошибка удаления:", error);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Мои объявления</h1>
            <p className="text-zinc-400 mt-1">{products.length} объявлений</p>
          </div>
          <Link
            href="/sell"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-5 py-3 rounded-xl font-semibold text-sm"
          >
            + Создать
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <p className="text-zinc-400">Нет объявлений</p>
            <Link
              href="/sell"
              className="inline-block mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-xl font-bold"
            >
              Создать первое
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const status = product.status || "active";
              const isSold = status === "sold";

              return (
                <div
                  key={product.id}
                  className={`bg-zinc-900 border rounded-2xl overflow-hidden ${
                    isSold ? "border-red-500/30 opacity-70" : "border-zinc-800"
                  }`}
                >
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
                    {isSold && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          Продано
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-cyan-400 mt-2 font-bold">{product.price}</p>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/listing/${product.id}`}
                        className="flex-1 bg-zinc-800 text-center py-2 rounded-lg text-xs hover:bg-zinc-700 transition"
                      >
                        Открыть
                      </Link>
                      <Link
                        href={`/edit/${product.id}`}
                        className="px-3 py-2 rounded-lg text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => toggleStatus(product.id, status)}
                        className={`px-3 py-2 rounded-lg text-xs ${
                          isSold
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {isSold ? "↩" : "✓"}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="px-3 py-2 rounded-lg text-xs bg-red-500/20 text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
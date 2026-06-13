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

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoading(false);
      return;
    }

    const user = session.user;
    setEmail(user.email || "");

    const [profileResult, productsResult] = await Promise.all([
      supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
      supabase.from("products").select("id, title, game, price, image_url").eq("user_id", user.id).order("id", { ascending: false }),
    ]);

    setUsername(profileResult.data?.username || user.email?.split("@")[0] || "user");
    setProducts(productsResult.data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!email) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Войдите в аккаунт</h1>
          <Link href="/login" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-3 rounded-xl font-bold">Войти</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-black">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{username}</h1>
              <p className="text-zinc-400 mt-1">{email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-zinc-500 text-sm">Объявлений</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-zinc-500 text-sm">Продаж</p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">5.0</p>
              <p className="text-zinc-500 text-sm">Рейтинг</p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Мои объявления</h2>
            <Link href="/sell" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-5 py-3 rounded-xl font-semibold text-sm">+ Создать</Link>
          </div>

          {products.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <p className="text-zinc-400">Нет объявлений</p>
              <Link href="/sell" className="inline-block mt-4 text-cyan-400 hover:underline">Создать первое</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>
    </main>
  );
}
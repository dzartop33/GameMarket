"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getCache, setCache } from "@/lib/cache";
import { ProfileSkeleton, CardGridSkeleton } from "@/components/Skeleton";

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
  const [phase, setPhase] = useState<"loading" | "ready" | "no-auth">("loading");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const cached = getCache("profile");
    if (cached) {
      setUsername(cached.username);
      setEmail(cached.email);
      setProducts(cached.products);
      setPhase("ready");
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      setPhase("no-auth");
      return;
    }

    const user = session.user;
    setEmail(user.email || "");
    setUsername(user.email?.split("@")[0] || "user");
    setPhase("ready");

    const [profileResult, productsResult] = await Promise.all([
      supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
      supabase.from("products").select("id, title, game, price, image_url").eq("user_id", user.id).order("id", { ascending: false }),
    ]);

    const finalUsername = profileResult.data?.username || user.email?.split("@")[0] || "user";
    const finalProducts = productsResult.data || [];

    setUsername(finalUsername);
    setProducts(finalProducts);
    setCache("profile", { username: finalUsername, email: user.email, products: finalProducts });
  }

  if (phase === "loading") return <main className="min-h-screen bg-zinc-950 text-white p-6"><div className="max-w-7xl mx-auto py-12"><ProfileSkeleton /><div className="mt-12"><CardGridSkeleton /></div></div></main>;

  if (phase === "no-auth") {
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
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <Link key={p.id} href={`/listing/${p.id}`}>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition">
                    <div className="relative h-32 bg-zinc-800">
                      {p.image_url ? <Image src={p.image_url} alt={p.title} fill sizes="25vw" className="object-cover" loading="lazy" /> : <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-1">{p.title}</h3>
                      <p className="text-cyan-400 mt-2 font-bold">{p.price}</p>
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
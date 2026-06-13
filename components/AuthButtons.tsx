"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AuthButtons() {
  const [username, setUsername] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setUsername(null);
      setBalance(null);
      setLoaded(true);
      return;
    }

    const user = session.user;

    setUsername(user.email?.split("@")[0] || user.email || null);
    setLoaded(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.username) {
      setUsername(profile.username);
    }

    const { data: balanceData } = await supabase
      .from("balances")
      .select("balance")
      .eq("id", user.id)
      .maybeSingle();

    if (balanceData) {
      setBalance(Number(balanceData.balance));
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (!loaded) {
    return (
      <div className="w-32 h-10 rounded-xl bg-zinc-800 animate-pulse" />
    );
  }

  if (username) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/wallet"
          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-sm"
        >
          💳 {balance !== null ? `${balance.toFixed(0)} ₽` : "..."}
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-black">
            {username.charAt(0).toUpperCase()}
          </div>

          <span className="text-sm max-w-[100px] truncate">
            {username}
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded-xl bg-zinc-800 text-red-400 hover:bg-zinc-700 transition text-sm"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="px-4 py-2 rounded-xl text-zinc-300 hover:text-white transition text-sm"
      >
        Вход
      </Link>

      <Link
        href="/register"
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold hover:opacity-90 transition text-sm"
      >
        Регистрация
      </Link>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCache, setCache, clearCache } from "@/lib/cache";

type AuthCache = {
  username: string | null;
  balance: number | null;
  isAdmin: boolean;
};

export default function AuthButtons() {
  const cached = getCache("auth-user") as AuthCache | null;

  const [username, setUsername] = useState<string | null>(
    cached?.username ?? null
  );
  const [balance, setBalance] = useState<number | null>(
    cached?.balance ?? null
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(
    cached?.isAdmin ?? false
  );
  const [loaded, setLoaded] = useState<boolean>(!!cached);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearCache("auth-user");
        setUsername(null);
        setBalance(null);
        setIsAdmin(false);
        setLoaded(true);
        return;
      }

      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        clearCache("auth-user");
        setUsername(null);
        setBalance(null);
        setIsAdmin(false);
        setLoaded(true);
        return;
      }

      const [profileResult, balanceResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, role")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("balances")
          .select("balance")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      const finalUsername =
        profileResult.data?.username ||
        user.email?.split("@")[0] ||
        "user";

      const finalIsAdmin = profileResult.data?.role === "admin";
      const finalBalance =
        balanceResult.data?.balance !== undefined &&
        balanceResult.data?.balance !== null
          ? Number(balanceResult.data.balance)
          : 0;

      setUsername(finalUsername);
      setBalance(finalBalance);
      setIsAdmin(finalIsAdmin);
      setLoaded(true);

      setCache("auth-user", {
        username: finalUsername,
        balance: finalBalance,
        isAdmin: finalIsAdmin,
      });
    } catch (error) {
      console.error("Ошибка загрузки пользователя:", error);

      const fallback = getCache("auth-user") as AuthCache | null;

      if (fallback) {
        setUsername(fallback.username);
        setBalance(fallback.balance);
        setIsAdmin(fallback.isAdmin);
      }

      setLoaded(true);
    }
  }

  async function handleLogout() {
    clearCache("auth-user");
    clearCache("profile");

    await supabase.auth.signOut();

    setUsername(null);
    setBalance(null);
    setIsAdmin(false);

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
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black ${
              isAdmin
                ? "bg-gradient-to-br from-red-400 to-orange-500"
                : "bg-gradient-to-br from-cyan-400 to-blue-500"
            }`}
          >
            {username.charAt(0).toUpperCase()}
          </div>

          <span className="text-sm max-w-[100px] truncate hidden sm:block">
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
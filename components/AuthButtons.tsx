"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCache, setCache, clearCache } from "@/lib/cache";

type AuthCache = {
  username: string;
  balance: number;
  isAdmin: boolean;
  role: string;
};

export default function AuthButtons() {
  const cached = getCache("auth-user") as AuthCache | null;

  const [username, setUsername] = useState<string | null>(cached?.username ?? null);
  const [balance, setBalance] = useState<number | null>(cached?.balance ?? null);
  const [isAdmin, setIsAdmin] = useState<boolean>(cached?.isAdmin ?? false);
  const [role, setRole] = useState<string>(cached?.role ?? "user");
  const [loaded, setLoaded] = useState<boolean>(!!cached);

  const isLoadingRef = useRef(false);
  const lastLoadRef = useRef(0);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearCache("auth-user");
        clearCache("profile");
        clearCache("user-role");
        setUsername(null);
        setBalance(null);
        setIsAdmin(false);
        setRole("user");
        setLoaded(true);
        return;
      }

      // Не загружаем чаще чем раз в 5 секунд
      const now = Date.now();
      if (now - lastLoadRef.current < 5000) return;

      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
    // Защита от параллельных вызовов
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    lastLoadRef.current = Date.now();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!cached) {
          setUsername(null);
          setBalance(null);
          setIsAdmin(false);
          setRole("user");
        }
        setLoaded(true);
        isLoadingRef.current = false;
        return;
      }

      const user = session.user;

      // Показываем кэш сразу
      if (!loaded && cached) {
        setLoaded(true);
      }

      // Если нет кэша — показываем хоть что-то
      if (!loaded && !cached) {
        setUsername(user.email?.split("@")[0] || "user");
        setLoaded(true);
      }

      const [profileResult, balanceResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, role")
          .eq("id", user.id),
        supabase
          .from("balances")
          .select("balance")
          .eq("id", user.id),
      ]);

      const profile = profileResult.data?.[0];
      const balanceRow = balanceResult.data?.[0];

      const finalUsername =
        profile?.username || user.email?.split("@")[0] || "user";
      const finalRole = profile?.role || "user";
      const finalIsAdmin = finalRole === "admin" || finalRole === "owner";
      const finalBalance =
        balanceRow?.balance !== undefined && balanceRow?.balance !== null
          ? Number(balanceRow.balance)
          : 0;

      setUsername(finalUsername);
      setBalance(finalBalance);
      setIsAdmin(finalIsAdmin);
      setRole(finalRole);
      setLoaded(true);

      setCache("auth-user", {
        username: finalUsername,
        balance: finalBalance,
        isAdmin: finalIsAdmin,
        role: finalRole,
      });
    } catch (error) {
      console.error("Ошибка загрузки пользователя:", error);

      if (cached) {
        setUsername(cached.username);
        setBalance(cached.balance);
        setIsAdmin(cached.isAdmin);
        setRole(cached.role);
      }

      setLoaded(true);
    }

    isLoadingRef.current = false;
  }

  async function handleLogout() {
    clearCache("auth-user");
    clearCache("profile");
    clearCache("user-role");
    await supabase.auth.signOut();
    setUsername(null);
    setBalance(null);
    setIsAdmin(false);
    setRole("user");
    window.location.assign("/");
  }

  if (!loaded) {
    return <div className="w-32 h-10 rounded-xl bg-zinc-800 animate-pulse" />;
  }

  function getAvatarStyle() {
    if (role === "owner") return "bg-gradient-to-br from-yellow-400 to-red-500";
    if (role === "admin") return "bg-gradient-to-br from-red-400 to-orange-500";
    return "bg-gradient-to-br from-cyan-400 to-blue-500";
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
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black ${getAvatarStyle()}`}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm max-w-[100px] truncate hidden sm:block">
            {username}
          </span>
          {role === "owner" && (
            <span className="text-[10px] text-yellow-400">👑</span>
          )}
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
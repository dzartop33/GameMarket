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

      const now = Date.now();
      if (now - lastLoadRef.current < 5000) return;

      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
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

      // Если есть кэш — показываем его сразу, не трогаем
      if (cached) {
        setLoaded(true);
      }

      // Загружаем данные из БД
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

      // Если профиль загрузился — используем его
      if (profile?.username) {
        const finalUsername = profile.username;
        const finalRole = profile.role || "user";
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
      } else if (!cached) {
        // Профиля нет в БД и кэша нет — показываем скелетон пока не создастся
        // Не показываем email!
        setLoaded(false);

        // Пробуем создать профиль
        try {
          await supabase.from("profiles").insert([
            {
              id: user.id,
              username: user.email?.split("@")[0] || "user",
              email: user.email,
              role: "user",
              is_blocked: false,
            },
          ]);

          await supabase.from("balances").insert([
            {
              id: user.id,
              email: user.email,
              balance: 0,
            },
          ]);

          const newUsername = user.email?.split("@")[0] || "user";

          setUsername(newUsername);
          setBalance(0);
          setIsAdmin(false);
          setRole("user");
          setLoaded(true);

          setCache("auth-user", {
            username: newUsername,
            balance: 0,
            isAdmin: false,
            role: "user",
          });
        } catch {
          // Если insert не удался (дубль) — просто показываем email как фоллбэк
          setUsername(user.email?.split("@")[0] || "user");
          setLoaded(true);
        }
      }
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

    setUsername(null);
    setBalance(null);
    setIsAdmin(false);
    setRole("user");

    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject("timeout"), 3000)
      );
      await Promise.race([supabase.auth.signOut(), timeout]);
    } catch {}

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}

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
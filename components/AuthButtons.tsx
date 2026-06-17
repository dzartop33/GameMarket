"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { clearCache } from "@/lib/cache";
import { useUser } from "@/context/UserProvider";

export default function AuthButtons() {
  const { user, loading } = useUser();

  async function handleLogout() {
    clearCache();

    try {
      await supabase.auth.signOut();
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

  if (loading) {
    return (
      <div className="w-32 h-10 rounded-xl bg-zinc-800 animate-pulse" />
    );
  }

  function getAvatarStyle() {
    if (user?.role === "owner") {
      return "bg-gradient-to-br from-yellow-400 to-red-500";
    }

    if (user?.role === "admin") {
      return "bg-gradient-to-br from-red-400 to-orange-500";
    }

    return "bg-gradient-to-br from-cyan-400 to-blue-500";
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/wallet"
          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-sm"
        >
          💳 {user.balance.toFixed(0)} ₽
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black ${getAvatarStyle()}`}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>

          <span className="text-sm max-w-[100px] truncate hidden sm:block">
            {user.username}
          </span>

          {user.role === "owner" && (
            <span className="text-[10px] text-yellow-400">
              👑
            </span>
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
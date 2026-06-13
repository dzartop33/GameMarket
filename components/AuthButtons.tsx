"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AuthButtons() {
  const [username, setUsername] = useState<string | null>(null);
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
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />

          <span className="text-sm max-w-[120px] truncate">
            {username}
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-zinc-800 text-red-400 hover:bg-zinc-700 transition text-sm"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="px-4 py-2 rounded-xl text-zinc-300 hover:text-white transition"
      >
        Вход
      </Link>

      <Link
        href="/register"
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold hover:opacity-90 transition"
      >
        Регистрация
      </Link>
    </div>
  );
}
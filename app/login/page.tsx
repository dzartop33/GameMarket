"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let emailToUse = login;

    if (!login.includes("@")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", login)
        .single();

      if (!profile) {
        alert("Пользователь не найден");
        setLoading(false);
        return;
      }

      emailToUse = profile.email;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            Вход в аккаунт
          </h1>

          <p className="text-zinc-400 mt-2">
            Рады видеть вас снова
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Логин или Email
              </label>

              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Никнейм или email"
                className="w-full p-4 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-cyan-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Пароль
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-cyan-500 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black py-4 rounded-xl font-bold hover:opacity-90 transition"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-zinc-400 text-center">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-cyan-400 hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  );
}
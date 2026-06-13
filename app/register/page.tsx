"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      alert("Введите никнейм");
      return;
    }

    setLoading(true);

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (existingProfile) {
      alert("Такой никнейм уже занят");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    setLoading(false);

    if (loginError) {
      alert(loginError.message);
      return;
    }

    window.location.assign("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            Создать аккаунт
          </h1>

          <p className="text-zinc-400 mt-2">
            Присоединяйтесь к GameMarket
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Никнейм
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ваш никнейм"
                className="w-full p-4 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-cyan-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                placeholder="Минимум 6 символов"
                className="w-full p-4 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-cyan-500 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black py-4 rounded-xl font-bold hover:opacity-90 transition"
            >
              {loading ? "Создание..." : "Создать аккаунт"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-zinc-400 text-center">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="text-cyan-400 hover:underline"
          >
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
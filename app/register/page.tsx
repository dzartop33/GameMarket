"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (signUpError) {
      alert(signUpError.message);
      setLoading(false);
      return;
    }

    const loginResult =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginResult.error) {
      alert(loginResult.error.message);
      setLoading(false);
      return;
    }

    const user = loginResult.data.user;

    if (user) {
      await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email,
          username: username,
        },
      ]);
    }

    setLoading(false);
    router.push("/");
    router.refresh();
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
              {loading ? "Создание..." : "Создать аккаунт"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-zinc-400 text-center">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-cyan-400 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
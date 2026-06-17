"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function ensureUserData(
    userId: string,
    userEmail: string,
    userName: string
  ) {
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId);

      if (!existingProfile || existingProfile.length === 0) {
        await supabase.from("profiles").insert([
          {
            id: userId,
            username: userName,
            email: userEmail,
            role: "user",
            is_blocked: false,
          },
        ]);
      }

      const { data: existingBalance } = await supabase
        .from("balances")
        .select("id")
        .eq("id", userId);

      if (!existingBalance || existingBalance.length === 0) {
        await supabase.from("balances").insert([
          {
            id: userId,
            email: userEmail,
            balance: 0,
          },
        ]);
      }
    } catch (error) {
      console.error("Ошибка создания данных пользователя:", error);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      alert("Введите никнейм");
      return;
    }

    if (cleanUsername.length < 3) {
      alert("Никнейм должен быть не менее 3 символов");
      return;
    }

    setLoading(true);

    // Проверяем занят ли никнейм — только среди реально существующих пользователей
    const { data: takenProfiles } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", cleanUsername);

    if (takenProfiles && takenProfiles.length > 0) {
      // Проверяем что этот пользователь реально существует в auth.users
      const { data: authUser } = await supabase
        .from("balances")
        .select("id")
        .eq("id", takenProfiles[0].id);

      if (authUser && authUser.length > 0) {
        alert("Такой никнейм уже занят");
        setLoading(false);
        return;
      } else {
        // Профиль есть но пользователя нет — удаляем старый профиль
        await supabase
          .from("profiles")
          .delete()
          .eq("username", cleanUsername);
      }
    }

    // Регистрация
    const { error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        alert("Этот email уже зарегистрирован");
      } else {
        alert(signUpError.message);
      }
      setLoading(false);
      return;
    }

    // Входим сразу после регистрации
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (loginError) {
      alert(loginError.message);
      setLoading(false);
      return;
    }

    // Гарантированно создаём profiles и balances
    if (loginData?.user) {
      await ensureUserData(loginData.user.id, cleanEmail, cleanUsername);
    }

    setLoading(false);
    window.location.assign("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Создать аккаунт</h1>
          <p className="text-zinc-400 mt-2">Присоединяйтесь к GameMarket</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <form onSubmit={handleRegister} className="space-y-4">
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
              <label className="block text-sm text-zinc-400 mb-2">Email</label>
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
              <label className="block text-sm text-zinc-400 mb-2">Пароль</label>
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
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black py-4 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
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
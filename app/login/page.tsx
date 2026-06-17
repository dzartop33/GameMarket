"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function ensureUserData(userId: string, userEmail: string) {
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, username, email")
        .eq("id", userId);

      if (!existingProfile || existingProfile.length === 0) {
        await supabase.from("profiles").insert([{
          id: userId,
          username: userEmail.split("@")[0],
          email: userEmail,
          role: "user",
          is_blocked: false,
        }]);
      } else if (!existingProfile[0].email) {
        await supabase
          .from("profiles")
          .update({ email: userEmail })
          .eq("id", userId);
      }

      const { data: existingBalance } = await supabase
        .from("balances")
        .select("id")
        .eq("id", userId);

      if (!existingBalance || existingBalance.length === 0) {
        await supabase.from("balances").insert([{
          id: userId,
          email: userEmail,
          balance: 0,
        }]);
      }
    } catch (error) {
      console.error("Ошибка проверки данных:", error);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const cleanLogin = login.trim();
    let emailToUse = cleanLogin;

    setLoading(true);

    try {
      // Если ввели никнейм
      if (!cleanLogin.includes("@")) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", cleanLogin);

        if (!profiles || profiles.length === 0) {
          alert("Пользователь с таким логином не найден");
          setLoading(false);
          return;
        }

        emailToUse = profiles[0].email;

        if (!emailToUse) {
          alert("У этого аккаунта не привязана почта. Попробуйте войти через email.");
          setLoading(false);
          return;
        }
      }

      // Входим
      const { data: loginData, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          alert("Неверный логин или пароль");
        } else {
          alert(error.message);
        }
        setLoading(false);
        return;
      }

      if (!loginData?.user) {
        alert("Ошибка входа");
        setLoading(false);
        return;
      }

      // Проверяем бан
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_blocked, username")
        .eq("id", loginData.user.id);

      if (profileData?.[0]?.is_blocked) {
        await supabase.auth.signOut();
        alert("❌ Ваш аккаунт заблокирован.\n\nОбратитесь в поддержку: support@gamemarket.ru");
        setLoading(false);
        return;
      }

      // Создаём данные если нет
      await ensureUserData(loginData.user.id, loginData.user.email || emailToUse);

      setLoading(false);
      window.location.assign("/");
    } catch (error) {
      console.error("Ошибка входа:", error);
      alert("Произошла ошибка. Попробуйте снова.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Вход в аккаунт</h1>
          <p className="text-zinc-400 mt-2">Рады видеть вас снова</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-4">
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
              <label className="block text-sm text-zinc-400 mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full p-4 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-cyan-500 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black py-4 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
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
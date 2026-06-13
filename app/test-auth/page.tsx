"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestAuthPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? null);
    }

    loadUser();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">
        Проверка авторизации
      </h1>

      {email ? (
        <p>Вы вошли как: {email}</p>
      ) : (
        <p>Пользователь не авторизован</p>
      )}
    </main>
  );
}
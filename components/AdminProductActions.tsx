"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminProductActions({ productId }: { productId: number }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) return;

        // Используем массив вместо maybeSingle
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id);

        const role = data?.[0]?.role || "user";

        // Показываем и для admin и для owner
        setIsAdmin(role === "admin" || role === "owner");
      } catch {
        setIsAdmin(false);
      }
    }

    check();
  }, []);

  if (!isAdmin) return null;

  async function handleDelete() {
    if (!confirm("Удалить объявление? (Админ)")) return;

    try {
      await supabase.from("products").delete().eq("id", productId);
      window.location.assign("/catalog");
    } catch (error) {
      console.error("Ошибка удаления:", error);
    }
  }

  async function handleHide() {
    try {
      await supabase
        .from("products")
        .update({ is_moderated: false })
        .eq("id", productId);
      alert("Объявление скрыто");
    } catch (error) {
      console.error("Ошибка скрытия:", error);
    }
  }

  async function handleShow() {
    try {
      await supabase
        .from("products")
        .update({ is_moderated: true })
        .eq("id", productId);
      alert("Объявление показано");
    } catch (error) {
      console.error("Ошибка показа:", error);
    }
  }

  return (
    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
      <p className="text-red-400 text-xs font-bold mb-3">⚙️ Действия администратора</p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleShow}
          className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition"
        >
          Показать
        </button>
        <button
          onClick={handleHide}
          className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm hover:bg-yellow-500/30 transition"
        >
          Скрыть
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
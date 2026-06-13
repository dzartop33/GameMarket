"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminProductActions({
  productId,
}: {
  productId: number;
}) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      setIsAdmin(data?.role === "admin");
    }

    check();
  }, []);

  if (!isAdmin) return null;

  async function handleDelete() {
    const confirmed = confirm("Удалить объявление? (Админ)");
    if (!confirmed) return;

    await supabase.from("products").delete().eq("id", productId);
    window.location.assign("/catalog");
  }

  async function handleHide() {
    await supabase
      .from("products")
      .update({ is_moderated: false })
      .eq("id", productId);

    alert("Объявление скрыто");
  }

  return (
    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
      <p className="text-red-400 text-xs font-bold mb-3">👑 Админ</p>

      <div className="flex gap-2">
        <button
          onClick={handleHide}
          className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm"
        >
          Скрыть
        </button>

        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
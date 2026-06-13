"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase";

export default function AdminUserActions({
  sellerId,
  sellerEmail,
}: {
  sellerId: string;
  sellerEmail: string;
}) {
  const { isAdmin, loaded } = useAdmin();

  if (!loaded || !isAdmin) return null;

  async function handleBlock() {
    const confirmed = confirm(
      `Заблокировать пользователя ${sellerEmail}?`
    );

    if (!confirmed) return;

    await supabase
      .from("profiles")
      .update({ is_blocked: true })
      .eq("id", sellerId);

    alert(`Пользователь ${sellerEmail} заблокирован`);
  }

  async function handleUnblock() {
    await supabase
      .from("profiles")
      .update({ is_blocked: false })
      .eq("id", sellerId);

    alert(`Пользователь ${sellerEmail} разблокирован`);
  }

  async function handleMakeAdmin() {
    const confirmed = confirm(
      `Назначить ${sellerEmail} администратором?`
    );

    if (!confirmed) return;

    await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", sellerId);

    alert(`${sellerEmail} теперь администратор`);
  }

  return (
    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
      <p className="text-red-400 text-xs font-bold mb-3">
        👑 Админ-действия
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleBlock}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm"
        >
          Заблокировать
        </button>

        <button
          onClick={handleUnblock}
          className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm"
        >
          Разблокировать
        </button>

        <button
          onClick={handleMakeAdmin}
          className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm"
        >
          Сделать админом
        </button>
      </div>
    </div>
  );
}
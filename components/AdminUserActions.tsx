"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminUserActions({
  sellerId,
  sellerEmail,
}: {
  sellerId: string;
  sellerEmail: string;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [myRole, setMyRole] = useState("user");

  useEffect(() => {
    async function check() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) return;

        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id);

        const role = data?.[0]?.role || "user";
        setMyRole(role);
        setIsAdmin(role === "admin" || role === "owner");
      } catch {
        setIsAdmin(false);
      }
    }

    check();
  }, []);

  if (!isAdmin) return null;

  async function handleBlock() {
    if (!confirm(`Заблокировать пользователя ${sellerEmail}?`)) return;

    try {
      await supabase
        .from("profiles")
        .update({ is_blocked: true })
        .eq("id", sellerId);
      alert(`Пользователь ${sellerEmail} заблокирован`);
    } catch (error) {
      console.error("Ошибка блокировки:", error);
    }
  }

  async function handleUnblock() {
    try {
      await supabase
        .from("profiles")
        .update({ is_blocked: false })
        .eq("id", sellerId);
      alert(`Пользователь ${sellerEmail} разблокирован`);
    } catch (error) {
      console.error("Ошибка разблокировки:", error);
    }
  }

  async function handleMakeAdmin() {
    if (myRole !== "owner") {
      alert("Только владелец может назначать администраторов");
      return;
    }

    if (!confirm(`Назначить ${sellerEmail} администратором?`)) return;

    try {
      await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", sellerId);
      alert(`${sellerEmail} теперь администратор`);
    } catch (error) {
      console.error("Ошибка назначения:", error);
    }
  }

  return (
    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
      <p className="text-red-400 text-xs font-bold mb-3">⚙️ Действия администратора</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleBlock}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition"
        >
          Заблокировать
        </button>
        <button
          onClick={handleUnblock}
          className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition"
        >
          Разблокировать
        </button>
        {myRole === "owner" && (
          <button
            onClick={handleMakeAdmin}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition"
          >
            Сделать админом
          </button>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminFloatingButton() {
  const [role, setRole] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalDeals: 0,
    totalRevenue: 0,
  });
  const [statsLoaded, setStatsLoaded] = useState(false);

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

      const userRole = data?.role || "user";
      if (userRole === "admin" || userRole === "owner") {
        setRole(userRole);
      }
    }

    check();
  }, []);

  async function loadStats() {
    if (statsLoaded) return;

    try {
      const [deposits, withdrawals, users, products, deals] = await Promise.all([
        supabase
          .from("deposit_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("withdrawal_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("balances")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true }),
      ]);

      setStats({
        pendingDeposits: deposits.count || 0,
        pendingWithdrawals: withdrawals.count || 0,
        totalUsers: users.count || 0,
        totalProducts: products.count || 0,
        totalDeals: deals.count || 0,
        totalRevenue: 0,
      });

      // Считаем доход только для owner
      if (role === "owner") {
        const { data: revenueData } = await supabase
          .from("transactions")
          .select("amount")
          .eq("type", "deposit");

        if (revenueData) {
          const total = revenueData.reduce((sum, t) => sum + Number(t.amount), 0);
          setStats((prev) => ({ ...prev, totalRevenue: total }));
        }
      }

      setStatsLoaded(true);
    } catch {}
  }

  function handleToggle() {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      loadStats();
    }
  }

  if (!role) return null;

  const isOwner = role === "owner";
  const totalPending = stats.pendingDeposits + stats.pendingWithdrawals;

  return (
    <>
      {/* Затемнение фона */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Меню */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Заголовок */}
          <div
            className={`p-4 ${
              isOwner
                ? "bg-gradient-to-r from-yellow-500/20 to-red-500/20 border-b border-yellow-500/20"
                : "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/20"
            }`}
          >
            <p className="font-bold text-sm">
              {isOwner ? "👑 Панель владельца" : "⚙️ Панель админа"}
            </p>
          </div>

          {/* Быстрая статистика */}
          <div className="p-3 border-b border-zinc-800">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{stats.totalUsers}</p>
                <p className="text-zinc-500 text-[10px]">Пользователи</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{stats.totalProducts}</p>
                <p className="text-zinc-500 text-[10px]">Объявления</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{stats.totalDeals}</p>
                <p className="text-zinc-500 text-[10px]">Сделки</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-yellow-400">
                  {totalPending}
                </p>
                <p className="text-zinc-500 text-[10px]">Ожидают</p>
              </div>
            </div>
          </div>

          {/* Общие кнопки (для admin и owner) */}
          <div className="p-2">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider px-2 py-1">
              Управление
            </p>

            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>⚙️</span>
              <span>Админ-панель</span>
              {totalPending > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {totalPending}
                </span>
              )}
            </Link>

            <Link
              href="/admin?tab=deposits"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>💰</span>
              <span>Заявки на пополнение</span>
              {stats.pendingDeposits > 0 && (
                <span className="ml-auto bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {stats.pendingDeposits}
                </span>
              )}
            </Link>

            <Link
              href="/admin?tab=withdrawals"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>💸</span>
              <span>Заявки на вывод</span>
              {stats.pendingWithdrawals > 0 && (
                <span className="ml-auto bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {stats.pendingWithdrawals}
                </span>
              )}
            </Link>

            <Link
              href="/admin?tab=users"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>👥</span>
              <span>Пользователи</span>
            </Link>

            <Link
              href="/admin?tab=products"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>📦</span>
              <span>Объявления</span>
            </Link>

            <Link
              href="/admin?tab=deals"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>🤝</span>
              <span>Сделки</span>
            </Link>
          </div>

          {/* Только для owner */}
          {isOwner && (
            <div className="p-2 border-t border-yellow-500/20">
              <p className="text-yellow-500 text-[10px] uppercase tracking-wider px-2 py-1">
                👑 Только владелец
              </p>

              <Link
                href="/admin?tab=balance"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-500/10 transition text-sm"
              >
                <span>💳</span>
                <span>Ручное пополнение</span>
              </Link>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm">
                <span>💵</span>
                <span>Доход площадки</span>
                <span className="ml-auto text-green-400 font-bold text-sm">
                  {stats.totalRevenue.toFixed(0)} ₽
                </span>
              </div>

              <Link
                href="/admin?tab=users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-500/10 transition text-sm"
              >
                <span>🛡️</span>
                <span>Управление админами</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Кнопка */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${
          isOwner
            ? "bg-gradient-to-br from-yellow-400 to-red-500 shadow-yellow-500/30"
            : "bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/30"
        }`}
      >
        <span className="text-2xl">{isOwner ? "👑" : "⚙️"}</span>

        {/* Счётчик pending */}
        {totalPending > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse font-bold">
            {totalPending}
          </span>
        )}
      </button>
    </>
  );
}
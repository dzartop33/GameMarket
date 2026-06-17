"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCache, setCache, clearCache } from "@/lib/cache";

type Role = "user" | "admin" | "owner" | null;

// Читаем роль из кэша ВНЕ компонента — до рендера
function getRoleFromCache(): Role {
  try {
    return (getCache("user-role") as Role) || null;
  } catch {
    return null;
  }
}

function getStatsFromCache() {
  try {
    return (
      getCache("admin-stats") || {
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        totalUsers: 0,
        totalProducts: 0,
        totalDeals: 0,
        totalRevenue: 0,
      }
    );
  } catch {
    return {
      pendingDeposits: 0,
      pendingWithdrawals: 0,
      totalUsers: 0,
      totalProducts: 0,
      totalDeals: 0,
      totalRevenue: 0,
    };
  }
}

export default function AdminFloatingButton() {
  const [role, setRole] = useState<Role>(getRoleFromCache);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState(getStatsFromCache);
  const [statsLoaded, setStatsLoaded] = useState(!!getCache("admin-stats"));
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Если роли нет в кэше — загружаем в фоне
    if (!role) {
      loadRoleBackground();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearCache("user-role");
        clearCache("admin-stats");
        setRole(null);
        setIsOpen(false);
        setStats({
          pendingDeposits: 0,
          pendingWithdrawals: 0,
          totalUsers: 0,
          totalProducts: 0,
          totalDeals: 0,
          totalRevenue: 0,
        });
        setStatsLoaded(false);
        return;
      }
      if (event === "SIGNED_IN") {
        loadRoleBackground();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadRoleBackground() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setRole(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id);

      const foundRole = (data?.[0]?.role as Role) || "user";

      if (foundRole === "admin" || foundRole === "owner") {
        startTransition(() => {
          setRole(foundRole);
        });
        setCache("user-role", foundRole);
      } else {
        setRole(null);
      }
    } catch {
      setRole(null);
    }
  }

  async function loadStats() {
    if (statsLoaded) return;

    try {
      const [deposits, withdrawals, users, products, deals] =
        await Promise.all([
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

      let totalRevenue = 0;

      if (role === "owner") {
        try {
          const { data: revenueData } = await supabase
            .from("transactions")
            .select("amount")
            .eq("type", "deposit");

          if (revenueData) {
            totalRevenue = revenueData.reduce(
              (sum, item) => sum + Number(item.amount || 0),
              0
            );
          }
        } catch {}
      }

      const newStats = {
        pendingDeposits: deposits.count || 0,
        pendingWithdrawals: withdrawals.count || 0,
        totalUsers: users.count || 0,
        totalProducts: products.count || 0,
        totalDeals: deals.count || 0,
        totalRevenue,
      };

      startTransition(() => {
        setStats(newStats);
        setStatsLoaded(true);
      });

      setCache("admin-stats", newStats);
    } catch {}
  }

  function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next) loadStats();
  }

  if (!role) return null;

  const isOwner = role === "owner";
  const totalPending = stats.pendingDeposits + stats.pendingWithdrawals;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-72 max-h-[70vh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
          {/* Заголовок */}
          <div
            className={`p-4 sticky top-0 z-10 bg-zinc-900 ${
              isOwner
                ? "border-b border-yellow-500/20"
                : "border-b border-red-500/20"
            }`}
          >
            <p className="font-bold text-sm">
              {isOwner ? "👑 Панель владельца" : "⚙️ Панель администратора"}
            </p>
          </div>

          {/* Статистика */}
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

          {/* Кнопки — показываются мгновенно */}
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
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>💰</span>
              <span>Пополнения</span>
              {stats.pendingDeposits > 0 && (
                <span className="ml-auto bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {stats.pendingDeposits}
                </span>
              )}
            </Link>

            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>💸</span>
              <span>Выводы</span>
              {stats.pendingWithdrawals > 0 && (
                <span className="ml-auto bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {stats.pendingWithdrawals}
                </span>
              )}
            </Link>

            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>👥</span>
              <span>Пользователи</span>
            </Link>

            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition text-sm"
            >
              <span>📦</span>
              <span>Объявления</span>
            </Link>

            <Link
              href="/admin"
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
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-500/10 transition text-sm"
              >
                <span>🛡️</span>
                <span>Управление админами</span>
              </Link>

              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-500/10 transition text-sm"
              >
                <span>💳</span>
                <span>Ручное пополнение</span>
              </Link>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm">
                <span>💵</span>
                <span>Доход площадки</span>
                <span className="ml-auto text-green-400 font-bold">
                  {stats.totalRevenue.toFixed(0)} ₽
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Кнопка */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${
          isOwner
            ? "bg-gradient-to-br from-yellow-400 to-red-500 shadow-yellow-500/30"
            : "bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/30"
        }`}
      >
        <span className="text-2xl">{isOwner ? "👑" : "⚙️"}</span>

        {totalPending > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse font-bold">
            {totalPending}
          </span>
        )}
      </button>
    </>
  );
}
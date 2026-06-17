"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type UserData = {
  id: string;
  email: string;
  balance: number;
  username?: string;
  is_blocked?: boolean;
  role?: string;
};

type DepositRequest = {
  id: number;
  user_id: string;
  user_email: string;
  amount: number;
  status: string;
  payment_method: string;
  comment: string;
  created_at: string;
};

type WithdrawalRequest = {
  id: number;
  user_id: string;
  user_email: string;
  amount: number;
  method: string;
  requisites: string;
  status: string;
  comment: string;
  created_at: string;
};

type Product = {
  id: number;
  title: string;
  seller: string;
  price: string;
  status: string;
  is_moderated: boolean;
};

type Deal = {
  id: number;
  product_title: string;
  buyer_email: string;
  seller_email: string;
  price: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const [tab, setTab] = useState("deposits");
  const [isAdmin, setIsAdmin] = useState(false);
  const [myRole, setMyRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  const [users, setUsers] = useState<UserData[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tabLoaded, setTabLoaded] = useState<Record<string, boolean>>({});

  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [newAlert, setNewAlert] = useState("");

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    checkAdmin();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isAdmin && !tabLoaded[tab]) {
      loadTab(tab);
    }
  }, [tab, isAdmin]);

  async function checkAdmin() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    const role = data?.role || "user";

    if (role !== "admin" && role !== "owner") {
      setLoading(false);
      return;
    }

    setMyRole(role);
    setIsAdmin(true);
    setLoading(false);
    subscribeToRealtime();
  }

  function subscribeToRealtime() {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deposit_requests" },
        (payload) => {
          const newDeposit = payload.new as DepositRequest;
          setDeposits((prev) => [newDeposit, ...prev]);
          showAlert(`💰 Новая заявка: ${newDeposit.amount} ₽ от ${newDeposit.user_email}`);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deposit_requests" },
        (payload) => {
          const updated = payload.new as DepositRequest;
          setDeposits((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "withdrawal_requests" },
        (payload) => {
          const newW = payload.new as WithdrawalRequest;
          setWithdrawals((prev) => [newW, ...prev]);
          showAlert(`💸 Новая заявка на вывод: ${newW.amount} ₽ от ${newW.user_email}`);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "withdrawal_requests" },
        (payload) => {
          const updated = payload.new as WithdrawalRequest;
          setWithdrawals((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "products" },
        (payload) => {
          setProducts((prev) => [payload.new as Product, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "products" },
        (payload) => {
          const deleted = payload.old as Product;
          setProducts((prev) => prev.filter((p) => p.id !== deleted.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deals" },
        (payload) => {
          const newDeal = payload.new as Deal;
          setDeals((prev) => [newDeal, ...prev]);
          showAlert(`🤝 Новая сделка: ${newDeal.product_title}`);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deals" },
        (payload) => {
          const updated = payload.new as Deal;
          setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        }
      )
      .subscribe();

    channelRef.current = channel;
  }

  function showAlert(message: string) {
    setNewAlert(message);
    setTimeout(() => setNewAlert(""), 5000);
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkZeYl5GJfXFkV0xDPDk5PUNLVWBqdH+IkJaZmZeTi4F2amBWTkdCPz9DR01WYGp0f4iQlpmZk4uBdmhfVU5HQj9AQ0dOV2FrdYCJkZaZmZOKgXZoX1VOR0I/QENHUF5p");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }

  async function loadTab(tabName: string) {
    setTabLoading(true);

    if (tabName === "deposits") {
      const { data } = await supabase
        .from("deposit_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setDeposits(data || []);
    }

    if (tabName === "withdrawals") {
      const { data } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setWithdrawals(data || []);
    }

    if (tabName === "users" || tabName === "balance") {
      const [b, p] = await Promise.all([
        supabase.from("balances").select("*").order("email"),
        supabase.from("profiles").select("id, username, is_blocked, role"),
      ]);

      setUsers(
        (b.data || []).map((u) => {
          const prof = p.data?.find((x) => x.id === u.id);
          return {
            ...u,
            username: prof?.username || "",
            is_blocked: prof?.is_blocked || false,
            role: prof?.role || "user",
          };
        })
      );
    }

    if (tabName === "products") {
      const { data } = await supabase
        .from("products")
        .select("id, title, seller, price, status, is_moderated")
        .order("id", { ascending: false })
        .limit(50);
      setProducts(data || []);
    }

    if (tabName === "deals") {
      const { data } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setDeals(data || []);
    }

    setTabLoaded((prev) => ({ ...prev, [tabName]: true }));
    setTabLoading(false);
  }

  async function approveDeposit(deposit: DepositRequest) {
    setActionLoading(deposit.id);
    const netAmount = deposit.amount * 0.9;
    const { data: balanceData } = await supabase
      .from("balances").select("balance").eq("id", deposit.user_id).single();
    const currentBalance = balanceData ? Number(balanceData.balance) : 0;

    await Promise.all([
      supabase.from("deposit_requests").update({ status: "approved" }).eq("id", deposit.id),
      supabase.from("balances").update({ balance: currentBalance + netAmount }).eq("id", deposit.user_id),
      supabase.from("transactions").insert([{
        user_id: deposit.user_id, type: "deposit", amount: netAmount,
        description: `СБП (${deposit.amount} ₽ → ${netAmount.toFixed(2)} ₽)`,
      }]),
    ]);

    setDeposits((prev) => prev.map((d) => d.id === deposit.id ? { ...d, status: "approved" } : d));
    setActionLoading(null);
  }

  async function rejectDeposit(id: number, reason: string) {
    setActionLoading(id);
    await supabase.from("deposit_requests").update({ status: "rejected", comment: reason }).eq("id", id);
    setDeposits((prev) => prev.map((d) => d.id === id ? { ...d, status: "rejected", comment: reason } : d));
    setActionLoading(null);
  }

  async function approveWithdrawal(withdrawal: WithdrawalRequest) {
    setActionLoading(withdrawal.id);
    await supabase.from("withdrawal_requests")
      .update({ status: "approved", comment: "Средства отправлены" }).eq("id", withdrawal.id);
    setWithdrawals((prev) => prev.map((w) => w.id === withdrawal.id ? { ...w, status: "approved" } : w));
    setActionLoading(null);
  }

  async function rejectWithdrawal(withdrawal: WithdrawalRequest) {
    setActionLoading(withdrawal.id);
    const { data: balanceData } = await supabase
      .from("balances").select("balance").eq("id", withdrawal.user_id).single();
    const currentBalance = balanceData ? Number(balanceData.balance) : 0;

    await Promise.all([
      supabase.from("withdrawal_requests")
        .update({ status: "rejected", comment: "Отклонено администратором" }).eq("id", withdrawal.id),
      supabase.from("balances").update({ balance: currentBalance + withdrawal.amount }).eq("id", withdrawal.user_id),
      supabase.from("transactions").insert([{
        user_id: withdrawal.user_id, type: "refund", amount: withdrawal.amount,
        description: `Возврат за отклонённый вывод #${withdrawal.id}`,
      }]),
    ]);

    setWithdrawals((prev) => prev.map((w) => w.id === withdrawal.id ? { ...w, status: "rejected" } : w));
    setActionLoading(null);
  }

  async function addBalance() {
    if (!selectedUser || !amount) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    const user = users.find((u) => u.id === selectedUser);
    if (!user) return;

    await Promise.all([
      supabase.from("balances").update({ balance: user.balance + amountNum }).eq("id", selectedUser),
      supabase.from("transactions").insert([{
        user_id: selectedUser, type: "deposit", amount: amountNum, description: "Пополнение администратором",
      }]),
    ]);

    setUsers((prev) => prev.map((u) => u.id === selectedUser ? { ...u, balance: u.balance + amountNum } : u));
    setAmount("");
  }

  function canManageUser(targetRole: string) {
    if (myRole === "owner") return targetRole !== "owner";
    if (myRole === "admin") return targetRole === "user";
    return false;
  }

  async function toggleBlock(userId: string, blocked: boolean, targetRole: string) {
    if (!canManageUser(targetRole)) {
      alert("У вас нет прав для этого действия");
      return;
    }
    await supabase.from("profiles").update({ is_blocked: !blocked }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_blocked: !blocked } : u));
  }

  async function toggleRole(userId: string, currentRole: string) {
    if (myRole !== "owner") {
      alert("Только владелец может менять роли");
      return;
    }
    if (currentRole === "owner") {
      alert("Нельзя изменить роль владельца");
      return;
    }

    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(newRole === "admin" ? "Назначить админом?" : "Снять админа?")) return;

    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  }

  async function toggleModeration(id: number, current: boolean) {
    await supabase.from("products").update({ is_moderated: !current }).eq("id", id);
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_moderated: !current } : p));
  }

  async function deleteProduct(id: number) {
    if (!confirm("Удалить?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <h1 className="text-3xl font-bold">Доступ запрещён</h1>
      </main>
    );
  }

  const tabs = [
    { id: "deposits", label: "💰 Заявки" },
    { id: "withdrawals", label: "💸 Выводы" },
    { id: "users", label: "👥 Пользователи" },
    { id: "products", label: "📦 Объявления" },
    { id: "deals", label: "🤝 Сделки" },
    { id: "balance", label: "💳 Баланс" },
  ];

  const pendingDeposits = deposits.filter((d) => d.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").length;

  function getRoleBadge(role: string) {
    if (role === "owner") return <span className="text-yellow-400 text-xs ml-2">👑 Владелец</span>;
    if (role === "admin") return <span className="text-cyan-400 text-xs ml-2">[Админ]</span>;
    return null;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {newAlert && (
          <div className="fixed top-4 right-4 z-50 bg-cyan-500 text-black px-6 py-4 rounded-2xl shadow-lg shadow-cyan-500/20 animate-bounce max-w-sm">
            <p className="font-bold text-sm">{newAlert}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Админ-панель</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Роль: {myRole === "owner" ? "👑 Владелец" : "⚙️ Администратор"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs">Live</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold relative ${
                tab === t.id ? "bg-cyan-500 text-black" : "bg-zinc-800 hover:bg-zinc-700"
              } transition`}
            >
              {t.label}
              {t.id === "deposits" && pendingDeposits > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {pendingDeposits}
                </span>
              )}
              {t.id === "withdrawals" && pendingWithdrawals > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {pendingWithdrawals}
                </span>
              )}
            </button>
          ))}
        </div>

        {tabLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === "deposits" && (
              <div className="space-y-3">
                {deposits.length === 0 ? (
                  <p className="text-zinc-400">Заявок нет</p>
                ) : (
                  deposits.map((dep) => (
                    <div
                      key={dep.id}
                      className={`bg-zinc-900 border rounded-xl p-4 flex flex-col gap-4 ${
                        dep.status === "pending" ? "border-yellow-500/30" : "border-zinc-800"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold">{dep.user_email}</p>
                          <p className="text-zinc-400 text-sm">
                            {dep.amount.toFixed(2)} ₽ → {(dep.amount * 0.9).toFixed(2)} ₽
                          </p>
                          <p className="text-zinc-500 text-xs">
                            #{dep.id} · {new Date(dep.created_at).toLocaleString("ru")}
                          </p>
                          {dep.comment && (
                            <p className="text-cyan-400 text-xs mt-1">{dep.comment}</p>
                          )}
                        </div>
                        {dep.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => approveDeposit(dep)} disabled={actionLoading === dep.id}
                              className="bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 whitespace-nowrap">
                              {actionLoading === dep.id ? "..." : "✓ Подтвердить"}
                            </button>
                            <button onClick={() => rejectDeposit(dep.id, "❌ Сумма не совпадает")} disabled={actionLoading === dep.id}
                              className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-lg text-sm disabled:opacity-50 whitespace-nowrap">
                              💰 Сумма не совпадает
                            </button>
                            <button onClick={() => rejectDeposit(dep.id, "❌ Комментарий не указан")} disabled={actionLoading === dep.id}
                              className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg text-sm disabled:opacity-50 whitespace-nowrap">
                              💬 Нет комментария
                            </button>
                            <button onClick={() => rejectDeposit(dep.id, "❌ Отклонено администратором")} disabled={actionLoading === dep.id}
                              className="bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm disabled:opacity-50 whitespace-nowrap">
                              ✕ Отклонить
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm">
                            {dep.status === "approved" ? "✅ Одобрено" : "❌ Отклонено"}
                          </span>
                        )}
                      </div>
                      {dep.status === "pending" && (
                        <div className="bg-zinc-800/50 rounded-xl p-3 text-xs text-zinc-400 space-y-1">
                          <p>📋 <span className="text-white font-medium">Что проверить:</span></p>
                          <p>1. Сумма: <span className="text-cyan-400 font-bold">{dep.amount.toFixed(2)} ₽</span></p>
                          <p>2. Комментарий: <span className="text-cyan-400 font-bold">GameMarket ID{dep.id}</span></p>
                          <p>3. Отправитель: <span className="text-cyan-400 font-bold">{dep.user_email}</span></p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "withdrawals" && (
              <div className="space-y-3">
                {withdrawals.length === 0 ? (
                  <p className="text-zinc-400">Заявок на вывод нет</p>
                ) : (
                  withdrawals.map((w) => (
                    <div key={w.id}
                      className={`bg-zinc-900 border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        w.status === "pending" ? "border-yellow-500/30" : "border-zinc-800"
                      }`}>
                      <div>
                        <p className="font-bold">{w.user_email}</p>
                        <p className="text-lg font-bold text-cyan-400">{w.amount} ₽</p>
                        <p className="text-zinc-400 text-sm">{w.method} · {w.requisites}</p>
                        <p className="text-zinc-500 text-xs">#{w.id} · {new Date(w.created_at).toLocaleString("ru")}</p>
                        {w.comment && <p className="text-cyan-400 text-xs mt-1">{w.comment}</p>}
                      </div>
                      <div className="flex gap-2">
                        {w.status === "pending" ? (
                          <>
                            <button onClick={() => approveWithdrawal(w)} disabled={actionLoading === w.id}
                              className="bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                              {actionLoading === w.id ? "..." : "✓ Отправлено"}
                            </button>
                            <button onClick={() => rejectWithdrawal(w)} disabled={actionLoading === w.id}
                              className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                              ✕ Отклонить
                            </button>
                          </>
                        ) : (
                          <span className="text-sm">{w.status === "approved" ? "✅" : "❌"}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "users" && (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id}
                    className={`bg-zinc-900 border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      user.is_blocked ? "border-red-500/30"
                      : user.role === "owner" ? "border-yellow-500/30"
                      : "border-zinc-800"
                    }`}>
                    <div>
                      <p className="font-bold">
                        {user.username || user.email}
                        {getRoleBadge(user.role || "user")}
                        {user.is_blocked && <span className="text-red-400 text-xs ml-2">[Бан]</span>}
                      </p>
                      <p className="text-zinc-500 text-xs">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold mr-2">{user.balance.toFixed(2)} ₽</p>

                      {/* Кнопка роли — только для owner */}
                      {myRole === "owner" && user.role !== "owner" && (
                        <button
                          onClick={() => toggleRole(user.id, user.role || "user")}
                          className={`px-3 py-1 rounded-lg text-xs ${
                            user.role === "admin"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-cyan-500/20 text-cyan-400"
                          }`}
                        >
                          {user.role === "admin" ? "Снять админа" : "Сделать админом"}
                        </button>
                      )}

                      {user.role === "owner" && (
                        <span className="px-3 py-1 rounded-lg text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          👑 Защищён
                        </span>
                      )}

                      {/* Кнопка бана */}
                      {canManageUser(user.role || "user") && (
                        <button
                          onClick={() => toggleBlock(user.id, !!user.is_blocked, user.role || "user")}
                          className={`px-3 py-1 rounded-lg text-xs ${
                            user.is_blocked
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {user.is_blocked ? "Разбан" : "Бан"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "products" && (
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{p.title}</p>
                      <p className="text-zinc-500 text-xs">{p.seller} · {p.price}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleModeration(p.id, p.is_moderated)}
                        className={`px-3 py-1 rounded-lg text-xs ${
                          p.is_moderated ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                        }`}>
                        {p.is_moderated ? "Скрыть" : "Показать"}
                      </button>
                      <button onClick={() => deleteProduct(p.id)}
                        className="px-3 py-1 rounded-lg text-xs bg-red-500/20 text-red-400">
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "deals" && (
              <div className="space-y-3">
                {deals.length === 0 ? (
                  <p className="text-zinc-400">Сделок нет</p>
                ) : (
                  deals.map((d) => (
                    <div key={d.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold">{d.product_title}</p>
                        <p className="text-zinc-500 text-xs">{d.buyer_email} → {d.seller_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{d.price}</p>
                        <p className="text-xs">{d.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "balance" && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Пополнить вручную</h2>
                <div className="flex flex-col md:flex-row gap-3">
                  <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                    <option value="">Выберите</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.email} ({u.balance.toFixed(2)} ₽)</option>
                    ))}
                  </select>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="Сумма" className="w-40 bg-zinc-800 border border-zinc-700 rounded-xl p-4" />
                  <button onClick={addBalance}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-4 rounded-xl font-bold">
                    +
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
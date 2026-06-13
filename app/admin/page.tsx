"use client";

import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserData[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tabLoaded, setTabLoaded] = useState<Record<string, boolean>>({});

  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    checkAdmin();
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  }

  async function loadTab(tabName: string) {
    if (tabName === "deposits") {
      const { data } = await supabase
        .from("deposit_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setDeposits(data || []);
    }

    if (tabName === "users" || tabName === "balance") {
      const [balancesResult, profilesResult] = await Promise.all([
        supabase.from("balances").select("*").order("email"),
        supabase.from("profiles").select("id, username, is_blocked, role"),
      ]);

      const merged = (balancesResult.data || []).map((u) => {
        const profile = profilesResult.data?.find((p) => p.id === u.id);
        return {
          ...u,
          username: profile?.username || "",
          is_blocked: profile?.is_blocked || false,
          role: profile?.role || "user",
        };
      });

      setUsers(merged);
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
  }

  async function approveDeposit(deposit: DepositRequest) {
    const netAmount = deposit.amount * 0.90;

    await supabase
      .from("deposit_requests")
      .update({ status: "approved" })
      .eq("id", deposit.id);

    const { data: balanceData } = await supabase
      .from("balances")
      .select("balance")
      .eq("id", deposit.user_id)
      .single();

    const currentBalance = balanceData ? Number(balanceData.balance) : 0;

    await Promise.all([
      supabase
        .from("balances")
        .update({ balance: currentBalance + netAmount })
        .eq("id", deposit.user_id),
      supabase.from("transactions").insert([
        {
          user_id: deposit.user_id,
          type: "deposit",
          amount: netAmount,
          description: `Пополнение СБП (внесено ${deposit.amount} ₽, зачислено ${netAmount.toFixed(2)} ₽)`,
        },
      ]),
    ]);

    alert(`Зачислено ${netAmount.toFixed(2)} ₽`);
    setTabLoaded((prev) => ({ ...prev, deposits: false }));
    loadTab("deposits");
  }

  async function rejectDeposit(id: number) {
    await supabase
      .from("deposit_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    setTabLoaded((prev) => ({ ...prev, deposits: false }));
    loadTab("deposits");
  }

  async function addBalance() {
    if (!selectedUser || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const user = users.find((u) => u.id === selectedUser);
    if (!user) return;

    await Promise.all([
      supabase
        .from("balances")
        .update({ balance: user.balance + amountNum })
        .eq("id", selectedUser),
      supabase.from("transactions").insert([
        {
          user_id: selectedUser,
          type: "deposit",
          amount: amountNum,
          description: "Пополнение администратором",
        },
      ]),
    ]);

    setAmount("");
    setTabLoaded((prev) => ({ ...prev, balance: false, users: false }));
    loadTab("balance");
  }

  async function toggleBlock(userId: string, blocked: boolean) {
    await supabase
      .from("profiles")
      .update({ is_blocked: !blocked })
      .eq("id", userId);

    setTabLoaded((prev) => ({ ...prev, users: false }));
    loadTab("users");
  }

  async function toggleRole(userId: string, role: string) {
    const newRole = role === "admin" ? "user" : "admin";
    const confirmed = confirm(
      newRole === "admin"
        ? "Назначить администратором?"
        : "Снять права администратора?"
    );

    if (!confirmed) return;

    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    setTabLoaded((prev) => ({ ...prev, users: false }));
    loadTab("users");
  }

  async function toggleModeration(id: number, current: boolean) {
    await supabase
      .from("products")
      .update({ is_moderated: !current })
      .eq("id", id);

    setTabLoaded((prev) => ({ ...prev, products: false }));
    loadTab("products");
  }

  async function deleteProduct(id: number) {
    if (!confirm("Удалить?")) return;

    await supabase.from("products").delete().eq("id", id);

    setTabLoaded((prev) => ({ ...prev, products: false }));
    loadTab("products");
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
    { id: "users", label: "👥 Пользователи" },
    { id: "products", label: "📦 Объявления" },
    { id: "deals", label: "🤝 Сделки" },
    { id: "balance", label: "💳 Баланс" },
  ];

  const pendingCount = deposits.filter((d) => d.status === "pending").length;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Админ-панель</h1>

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
              {t.id === "deposits" && pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {!tabLoaded[tab] ? (
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
                    <div key={dep.id} className={`bg-zinc-900 border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${dep.status === "pending" ? "border-yellow-500/30" : "border-zinc-800"}`}>
                      <div>
                        <p className="font-bold">{dep.user_email}</p>
                        <p className="text-zinc-400 text-sm">
                          {dep.amount.toFixed(2)} ₽ → {(dep.amount * 0.9).toFixed(2)} ₽
                        </p>
                        <p className="text-zinc-500 text-xs">#{dep.id} · {new Date(dep.created_at).toLocaleString("ru")}</p>
                        {dep.comment && <p className="text-cyan-400 text-xs mt-1">{dep.comment}</p>}
                      </div>
                      <div className="flex gap-2">
                        {dep.status === "pending" ? (
                          <>
                            <button onClick={() => approveDeposit(dep)} className="bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-bold">✓</button>
                            <button onClick={() => rejectDeposit(dep.id)} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">✕</button>
                          </>
                        ) : (
                          <span className="text-sm">{dep.status === "approved" ? "✅" : "❌"}</span>
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
                  <div key={user.id} className={`bg-zinc-900 border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${user.is_blocked ? "border-red-500/30" : "border-zinc-800"}`}>
                    <div>
                      <p className="font-bold">
                        {user.username || user.email}
                        {user.role === "admin" && <span className="text-cyan-400 text-xs ml-2">[Админ]</span>}
                        {user.is_blocked && <span className="text-red-400 text-xs ml-2">[Бан]</span>}
                      </p>
                      <p className="text-zinc-500 text-xs">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold mr-2">{user.balance.toFixed(2)} ₽</p>
                      <button onClick={() => toggleRole(user.id, user.role || "user")} className={`px-3 py-1 rounded-lg text-xs ${user.role === "admin" ? "bg-yellow-500/20 text-yellow-400" : "bg-cyan-500/20 text-cyan-400"}`}>
                        {user.role === "admin" ? "Снять" : "Админ"}
                      </button>
                      <button onClick={() => toggleBlock(user.id, !!user.is_blocked)} className={`px-3 py-1 rounded-lg text-xs ${user.is_blocked ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {user.is_blocked ? "Разбан" : "Бан"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "products" && (
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{product.title}</p>
                      <p className="text-zinc-500 text-xs">{product.seller} · {product.price}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleModeration(product.id, product.is_moderated)} className={`px-3 py-1 rounded-lg text-xs ${product.is_moderated ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                        {product.is_moderated ? "Скрыть" : "Показать"}
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="px-3 py-1 rounded-lg text-xs bg-red-500/20 text-red-400">Удалить</button>
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
                  deals.map((deal) => (
                    <div key={deal.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold">{deal.product_title}</p>
                        <p className="text-zinc-500 text-xs">{deal.buyer_email} → {deal.seller_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{deal.price}</p>
                        <p className="text-xs">{deal.status}</p>
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
                  <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                    <option value="">Выберите пользователя</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.email} ({user.balance.toFixed(2)} ₽)</option>
                    ))}
                  </select>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Сумма" className="w-40 bg-zinc-800 border border-zinc-700 rounded-xl p-4" />
                  <button onClick={addBalance} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-4 rounded-xl font-bold">Пополнить</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
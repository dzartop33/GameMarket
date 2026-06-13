"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserData = {
  id: string;
  email: string;
  balance: number;
  username?: string;
  is_blocked?: boolean;
};

type DepositRequest = {
  id: number;
  user_id: string;
  user_email: string;
  amount: number;
  status: string;
  payment_method: string;
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

const ADMIN_EMAILS = ["dzartop22@gmail.com"];

export default function AdminPage() {
  const [tab, setTab] = useState("deposits");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserData[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user || !ADMIN_EMAILS.includes(session.user.email || "")) {
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    await loadAll();
    setLoading(false);
  }

  async function loadAll() {
    const { data: usersData } = await supabase
      .from("balances")
      .select("*")
      .order("email");

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, is_blocked");

    const merged = (usersData || []).map((u) => {
      const profile = profilesData?.find((p) => p.id === u.id);
      return {
        ...u,
        username: profile?.username || "",
        is_blocked: profile?.is_blocked || false,
      };
    });

    setUsers(merged);

    const { data: depositsData } = await supabase
      .from("deposit_requests")
      .select("*")
      .order("created_at", { ascending: false });

    setDeposits(depositsData || []);

    const { data: productsData } = await supabase
      .from("products")
      .select("id, title, seller, price, status, is_moderated")
      .order("id", { ascending: false })
      .limit(50);

    setProducts(productsData || []);

    const { data: dealsData } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    setDeals(dealsData || []);
  }

  async function approveDeposit(deposit: DepositRequest) {
    await supabase
      .from("deposit_requests")
      .update({ status: "approved" })
      .eq("id", deposit.id);

    const user = users.find((u) => u.id === deposit.user_id);
    const currentBalance = user ? user.balance : 0;

    await supabase
      .from("balances")
      .update({ balance: currentBalance + deposit.amount })
      .eq("id", deposit.user_id);

    await supabase.from("transactions").insert([
      {
        user_id: deposit.user_id,
        type: "deposit",
        amount: deposit.amount,
        description: `Пополнение (${deposit.payment_method})`,
      },
    ]);

    loadAll();
  }

  async function rejectDeposit(id: number) {
    await supabase
      .from("deposit_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    loadAll();
  }

  async function addBalance() {
    if (!selectedUser || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const user = users.find((u) => u.id === selectedUser);
    if (!user) return;

    await supabase
      .from("balances")
      .update({ balance: user.balance + amountNum })
      .eq("id", selectedUser);

    await supabase.from("transactions").insert([
      {
        user_id: selectedUser,
        type: "deposit",
        amount: amountNum,
        description: "Пополнение администратором",
      },
    ]);

    setAmount("");
    loadAll();
  }

  async function toggleBlock(userId: string, currentlyBlocked: boolean) {
    await supabase
      .from("profiles")
      .update({ is_blocked: !currentlyBlocked })
      .eq("id", userId);

    loadAll();
  }

  async function toggleModeration(productId: number, current: boolean) {
    await supabase
      .from("products")
      .update({ is_moderated: !current })
      .eq("id", productId);

    loadAll();
  }

  async function deleteProduct(id: number) {
    const confirmed = confirm("Удалить объявление?");
    if (!confirmed) return;

    await supabase.from("products").delete().eq("id", id);
    loadAll();
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Админ-панель
        </h1>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                tab === t.id
                  ? "bg-cyan-500 text-black"
                  : "bg-zinc-800 hover:bg-zinc-700"
              } transition`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "deposits" && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold mb-4">
              Заявки на пополнение ({deposits.filter((d) => d.status === "pending").length} ожидает)
            </h2>

            {deposits.map((dep) => (
              <div
                key={dep.id}
                className={`bg-zinc-900 border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  dep.status === "pending" ? "border-yellow-500/30" : "border-zinc-800"
                }`}
              >
                <div>
                  <p className="font-bold">{dep.user_email}</p>
                  <p className="text-zinc-400 text-sm">
                    {dep.amount.toFixed(2)} ₽ · {dep.payment_method} ·{" "}
                    {new Date(dep.created_at).toLocaleString("ru")}
                  </p>
                </div>

                <div className="flex gap-2">
                  {dep.status === "pending" ? (
                    <>
                      <button
                        onClick={() => approveDeposit(dep)}
                        className="bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-bold"
                      >
                        ✓ Одобрить
                      </button>
                      <button
                        onClick={() => rejectDeposit(dep.id)}
                        className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm"
                      >
                        ✕ Отклонить
                      </button>
                    </>
                  ) : (
                    <span className="text-sm">
                      {dep.status === "approved" ? "✅ Одобрено" : "❌ Отклонено"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold mb-4">
              Пользователи ({users.length})
            </h2>

            {users.map((user) => (
              <div
                key={user.id}
                className={`bg-zinc-900 border rounded-xl p-4 flex items-center justify-between ${
                  user.is_blocked ? "border-red-500/30" : "border-zinc-800"
                }`}
              >
                <div>
                  <p className="font-bold">
                    {user.username || user.email}
                    {user.is_blocked && (
                      <span className="text-red-400 text-xs ml-2">
                        [Заблокирован]
                      </span>
                    )}
                  </p>
                  <p className="text-zinc-500 text-xs">{user.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-bold">{user.balance.toFixed(2)} ₽</p>

                  <button
                    onClick={() => toggleBlock(user.id, !!user.is_blocked)}
                    className={`px-3 py-1 rounded-lg text-xs ${
                      user.is_blocked
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {user.is_blocked ? "Разблокировать" : "Заблокировать"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "products" && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold mb-4">
              Объявления ({products.length})
            </h2>

            {products.map((product) => (
              <div
                key={product.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold">{product.title}</p>
                  <p className="text-zinc-500 text-xs">
                    {product.seller} · {product.price} · {product.status || "active"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleModeration(product.id, product.is_moderated)}
                    className={`px-3 py-1 rounded-lg text-xs ${
                      product.is_moderated
                        ? "bg-red-500/20 text-red-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {product.is_moderated ? "Скрыть" : "Показать"}
                  </button>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="px-3 py-1 rounded-lg text-xs bg-red-500/20 text-red-400"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "deals" && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold mb-4">
              Сделки ({deals.length})
            </h2>

            {deals.map((deal) => (
              <div
                key={deal.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{deal.product_title}</p>
                    <p className="text-zinc-500 text-xs">
                      {deal.buyer_email} → {deal.seller_email}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">{deal.price}</p>
                    <p className="text-xs">{deal.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "balance" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">
              Пополнить баланс вручную
            </h2>

            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-4"
              >
                <option value="">Выберите пользователя</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} ({user.balance.toFixed(2)} ₽)
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Сумма"
                className="w-40 bg-zinc-800 border border-zinc-700 rounded-xl p-4"
              />

              <button
                onClick={addBalance}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-4 rounded-xl font-bold"
              >
                Пополнить
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
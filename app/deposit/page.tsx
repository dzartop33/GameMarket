"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DepositRequest = {
  id: number;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  pending: "⏳ Ожидает",
  approved: "✅ Одобрено",
  rejected: "❌ Отклонено",
};

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [requests, setRequests] = useState<DepositRequest[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    const { data: balanceData } = await supabase
      .from("balances")
      .select("balance")
      .eq("id", session.user.id)
      .maybeSingle();

    if (balanceData) {
      setBalance(Number(balanceData.balance));
    }

    const { data: requestsData } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setRequests(requestsData || []);
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum < 100) {
      alert("Минимальная сумма пополнения: 100 ₽");
      return;
    }

    if (amountNum > 100000) {
      alert("Максимальная сумма пополнения: 100 000 ₽");
      return;
    }

    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      alert("Необходимо войти в аккаунт");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("deposit_requests")
      .insert([
        {
          user_id: session.user.id,
          user_email: session.user.email,
          amount: amountNum,
          payment_method: method,
          status: "pending",
        },
      ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setAmount("");
    loadData();
    alert("Заявка на пополнение создана. Ожидайте подтверждения.");
  }

  const presets = [100, 500, 1000, 2500, 5000, 10000];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">
          Пополнение баланса
        </h1>

        <p className="text-zinc-400 mb-8">
          Текущий баланс: {balance.toFixed(2)} ₽
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <form onSubmit={handleDeposit} className="space-y-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Сумма пополнения
              </label>

              <div className="flex flex-wrap gap-2 mb-3">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className={`px-4 py-2 rounded-xl border text-sm ${
                      amount === preset.toString()
                        ? "bg-cyan-500 text-black border-cyan-500"
                        : "bg-zinc-800 border-zinc-700 hover:border-zinc-500"
                    } transition`}
                  >
                    {preset} ₽
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Или введите сумму"
                min="100"
                max="100000"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Способ оплаты
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={`p-4 rounded-xl border text-left ${
                    method === "card"
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-zinc-700 bg-zinc-800"
                  } transition`}
                >
                  <p className="font-bold">💳 Банковская карта</p>
                  <p className="text-zinc-400 text-xs mt-1">
                    Visa, Mastercard, МИР
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("sbp")}
                  className={`p-4 rounded-xl border text-left ${
                    method === "sbp"
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-zinc-700 bg-zinc-800"
                  } transition`}
                >
                  <p className="font-bold">🏦 СБП</p>
                  <p className="text-zinc-400 text-xs mt-1">
                    Перевод по номеру
                  </p>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black py-4 rounded-xl font-bold"
            >
              {loading ? "Отправка..." : "Создать заявку на пополнение"}
            </button>

            <p className="text-zinc-500 text-xs text-center">
              После создания заявки администратор подтвердит платёж
            </p>
          </form>
        </div>

        <h2 className="text-xl font-bold mb-4">
          История заявок
        </h2>

        {requests.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-400">Заявок пока нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {req.amount.toFixed(2)} ₽
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {req.payment_method === "card" ? "💳 Карта" : "🏦 СБП"}
                    {" · "}
                    {new Date(req.created_at).toLocaleString("ru")}
                  </p>
                </div>

                <span className="text-sm">
                  {statusLabels[req.status] || req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
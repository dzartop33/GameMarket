"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
};

const typeLabels: Record<string, string> = {
  deposit: "💰 Пополнение",
  withdrawal: "💸 Вывод",
  purchase: "🛒 Покупка",
  sale: "💵 Продажа",
  refund: "↩️ Возврат",
};

const typeColors: Record<string, string> = {
  deposit: "text-green-400",
  withdrawal: "text-red-400",
  purchase: "text-red-400",
  sale: "text-green-400",
  refund: "text-yellow-400",
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoading(false);
      return;
    }

    const [balanceResult, txResult] = await Promise.all([
      supabase.from("balances").select("balance").eq("id", session.user.id).maybeSingle(),
      supabase.from("transactions").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(50),
    ]);

    if (balanceResult.data) setBalance(Number(balanceResult.data.balance));
    setTransactions(txResult.data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Кошелёк</h1>

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 mb-8">
          <p className="text-zinc-400">Ваш баланс</p>
          <p className="text-5xl font-bold mt-2">{balance.toFixed(2)} ₽</p>
          <div className="flex gap-3 mt-6">
            <Link href="/deposit" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-xl font-bold">
              Пополнить
            </Link>
            <button className="border border-zinc-700 px-6 py-3 rounded-xl hover:border-cyan-500 transition">
              Вывести
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">История операций</h2>

        {transactions.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-400">Операций нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{typeLabels[tx.type] || tx.type}</p>
                  <p className="text-zinc-400 text-xs mt-1">{tx.description}</p>
                  <p className="text-zinc-500 text-xs mt-1">{new Date(tx.created_at).toLocaleString("ru")}</p>
                </div>
                <p className={`text-lg font-bold ${typeColors[tx.type] || "text-white"}`}>
                  {tx.type === "purchase" || tx.type === "withdrawal" ? "-" : "+"}
                  {tx.amount.toFixed(2)} ₽
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
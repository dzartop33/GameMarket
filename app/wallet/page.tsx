"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Transaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
};

type WithdrawalRequest = {
  id: number;
  amount: number;
  method: string;
  requisites: string;
  status: string;
  comment: string;
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

const statusLabels: Record<string, string> = {
  pending: "⏳ На рассмотрении",
  approved: "✅ Выполнено",
  rejected: "❌ Отклонено",
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawRequisites, setWithdrawRequisites] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("СБП");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadWallet();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  async function loadWallet() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      userIdRef.current = session.user.id;

      const [balanceResult, txResult, withdrawResult] = await Promise.all([
        supabase
          .from("balances")
          .select("balance")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("withdrawal_requests")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (balanceResult.data) setBalance(Number(balanceResult.data.balance));
      setTransactions(txResult.data || []);
      setWithdrawals(withdrawResult.data || []);

      const pending = (withdrawResult.data || []).find(
        (w) => w.status === "pending"
      );
      setHasPendingWithdrawal(!!pending);

      subscribeToUpdates(session.user.id);
      setLoading(false);
    } catch (err) {
      console.error("Ошибка загрузки кошелька:", err);
      setError(true);
      setLoading(false);
    }
  }

  function subscribeToUpdates(userId: string) {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("wallet-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "withdrawal_requests",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const updated = payload.new as WithdrawalRequest;

          setWithdrawals((prev) =>
            prev.map((w) => (w.id === updated.id ? updated : w))
          );

          if (updated.status === "approved") {
            setHasPendingWithdrawal(false);
            setJustCompleted(true);
            setTimeout(() => setJustCompleted(false), 5000);
          }

          if (updated.status === "rejected") {
            setHasPendingWithdrawal(false);

            try {
              const { data: balanceData } = await supabase
                .from("balances")
                .select("balance")
                .eq("id", userId)
                .maybeSingle();

              if (balanceData) setBalance(Number(balanceData.balance));
            } catch {}
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();

    const amountNum = parseFloat(withdrawAmount);

    if (isNaN(amountNum) || amountNum < 100) {
      alert("Минимальная сумма вывода: 100 ₽");
      return;
    }

    if (amountNum > balance) {
      alert("Недостаточно средств на балансе");
      return;
    }

    if (!withdrawRequisites.trim()) {
      alert("Укажите реквизиты для вывода");
      return;
    }

    setWithdrawLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("Необходимо войти в аккаунт");
        setWithdrawLoading(false);
        return;
      }

      const { data: existingPending } = await supabase
        .from("withdrawal_requests")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingPending) {
        alert("У вас уже есть активная заявка на вывод");
        setWithdrawLoading(false);
        return;
      }

      const newBalance = balance - amountNum;

      const { error: balanceError } = await supabase
        .from("balances")
        .update({ balance: newBalance })
        .eq("id", session.user.id);

      if (balanceError) {
        alert("Ошибка при списании баланса");
        setWithdrawLoading(false);
        return;
      }

      const { error } = await supabase.from("withdrawal_requests").insert([
        {
          user_id: session.user.id,
          user_email: session.user.email,
          amount: amountNum,
          method: withdrawMethod,
          requisites: withdrawRequisites.trim(),
          status: "pending",
        },
      ]);

      await supabase.from("transactions").insert([
        {
          user_id: session.user.id,
          type: "withdrawal",
          amount: amountNum,
          description: `Вывод ${amountNum} ₽ (${withdrawMethod})`,
        },
      ]);

      setWithdrawLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      setBalance(newBalance);
      setShowWithdraw(false);
      setWithdrawAmount("");
      setWithdrawRequisites("");
      setHasPendingWithdrawal(true);

      alert("Заявка на вывод создана! Средства будут отправлены после проверки.");
      loadWallet();
    } catch (err) {
      console.error("Ошибка вывода:", err);
      alert("Произошла ошибка. Попробуйте позже.");
      setWithdrawLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Ошибка загрузки</p>
          <button
            onClick={() => {
              setError(false);
              setLoading(true);
              loadWallet();
            }}
            className="bg-cyan-500 text-black px-6 py-3 rounded-xl font-bold"
          >
            Попробовать снова
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Кошелёк</h1>

        {justCompleted && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center animate-pulse">
            <p className="text-green-400 text-xl font-bold">✅ Вывод выполнен!</p>
            <p className="text-green-400/70 text-sm mt-2">
              Средства отправлены на ваши реквизиты
            </p>
          </div>
        )}

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 mb-8">
          <p className="text-zinc-400">Ваш баланс</p>
          <p className="text-5xl font-bold mt-2">{balance.toFixed(2)} ₽</p>

          <div className="flex gap-3 mt-6">
            <Link
              href="/deposit"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              Пополнить
            </Link>

            <button
              onClick={() => setShowWithdraw(!showWithdraw)}
              disabled={hasPendingWithdrawal}
              className={`border px-6 py-3 rounded-xl transition font-bold ${
                hasPendingWithdrawal
                  ? "border-yellow-500/30 text-yellow-500 opacity-50 cursor-not-allowed"
                  : "border-zinc-700 hover:border-cyan-500"
              }`}
            >
              {hasPendingWithdrawal ? "⏳ Заявка на выводе" : "Вывести"}
            </button>
          </div>
        </div>

        {showWithdraw && !hasPendingWithdrawal && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold mb-6">💸 Вывод средств</h2>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Способ вывода
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 outline-none focus:border-cyan-500"
                >
                  <option value="СБП">СБП (по номеру телефона)</option>
                  <option value="Карта">На карту (по номеру карты)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  {withdrawMethod === "СБП"
                    ? "Номер телефона (привязанный к СБП)"
                    : "Номер карты"}
                </label>
                <input
                  type="text"
                  value={withdrawRequisites}
                  onChange={(e) => setWithdrawRequisites(e.target.value)}
                  placeholder={
                    withdrawMethod === "СБП"
                      ? "+7 999 123-45-67"
                      : "1234 5678 9012 3456"
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Сумма вывода
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Минимум 100 ₽"
                  min="100"
                  max={balance}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 outline-none focus:border-cyan-500"
                  required
                />
                <p className="text-zinc-500 text-xs mt-1">
                  Доступно: {balance.toFixed(2)} ₽
                </p>
              </div>

              {withdrawAmount && parseFloat(withdrawAmount) >= 100 && (
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Сумма вывода:</span>
                    <span>{withdrawAmount} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-zinc-400">Способ:</span>
                    <span>{withdrawMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-zinc-400">Реквизиты:</span>
                    <span className="text-cyan-400">
                      {withdrawRequisites || "—"}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-yellow-500 text-sm text-center">
                  ⚠️ Сумма будет списана с баланса сразу. Если заявка будет
                  отклонена — средства вернутся.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={
                    withdrawLoading ||
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) < 100 ||
                    parseFloat(withdrawAmount) > balance ||
                    !withdrawRequisites.trim()
                  }
                  className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {withdrawLoading ? "Создание..." : "Создать заявку"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowWithdraw(false);
                    setWithdrawAmount("");
                    setWithdrawRequisites("");
                  }}
                  className="px-6 py-4 rounded-xl border border-zinc-700 hover:border-zinc-500 transition"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {withdrawals.some((w) => w.status === "pending") && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Активные заявки на вывод</h2>
            <div className="space-y-3">
              {withdrawals
                .filter((w) => w.status === "pending")
                .map((w) => (
                  <div
                    key={w.id}
                    className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{w.amount} ₽</p>
                        <p className="text-zinc-500 text-xs">
                          {w.method} · {w.requisites}
                        </p>
                        <p className="text-zinc-500 text-xs">
                          {new Date(w.created_at).toLocaleString("ru")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <span className="text-yellow-500 text-sm">
                          На рассмотрении
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4">История операций</h2>

        {transactions.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-400">Операций нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">
                    {typeLabels[tx.type] || tx.type}
                  </p>
                  <p className="text-zinc-400 text-xs mt-1">{tx.description}</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {new Date(tx.created_at).toLocaleString("ru")}
                  </p>
                </div>
                <p
                  className={`text-lg font-bold ${
                    typeColors[tx.type] || "text-white"
                  }`}
                >
                  {tx.type === "purchase" || tx.type === "withdrawal"
                    ? "-"
                    : "+"}
                  {tx.amount.toFixed(2)} ₽
                </p>
              </div>
            ))}
          </div>
        )}

        {withdrawals.some((w) => w.status !== "pending") && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">История выводов</h2>
            <div className="space-y-3">
              {withdrawals
                .filter((w) => w.status !== "pending")
                .map((w) => (
                  <div
                    key={w.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold">{w.amount} ₽</p>
                      <p className="text-zinc-500 text-xs">
                        {w.method} · {w.requisites}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(w.created_at).toLocaleString("ru")}
                      </p>
                      {w.comment && (
                        <p className="text-cyan-400 text-xs mt-1">
                          {w.comment}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${
                        w.status === "approved"
                          ? "border-green-500/50 text-green-500"
                          : "border-red-500/50 text-red-500"
                      }`}
                    >
                      {statusLabels[w.status]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
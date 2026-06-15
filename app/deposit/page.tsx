"use client";

import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type DepositRequest = {
  id: number;
  amount: number;
  status: string;
  comment: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  pending: "⏳ Проверка",
  approved: "✅ Зачислено",
  rejected: "❌ Отклонено",
};

const SBP_PHONE = "+79331869030";
const SBP_PHONE_DISPLAY = "+7 933 186-90-30";
const SBP_BANK = "Сбербанк";
const SBP_NAME = "Яромир Ш.";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [copied, setCopied] = useState("");
  const [currentRequest, setCurrentRequest] = useState<DepositRequest | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [justApproved, setJustApproved] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadData();
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (userIdRef.current) {
      subscribeToUpdates(userIdRef.current);
    }
  }, [currentRequest]);

  async function loadData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    userIdRef.current = session.user.id;

    const { data: balanceData } = await supabase
      .from("balances")
      .select("balance")
      .eq("id", session.user.id)
      .maybeSingle();

    if (balanceData) setBalance(Number(balanceData.balance));

    const { data: requestsData } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setRequests(requestsData || []);

    subscribeToUpdates(session.user.id);
  }

  function subscribeToUpdates(userId: string) {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("deposit-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deposit_requests",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const updated = payload.new as DepositRequest;

          setRequests((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );

          if (updated.status === "approved") {
            if (currentRequest && currentRequest.id === updated.id) {
              setJustApproved(true);
              setCurrentRequest(null);

              const { data: balanceData } = await supabase
                .from("balances")
                .select("balance")
                .eq("id", userId)
                .maybeSingle();

              if (balanceData) setBalance(Number(balanceData.balance));

              setTimeout(() => setJustApproved(false), 5000);
            } else {
              const { data: balanceData } = await supabase
                .from("balances")
                .select("balance")
                .eq("id", userId)
                .maybeSingle();

              if (balanceData) setBalance(Number(balanceData.balance));
            }
          }

          if (updated.status === "rejected") {
            if (currentRequest && currentRequest.id === updated.id) {
              setCurrentRequest(null);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum < 100) {
      alert("Минимальная сумма: 100 ₽");
      return;
    }

    if (amountNum > 100000) {
      alert("Максимальная сумма: 100 000 ₽");
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

    const { data, error } = await supabase
      .from("deposit_requests")
      .insert([
        {
          user_id: session.user.id,
          user_email: session.user.email,
          amount: amountNum,
          payment_method: "СБП",
          status: "pending",
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCurrentRequest(data);
    loadData();
  }

  async function handleConfirm() {
    if (!currentRequest) return;

    await supabase
      .from("deposit_requests")
      .update({
        comment: `Оплачено. ID #${currentRequest.id}`,
      })
      .eq("id", currentRequest.id);

    alert("Заявка отправлена на проверку. Баланс будет пополнен после подтверждения.");
    setAmount("");
  }

  function getSbpLink() {
    if (!currentRequest) return "";

    const phone = SBP_PHONE.replace(/[^\d]/g, "");
    const comment = encodeURIComponent(`GameMarket ID${currentRequest.id}`);
    const amountKopeks = Math.round(currentRequest.amount * 100);

    return `https://qr.nspk.ru/pay?type=02&bank=100000000111&phone=${phone}&sum=${amountKopeks}&purpose=${comment}`;
  }

  function getSberLink() {
    if (!currentRequest) return "";

    const phone = SBP_PHONE.replace(/[^\d]/g, "");

    return `sberbankonline://payments/p2p?phone=${phone}&amount=${currentRequest.amount}&comment=GameMarket+ID${currentRequest.id}`;
  }

  const presets = [100, 500, 1000, 2000, 5000, 10000];
  const netAmount = amount ? (parseFloat(amount) * 0.9).toFixed(2) : "0.00";

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-20">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">💳 Пополнение баланса</h1>

        <p className="text-zinc-400 mb-8">
          Текущий баланс: {balance.toFixed(2)} ₽
        </p>

        {/* Уведомление об успешном зачислении */}
        {justApproved && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center animate-pulse">
            <p className="text-green-400 text-xl font-bold">✅ Баланс пополнен!</p>
            <p className="text-green-400/70 text-sm mt-2">
              Средства зачислены на ваш счёт
            </p>
          </div>
        )}

        {!currentRequest ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <label className="block text-zinc-400 text-sm mb-4">
              Выберите или введите сумму
            </label>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {presets.map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className={`py-3 rounded-xl border transition ${
                    amount === val.toString()
                      ? "bg-cyan-500 border-cyan-500 text-black font-bold"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300"
                  }`}
                >
                  {val} ₽
                </button>
              ))}
            </div>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Своя сумма (от 100 ₽)"
              min="100"
              max="100000"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-4 outline-none focus:border-cyan-500"
            />

            {amount && parseFloat(amount) >= 100 && (
              <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Сумма перевода:</span>
                  <span>{amount} ₽</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-zinc-400">Комиссия (10%):</span>
                  <span className="text-red-400">
                    -{(parseFloat(amount) * 0.1).toFixed(2)} ₽
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-zinc-700">
                  <span className="text-zinc-400">Зачислено на баланс:</span>
                  <span className="text-green-400 font-bold">{netAmount} ₽</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateRequest}
              disabled={loading || !amount || parseFloat(amount) < 100}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? "Создание..." : "Продолжить"}
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-cyan-500/50 rounded-3xl p-8 animate-slide-up">
            <h2 className="text-xl font-bold mb-2 text-cyan-400 text-center">
              Оплата заявки #{currentRequest.id}
            </h2>

            <p className="text-center text-zinc-400 text-sm mb-6">
              Статус обновится автоматически после подтверждения
            </p>

            <div className="space-y-6">
              <div className="flex justify-between items-center bg-zinc-800/50 p-4 rounded-2xl">
                <span className="text-zinc-400">Сумма к переводу:</span>
                <span className="text-2xl font-bold">
                  {currentRequest.amount} ₽
                </span>
              </div>

              {isMobile ? (
                <div className="space-y-3">
                  <a
                    href={getSberLink()}
                    className="block w-full py-4 bg-green-500 text-black font-bold rounded-xl text-center"
                  >
                    Открыть Сбербанк
                  </a>

                  <a
                    href={getSbpLink()}
                    className="block w-full py-4 bg-blue-500 text-black font-bold rounded-xl text-center"
                  >
                    Оплатить через СБП
                  </a>
                </div>
              ) : (
                <div className="bg-zinc-800/50 p-6 rounded-2xl">
                  <p className="text-center text-zinc-400 mb-4">
                    Отсканируйте QR-код в приложении банка
                  </p>

                  <div className="flex justify-center bg-white p-4 rounded-2xl">
                    <QRCodeSVG value={getSbpLink()} size={200} level="M" />
                  </div>
                </div>
              )}

              <div className="bg-zinc-800/50 p-6 rounded-2xl space-y-4">
                <p className="text-zinc-400 text-sm text-center">
                  Или переведите вручную:
                </p>

                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Получатель
                  </p>
                  <p className="text-lg font-bold">{SBP_NAME}</p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Банк
                  </p>
                  <p className="text-lg font-bold">{SBP_BANK}</p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Номер телефона
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-mono text-cyan-400">
                      {SBP_PHONE_DISPLAY}
                    </span>
                    <button
                      onClick={() =>
                        copyText(SBP_PHONE.replace(/[^\d+]/g, ""), "phone")
                      }
                      className="text-xs bg-cyan-500 text-black px-2 py-1 rounded font-bold"
                    >
                      {copied === "phone" ? "✓" : "КОПИРОВАТЬ"}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Сумма
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">
                      {currentRequest.amount} ₽
                    </span>
                    <button
                      onClick={() =>
                        copyText(currentRequest.amount.toString(), "amount")
                      }
                      className="text-xs bg-cyan-500 text-black px-2 py-1 rounded font-bold"
                    >
                      {copied === "amount" ? "✓" : "КОПИРОВАТЬ"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                <p className="text-yellow-500 text-sm text-center">
                  ⚠️ В комментарии к переводу укажите:
                  <br />
                  <span className="font-bold text-base">
                    GameMarket ID{currentRequest.id}
                  </span>
                </p>

                <div className="flex justify-center mt-2">
                  <button
                    onClick={() =>
                      copyText(
                        `GameMarket ID${currentRequest.id}`,
                        "comment"
                      )
                    }
                    className="text-xs bg-yellow-500 text-black px-3 py-1 rounded font-bold"
                  >
                    {copied === "comment"
                      ? "✓ Скопировано"
                      : "Копировать комментарий"}
                  </button>
                </div>
              </div>

              {/* Индикатор ожидания */}
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-yellow-500 text-sm">
                  Ожидание подтверждения администратором...
                </span>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition"
              >
                ✓ Я ОПЛАТИЛ
              </button>

              <button
                onClick={() => {
                  setCurrentRequest(null);
                  setAmount("");
                }}
                className="w-full text-zinc-500 text-sm hover:text-white transition"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">История пополнений</h3>

          {requests.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <p className="text-zinc-400">Заявок пока нет</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">{req.amount} ₽</p>
                    <p className="text-xs text-zinc-500">
                      #{req.id} ·{" "}
                      {new Date(req.created_at).toLocaleString("ru")}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${
                      req.status === "pending"
                        ? "border-yellow-500/50 text-yellow-500"
                        : req.status === "approved"
                        ? "border-green-500/50 text-green-500"
                        : "border-red-500/50 text-red-500"
                    }`}
                  >
                    {statusLabels[req.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
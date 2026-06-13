"use client";

import { useEffect, useState } from "react";
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

// Твои данные для перевода
const SBP_PHONE = "+7 933 186-90-30"; 
const SBP_BANK = "Сбербанк";
const SBP_NAME = "Яромир Ш.";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [copied, setCopied] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<DepositRequest | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

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
  }

  function copyPhone() {
    navigator.clipboard.writeText(SBP_PHONE.replace(/[^\d+]/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum < 100) {
      alert("Минимальная сумма: 100 ₽");
      return;
    }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("deposit_requests")
      .insert([{
        user_id: session.user.id,
        user_email: session.user.email,
        amount: amountNum,
        payment_method: "СБП",
        status: "pending"
      }])
      .select()
      .single();

    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      setCurrentRequest(data);
      loadData();
    }
  }

  async function handleConfirm() {
    if (!currentRequest) return;
    
    await supabase
      .from("deposit_requests")
      .update({ comment: `Оплачено пользователем. ID #${currentRequest.id}` })
      .eq("id", currentRequest.id);

    alert("Заявка отправлена! Мы зачислим средства сразу после проверки перевода.");
    setCurrentRequest(null);
    setAmount("");
    loadData();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-20">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          💳 Пополнение баланса
        </h1>

        {/* Форма создания */}
        {!currentRequest ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
            <label className="block text-zinc-400 text-sm mb-4">Выберите или введите сумму</label>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[100, 500, 1000, 2000, 5000, 10000].map(val => (
                <button 
                  key={val} 
                  onClick={() => setAmount(val.toString())}
                  className={`py-3 rounded-xl border transition ${amount === val.toString() ? 'bg-cyan-500 border-cyan-500 text-black font-bold' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}
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
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-6 outline-none focus:border-cyan-500"
            />

            <button 
              onClick={handleCreateRequest}
              disabled={loading || !amount}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? "Создание..." : "Продолжить"}
            </button>
          </div>
        ) : (
          /* Инструкция оплаты */
          <div className="bg-zinc-900 border border-cyan-500/50 rounded-3xl p-8 shadow-2xl animate-slide-up">
            <h2 className="text-xl font-bold mb-6 text-cyan-400 text-center">Инструкция по оплате</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-zinc-800/50 p-4 rounded-2xl">
                <span className="text-zinc-400">Сумма к переводу:</span>
                <span className="text-2xl font-bold">{currentRequest.amount} ₽</span>
              </div>

              <div className="bg-zinc-800/50 p-6 rounded-2xl space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Получатель (СБП)</p>
                  <p className="text-lg font-bold">{SBP_NAME}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Банк</p>
                  <p className="text-lg font-bold">{SBP_BANK}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Номер телефона</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-mono text-cyan-400">{SBP_PHONE}</span>
                    <button onClick={copyPhone} className="text-xs bg-cyan-500 text-black px-2 py-1 rounded font-bold">
                      {copied ? "ОК" : "КОПИРОВАТЬ"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                <p className="text-yellow-500 text-sm text-center">
                  ⚠️ В комментарии к переводу укажите: <br/>
                  <span className="font-bold text-base">ID {currentRequest.id}</span>
                </p>
              </div>

              <button 
                onClick={handleConfirm}
                className="w-full py-4 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition"
              >
                Я ОПЛАТИЛ
              </button>
              
              <button 
                onClick={() => setCurrentRequest(null)}
                className="w-full text-zinc-500 text-sm hover:text-white"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список заявок */}
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">История пополнений</h3>
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold">{req.amount} ₽</p>
                  <p className="text-xs text-zinc-500">{new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border ${req.status === 'pending' ? 'border-yellow-500/50 text-yellow-500' : req.status === 'approved' ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}>
                  {statusLabels[req.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
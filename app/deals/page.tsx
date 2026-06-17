"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Deal = {
  id: number;
  product_id: number;
  product_title: string;
  price: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  buyer_email: string;
  seller_email: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  pending: "⏳ Ожидает оплаты",
  paid: "💰 Оплачено",
  in_progress: "🔄 Передача товара",
  completed: "✅ Завершено",
  cancelled: "❌ Отменено",
  dispute: "⚠️ Спор",
};

const statusColors: Record<string, string> = {
  pending: "border-yellow-500/30 bg-yellow-500/5",
  paid: "border-green-500/30 bg-green-500/5",
  in_progress: "border-blue-500/30 bg-blue-500/5",
  completed: "border-green-500/30 bg-green-500/5",
  cancelled: "border-red-500/30 bg-red-500/5",
  dispute: "border-orange-500/30 bg-orange-500/5",
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  async function loadDeals() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      setUserId(session.user.id);

      const { data } = await supabase
        .from("deals")
        .select("*")
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false });

      setDeals(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Ошибка загрузки сделок:", error);
      setLoading(false);
    }
  }

  async function updateStatus(dealId: number, newStatus: string) {
    try {
      const { error } = await supabase
        .from("deals")
        .update({ status: newStatus })
        .eq("id", dealId);

      if (error) {
        alert(error.message);
        return;
      }

      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status: newStatus } : d))
      );
    } catch (error) {
      console.error("Ошибка обновления статуса:", error);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Войдите в аккаунт</h1>
          <Link
            href="/login"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-3 rounded-xl font-bold"
          >
            Войти
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Мои сделки</h1>
        <p className="text-zinc-400 mb-8">Управляйте покупками и продажами</p>

        {deals.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <p className="text-zinc-400">У вас пока нет сделок</p>
            <Link
              href="/catalog"
              className="inline-block mt-4 text-cyan-400 hover:underline"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => {
              const isBuyer = deal.buyer_id === userId;
              const role = isBuyer ? "Покупатель" : "Продавец";
              const otherUser = isBuyer ? deal.seller_email : deal.buyer_email;

              return (
                <div
                  key={deal.id}
                  className={`border rounded-2xl p-6 ${
                    statusColors[deal.status] || "border-zinc-800"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/listing/${deal.product_id}`}
                          className="font-bold text-lg hover:text-cyan-400 transition"
                        >
                          {deal.product_title}
                        </Link>
                        <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full">
                          {role}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm mt-1">
                        {isBuyer ? "Продавец" : "Покупатель"}: {otherUser}
                      </p>
                      <p className="text-sm mt-1">
                        {statusLabels[deal.status] || deal.status}
                      </p>
                      <p className="text-zinc-500 text-xs mt-1">
                        {new Date(deal.created_at).toLocaleString("ru")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{deal.price}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {isBuyer && deal.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(deal.id, "paid")}
                          className="bg-green-500 text-black px-4 py-2 rounded-xl text-sm font-semibold"
                        >
                          Подтвердить оплату
                        </button>
                        <button
                          onClick={() => updateStatus(deal.id, "cancelled")}
                          className="bg-zinc-800 text-red-400 px-4 py-2 rounded-xl text-sm"
                        >
                          Отменить
                        </button>
                      </>
                    )}

                    {!isBuyer && deal.status === "paid" && (
                      <button
                        onClick={() => updateStatus(deal.id, "in_progress")}
                        className="bg-blue-500 text-black px-4 py-2 rounded-xl text-sm font-semibold"
                      >
                        Начать передачу товара
                      </button>
                    )}

                    {isBuyer && deal.status === "in_progress" && (
                      <>
                        <button
                          onClick={() => updateStatus(deal.id, "completed")}
                          className="bg-green-500 text-black px-4 py-2 rounded-xl text-sm font-semibold"
                        >
                          Товар получен
                        </button>
                        <button
                          onClick={() => updateStatus(deal.id, "dispute")}
                          className="bg-orange-500 text-black px-4 py-2 rounded-xl text-sm"
                        >
                          Открыть спор
                        </button>
                      </>
                    )}

                    <Link
                      href="/messages"
                      className="bg-zinc-800 px-4 py-2 rounded-xl text-sm hover:bg-zinc-700 transition"
                    >
                      💬 Чат
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
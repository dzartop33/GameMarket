"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Chat = {
  id: number;
  user1_email: string;
  user2_email: string;
  created_at: string;
};

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setEmail(user.email || "");

    const { data } = await supabase
      .from("chats")
      .select("*")
      .or(
        `user1_id.eq.${user.id},user2_id.eq.${user.id}`
      )
      .order("created_at", { ascending: false });

    setChats(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-10">
        Загрузка...
      </main>
    );
  }

  if (!email) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-10">
        <h1 className="text-3xl font-bold">
          Войдите в аккаунт
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Сообщения
        </h1>

        {chats.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            У вас пока нет диалогов.
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => {
              const otherUser =
                chat.user1_email === email
                  ? chat.user2_email
                  : chat.user1_email;

              return (
                <Link
                  key={chat.id}
                  href={`/messages/${chat.id}`}
                >
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-500 transition flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />

                    <div>
                      <p className="font-semibold">
                        {otherUser}
                      </p>

                      <p className="text-zinc-400 text-sm">
                        Нажмите чтобы открыть
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
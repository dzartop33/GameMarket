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
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoading(false);
      return;
    }

    setEmail(session.user.email || "");

    const { data } = await supabase
      .from("chats")
      .select("id, user1_email, user2_email, created_at")
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false });

    setChats(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!email) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Войдите в аккаунт</h1>
          <Link href="/login" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-8 py-3 rounded-xl font-bold">Войти</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Сообщения</h1>
        <p className="text-zinc-400 mb-8">{chats.length} диалогов</p>

        {chats.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <p className="text-zinc-400">Нет диалогов</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => {
              const otherUser = chat.user1_email === email ? chat.user2_email : chat.user1_email;

              return (
                <Link key={chat.id} href={`/messages/${chat.id}`}>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-cyan-500/50 transition flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-black">
                      {otherUser.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{otherUser}</p>
                      <p className="text-zinc-500 text-xs">Нажмите чтобы открыть</p>
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
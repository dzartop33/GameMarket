"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

type Message = {
  id: number;
  sender_email: string;
  text: string;
  created_at: string;
};

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [
            ...prev,
            payload.new as Message,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function loadMessages() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setEmail(user.email || "");
    setUserId(user.id);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", Number(id))
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setLoading(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!text.trim()) return;

    await supabase.from("messages").insert([
      {
        chat_id: Number(id),
        sender_id: userId,
        sender_email: email,
        text: text.trim(),
      },
    ]);

    setText("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-10">
        Загрузка...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-6">
          Диалог
        </h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[400px] flex flex-col">
          <div className="flex-1 space-y-4 mb-6 overflow-y-auto max-h-[500px]">
            {messages.length === 0 ? (
              <p className="text-zinc-400">
                Напишите первое сообщение
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[70%] p-4 rounded-2xl ${
                    msg.sender_email === email
                      ? "bg-cyan-500 text-black ml-auto"
                      : "bg-zinc-800"
                  }`}
                >
                  <p className="text-xs opacity-70 mb-1">
                    {msg.sender_email}
                  </p>

                  <p>{msg.text}</p>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex gap-3"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите сообщение..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-4 outline-none focus:border-cyan-500 transition"
            />

            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 rounded-xl font-bold"
            >
              →
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
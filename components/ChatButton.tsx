"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

type Props = {
  sellerId: string;
  sellerEmail: string;
  productId: number;
};

export default function ChatButton({
  sellerId,
  sellerEmail,
  productId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startChat() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      alert("Необходимо войти в аккаунт");
      setLoading(false);
      return;
    }

    if (session.user.id === sellerId) {
      alert("Это ваше объявление");
      setLoading(false);
      return;
    }

    const { data: existingChats } = await supabase
      .from("chats")
      .select("id")
      .eq("product_id", productId)
      .or(
        `and(user1_id.eq.${session.user.id},user2_id.eq.${sellerId}),and(user1_id.eq.${sellerId},user2_id.eq.${session.user.id})`
      );

    if (existingChats && existingChats.length > 0) {
      router.push(`/messages/${existingChats[0].id}`);
      setLoading(false);
      return;
    }

    const { data: newChat, error } = await supabase
      .from("chats")
      .insert([
        {
          user1_id: session.user.id,
          user2_id: sellerId,
          user1_email: session.user.email,
          user2_email: sellerEmail,
          product_id: productId,
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/messages/${newChat.id}`);
  }

  return (
    <button
      onClick={startChat}
      disabled={loading}
      className="px-8 py-4 rounded-xl border border-zinc-700 hover:border-cyan-500 transition text-sm"
    >
      {loading ? "..." : "💬 Написать"}
    </button>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

  async function startChat() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Необходимо войти в аккаунт");
      return;
    }

    if (user.id === sellerId) {
      alert("Это ваше объявление");
      return;
    }

    const { data: existingChats } = await supabase
      .from("chats")
      .select("*")
      .eq("product_id", productId)
      .or(
        `and(user1_id.eq.${user.id},user2_id.eq.${sellerId}),and(user1_id.eq.${sellerId},user2_id.eq.${user.id})`
      );

    if (existingChats && existingChats.length > 0) {
      router.push(`/messages/${existingChats[0].id}`);
      return;
    }

    const { data: newChat, error } = await supabase
      .from("chats")
      .insert([
        {
          user1_id: user.id,
          user2_id: sellerId,
          user1_email: user.email,
          user2_email: sellerEmail,
          product_id: productId,
        },
      ])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/messages/${newChat.id}`);
  }

  return (
    <button
      onClick={startChat}
      className="px-8 py-4 rounded-xl border border-zinc-700 hover:border-cyan-500 transition"
    >
      💬 Написать
    </button>
  );
}
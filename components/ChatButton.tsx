"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

type Props = {
  sellerId: string;
  sellerEmail: string;
  productId: number;
};

export default function ChatButton({ sellerId, sellerEmail, productId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startChat() {
    setLoading(true);

    try {
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

      // Проверяем существующий чат
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

      // Создаём новый чат — используем массив вместо .single()
      const { data: newChats, error } = await supabase
        .from("chats")
        .insert([{
          user1_id: session.user.id,
          user2_id: sellerId,
          user1_email: session.user.email,
          user2_email: sellerEmail,
          product_id: productId,
        }])
        .select();

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      if (newChats && newChats.length > 0) {
        router.push(`/messages/${newChats[0].id}`);
      }
    } catch (error) {
      console.error("Ошибка чата:", error);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startChat}
      disabled={loading}
      className="px-8 py-4 rounded-xl border border-zinc-700 hover:border-cyan-500 transition text-sm disabled:opacity-50"
    >
      {loading ? "..." : "💬 Написать"}
    </button>
  );
}
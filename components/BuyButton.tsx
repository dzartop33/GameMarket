"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  productId: number;
  sellerId: string;
  sellerEmail: string;
  productTitle: string;
  price: string;
};

export default function BuyButton({
  productId,
  sellerId,
  sellerEmail,
  productTitle,
  price,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      alert("Необходимо войти в аккаунт");
      return;
    }

    if (session.user.id === sellerId) {
      alert("Нельзя купить свой товар");
      return;
    }

    const priceNum = parseFloat(price.replace(/[^\d.]/g, ""));

    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Некорректная цена");
      return;
    }

    const confirmed = confirm(
      `Купить "${productTitle}" за ${priceNum.toFixed(2)} ₽?\n\nСумма будет списана с вашего баланса.`
    );

    if (!confirmed) return;

    setLoading(true);

    const { data: buyerBalance } = await supabase
      .from("balances")
      .select("balance")
      .eq("id", session.user.id)
      .single();

    if (!buyerBalance || Number(buyerBalance.balance) < priceNum) {
      alert(
        `Недостаточно средств.\n\nБаланс: ${
          buyerBalance ? Number(buyerBalance.balance).toFixed(2) : "0.00"
        } ₽\nЦена: ${priceNum.toFixed(2)} ₽`
      );
      setLoading(false);
      return;
    }

    const { data: existingDeal } = await supabase
      .from("deals")
      .select("id")
      .eq("product_id", productId)
      .eq("buyer_id", session.user.id)
      .in("status", ["pending", "paid", "in_progress"])
      .maybeSingle();

    if (existingDeal) {
      alert("У вас уже есть активная сделка");
      setLoading(false);
      return;
    }

    const { error: transferError } = await supabase.rpc("transfer_funds", {
      buyer_id_input: session.user.id,
      seller_id_input: sellerId,
      amount_input: priceNum,
    });

    if (transferError) {
      alert(transferError.message);
      setLoading(false);
      return;
    }

    const insertPromises = [
      supabase.from("transactions").insert([
        {
          user_id: session.user.id,
          type: "purchase",
          amount: priceNum,
          description: `Покупка: ${productTitle}`,
        },
      ]),
      supabase.from("transactions").insert([
        {
          user_id: sellerId,
          type: "sale",
          amount: priceNum,
          description: `Продажа: ${productTitle}`,
        },
      ]),
      supabase.from("deals").insert([
        {
          product_id: productId,
          buyer_id: session.user.id,
          seller_id: sellerId,
          buyer_email: session.user.email,
          seller_email: sellerEmail,
          product_title: productTitle,
          price: price,
          status: "paid",
        },
      ]),
    ];

    await Promise.all(insertPromises);

    setLoading(false);
    alert("Покупка успешна!");
    window.location.assign("/deals");
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold hover:opacity-90 transition"
    >
      {loading ? "Оплата..." : "Купить сейчас"}
    </button>
  );
}
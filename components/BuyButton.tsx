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
    try {
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

      // Проверяем бан
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_blocked")
        .eq("id", session.user.id);

      if (profileData?.[0]?.is_blocked) {
        alert("Ваш аккаунт заблокирован. Покупка невозможна.");
        return;
      }

      const priceNum = parseFloat(price.replace(/[^\d.]/g, ""));

      if (isNaN(priceNum) || priceNum <= 0) {
        alert("Некорректная цена");
        return;
      }

      // Проверяем количество товара
      const { data: productData } = await supabase
        .from("products")
        .select("quantity, status, title")
        .eq("id", productId);

      const product = productData?.[0];

      if (!product) {
        alert("Товар не найден");
        return;
      }

      if (product.status === "sold") {
        alert("Товар уже продан");
        return;
      }

      if (product.quantity !== null && product.quantity <= 0) {
        alert("Товар закончился");
        return;
      }

      const confirmed = confirm(
        `Купить "${productTitle}" за ${priceNum.toFixed(2)} ₽?\n\nКомиссия сервиса: ${(priceNum * 0.05).toFixed(2)} ₽\nСумма будет списана с вашего баланса.`
      );

      if (!confirmed) return;

      setLoading(true);

      // Проверяем баланс
      const { data: balanceData } = await supabase
        .from("balances")
        .select("balance")
        .eq("id", session.user.id);

      const buyerBalance = balanceData?.[0];

      if (!buyerBalance || Number(buyerBalance.balance) < priceNum) {
        alert(
          `Недостаточно средств.\n\nВаш баланс: ${
            buyerBalance ? Number(buyerBalance.balance).toFixed(2) : "0.00"
          } ₽\nЦена: ${priceNum.toFixed(2)} ₽\n\nПополните баланс в разделе Кошелёк.`
        );
        setLoading(false);
        return;
      }

      // Проверяем существующую сделку
      const { data: existingDeals } = await supabase
        .from("deals")
        .select("id")
        .eq("product_id", productId)
        .eq("buyer_id", session.user.id)
        .in("status", ["pending", "paid", "in_progress"]);

      if (existingDeals && existingDeals.length > 0) {
        alert("У вас уже есть активная сделка по этому товару");
        setLoading(false);
        return;
      }

      // Переводим деньги с комиссией
      const { error: transferError } = await supabase.rpc("transfer_funds", {
        buyer_id_input: session.user.id,
        seller_id_input: sellerId,
        amount_input: priceNum,
      });

      if (transferError) {
        alert(`Ошибка оплаты: ${transferError.message}`);
        setLoading(false);
        return;
      }

      // Уменьшаем количество товара
      await supabase.rpc("decrease_product_quantity", {
        product_id_input: productId,
      });

      const commission = priceNum * 0.05;
      const sellerAmount = priceNum - commission;

      // Записываем транзакции и сделку параллельно
      await Promise.all([
        supabase.from("transactions").insert([{
          user_id: session.user.id,
          type: "purchase",
          amount: priceNum,
          description: `Покупка: ${productTitle}`,
        }]),
        supabase.from("transactions").insert([{
          user_id: sellerId,
          type: "sale",
          amount: sellerAmount,
          description: `Продажа: ${productTitle} (комиссия ${commission.toFixed(2)} ₽)`,
        }]),
        supabase.from("deals").insert([{
          product_id: productId,
          buyer_id: session.user.id,
          seller_id: sellerId,
          buyer_email: session.user.email,
          seller_email: sellerEmail,
          product_title: productTitle,
          price: price,
          status: "paid",
        }]),
      ]);

      setLoading(false);
      alert(`✅ Покупка успешна!\n\nСписано: ${priceNum.toFixed(2)} ₽\nПродавец получит: ${sellerAmount.toFixed(2)} ₽`);
      window.location.assign("/deals");
    } catch (error) {
      console.error("Ошибка покупки:", error);
      alert("Произошла ошибка. Попробуйте снова.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold hover:opacity-90 transition disabled:opacity-50"
    >
      {loading ? "Оплата..." : "Купить сейчас"}
    </button>
  );
}
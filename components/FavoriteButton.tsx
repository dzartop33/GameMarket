"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FavoriteButton({
  productId,
}: {
  productId: number;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, []);

  async function checkFavorite() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("product_id", productId)
      .maybeSingle();

    setIsFavorite(!!data);
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      alert("Необходимо войти в аккаунт");
      return;
    }

    setLoading(true);

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", session.user.id)
        .eq("product_id", productId);

      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert([
        {
          user_id: session.user.id,
          product_id: productId,
        },
      ]);

      setIsFavorite(true);
    }

    setLoading(false);
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="absolute top-3 right-3 z-10 text-2xl hover:scale-110 transition"
    >
      {isFavorite ? "❤️" : "🤍"}
    </button>
  );
}
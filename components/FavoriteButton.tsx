"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

let cachedUserId: string | null = null;

export default function FavoriteButton({ productId }: { productId: number }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const checkFavorite = useCallback(async () => {
    try {
      if (!cachedUserId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        cachedUserId = session?.user?.id || null;
      }

      if (!cachedUserId) {
        setReady(true);
        return;
      }

      // Используем массив вместо maybeSingle
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", cachedUserId)
        .eq("product_id", productId);

      setIsFavorite(data !== null && data.length > 0);
      setReady(true);
    } catch {
      setReady(true);
    }
  }, [productId]);

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!cachedUserId) {
      alert("Необходимо войти в аккаунт");
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", cachedUserId)
          .eq("product_id", productId);
        setIsFavorite(false);
      } else {
        await supabase.from("favorites").insert([{
          user_id: cachedUserId,
          product_id: productId,
        }]);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Ошибка избранного:", error);
    }

    setLoading(false);
  }

  if (!ready) return null;

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="absolute top-3 right-3 z-10 text-2xl hover:scale-110 transition disabled:opacity-50"
    >
      {isFavorite ? "❤️" : "🤍"}
    </button>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: number;
  author_id: string;
  author_username: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function Reviews({ sellerId }: { sellerId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    } catch {
      setCurrentUserId(null);
    }
  }

  async function loadReviews() {
    try {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
      setReviews(data || []);
    } catch {
      setReviews([]);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("Необходимо войти в аккаунт");
        return;
      }

      if (session.user.id === sellerId) {
        alert("Нельзя оставить отзыв самому себе");
        return;
      }

      setLoading(true);

      // Используем массив вместо maybeSingle
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id);

      const username =
        profileData?.[0]?.username ||
        session.user.email?.split("@")[0] ||
        "user";

      const { error } = await supabase.from("reviews").insert([{
        seller_id: sellerId,
        author_id: session.user.id,
        author_username: username,
        rating,
        comment,
      }]);

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      setComment("");
      setRating(5);
      loadReviews();
    } catch (error) {
      console.error("Ошибка отправки отзыва:", error);
      setLoading(false);
    }
  }

  async function deleteReview(reviewId: number) {
    if (!confirm("Удалить отзыв?")) return;

    try {
      await supabase.from("reviews").delete().eq("id", reviewId);
      loadReviews();
    } catch (error) {
      console.error("Ошибка удаления отзыва:", error);
    }
  }

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0";

  return (
    <div className="mt-12">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Отзывы</h2>
        <span className="text-cyan-400">
          ★ {avgRating} ({reviews.length})
        </span>
      </div>

      <form
        onSubmit={submitReview}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
      >
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl transition ${
                star <= rating ? "text-yellow-400" : "text-zinc-600"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Напишите отзыв..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-4 outline-none focus:border-cyan-500 transition"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? "Отправка..." : "Отправить отзыв"}
        </button>
      </form>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-zinc-400">Пока нет отзывов.</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{review.author_username}</p>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                  {currentUserId === review.author_id && (
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="text-red-400 text-sm hover:underline"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
              <p className="text-zinc-300 mt-2">{review.comment}</p>
              <p className="text-zinc-500 text-xs mt-1">
                {new Date(review.created_at).toLocaleString("ru")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
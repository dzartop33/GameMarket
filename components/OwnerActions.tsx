"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OwnerActions({
  productId,
  ownerId,
}: {
  productId: number;
  ownerId: string;
}) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsOwner(session?.user?.id === ownerId);
    }

    check();
  }, [ownerId]);

  if (!isOwner) return null;

  async function deleteProduct() {
    const confirmed = confirm("Удалить объявление?");
    if (!confirmed) return;

    await supabase.from("products").delete().eq("id", productId);
    window.location.assign("/my-listings");
  }

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={() => window.location.assign(`/edit/${productId}`)}
        className="flex-1 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition font-semibold text-sm"
      >
        ✏️ Редактировать
      </button>

      <button
        onClick={deleteProduct}
        className="px-6 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition font-semibold text-sm"
      >
        🗑️ Удалить
      </button>
    </div>
  );
}
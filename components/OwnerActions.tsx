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
    checkOwner();
  }, []);

  async function checkOwner() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id === ownerId) {
      setIsOwner(true);
    }
  }

  async function deleteProduct() {
    const confirmed = confirm("Удалить объявление?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.assign("/my-listings");
  }

  if (!isOwner) return null;

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={() =>
          window.location.assign(`/edit/${productId}`)
        }
        className="flex-1 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition font-semibold"
      >
        ✏️ Редактировать
      </button>

      <button
        onClick={deleteProduct}
        className="px-6 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition font-semibold"
      >
        🗑️ Удалить
      </button>
    </div>
  );
}
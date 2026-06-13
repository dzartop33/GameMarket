"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminFloatingButton() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      setIsAdmin(data?.role === "admin");
    }

    check();
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-110 transition-transform"
    >
      <span className="text-2xl">👑</span>
    </Link>
  );
}
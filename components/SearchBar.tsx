"use client";

import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div className="mb-8">
      <input
        type="text"
        placeholder="Поиск товаров..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-white outline-none"
      />

      {query && (
        <p className="mt-2 text-zinc-400">
          Поиск: {query}
        </p>
      )}
    </div>
  );
}
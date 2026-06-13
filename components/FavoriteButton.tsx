"use client";

import { useState } from "react";

export default function FavoriteButton() {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setIsFavorite(!isFavorite);
      }}
      className="absolute top-3 right-3 z-10 text-2xl"
    >
      {isFavorite ? "❤️" : "🤍"}
    </button>
  );
}
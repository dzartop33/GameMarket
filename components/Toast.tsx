"use client";

import { useEffect } from "react";

type Props = {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
};

const colors = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-cyan-500",
};

const icons = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export default function Toast({ message, type, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div
        className={`${colors[type]} text-black px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 max-w-sm`}
      >
        <span className="text-lg font-bold">{icons[type]}</span>
        <p className="font-semibold text-sm">{message}</p>
        <button onClick={onClose} className="ml-auto text-lg opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  );
}
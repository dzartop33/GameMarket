export default function Categories() {
  const categories = [
    "Все",
    "Аккаунты",
    "Валюта",
    "Буст",
    "Предметы",
  ];

  return (
    <div className="flex gap-3 mb-8 flex-wrap">
      {categories.map((category) => (
        <button
          key={category}
          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500 transition"
        >
          {category}
        </button>
      ))}
    </div>
  );
}
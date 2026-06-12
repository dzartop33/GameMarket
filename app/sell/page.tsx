export default function SellPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Разместить объявление
        </h1>

        <form className="space-y-6">
          <div>
            <label className="block mb-2">
              Название товара
            </label>

            <input
              type="text"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              placeholder="Например: Аккаунт CS2 Prime"
            />
          </div>

          <div>
            <label className="block mb-2">
              Игра
            </label>

            <input
              type="text"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              placeholder="Counter-Strike 2"
            />
          </div>

          <div>
            <label className="block mb-2">
              Цена
            </label>

            <input
              type="number"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              placeholder="2500"
            />
          </div>

          <div>
            <label className="block mb-2">
              Описание
            </label>

            <textarea
              rows={6}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              placeholder="Подробное описание товара..."
            />
          </div>

          <button
            type="submit"
            className="bg-cyan-500 text-black font-bold px-8 py-4 rounded-xl"
          >
            Опубликовать
          </button>
        </form>
      </div>
    </main>
  );
}
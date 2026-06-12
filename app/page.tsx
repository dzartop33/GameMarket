export default function CatalogPage() {
  const products = [
    {
      id: 1,
      title: "Аккаунт CS2 Prime",
      price: "2500 ₽",
    },
    {
      id: 2,
      title: "1000 V-Bucks",
      price: "700 ₽",
    },
    {
      id: 3,
      title: "Аккаунт GTA 5",
      price: "1900 ₽",
    },
    {
      id: 4,
      title: "World of Warcraft",
      price: "850 ₽",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Каталог товаров
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <div className="h-40 bg-zinc-800 rounded-xl mb-4"></div>

              <h2 className="font-semibold">
                {product.title}
              </h2>

              <p className="text-cyan-400 mt-2">
                {product.price}
              </p>

              <button className="mt-4 w-full bg-cyan-500 text-black py-3 rounded-xl font-bold">
                Купить
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
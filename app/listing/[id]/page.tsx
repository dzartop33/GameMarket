import { products } from "@/data/products";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = products.find(
    (p) => p.id === Number(id)
  );

  if (!product) {
    return (
      <main className="p-10 text-white">
        Товар не найден
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="h-96 bg-zinc-800 rounded-2xl"></div>

          <div>
            <p className="text-cyan-400">
              {product.game}
            </p>

            <h1 className="text-4xl font-bold mt-3">
              {product.title}
            </h1>

            <p className="text-4xl font-bold mt-8">
              {product.price}
            </p>

            <button className="mt-8 px-8 py-4 bg-cyan-500 text-black rounded-xl font-bold">
              Купить
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
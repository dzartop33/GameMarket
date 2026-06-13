import Link from "next/link";
import { getProducts } from "@/lib/products";

export default async function SellersPage() {
  const products = await getProducts();

  const sellersMap = new Map<
    string,
    { name: string; count: number }
  >();

  products.forEach((product: any) => {
    if (sellersMap.has(product.seller)) {
      const seller = sellersMap.get(product.seller)!;
      seller.count += 1;
    } else {
      sellersMap.set(product.seller, {
        name: product.seller,
        count: 1,
      });
    }
  });

  const sellers = Array.from(sellersMap.values());

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Продавцы
        </h1>

        {sellers.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            Пока нет продавцов.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sellers.map((seller) => (
              <Link
                key={seller.name}
                href={`/seller/${seller.name}`}
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-cyan-500 transition">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 mx-auto mb-4"></div>

                  <h2 className="text-xl font-bold text-center">
                    {seller.name}
                  </h2>

                  <p className="text-zinc-400 text-center mt-2">
                    Объявлений: {seller.count}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
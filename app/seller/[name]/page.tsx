import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/products";
import { supabase } from "@/lib/supabase";
import Reviews from "@/components/Reviews";

export default async function SellerPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const allProducts = await getProducts();

  const sellerProducts = allProducts.filter(
    (product: any) => product.seller === decodedName
  );

  const sellerId = sellerProducts[0]?.user_id || null;

  let avgRating = "0";
  let reviewCount = 0;

  if (sellerId) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("seller_id", sellerId);

    if (reviews && reviews.length > 0) {
      reviewCount = reviews.length;

      avgRating = (
        reviews.reduce(
          (sum: number, r: any) => sum + r.rating,
          0
        ) / reviews.length
      ).toFixed(1);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />

            <div>
              <h1 className="text-4xl font-bold">
                {decodedName}
              </h1>

              <p className="text-cyan-400 mt-2">
                ★ {avgRating} ({reviewCount} отзывов)
              </p>

              <p className="text-zinc-400">
                Объявлений: {sellerProducts.length}
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-12 mb-6">
          Товары продавца
        </h2>

        {sellerProducts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            У продавца пока нет товаров.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sellerProducts.map((product: any) => (
              <Link
                key={product.id}
                href={`/listing/${product.id}`}
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition">
                  <div className="relative h-32 bg-zinc-800">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold">
                      {product.title}
                    </h3>

                    <p className="text-cyan-400 mt-2">
                      {product.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {sellerId && <Reviews sellerId={sellerId} />}
      </div>
    </main>
  );
}
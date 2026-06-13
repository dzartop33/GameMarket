import Image from "next/image";
import Link from "next/link";
import { getProductById } from "@/lib/products";
import ChatButton from "@/components/ChatButton";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(Number(id));

  if (!product) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-10">
        <h1 className="text-3xl font-bold">
          Товар не найден
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="relative h-96 rounded-2xl overflow-hidden bg-zinc-800">
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

          <div>
            <p className="text-cyan-400">
              {product.game}
            </p>

            <h1 className="text-4xl font-bold mt-2">
              {product.title}
            </h1>

            {product.category && (
              <span className="inline-block mt-3 bg-zinc-800 text-sm px-3 py-1 rounded-full">
                {product.category}
              </span>
            )}

            <div className="mt-6">
              <Link
                href={`/seller/${product.seller}`}
                className="text-cyan-400 hover:underline"
              >
                Продавец: {product.seller}
              </Link>
            </div>

            <p className="mt-6 text-zinc-300">
              {product.description || "Описание отсутствует."}
            </p>

            <div className="mt-8">
              <p className="text-4xl font-bold">
                {product.price}
              </p>

              <div className="flex gap-4 mt-6">
                <button className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold hover:opacity-90 transition">
                  Купить сейчас
                </button>

                <ChatButton
                  sellerId={product.user_id}
                  sellerEmail={product.seller}
                  productId={product.id}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
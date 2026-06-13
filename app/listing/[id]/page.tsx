import Image from "next/image";
import Link from "next/link";
import { getProductById } from "@/lib/products";
import ChatButton from "@/components/ChatButton";
import BuyButton from "@/components/BuyButton";
import Reviews from "@/components/Reviews";
import OwnerActions from "@/components/OwnerActions";
import AdminProductActions from "@/components/AdminProductActions";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(Number(id));

  if (!product) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Товар не найден</h1>

          <Link
            href="/catalog"
            className="inline-block mt-6 text-cyan-400 hover:underline"
          >
            Перейти в каталог
          </Link>
        </div>
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
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <p className="text-cyan-400 text-sm">{product.game}</p>

              {product.category && (
                <span className="bg-zinc-800 text-xs px-3 py-1 rounded-full">
                  {product.category}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold mt-3">{product.title}</h1>

            <div className="mt-4">
              <Link
                href={`/seller/${product.seller}`}
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-cyan-400 transition"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
                {product.seller}
              </Link>
            </div>

            <p className="mt-6 text-zinc-300 leading-relaxed">
              {product.description || "Описание отсутствует."}
            </p>

            <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-4xl font-bold">{product.price}</p>

              <div className="flex gap-3 mt-6">
                <BuyButton
                  productId={product.id}
                  sellerId={product.user_id}
                  sellerEmail={product.seller}
                  productTitle={product.title}
                  price={product.price}
                />

                <ChatButton
                  sellerId={product.user_id}
                  sellerEmail={product.seller}
                  productId={product.id}
                />
              </div>

              {product.user_id && (
                <OwnerActions
                  productId={product.id}
                  ownerId={product.user_id}
                />
              )}

              <AdminProductActions productId={product.id} />
            </div>
          </div>
        </div>

        {product.user_id && <Reviews sellerId={product.user_id} />}
      </div>
    </main>
  );
}
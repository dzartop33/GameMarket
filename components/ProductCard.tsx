import Link from "next/link";
import Image from "next/image";
import FavoriteButton from "./FavoriteButton";

type Product = {
  id: number;
  title: string;
  game: string;
  category?: string;
  price: string;
  quantity?: number;
  seller: string;
  image_url?: string;
};

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  return (
    <div className="relative">
      <FavoriteButton productId={product.id} />

      <Link href={`/listing/${product.id}`} prefetch={true}>
        <div className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200">
          <div className="relative h-44 bg-zinc-800">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700" />
            )}

            {product.category && (
              <span className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-sm text-xs px-3 py-1 rounded-full">
                {product.category}
              </span>
            )}

            {/* КОЛИЧЕСТВО — бейдж в углу */}
            {product.quantity !== undefined && (
              <span
                className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-medium ${
                  product.quantity > 0
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {product.quantity > 0
                  ? `${product.quantity} шт.`
                  : "Нет"}
              </span>
            )}
          </div>

          <div className="p-4">
            <p className="text-cyan-400 text-xs">{product.game}</p>

            <h3 className="font-semibold mt-1 line-clamp-2 text-sm">
              {product.title}
            </h3>

            <div className="flex items-center justify-between mt-3">
              <p className="text-lg font-bold">{product.price}</p>

              <p className="text-zinc-500 text-xs truncate max-w-[80px]">
                {product.seller}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
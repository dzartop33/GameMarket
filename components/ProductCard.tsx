import Link from "next/link";
import Image from "next/image";
import FavoriteButton from "./FavoriteButton";

type Product = {
  id: number;
  title: string;
  game: string;
  category?: string;
  price: string;
  seller: string;
  rating?: number;
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

      <Link
        href={`/listing/${product.id}`}
        prefetch={true}
      >
        <div className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300">
          <div className="relative h-44 bg-zinc-800">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
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
          </div>

          <div className="p-4">
            <p className="text-cyan-400 text-xs">
              {product.game}
            </p>

            <h3 className="font-semibold mt-1 line-clamp-2">
              {product.title}
            </h3>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xl font-bold">
                {product.price}
              </p>

              <p className="text-zinc-500 text-xs truncate max-w-[100px]">
                {product.seller}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
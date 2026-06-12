import Link from "next/link";

type Product = {
  id: number;
  title: string;
  game: string;
  price: string;
};

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  return (
    <Link href={`/listing/${product.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-cyan-500 transition cursor-pointer">
        <div className="h-40 bg-zinc-800 rounded-xl mb-4"></div>

        <p className="text-cyan-400 text-sm">
          {product.game}
        </p>

        <h3 className="font-semibold mt-2">
          {product.title}
        </h3>

        <p className="text-2xl font-bold mt-4">
          {product.price}
        </p>
      </div>
    </Link>
  );
}
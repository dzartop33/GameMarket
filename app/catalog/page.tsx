import CatalogClient from "@/components/CatalogClient";
import { getProducts } from "@/lib/products";

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Каталог товаров
        </h1>

        <CatalogClient products={products} />
      </div>
    </main>
  );
}
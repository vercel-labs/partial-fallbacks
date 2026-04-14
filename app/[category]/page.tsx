import { Suspense } from "react";
import Link from "next/link";
import { fetchProducts, getProducts, type Product } from "../lib/data";

export default function CategoryPage(props: PageProps<"/[category]">) {
  // Kick off the uncached fetch at the top so it runs in parallel with rendering.
  const liveData = props.params.then(async (p) => ({
    category: p.category,
    products: await fetchProducts(p.category),
  }));

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<p className="text-zinc-500">Loading products...</p>}>
        <ProductList {...props}>
          <Suspense
            fallback={
              <p className="text-xs text-zinc-500">Checking inventory...</p>
            }
          >
            <InventoryCheck data={liveData} />
          </Suspense>
        </ProductList>
      </Suspense>
    </div>
  );
}

async function ProductList({
  children,
  ...props
}: PageProps<"/[category]"> & { children: React.ReactNode }) {
  const { category } = await props.params;
  const products = await getProducts(category);

  if (products.length === 0) {
    return <p className="text-zinc-500">No products found.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <ul className="grid gap-4">
        {products.map((product) => (
          <li key={product.slug}>
            <Link
              href={`/${category}/${product.slug}`}
              className="block rounded-lg border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <h2 className="font-semibold">{product.name}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                ${product.price}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}

async function InventoryCheck({
  data,
}: {
  data: Promise<{ category: string; products: Product[] }>;
}) {
  const { products } = await data;
  const now = new Date().toISOString();

  return (
    <p className="text-xs text-zinc-500">
      {products.length} product(s) in stock as of <code>{now}</code>
    </p>
  );
}

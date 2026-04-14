import { Suspense } from "react";
import Link from "next/link";
import { getProduct, getPopularProducts } from "../../lib/data";

export async function generateStaticParams({
  params,
}: {
  params: { category: string };
}) {
  const products = await getPopularProducts(params.category);
  return products.map((p) => ({ product: p.slug }));
}

export default function ProductPage(props: PageProps<"/[category]/[product]">) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<LoadingProduct />}>
        <ProductDetails {...props} />
      </Suspense>
    </div>
  );
}

async function ProductDetails(props: PageProps<"/[category]/[product]">) {
  const { category, product } = await props.params;
  const data = await getProduct(category, product);

  if (!data) {
    return <p className="text-zinc-500">Product not found.</p>;
  }

  return (
    <>
      <Link
        href={`/${category}`}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        &larr; Back to products
      </Link>

      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-xl font-bold">{data.name}</h2>
        <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          ${data.price}
        </p>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {data.description}
        </p>
      </div>
    </>
  );
}

function LoadingProduct() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-9 w-40 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-900" />
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="h-7 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="mt-1 h-5 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="mt-1 h-4 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { getCategory, getTopCategories } from "../lib/data";

export async function generateStaticParams() {
  const categories = await getTopCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export default function CategoryLayout(props: LayoutProps<"/[category]">) {
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-16">
      <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          &larr; All categories
        </Link>

        <Suspense fallback={<CategoryHeadingSkeleton />}>
          <CategoryHeading params={props.params} />
        </Suspense>
      </div>

      <div className="mt-8">{props.children}</div>
    </div>
  );
}

async function CategoryHeading({
  params,
}: Pick<LayoutProps<"/[category]">, "params">) {
  const { category } = await params;
  const data = await getCategory(category);

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold">{data?.name ?? "Category"}</h1>

      {data?.description && (
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {data.description}
        </p>
      )}
    </>
  );
}

function CategoryHeadingSkeleton() {
  return (
    <>
      <h1 className="mt-2 text-2xl font-bold text-transparent">
        <span className="animate-pulse rounded bg-zinc-100 dark:bg-zinc-900">
          Category
        </span>
      </h1>

      <p className="mt-1 text-transparent">
        <span className="animate-pulse rounded bg-zinc-100 dark:bg-zinc-900">
          Category description placeholder text here.
        </span>
      </p>
    </>
  );
}

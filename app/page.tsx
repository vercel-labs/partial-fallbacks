import Link from "next/link";
import { Suspense } from "react";
import {
  getCategories,
  getSuffix,
  getSuffixedCategories,
} from "./lib/data";
import { RollButton } from "./roll-button";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Store</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Browse by category.
      </p>
      <Suspense fallback={<CategoryListSkeleton />}>
        <CategoryList />
      </Suspense>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Random suffix demo</h2>
          <Suspense fallback={null}>
            <Roll />
          </Suspense>
        </div>
        <p className="mt-1 mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Suffixed category links. Each fresh suffix is a first-visit fallback shell.
        </p>
        <Suspense
          fallback={<p className="text-sm text-zinc-500">Loading...</p>}
        >
          <SuffixedCategories />
        </Suspense>
      </section>

      <footer className="mt-16 flex flex-col gap-1 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">
        <p>
          This demo explains{" "}
          <a
            href="https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components"
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ISR with Cache Components
          </a>
          .
        </p>
        <p>
          Source:{" "}
          <a
            href="https://github.com/vercel-labs/partial-fallbacks"
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            github.com/vercel-labs/partial-fallbacks
          </a>
        </p>
      </footer>
    </div>
  );
}

async function Roll() {
  const suffix = await getSuffix();
  return <RollButton suffix={suffix} />;
}

async function CategoryList() {
  const categories = await getCategories();
  const main = categories.filter((c) => c.slug !== "shoes");

  return (
    <ul className="mt-8 grid gap-4">
      {main.map((category) => (
        <li key={category.slug}>
          <Link
            href={`/${category.slug}`}
            className="block rounded-lg border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {category.description}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CategoryListSkeleton() {
  return (
    <ul className="mt-8 grid gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <li
          key={i}
          className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
        >
          <div className="h-6 w-1/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </li>
      ))}
    </ul>
  );
}

async function SuffixedCategories() {
  const categories = await getSuffixedCategories();

  if (categories.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Click re-roll to generate suffixed links.
      </p>
    );
  }

  return (
    <ul className="grid gap-4">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={`/${category.slug}`}
            className="block rounded-lg border border-dashed border-zinc-300 p-4 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            <h2 className="font-semibold">
              {category.name}{" "}
              <span className="text-xs text-zinc-500">({category.suffix})</span>
            </h2>
          </Link>
        </li>
      ))}
    </ul>
  );
}

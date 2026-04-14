import { setTimeout } from "node:timers/promises";
import { cookies } from "next/headers";

const API = "https://next-recipe-api.vercel.dev";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  category: { id: string; name: string; slug: string };
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type CategoryWithProducts = Category & {
  products: Product[];
};

export async function getCategories(): Promise<Category[]> {
  "use cache";
  const res = await fetch(`${API}/categories`);
  return res.json();
}

export async function getCategory(
  slug: string,
): Promise<CategoryWithProducts | null> {
  "use cache";
  // Strip any recommendation suffix so the lookup hits the real category.
  const realSlug = slug.replace(/-[a-z0-9]{4}$/, "");
  const res = await fetch(`${API}/categories/${realSlug}`);

  if (!res.ok) return null;

  return res.json();
}

export async function getProduct(
  category: string,
  slug: string,
): Promise<Product | null> {
  "use cache";
  await setTimeout(800);
  // Strip any category suffix so the category match check works.
  const realCategory = category.replace(/-[a-z0-9]{4}$/, "");
  const res = await fetch(`${API}/products/${slug}`);

  if (!res.ok) return null;

  const product = await res.json();

  if (product.category?.slug !== realCategory) return null;

  return product;
}

export async function fetchProducts(category?: string): Promise<Product[]> {
  await setTimeout(300);

  const url = category
    ? // Strip any recommendation suffix so the lookup hits the real category.
      `${API}/products?category=${category.replace(/-[a-z0-9]{4}$/, "")}`
    : `${API}/products`;

  const res = await fetch(url);

  return res.json();
}

export async function getProducts(category?: string) {
  "use cache";

  const products = await fetchProducts(category);

  return products;
}

export async function getSuffix() {
  return (await cookies()).get("rec")?.value;
}

export async function getSuffixedCategories() {
  const rec = await getSuffix();
  if (!rec) return [];

  await setTimeout(200);
  const categories = await getCategories();
  const main = ["tops", "shorts"];
  const extras = categories.filter((c) => !main.includes(c.slug));

  return extras.map((c) => ({
    ...c,
    slug: `${c.slug}-${rec}`,
    suffix: rec,
  }));
}

// Fetch categories at build time and prerender only the first two.
// The rest will use fallback shells.
export async function getTopCategories() {
  const categories = await getCategories();
  return categories.slice(0, 2);
}

// Fetch the most popular products for a category.
// Only these are prerendered; the rest use fallback shells.
export async function getPopularProducts(category: string) {
  const products = await getProducts(category);
  return products.slice(0, 1);
}

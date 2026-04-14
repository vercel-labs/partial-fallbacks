# Partial Fallbacks Demo

A Next.js demo of [Incremental Static Regeneration](https://nextjs.org/docs/app/guides/incremental-static-regeneration) with [Cache Components](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) and `experimental.partialFallbacks`.

## What it demonstrates

A small product catalog that shows:

1. **Prerendering a subset** of dynamic routes at build time with `generateStaticParams`
2. **Fallback shells** for routes not in the subset, served instantly instead of blocking
3. **Shell upgrades** after the first visit, so subsequent visitors get a more specific page
4. **PPR in practice**: cached data in the static shell, uncached data streams in as a dynamic hole

## Route structure

```
app/
  page.tsx                            Home: category list + suffixed links
  [category]/
    layout.tsx                        Layout with Suspense around dynamic header
    page.tsx                          Category page: product list + inventory check
    [product]/
      page.tsx                        Product detail page
  lib/
    data.ts                           Data layer with 'use cache' functions
  actions.ts                          Server action to re-roll the suffix cookie
  roll-button.tsx                     Re-roll button (client component)
```

### What gets prerendered

At build time, `generateStaticParams` returns the top 2 categories (`tops`, `shorts`) and the most popular product per category. Running `next build` produces:

- `/tops`, `/shorts`: fully static category pages
- `/tops/tee`, `/shorts/joggers`: fully static product pages
- `/[category]`, `/tops/[product]`, `/shorts/[product]`: fallback shells
- `/[category]/[product]`: generic fallback shell

### What happens at runtime

**Known route (`/tops/tee`)**: served from the static shell. Cached data is already rendered. Only the inventory check streams in as a dynamic hole.

**Known category, unknown product (`/tops/overshirt`)**: served from the `/tops/[product]` fallback shell with the category header already rendered. Product data and inventory check stream in.

**Unknown category (`/shoes/basketball-shoes`)**: served from the generic `/[category]/[product]` fallback shell. Category header, product, and inventory check all stream in.

**After the first visit**: Next.js renders the page in the background with the now-known params. Subsequent visitors get a more specific shell (or a fully static page if all data is cached).

## The suffix demo

The home page has a "Random suffix demo" section with a re-roll button. Clicking it sets a cookie with a random 4-character suffix. Category links in that section are decorated with the suffix, e.g. `/shoes-abc1`.

Visiting a suffixed URL goes through the generic `/[category]` fallback shell because the suffixed slug was never prerendered. The category layout renders with its header in Suspense, and the category data (stripped of the suffix server-side) streams in.

Re-roll to get a fresh suffix and try again. The cookie persists across reloads so you can see the upgrade happen (first visit = fallback, reload = cached).

## Cache Components discipline

This demo follows a few PPR patterns worth noting:

**Passing params promises into Suspense boundaries.** The category layout does not `await props.params` itself. Instead, it passes the promise into `CategoryHeading`, which awaits inside `<Suspense>`. This keeps the outer layout in the static shell so the "All categories" link is part of the shell regardless of the param value.

```tsx
export default function CategoryLayout(props: LayoutProps<"/[category]">) {
  return (
    <div>
      <div>
        <Link href="/">&larr; All categories</Link>
        <Suspense fallback={<CategoryHeadingSkeleton />}>
          <CategoryHeading params={props.params} />
        </Suspense>
      </div>
      <div>{props.children}</div>
    </div>
  );
}
```

Another valid pattern is to resolve the promise inline within the Suspense boundary. This keeps the child component's signature simpler (no `params` prop at all):

```tsx
<Suspense fallback={<CategoryHeadingSkeleton />}>
  {props.params.then(({ category }) => (
    <CategoryHeading slug={category} />
  ))}
</Suspense>
```

**Cached data vs live data, side by side.** On the category page, `ProductList` uses the cached `getProducts` so it ends up in the static shell. `InventoryCheck` calls the uncached `fetchProducts` so it is a dynamic hole that streams in per request.

```tsx
export default function CategoryPage(props: PageProps<"/[category]">) {
  const liveData = props.params.then(async (p) => ({
    category: p.category,
    products: await fetchProducts(p.category),
  }));

  return (
    <Suspense fallback={<p>Loading products...</p>}>
      <ProductList {...props}>
        <Suspense fallback={<p>Checking inventory...</p>}>
          <InventoryCheck data={liveData} />
        </Suspense>
      </ProductList>
    </Suspense>
  );
}
```

Kicking off `fetchProducts` at the top lets the request start before `InventoryCheck` mounts, so one suspension does not delay the other. The inner Suspense is nested inside `ProductList` on purpose: when the list is waiting on the static shell, we do not want a second "Checking inventory..." spinner next to "Loading products...". Nesting keeps the visible loading state to one at a time.

**Suffix stripping in the data layer.** Because category links can carry a `-abc1` suffix, `getCategory`, `getProduct`, and `fetchProducts` strip the trailing 4-char suffix before calling the real API. The suffix exists only to make each click a first-visit fallback shell.

## Getting started

```bash
pnpm install
pnpm build
pnpm start
```

Open [http://localhost:3000](http://localhost:3000).

Try:

1. Navigate to `/tops/tee` (fully static, instant)
2. Navigate to `/tops/overshirt` (category shell + product streams in)
3. Navigate to `/shoes` (unknown category, generic shell)
4. Click re-roll and navigate to a suffixed `/shoes-abc1`
5. Reload to see the upgrade

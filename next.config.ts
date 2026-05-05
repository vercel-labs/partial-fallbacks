import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    partialFallbacks: true,
  },
  // Plural: handles 'use cache' entries via the community Cache Components handler.
  cacheHandlers: {
    default: require.resolve("./data-cache-handler.mjs"),
  },
  // Singular: file-system ISR handler mirroring Next's default.
  cacheHandler: require.resolve("./isr-cache-handler.mjs"),
  cacheMaxMemorySize: 0,
};

export default nextConfig;

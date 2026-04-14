import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    partialFallbacks: true,
  },
};

export default nextConfig;
